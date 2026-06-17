import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Wallet, CheckCircle2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { exportCsv } from "@/lib/exportCsv";

/** Owner/Accountant: o'qituvchi oylik to'lovlari — kim qancha oldi, qancha qoldi. */
const TeacherPayoutsPanel = () => {
  const { profile, user } = useAuth();
  const qc = useQueryClient();

  const { data: payouts = [] } = useQuery({
    queryKey: ["all-teacher-payouts", profile?.organization_id],
    queryFn: async () => {
      const { data } = await supabase.from("teacher_payouts").select("*")
        .order("period_month", { ascending: false }).limit(60);
      return data || [];
    },
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ["all-contracts-list", profile?.organization_id],
    queryFn: async () => {
      const { data } = await supabase.from("teacher_contracts").select("id, teacher_id, contract_type, currency").eq("is_active", true);
      return data || [];
    },
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers-list-payouts", profile?.organization_id],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "teacher").eq("organization_id", profile?.organization_id);
      const ids = (roles || []).map((r: any) => r.user_id);
      if (ids.length === 0) return [];
      const { data } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ids);
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  const teacherName = (id: string) => teachers.find((t: any) => t.user_id === id)?.full_name || "—";

  const generateCurrentMonth = async () => {
    const period = new Date();
    period.setDate(1);
    const periodStr = period.toISOString().slice(0, 10);
    let created = 0;
    for (const c of contracts) {
      const exists = payouts.find((p: any) => p.contract_id === c.id && p.period_month?.startsWith(periodStr.slice(0, 7)));
      if (exists) continue;
      const { error } = await supabase.from("teacher_payouts").insert({
        organization_id: profile?.organization_id,
        teacher_id: c.teacher_id, contract_id: c.id,
        period_month: periodStr, computed_amount: 0, currency: c.currency, status: "pending",
        breakdown: { auto: true, contract_type: c.contract_type },
      });
      if (!error) created++;
    }
    toast.success(`${created} ta yangi to'lov yozuvi yaratildi`);
    qc.invalidateQueries({ queryKey: ["all-teacher-payouts"] });
  };

  const markPaid = async (p: any) => {
    const amount = prompt(`To'langan summa (${p.currency}):`, String(p.computed_amount || 0));
    if (!amount) return;
    const { error } = await supabase.from("teacher_payouts").update({
      paid_amount: Number(amount),
      status: Number(amount) >= Number(p.computed_amount) ? "paid" : "partial",
      paid_at: new Date().toISOString(),
      paid_by: user?.id,
    }).eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    toast.success("To'lov belgilandi");
    qc.invalidateQueries({ queryKey: ["all-teacher-payouts"] });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-strong p-4 rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-success/15 flex items-center justify-center"><Wallet className="w-4 h-4 text-success" /></div>
          <h3 className="font-semibold text-sm">O'qituvchi to'lovlari</h3>
        </div>
        <div className="flex gap-1">
          <button onClick={generateCurrentMonth} className="glass px-2 py-1 rounded-lg text-[10px] hover:bg-primary/10 text-primary">+ Joriy oy</button>
          {payouts.length > 0 && (
            <button onClick={() => exportCsv("teacher-payouts.csv", payouts.map((p: any) => ({
              teacher: teacherName(p.teacher_id), period: p.period_month, computed: p.computed_amount, paid: p.paid_amount, status: p.status, currency: p.currency,
            })))} className="glass px-2 py-1 rounded-lg text-[10px] flex items-center gap-1"><Download className="w-3 h-3" />CSV</button>
          )}
        </div>
      </div>

      <div className="space-y-1.5 max-h-[420px] overflow-y-auto">
        {payouts.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">To'lov yozuvi yo'q</p>
        ) : payouts.map((p: any) => (
          <div key={p.id} className="glass p-2.5 rounded-lg flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{teacherName(p.teacher_id)}</p>
              <p className="text-[10px] text-muted-foreground">
                {new Date(p.period_month).toLocaleDateString([], { year: "numeric", month: "short" })} ·
                hisoblangan {Number(p.computed_amount).toLocaleString()} · to'langan {Number(p.paid_amount).toLocaleString()} {p.currency}
              </p>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              p.status === "paid" ? "bg-success/15 text-success" :
              p.status === "partial" ? "bg-warning/15 text-warning" : "bg-muted/40 text-muted-foreground"
            }`}>{p.status.toUpperCase()}</span>
            {p.status !== "paid" && (
              <button onClick={() => markPaid(p)} className="p-1.5 rounded hover:bg-success/10 text-success" title="To'landi deb belgilash">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default TeacherPayoutsPanel;
