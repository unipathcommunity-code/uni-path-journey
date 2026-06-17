import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, MapPin, ScanFace, AlertTriangle, CheckCircle2, Loader2,
  Lock as LockIcon, QrCode, X, Wifi, WifiOff, RefreshCw,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import CameraQRCheckin, { flushAttendanceQueue } from "@/components/student/CameraQRCheckin";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

type CheckinStep = "idle" | "gps" | "face" | "writing" | "success" | "failed" | "queued";
type FailureKind = "gps_out_of_range" | "face_failed" | "no_active_lesson" | "not_in_group" | "unknown";

interface ActiveLesson {
  id: string;
  subject_id: string | null;
  teacher_id: string;
  room_id: string | null;
  title: string;
  starts_at: string;
  ends_at: string;
}

interface Props {
  /** When provided, the component renders as a modal with a close button. */
  onClose?: () => void;
}

const QUEUE_KEY = "nova.attendance.queue";
const COOLDOWN_KEY = "nova.biometric.cooldown";
const COOLDOWN_MS = 5 * 60 * 1000; // 5 daqiqa lock-out after a hard fail

/** Haversine distance (metres) between two coordinates. */
const haversineMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

const readQueue = (): any[] => {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); } catch { return []; }
};
const writeQueue = (q: any[]) => localStorage.setItem(QUEUE_KEY, JSON.stringify(q));

