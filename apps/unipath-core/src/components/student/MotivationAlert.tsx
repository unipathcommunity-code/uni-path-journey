import { motion } from "framer-motion";
import { AlertTriangle, Zap } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface MotivationAlertProps {
  missedCount: number;
  subject: string;
}

const MotivationAlert = ({ missedCount, subject }: MotivationAlertProps) => {
  const { t } = useLanguage();
  if (missedCount < 3) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-warning/30 bg-warning/5 p-4 flex items-start gap-3"
    >
      <motion.div
        animate={{ rotate: [0, -10, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
        className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0"
      >
        <AlertTriangle className="w-5 h-5 text-warning" />
      </motion.div>
      <div>
        <p className="text-sm font-semibold text-foreground">
          {missedCount} {t("student.missed_classes")} {subject}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          "{t("student.motivation_msg", { subject })}"
        </p>
        <button className="mt-2 text-xs font-semibold text-primary flex items-center gap-1 hover:underline">
          <Zap className="w-3 h-3" /> {t("student.catch_up")}
        </button>
      </div>
    </motion.div>
  );
};

export default MotivationAlert;
