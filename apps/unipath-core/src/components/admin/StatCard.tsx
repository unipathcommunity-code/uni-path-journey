import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sublabel?: string;
  color?: "primary" | "accent" | "success" | "warning" | "destructive";
  delay?: number;
}

const colorMap = {
  primary: { bg: "bg-primary/10", text: "text-primary", glow: "glow-primary" },
  accent: { bg: "bg-accent/10", text: "text-accent", glow: "glow-accent" },
  success: { bg: "bg-success/10", text: "text-success", glow: "glow-success" },
  warning: { bg: "bg-warning/10", text: "text-warning", glow: "" },
  destructive: { bg: "bg-destructive/10", text: "text-destructive", glow: "glow-destructive" },
};

const StatCard = ({ icon: Icon, label, value, sublabel, color = "primary", delay = 0 }: StatCardProps) => {
  const c = colorMap[color];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-strong p-5"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className={`text-3xl font-bold font-heading ${c.text}`}>{value}</p>
      {sublabel && <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>}
    </motion.div>
  );
};

export default StatCard;