const BiometricCheckin = ({ onClose }: Props) => {
  const { user } = useAuth();
  const { isEnabled } = useFeatureFlag();
  const biometricRequired = isEnabled("biometric");

  const [step, setStep] = useState<CheckinStep>("idle");
  const [gpsProgress, setGpsProgress] = useState(0);
  const [faceProgress, setFaceProgress] = useState(0);
  const [locked, setLocked] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [distanceM, setDistanceM] = useState<number | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<ActiveLesson | null>(null);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [queueSize, setQueueSize] = useState(0);
  const [retrying, setRetrying] = useState(false);
  // Sync banner: idle | syncing | success (with how many) | partial (some left)
  const [syncState, setSyncState] = useState<{ kind: "idle" | "syncing" | "success" | "partial"; count?: number; remaining?: number }>({ kind: "idle" });
  const cancelRef = useRef(false);
  const syncBannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Online/offline + queue tracking
  useEffect(() => {
    setQueueSize(readQueue().length);
    const on = () => { setIsOnline(true); void handleQueueRetry(); };
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore cooldown lock if user spammed and we hard-failed previously
  useEffect(() => {
    const until = Number(localStorage.getItem(COOLDOWN_KEY) || "0");
    if (until > Date.now()) {
      setLocked(true);
      setStep("failed");
      setStatusMsg(`Sessiya bloklangan — ${Math.ceil((until - Date.now()) / 60000)} daqiqadan keyin urinib ko'ring`);
    }
  }, []);

  // Resolve org + primary branch + active lesson on mount
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data: prof } = await supabase
        .from("profiles")
        .select("organization_id, primary_branch_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (prof?.organization_id) setOrgId(prof.organization_id);
      if (prof?.primary_branch_id) setBranchId(prof.primary_branch_id);

      // Find a lesson the student is currently expected at (now between starts/ends, ±15 min grace)
      const now = new Date();
      const graceStart = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
      const graceEnd = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

      const { data: gm } = await supabase
        .from("group_members")
        .select("groups!inner(id, subject_id, teacher_id)")
        .eq("student_id", user.id);

      const subjectTeacherPairs = (gm || []).map((m: any) => ({
        subject_id: m.groups?.subject_id,
        teacher_id: m.groups?.teacher_id,
      })).filter((p: any) => p.subject_id && p.teacher_id);

      if (subjectTeacherPairs.length === 0) return;

      const { data: lessons } = await supabase
        .from("lessons")
        .select("id, subject_id, teacher_id, room_id, title, starts_at, ends_at")
        .lte("starts_at", graceEnd)
        .gte("ends_at", graceStart)
        .order("starts_at", { ascending: true });

      const match = (lessons || []).find((l: any) =>
        subjectTeacherPairs.some((p) => p.subject_id === l.subject_id && p.teacher_id === l.teacher_id)
      );
      if (cancelled || !match) return;
      setActiveLesson(match as ActiveLesson);

      // Already checked in?
      const { data: existing } = await supabase
        .from("attendance")
        .select("id, status")
        .eq("lesson_id", match.id)
        .eq("student_id", user.id)
        .maybeSingle();
      if (existing && existing.status === "present") setAlreadyCheckedIn(true);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const handleQueueRetry = async () => {
    if (retrying) return;
    setRetrying(true);
    setSyncState({ kind: "syncing" });
    try {
      const before = readQueue().length;
      const synced = await flushAttendanceQueue();
      const remaining = readQueue().length;
      setQueueSize(remaining);
      if (synced > 0) {
        toast.success(`${synced} ta yozuv yuborildi`);
        setSyncState(remaining === 0
          ? { kind: "success", count: synced }
          : { kind: "partial", count: synced, remaining });
      } else if (before > 0 && remaining > 0) {
        // Nothing synced — show partial state with the still-queued count
        setSyncState({ kind: "partial", count: 0, remaining });
      } else {
        setSyncState({ kind: "idle" });
      }
      // Auto-hide success/partial banner after a few seconds
      if (syncBannerTimer.current) clearTimeout(syncBannerTimer.current);
      syncBannerTimer.current = setTimeout(() => setSyncState({ kind: "idle" }), 4500);
    } catch (e) {
      setSyncState({ kind: "idle" });
    } finally {
      setRetrying(false);
    }
  };

  /** Records an unauthorized attempt + alerts admins. */
  const reportIncident = useCallback(
    async (kind: FailureKind, reason: string, metadata: Record<string, unknown> = {}) => {
      if (!user || !orgId) return;
      const safeKind = ["gps_out_of_range", "face_failed"].includes(kind) ? kind : "session_locked";
      try {
        await supabase.from("security_incidents").insert([{
          organization_id: orgId,
          branch_id: branchId,
          user_id: user.id,
          kind: safeKind,
          reason,
          metadata: metadata as never,
        }]);
      } catch (e) {
        console.warn("[NOVA] incident insert failed", e);
      }
    },
    [user, orgId, branchId]
  );

  const triggerFailure = useCallback(
    (kind: FailureKind, reason: string, meta?: Record<string, unknown>, hardLock = false) => {
      setStep("failed");
      setStatusMsg(reason);
      void reportIncident(kind, reason, meta);
      if (hardLock) {
        setLocked(true);
        localStorage.setItem(COOLDOWN_KEY, String(Date.now() + COOLDOWN_MS));
      }
      toast.error(`Ruxsat berilmadi: ${reason}`, {
        description: hardLock ? "Admin xabardor qilindi. Sessiya bloklandi." : "Qaytadan urinib ko'ring.",
      });
    },
    [reportIncident]
  );

  /** Real geolocation + geofence check. */
  const runGpsCheck = useCallback(async (): Promise<boolean> => {
    setGpsProgress(10);
    if (!("geolocation" in navigator)) {
      triggerFailure("gps_out_of_range", "Qurilma GPS'ni qo'llab-quvvatlamaydi", {}, true);
      return false;
    }
    if (!branchId) {
      triggerFailure("gps_out_of_range", "Filial belgilanmagan — adminga murojaat qiling");
      return false;
    }
    const { data: branch } = await supabase
      .from("branches")
      .select("latitude, longitude, geofence_radius_m, name")
      .eq("id", branchId)
      .maybeSingle();
    setGpsProgress(35);
    if (!branch || branch.latitude == null || branch.longitude == null) {
      // No geofence configured — soft-pass with a warning so the system is still usable
      // for orgs that don't use GPS verification yet.
      setGpsProgress(100);
      setDistanceM(null);
      toast.message("Filial geofence sozlanmagan — GPS o'tkazib yuborildi");
      return true;
    }
    const radius = branch.geofence_radius_m ?? 50;
    const accuracyThreshold = Math.max(15, Math.round(radius * 0.7));

    return new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsProgress(70);
          const acc = Math.round(pos.coords.accuracy);
          if (acc > accuracyThreshold) {
            triggerFailure(
              "gps_out_of_range",
              `GPS aniqligi past (±${acc}m). ${accuracyThreshold}m yoki yaxshiroq kerak. Tashqariga chiqing yoki Wi-Fi/lokatsiyani yoqing.`,
              { accuracy_m: acc, threshold_m: accuracyThreshold, radius_m: radius }
            );
            resolve(false);
            return;
          }
          const dist = haversineMeters(
            pos.coords.latitude, pos.coords.longitude,
            Number(branch.latitude), Number(branch.longitude)
          );
          setDistanceM(Math.round(dist));
          setGpsProgress(100);
          if (dist > radius) {
            triggerFailure(
              "gps_out_of_range",
              `Markazdan ${Math.round(dist)}m uzoqda (ruxsat: ${radius}m, aniqlik ±${acc}m)`,
              { distance_m: Math.round(dist), radius_m: radius, accuracy_m: acc },
              true // hard lock — being far from the center is a red flag
            );
            resolve(false);
          } else {
            resolve(true);
          }
        },
        (err) => {
          triggerFailure(
            "gps_out_of_range",
            err.code === 1 ? "Joylashuvga ruxsat berilmadi" : "GPS signali topilmadi",
            { code: err.code, message: err.message }
          );
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, [branchId, triggerFailure]);

  /** WebAuthn platform-authenticator (Touch/Face ID).
   *  When org doesn't require biometric, this is best-effort and softly skips. */
  const runFaceCheck = useCallback(async (): Promise<boolean> => {
    setFaceProgress(15);
    const supported = typeof window !== "undefined" && !!window.PublicKeyCredential;
    if (!supported) {
      if (biometricRequired) {
        triggerFailure("face_failed", "Qurilma biometric autentifikatsiyani qo'llab-quvvatlamaydi", {}, true);
        return false;
      }
      setFaceProgress(100);
      toast.message("Biometric mavjud emas — o'tkazib yuborildi");
      return true;
    }
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      setFaceProgress(40);
      if (!available) {
        if (biometricRequired) {
          triggerFailure("face_failed", "Face/Touch ID mavjud emas", {}, true);
          return false;
        }
        setFaceProgress(100);
        toast.message("Platform biometrikasi yo'q — o'tkazib yuborildi");
        return true;
      }
      // Liveness/identity assertion. We don't persist a credential — we just want
      // to confirm the device owner is physically present (Face/Touch unlock).
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 30000,
          userVerification: "required",
          rpId: window.location.hostname,
        },
      } as CredentialRequestOptions);
      setFaceProgress(100);
      return true;
    } catch (e: any) {
      const msg = String(e?.message || e || "");
      // User-cancelled = soft fail (no admin alert)
      if (/NotAllowedError|cancel/i.test(msg)) {
        setStep("failed");
        setStatusMsg("Yuz tasdiqlash bekor qilindi");
        toast.error("Bekor qilindi");
        return false;
      }
      if (biometricRequired) {
        triggerFailure("face_failed", "Yuz tasdiqlanmadi", { error: msg }, true);
      } else {
        // Soft fail — allow attendance without biometric
        setFaceProgress(100);
        toast.message("Biometric o'tmadi — GPS bilan davom etildi");
        return true;
      }
      return false;
    }
  }, [triggerFailure, biometricRequired]);

  /** Insert/upsert attendance for the matched lesson. */
  const writeAttendance = useCallback(
    async (faceVerified: boolean): Promise<"ok" | "queued" | "error"> => {
      if (!user || !activeLesson) return "error";
      const checkedInAt = new Date().toISOString();

      if (!navigator.onLine) {
        const q = readQueue();
        q.push({
          lesson_id: activeLesson.id,
          student_id: user.id,
          room_name: activeLesson.title,
          checked_in_at: checkedInAt,
        });
        writeQueue(q);
        setQueueSize(q.length);
        return "queued";
      }

      const { error } = await supabase.from("attendance").upsert(
        {
          lesson_id: activeLesson.id,
          student_id: user.id,
          status: "present",
          gps_verified: true,
          face_verified: faceVerified,
          checked_in_at: checkedInAt,
        },
        { onConflict: "lesson_id,student_id" }
      );
      if (error) {
        // Last-resort offline queue if DB write fails
        const q = readQueue();
        q.push({
          lesson_id: activeLesson.id,
          student_id: user.id,
          room_name: activeLesson.title,
          checked_in_at: checkedInAt,
        });
        writeQueue(q);
        setQueueSize(q.length);
        return "queued";
      }
      return "ok";
    },
    [user, activeLesson]
  );

  const startCheckin = async () => {
    if (locked || !user) return;
    if (alreadyCheckedIn) {
      toast.success("Siz allaqachon shu darsga belgilangansiz");
      setStep("success");
      return;
    }
    if (!activeLesson) {
      triggerFailure("no_active_lesson", "Hozir sizning faol darsingiz yo'q (±15 daqiqa oynasi)");
      return;
    }
    cancelRef.current = false;
    setStep("gps");
    setGpsProgress(0);
    setFaceProgress(0);
    setStatusMsg("");
    setDistanceM(null);

    const gpsOk = await runGpsCheck();
    if (!gpsOk || cancelRef.current) return;

    setStep("face");
    const faceOk = await runFaceCheck();
    if (!faceOk || cancelRef.current) return;

    setStep("writing");
    const result = await writeAttendance(faceOk);
    if (result === "queued") {
      setStep("queued");
      toast.message("Internet yo'q — yozuv navbatga qo'yildi");
      return;
    }
    if (result === "error") {
      triggerFailure("unknown", "Yozishda xatolik");
      return;
    }
    setAlreadyCheckedIn(true);
    setStep("success");
    toast.success("Check-in muvaffaqiyatli", {
      description: distanceM != null ? `Markazdan ${distanceM}m` : undefined,
    });
  };

  const resetSession = () => {
    cancelRef.current = true;
    const until = Number(localStorage.getItem(COOLDOWN_KEY) || "0");
    if (until > Date.now()) {
      toast.error(`Sessiya hali bloklangan — ${Math.ceil((until - Date.now()) / 60000)} daqiqa`);
      return;
    }
    localStorage.removeItem(COOLDOWN_KEY);
    setStep("idle");
    setLocked(false);
    setGpsProgress(0);
    setFaceProgress(0);
    setStatusMsg("");
    setDistanceM(null);
  };

  const isModal = !!onClose;

  const content = (
    <>
      {/* Status pills */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
          isOnline ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
        }`}>
          {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {isOnline ? "Online" : "Offline"}
        </div>
        {queueSize > 0 && (
          <button
            onClick={handleQueueRetry}
            disabled={retrying}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold hover:bg-primary/20 transition disabled:opacity-60"
          >
            {retrying ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Navbat ({queueSize})
          </button>
        )}
        {!biometricRequired && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/40 text-muted-foreground text-[11px]">
            Yumshoq rejim
          </div>
        )}
      </div>

      {/* Sync banner — animates through queued → syncing → success/partial */}
      <AnimatePresence mode="wait">
        {(queueSize > 0 || syncState.kind !== "idle") && (
          <motion.div
            key={syncState.kind + ":" + queueSize}
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mb-4 overflow-hidden"
          >
            <SyncBanner
              syncState={syncState}
              queueSize={queueSize}
              isOnline={isOnline}
              retrying={retrying}
              onRetry={handleQueueRetry}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active lesson banner */}
      {activeLesson ? (
        <div className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/15 text-left">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Joriy dars</p>
          <p className="text-sm font-semibold mt-0.5">{activeLesson.title}</p>
          <p className="text-[11px] text-muted-foreground">
            {new Date(activeLesson.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            {" – "}
            {new Date(activeLesson.ends_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            {alreadyCheckedIn && " · ✓ Belgilangan"}
          </p>
        </div>
      ) : (
        <div className="mb-4 p-3 rounded-xl bg-muted/30 border border-border/30 text-left">
          <p className="text-xs text-muted-foreground">
            Hozir sizning faol darsingiz topilmadi (±15 daqiqa oynasi). Dars boshlanishidan oldin urinib ko'ring.
          </p>
        </div>
      )}

      <div className="relative w-44 h-44 mx-auto mb-6">
        <div className={`absolute inset-0 rounded-full border-2 transition-colors duration-500 ${
          step === "success" ? "border-success" : step === "failed" ? "border-destructive" : "border-primary/30"
        }`} />

        {(step === "gps" || step === "face" || step === "writing") && (
          <>
            <div className="pulse-ring inset-0 border-2 border-primary/40" />
            <div className="pulse-ring inset-0 border-2 border-primary/20" style={{ animationDelay: "0.5s" }} />
          </>
        )}

        <div className="absolute inset-0 flex items-center justify-center">
          {step === "idle" && <ScanFace className="w-14 h-14 text-primary/60" />}
          {step === "gps" && (
            <div className="text-center">
              <MapPin className="w-11 h-11 text-primary mx-auto mb-1" />
              <span className="text-[11px] text-muted-foreground">Joylashuv…</span>
            </div>
          )}
          {step === "face" && (
            <div className="relative w-full h-full">
              <ScanFace className="w-14 h-14 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent scan-line" />
            </div>
          )}
          {step === "writing" && (
            <div className="text-center">
              <Loader2 className="w-11 h-11 text-primary animate-spin mx-auto mb-1" />
              <span className="text-[11px] text-muted-foreground">Yozilmoqda…</span>
            </div>
          )}
          {step === "success" && <CheckCircle2 className="w-14 h-14 text-success" />}
          {step === "failed" && <AlertTriangle className="w-14 h-14 text-destructive" />}
          {step === "queued" && <WifiOff className="w-14 h-14 text-warning" />}
        </div>

        {(step === "gps" || step === "face") && (
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="50%" cy="50%" r="84"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeDasharray={`${2 * Math.PI * 84}`}
              strokeDashoffset={`${2 * Math.PI * 84 * (1 - (step === "gps" ? gpsProgress : faceProgress) / 100)}`}
              className="transition-all duration-100"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>

      <div className="space-y-2 mb-6">
        <StepIndicator
          label="GPS Geofence"
          sublabel={distanceM != null ? `Markazdan ${distanceM}m` : "Filial atrofida"}
          icon={<MapPin className="w-4 h-4" />}
          status={step === "idle" ? "pending" : step === "gps" ? "active" : gpsProgress >= 100 ? "done" : "pending"}
        />
        <StepIndicator
          label={biometricRequired ? "Biometric (talab)" : "Biometric (ixtiyoriy)"}
          sublabel="Face/Touch ID"
          icon={<ScanFace className="w-4 h-4" />}
          status={step === "face" ? "active" : faceProgress >= 100 ? "done" : "pending"}
        />
      </div>

      {step === "idle" && (
        <>
          <motion.button
            whileHover={{ scale: locked ? 1 : 1.02 }}
            whileTap={{ scale: locked ? 1 : 0.98 }}
            onClick={startCheckin}
            disabled={locked || !user || alreadyCheckedIn}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold glow-primary transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {locked ? (
              <span className="inline-flex items-center gap-2 justify-center"><LockIcon className="w-4 h-4" /> Sessiya bloklangan</span>
            ) : alreadyCheckedIn ? "✓ Allaqachon belgilangan" : "Check-in boshlash"}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => !locked && setQrOpen(true)}
            disabled={locked}
            className="mt-2.5 w-full py-2.5 rounded-xl bg-secondary/60 hover:bg-secondary text-foreground font-semibold text-sm border border-border/40 transition disabled:opacity-40 inline-flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4 text-accent" />
            QR orqali (xona QR-kodi)
          </motion.button>
        </>
      )}

      {(step === "gps" || step === "face" || step === "writing") && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground py-3">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">
            {step === "gps" ? "Joylashuv tekshirilmoqda…"
              : step === "face" ? "Yuz skanerlanmoqda…"
              : "Davomat yozilmoqda…"}
          </span>
        </div>
      )}

      {step === "success" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="py-3 rounded-xl bg-success/10 border border-success/20 mb-3">
            <p className="text-success font-semibold text-sm">Davomat ro'yxatga olindi</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {new Date().toLocaleTimeString()}{distanceM != null ? ` · ${distanceM}m` : ""}
            </p>
          </div>
          <button onClick={onClose ?? resetSession} className="text-sm text-muted-foreground hover:text-foreground transition">
            {onClose ? "Yopish" : "Qaytadan"}
          </button>
        </motion.div>
      )}

      {step === "queued" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="py-3 rounded-xl bg-warning/10 border border-warning/30 mb-3">
            <p className="text-warning font-semibold text-sm">Internet yo'q — navbatga qo'yildi</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Internet qaytsa avtomatik yuboriladi
            </p>
          </div>
          <button onClick={onClose ?? resetSession} className="text-sm text-muted-foreground hover:text-foreground transition">
            {onClose ? "Yopish" : "OK"}
          </button>
        </motion.div>
      )}

      {step === "failed" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="py-3 px-4 rounded-xl bg-destructive/10 border border-destructive/30 mb-3">
            <p className="text-destructive font-semibold flex items-center gap-2 justify-center text-sm">
              <AlertTriangle className="w-4 h-4" /> Ruxsat berilmadi
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {statusMsg}{locked ? " · Sessiya bloklandi" : ""}
            </p>
          </div>
          <button
            onClick={resetSession}
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            {locked ? "Adminni chaqirib qayta sinash" : "Qaytadan urinib ko'rish"}
          </button>
        </motion.div>
      )}
    </>
  );

  // Modal mode
  if (isModal) {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.94 }} animate={{ scale: 1 }} exit={{ scale: 0.94 }}
          className="glass-strong p-5 max-w-sm w-full relative rounded-2xl"
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-muted/50 transition z-10"
            aria-label="Yopish"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex items-center justify-center gap-2 mb-3 pt-1">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold font-heading">Biometric Check-in</h3>
          </div>
          {content}
        </motion.div>
        <AnimatePresence>
          {qrOpen && <CameraQRCheckin onClose={() => setQrOpen(false)} />}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Standalone page mode
  return (
    <div className="min-h-screen bg-background nova-grid-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 z-10">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight text-gradient-primary font-heading">NOVA</h1>
        </div>
        <p className="text-muted-foreground text-sm">Secure Biometric Check-in</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="glass-strong p-6 w-full max-w-sm z-10 rounded-2xl"
      >
        {content}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="text-xs text-muted-foreground mt-6 z-10"
      >
        Founded by Hasanov Behruz Feruzovich
      </motion.p>

      <AnimatePresence>
        {qrOpen && <CameraQRCheckin onClose={() => setQrOpen(false)} />}
      </AnimatePresence>
    </div>
  );
};

const SyncBanner = ({
  syncState, queueSize, isOnline, retrying, onRetry,
}: {
  syncState: { kind: "idle" | "syncing" | "success" | "partial"; count?: number; remaining?: number };
  queueSize: number;
  isOnline: boolean;
  retrying: boolean;
  onRetry: () => void;
}) => {
  // Resolve visual style + copy from current state
  const isSyncing = syncState.kind === "syncing";
  const isSuccess = syncState.kind === "success";
  const isPartial = syncState.kind === "partial";
  const isQueued = syncState.kind === "idle" && queueSize > 0;

  const tone = isSuccess ? "success" : isPartial ? "warning" : isSyncing ? "primary" : "warning";
  const styles =
    tone === "success"
      ? "bg-success/10 border-success/30 text-success"
      : tone === "primary"
      ? "bg-primary/10 border-primary/25 text-primary"
      : "bg-warning/10 border-warning/30 text-warning";

  // Indeterminate progress bar uses the same animation we already have
  // for the GPS pulse. Determinate when we know success.
  const progressPct = isSuccess ? 100 : isSyncing ? undefined : isPartial ? Math.max(15, Math.round(((syncState.count || 0) / Math.max(1, (syncState.count || 0) + (syncState.remaining || 0))) * 100)) : 0;

  return (
    <div className={`p-3 rounded-xl border ${styles}`}>
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5">
          {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" />
            : isSuccess ? <CheckCircle2 className="w-4 h-4" />
            : isPartial ? <RefreshCw className="w-4 h-4" />
            : <WifiOff className="w-4 h-4" />}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-xs font-semibold leading-tight">
            {isSyncing && "Navbatdagi yozuvlar yuborilmoqda…"}
            {isSuccess && `Sinxronlandi: ${syncState.count} ta yozuv qabul qilindi`}
            {isPartial && `${syncState.count || 0} ta yuborildi · ${syncState.remaining} ta navbatda qoldi`}
            {isQueued && `${queueSize} ta yozuv navbatda kutmoqda`}
          </p>
          <p className="text-[11px] text-foreground/70 mt-0.5">
            {isSyncing && "Iltimos kuting, bu bir necha soniya oladi."}
            {isSuccess && "Davomatingiz serverga to'liq saqlandi."}
            {isPartial && (isOnline
              ? "Ba'zi yozuvlar yuborilmadi. Yana urinish mumkin."
              : "Internet uzilib qoldi — qaytsa avtomatik davom etadi.")}
            {isQueued && (isOnline
              ? "Hozir sinxronlash mumkin."
              : "Internet qaytishi bilan avtomatik yuboriladi.")}
          </p>

          {/* Progress bar */}
          <div className="mt-2 h-1 w-full rounded-full bg-foreground/10 overflow-hidden">
            {isSyncing ? (
              <motion.div
                className="h-full bg-current rounded-full"
                initial={{ x: "-40%", width: "40%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              />
            ) : (
              <motion.div
                className="h-full bg-current rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct ?? 0}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            )}
          </div>
        </div>

        {(isQueued || isPartial) && (
          <button
            onClick={onRetry}
            disabled={retrying || !isOnline}
            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-current/10 hover:bg-current/20 text-[11px] font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Hozir sinxronlash"
          >
            {retrying ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Sinxronlash
          </button>
        )}
      </div>
    </div>
  );
};

const StepIndicator = ({
  label, sublabel, icon, status,
}: {
  label: string; sublabel: string; icon: React.ReactNode;
  status: "pending" | "active" | "done";
}) => (
  <div className={`flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 ${
    status === "active" ? "bg-primary/10 border border-primary/20" :
    status === "done" ? "bg-success/5 border border-success/10" :
    "bg-muted/30 border border-transparent"
  }`}>
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
      status === "active" ? "bg-primary/20 text-primary" :
      status === "done" ? "bg-success/20 text-success" :
      "bg-muted text-muted-foreground"
    }`}>
      {status === "done" ? <CheckCircle2 className="w-4 h-4" /> : icon}
    </div>
    <div>
      <p className={`text-sm font-medium ${status === "done" ? "text-success" : status === "active" ? "text-foreground" : "text-muted-foreground"}`}>
        {label}
      </p>
      <p className="text-[11px] text-muted-foreground">{sublabel}</p>
    </div>
  </div>
);

export default BiometricCheckin;
