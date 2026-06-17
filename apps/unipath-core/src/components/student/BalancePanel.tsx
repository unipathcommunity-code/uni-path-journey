import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Wallet, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** Student/Parent uchun: o'z (yoki farzand) qarz va to'lov tarixi. */
const BalancePanel = ({ studentId }: { studentId?: string }) => {
  const { user } = useAuth();
  const targetId = studentId || user?.id;

  const { data: charges = [] } = useQuery({
    queryKey: ["student-charges", targetId],
    queryFn: async () => {
      if (!targetId) return [];
      const { data } = await supabase
        .from("student_charges")
        .select("*, subjects(name)")
        .eq("student_id", targetId)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!targetId,
  });

  const totalDebt = charges
    .filter((c: any) => c.status !== "paid" && c.status !== "waived")
    .reduce((s: number, c: any) => s + (Number(c.amount) - Number(c.paid_amount || 0)), 0);
  const currency = charges[0]?.currency || "UZS";

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className={`glass-strong p-4 rounded-2xl border ${totalDebt > 0 ? "border-destructive/40" : "border-success/40"}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${totalDebt > 0 ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"}`}>
            <Wallet className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Umumiy qarz</p>
            <p className={`text-xl font-bold ${totalDebt > 0 ? "text-destructive" : "text-success"}`}>
              {totalDebt.toLocaleString()} {currency}
            </p>
          </div>
        </div>
      </div>

      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">To'lov tarixi</h3>
      {charges.length === 0 ? (
        <div className="glass p-6 text-center text-sm text-muted-foreground">Hozircha to'lov majburiyati yo'q</div>
      ) : charges.map((c: any) => {
        const remain = Number(c.amount) - Number(c.paid_amount || 0);
        const paid = c.status === "paid";
        return (
          <div key={c.id} className="glass p-3 flex items-center gap-3">
            {paid ? <CheckCircle2 className="w-4 h-4 text-success" /> : <AlertCircle className={`w-4 h-4 ${remain > 0 ? "text-destructive" : "text-warning"}`} />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{c.subjects?.name || "Fan"}{c.period_month ? ` · ${new Date(c.period_month).toLocaleDateString([], { year: "numeric", month: "short" })}` : ""}</p>
              <p className="text-[10px] text-muted-foreground">
                {Number(c.amount).toLocaleString()} {c.currency} · to'langan {Number(c.paid_amount || 0).toLocaleString()}
              </p>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              paid ? "bg-success/15 text-success" :
              c.status === "partial" ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive"
            }`}>
              {paid ? "TO'LANDI" : c.status === "partial" ? "QISMAN" : `${remain.toLocaleString()} qarz`}
            </span>
          </div>
        );
      })}
    </motion.div>
  );
};

export default BalancePanel;
