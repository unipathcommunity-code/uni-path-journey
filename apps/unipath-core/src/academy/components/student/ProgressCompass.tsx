import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface ProgressCompassProps {
  level: number;
  averageScore: number;
  trend: "up" | "down" | "stable";
  attendanceRate: number;
}

const ProgressCompass = ({ level, averageScore, trend, attendanceRate }: ProgressCompassProps) => {
  const { t } = useLanguage();
  const circumference = 2 * Math.PI * 58;
  const scoreOffset = circumference - (averageScore / 100) * circumference;
  const attendanceOffset = circumference - (attendanceRate / 100) * circumference;

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-warning";
  const trendLabel = trend === "up" ? t("student.trend_up") : trend === "down" ? t("student.trend_down") : t("student.trend_stable");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-strong p-5 flex flex-col items-center"
    >
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 self-start">
        {t("student.progress_compass")}
      </h3>

      <div className="relative w-36 h-36">
        <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
          <circle cx="64" cy="64" r="58" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
          <motion.circle
            cx="64" cy="64" r="58" fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth="6"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: attendanceOffset }}
            transition={{ duration: 1.2, delay: 0.2 }}
            strokeLinecap="round"
            opacity={0.3}
          />
          <motion.circle
            cx="64" cy="64" r="50" fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="6"
            strokeDasharray={2 * Math.PI * 50}
            initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
            animate={{ strokeDashoffset: (2 * Math.PI * 50) - (averageScore / 100) * (2 * Math.PI * 50) }}
            transition={{ duration: 1.2, delay: 0.4 }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold font-heading text-foreground">{averageScore}</span>
          <span className="text-[10px] text-muted-foreground uppercase">{t("student.avg_score")}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 w-full text-center">
        <div>
          <p className="text-lg font-bold text-accent">{level}</p>
          <p className="text-[10px] text-muted-foreground">{t("student.level")}</p>
        </div>
        <div>
          <p className="text-lg font-bold text-primary">{attendanceRate}%</p>
          <p className="text-[10px] text-muted-foreground">{t("student.attendance")}</p>
        </div>
        <div className="flex flex-col items-center">
          <TrendIcon className={`w-5 h-5 ${trendColor}`} />
          <p className="text-[10px] text-muted-foreground capitalize">{trendLabel}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default ProgressCompass;
