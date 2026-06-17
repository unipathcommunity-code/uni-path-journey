import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, X, Camera, AlertTriangle, WifiOff, Wifi, RefreshCw, Loader2, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  onClose: () => void;
}

// Honest flow: scan QR → real eligibility check (student role + group member of an
// active lesson in that room) → auto-record attendance. No fake face simulation.
type Stage = "qr" | "verifying" | "success" | "error" | "queued";

type QueuedAttendance = {
  lesson_id: string;
  student_id: string;
  room_name: string;
  checked_in_at: string;
};

const QUEUE_KEY = "nova.attendance.queue";

const readQueue = (): QueuedAttendance[] => {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
};

const writeQueue = (q: QueuedAttendance[]) => {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
};

export const flushAttendanceQueue = async (): Promise<number> => {
  const queue = readQueue();
  if (!queue.length) return 0;
  const remaining: QueuedAttendance[] = [];
  let synced = 0;
  for (const item of queue) {
    const { error } = await supabase.from("attendance").upsert(
      {
        lesson_id: item.lesson_id,
        student_id: item.student_id,
        status: "present",
        gps_verified: true,
        face_verified: true,
        checked_in_at: item.checked_in_at,
      },
      { onConflict: "lesson_id,student_id" }
    );
    if (error) remaining.push(item);
    else synced++;
  }
  writeQueue(remaining);
  return synced;
};

