import { motion } from "framer-motion";
import { useRef } from "react";
import { BookOpen, MapPin, User } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface ScheduleItem {
  id: string;
  subject: string;
  room: string;
  teacher: string;
  startsAt: Date;
  endsAt: Date;
  status: "completed" | "live" | "upcoming";
}

interface ScheduleTimelineProps {
  items: ScheduleItem[];
}

const ScheduleTimeline = ({ items }: ScheduleTimelineProps) => {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);

  const statusColors = {
    completed: "border-muted-foreground/30 bg-muted/50",
    live: "border-primary/60 bg-primary/10 glow-primary",
    upcoming: "border-glass-border bg-card/60",
  };

  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">{t("student.today_schedule")}</h3>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`snap-start flex-shrink-0 w-[200px] rounded-2xl border p-4 ${statusColors[item.status]}`}
          >
            {item.status === "live" && (
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1 block">● {t("student.live")}</span>
            )}
            <h4 className="font-heading font-semibold text-sm text-foreground truncate">{item.subject}</h4>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {item.room}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <User className="w-3 h-3" /> {item.teacher}
            </p>
            <p className="text-[11px] text-muted-foreground mt-2 font-mono">
              {formatTime(item.startsAt)} — {formatTime(item.endsAt)}
            </p>
          </motion.div>
        ))}
        {items.length === 0 && (
          <div className="flex items-center justify-center w-full py-8 text-sm text-muted-foreground">
            {t("student.no_schedule")}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleTimeline;
