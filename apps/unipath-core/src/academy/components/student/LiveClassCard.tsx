import { motion, AnimatePresence } from "framer-motion";
import { Clock, MapPin, User, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";

interface LiveClassCardProps {
  subject: string;
  room: string;
  teacher: string;
  teacherStatus: "present" | "late" | "absent";
  startsAt: Date;
  endsAt: Date;
  isLive: boolean;
}

const LiveClassCard = ({ subject, room, teacher, teacherStatus, startsAt, endsAt, isLive }: LiveClassCardProps) => {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      if (isLive) {
        const total = endsAt.getTime() - startsAt.getTime();
        const elapsed = now.getTime() - startsAt.getTime();
        setProgress(Math.min((elapsed / total) * 100, 100));
        const remaining = Math.max(0, endsAt.getTime() - now.getTime());
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`);
      } else {
        const until = Math.max(0, startsAt.getTime() - now.getTime());
        const mins = Math.floor(until / 60000);
        const secs = Math.floor((until % 60000) / 1000);
        setTimeLeft(mins > 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}:${secs.toString().padStart(2, "0")}`);
        setProgress(0);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startsAt, endsAt, isLive]);

  const statusConfig = {
    present: { label: t("student.present"), color: "text-success", dot: "bg-success" },
    late: { label: t("student.late"), color: "text-warning", dot: "bg-warning" },
    absent: { label: t("student.absent"), color: "text-destructive", dot: "bg-destructive" },
  };

  const status = statusConfig[teacherStatus];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl"
    >
      {isLive && (
        <div className="absolute inset-0 rounded-2xl z-0">
          <div className="absolute inset-0 rounded-2xl animate-pulse" style={{
            background: `linear-gradient(135deg, hsl(var(--primary) / 0.4), hsl(var(--accent) / 0.4), hsl(var(--primary) / 0.4))`,
            backgroundSize: "200% 200%",
            animation: "glowShift 3s ease-in-out infinite",
          }} />
        </div>
      )}

      <div className={`relative z-10 glass-strong p-5 ${isLive ? "border-primary/40" : ""}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isLive ? (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="flex items-center gap-1.5"
              >
                <Wifi className="w-4 h-4 text-success" />
                <span className="text-xs font-semibold text-success uppercase tracking-wider">{t("student.live_now")}</span>
              </motion.div>
            ) : (
              <div className="flex items-center gap-1.5">
                <WifiOff className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{t("student.upcoming")}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <div className={`w-2 h-2 rounded-full ${status.dot}`} />
            <span className={status.color}>{teacher} · {status.label}</span>
          </div>
        </div>

        <h3 className="text-xl font-bold font-heading text-foreground mb-1">{subject}</h3>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {room}</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {timeLeft}</span>
        </div>

        {isLive && (
          <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LiveClassCard;
