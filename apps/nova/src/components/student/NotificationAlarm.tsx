import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Volume2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "alarm" | "success";
  isAlarm: boolean;
  createdAt: Date;
}

interface NotificationAlarmProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

const playBeep = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = "sine"; o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    o.start(); o.stop(ctx.currentTime + 0.6);
    setTimeout(() => {
      const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
      o2.connect(g2); g2.connect(ctx.destination);
      o2.type = "sine"; o2.frequency.value = 1100;
      g2.gain.setValueAtTime(0.0001, ctx.currentTime);
      g2.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      g2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      o2.start(); o2.stop(ctx.currentTime + 0.6);
    }, 250);
  } catch {}
};

const NotificationAlarm = ({ notifications, onDismiss }: NotificationAlarmProps) => {
  const { t } = useLanguage();
  const [activeAlarm, setActiveAlarm] = useState<Notification | null>(null);
  const seenIds = useState(() => new Set<string>())[0];

  useEffect(() => {
    const alarm = notifications.find((n) => n.isAlarm && !seenIds.has(n.id));
    if (alarm) {
      seenIds.add(alarm.id);
      setActiveAlarm(alarm);
      playBeep();
      // Vibrate on mobile if available
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
  }, [notifications, seenIds]);

  const typeColors = {
    info: "border-primary/40 bg-primary/5",
    warning: "border-warning/40 bg-warning/5",
    alarm: "border-destructive/40 bg-destructive/5",
    success: "border-success/40 bg-success/5",
  };

  return (
    <>
      <AnimatePresence>
        {activeAlarm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => { setActiveAlarm(null); onDismiss(activeAlarm.id); }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong p-8 max-w-sm w-full text-center space-y-4 border-destructive/30"
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }}
                transition={{ repeat: Infinity, duration: 0.6 }}
                className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto glow-destructive"
              >
                <Volume2 className="w-8 h-8 text-destructive" />
              </motion.div>
              <h2 className="text-xl font-bold font-heading text-foreground">{activeAlarm.title}</h2>
              <p className="text-sm text-muted-foreground">{activeAlarm.message}</p>
              <button
                onClick={() => { setActiveAlarm(null); onDismiss(activeAlarm.id); }}
                className="px-6 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm"
              >
                {t("student.dismiss")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        <AnimatePresence>
          {notifications.filter(n => !n.isAlarm).slice(0, 5).map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className={`flex items-start gap-3 p-3 rounded-xl border ${typeColors[n.type]}`}
            >
              <Bell className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{n.title}</p>
                <p className="text-[11px] text-muted-foreground">{n.message}</p>
              </div>
              <button onClick={() => onDismiss(n.id)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};

export default NotificationAlarm;