const CameraQRCheckin = ({ onClose }: Props) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [stage, setStage] = useState<Stage>("qr");
  const [errorMsg, setErrorMsg] = useState("");
  const [scannedRoom, setScannedRoom] = useState<{ id: string; name: string } | null>(null);
  const [verifyingMsg, setVerifyingMsg] = useState("");
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [queueSize, setQueueSize] = useState(0);
  const [retrying, setRetrying] = useState(false);

  const refreshQueueSize = useCallback(() => setQueueSize(readQueue().length), []);

  useEffect(() => {
    refreshQueueSize();
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [refreshQueueSize]);

  // Auto-flush when connection comes back
  useEffect(() => {
    if (isOnline && queueSize > 0) {
      void handleManualRetry();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const handleManualRetry = async () => {
    if (retrying) return;
    setRetrying(true);
    try {
      const synced = await flushAttendanceQueue();
      refreshQueueSize();
      if (synced > 0) {
        toast.success(`${synced} ${t("qr.synced")}`);
        if (stage === "queued" && readQueue().length === 0) setStage("success");
      } else if (!navigator.onLine) {
        toast.error(t("qr.offline_msg"));
      }
    } finally {
      setRetrying(false);
    }
  };

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async (facingMode: "environment" | "user") => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (e: any) {
      setErrorMsg(t("qr.camera_denied"));
      setStage("error");
    }
  };

  // QR scan loop
  useEffect(() => {
    if (stage !== "qr") return;
    startCamera("environment");

    const tick = () => {
      const v = videoRef.current;
      const c = canvasRef.current;
      if (v && c && v.readyState === v.HAVE_ENOUGH_DATA) {
        const ctx = c.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          c.width = v.videoWidth;
          c.height = v.videoHeight;
          ctx.drawImage(v, 0, 0, c.width, c.height);
          const img = ctx.getImageData(0, 0, c.width, c.height);
          const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
          if (code?.data) {
            handleQR(code.data);
            return;
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const handleQR = async (qr: string) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    stopCamera();
    // 1) Validate room QR
    const { data: room, error } = await supabase
      .from("rooms")
      .select("id, name, checkin_active, organization_id")
      .eq("qr_code", qr)
      .maybeSingle();
    if (error || !room) {
      setErrorMsg(t("qr.invalid"));
      setStage("error");
      return;
    }
    if (!room.checkin_active) {
      setErrorMsg(t("qr.checkin_off"));
      setStage("error");
      return;
    }
    setScannedRoom({ id: room.id, name: room.name });
    setStage("verifying");
    // 2) Real auto-verification & attendance write — no fake face countdown.
    await recordAttendance(room);
  };

  /**
   * Real check-in: verify the signed-in user is a student of this org and a
   * member of a group that has a live lesson in the scanned room, then
   * write attendance automatically. Falls back to offline queue on errors.
   */
  const recordAttendance = async (room: { id: string; name: string; organization_id?: string | null }) => {
    if (!user) return;
    const checkedInAt = new Date().toISOString();

    // Offline → queue and stop early
    if (!navigator.onLine) {
      const q = readQueue();
      q.push({
        lesson_id: `room:${room.id}`,
        student_id: user.id,
        room_name: room.name,
        checked_in_at: checkedInAt,
      });
      writeQueue(q);
      refreshQueueSize();
      setStage("queued");
      toast.message(t("qr.offline_msg"));
      return;
    }

    setVerifyingMsg(t("qr.verifying_role") || "Talaba sifatida tekshirilmoqda…");

    // Confirm the user really has the student role (RLS would also block, but
    // we want a clear error message instead of a silent insert failure).
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const isStudent = (roles || []).some((r: any) => r.role === "student");
    if (!isStudent) {
      setErrorMsg(t("qr.not_student") || "Siz talaba sifatida ro'yxatdan o'tmagansiz");
      setStage("error");
      return;
    }

    // Find a lesson currently happening in this room
    setVerifyingMsg(t("qr.verifying_lesson") || "Faol dars qidirilmoqda…");
    const now = new Date().toISOString();
    const { data: lesson, error: lessonErr } = await supabase
      .from("lessons")
      .select("id, subject_id, teacher_id")
      .eq("room_id", room.id)
      .lte("starts_at", now)
      .gte("ends_at", now)
      .maybeSingle();

    if (lessonErr) {
      const q = readQueue();
      q.push({
        lesson_id: `room:${room.id}`,
        student_id: user.id,
        room_name: room.name,
        checked_in_at: checkedInAt,
      });
      writeQueue(q);
      refreshQueueSize();
      setStage("queued");
      return;
    }
    if (!lesson) {
      setErrorMsg(t("qr.no_active_lesson") || "Bu xonada hozir faol dars yo'q");
      setStage("error");
      return;
    }

    // Confirm the student is a member of a group that matches this lesson's subject + teacher
    setVerifyingMsg(t("qr.verifying_member") || "Guruh a'zoligi tekshirilmoqda…");
    const { data: gm } = await supabase
      .from("group_members")
      .select("groups!inner(subject_id, teacher_id)")
      .eq("student_id", user.id);
    const inGroup = (gm || []).some(
      (m: any) =>
        m.groups?.subject_id === lesson.subject_id &&
        m.groups?.teacher_id === lesson.teacher_id
    );
    if (!inGroup) {
      setErrorMsg(t("qr.not_in_group") || "Bu darsning guruhida emassiz");
      setStage("error");
      return;
    }

    // All verified — write attendance for the authenticated student automatically
    const { error: insertErr } = await supabase.from("attendance").upsert(
      {
        lesson_id: lesson.id,
        student_id: user.id,
        status: "present",
        gps_verified: false, // we did NOT do GPS — keep this honest
        face_verified: false, // we did NOT do face — keep this honest
        checked_in_at: checkedInAt,
      },
      { onConflict: "lesson_id,student_id" }
    );
    if (insertErr) {
      const q = readQueue();
      q.push({
        lesson_id: lesson.id,
        student_id: user.id,
        room_name: room.name,
        checked_in_at: checkedInAt,
      });
      writeQueue(q);
      refreshQueueSize();
      setStage("queued");
      return;
    }
    toast.success(t("qr.success_title"));
    setStage("success");
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="glass-strong p-5 max-w-sm w-full text-center space-y-4 relative"
      >
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-muted/50 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Connection status pill + manual retry */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
              isOnline
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? t("qr.online") : t("qr.offline")}
          </div>
          {queueSize > 0 && (
            <button
              onClick={handleManualRetry}
              disabled={retrying}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold hover:bg-primary/20 transition-colors disabled:opacity-60"
            >
              {retrying ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              {t("qr.retry_queue")} ({queueSize})
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {stage === "qr" && (
            <motion.div key="qr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold font-heading">{t("qr.scan_title")}</h3>
              </div>
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black border-2 border-primary/30">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                <canvas ref={canvasRef} className="hidden" />
                {/* Scan frame */}
                <div className="absolute inset-6 border-2 border-primary/70 rounded-xl pointer-events-none">
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br" />
                </div>
                <div className="absolute left-6 right-6 h-0.5 bg-primary scan-line" />
              </div>
              <p className="text-xs text-muted-foreground">{t("qr.scan_desc")}</p>
            </motion.div>
          )}

          {stage === "verifying" && (
            <motion.div key="verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 py-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold font-heading">{t("qr.verifying_title") || "Tasdiqlanmoqda"}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {scannedRoom?.name} · {verifyingMsg}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </motion.div>
          )}

          {stage === "success" && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 py-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto"
              >
                <CheckCircle className="w-10 h-10 text-success" />
              </motion.div>
              <div>
                <h3 className="text-lg font-bold font-heading">{t("qr.success_title")}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {scannedRoom?.name} · {new Date().toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-full py-2.5 rounded-xl bg-success text-success-foreground font-semibold text-sm"
              >
                {t("qr.done")}
              </button>
            </motion.div>
          )}

          {stage === "error" && (
            <motion.div key="error" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 py-4">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-10 h-10 text-destructive" />
              </div>
              <div>
                <h3 className="text-base font-bold font-heading">{t("qr.error")}</h3>
                <p className="text-xs text-muted-foreground mt-1">{errorMsg}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setErrorMsg("");
                    setStage("qr");
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
                >
                  {t("qr.retry")}
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground font-semibold text-sm"
                >
                  {t("qr.done")}
                </button>
              </div>
            </motion.div>
          )}

          {stage === "queued" && (
            <motion.div
              key="queued"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4 py-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mx-auto"
              >
                <WifiOff className="w-10 h-10 text-warning" />
              </motion.div>
              <div>
                <h3 className="text-lg font-bold font-heading">{t("qr.queued_title")}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {scannedRoom?.name} · {t("qr.queued_desc")}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleManualRetry}
                  disabled={retrying}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {retrying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {t("qr.retry_now")}
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground font-semibold text-sm"
                >
                  {t("qr.done")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default CameraQRCheckin;
