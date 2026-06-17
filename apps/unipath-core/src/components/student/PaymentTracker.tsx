import { motion } from "framer-motion";
import { CreditCard, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";

interface Payment {
  id: string;
  description: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "overdue";
  dueDate: string;
}

interface PaymentTrackerProps {
  payments: Payment[];
  totalDebt: number;
}

const PaymentTracker = ({ payments, totalDebt }: PaymentTrackerProps) => {
  const { t } = useLanguage();
  const [simulating, setSimulating] = useState<string | null>(null);

  const handlePay = (id: string) => {
    setSimulating(id);
    setTimeout(() => setSimulating(null), 2000);
  };

  const statusConfig = {
    paid: { icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
    pending: { icon: Clock, color: "text-warning", bg: "bg-warning/10" },
    overdue: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-strong p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("student.payments")}</h3>
        {totalDebt > 0 && (
          <span className="text-xs font-semibold text-destructive bg-destructive/10 px-2 py-1 rounded-full">
            {t("student.debt")}: {totalDebt.toLocaleString()} UZS
          </span>
        )}
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {payments.map((p, i) => {
          const cfg = statusConfig[p.status];
          const Icon = cfg.icon;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/30"
            >
              <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{p.description}</p>
                <p className="text-[11px] text-muted-foreground">{t("student.due")}: {p.dueDate}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-foreground">{p.amount.toLocaleString()}</p>
                {p.status !== "paid" && (
                  <button
                    onClick={() => handlePay(p.id)}
                    disabled={simulating === p.id}
                    className="text-[10px] font-semibold text-primary hover:underline disabled:opacity-50"
                  >
                    {simulating === p.id ? t("student.processing") : t("student.pay_now")}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default PaymentTracker;
