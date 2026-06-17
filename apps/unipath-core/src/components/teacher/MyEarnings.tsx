import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Wallet, FileText, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** O'qituvchi o'z kelishuvi va oylik chegirmalarini ko'radi. */
const MyEarnings = () => {
  const { user } = useAuth();

  const { data: contracts = [] } = useQuery({
    queryKey: ["my-contracts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("teacher_contracts")
        .select("*, subjects(name), groups(name)")
        .eq("teacher_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: payouts = [] } = useQuery({
    queryKey: ["my-payouts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("teacher_payouts")
        .select("*").eq("teacher_id", user.id)
        .order("period_month", { ascending: false }).limit(12);
      return data || [];
    },
    enabled: !!user,
  });

  const labelFor = (type: string) => ({
    percentage: "Foiz", per_lesson: "Dars", monthly_salary: "Oylik", base_plus_bonus: "Asos+Bonus",
  } as any)[type] || type;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Mening kelishuvlarim</h2>
      {contracts.length === 0 ? (
        <div className="glass p-6 text-center text-sm text-muted-foreground">
          Hali kelishuv yo'q. Direktor sizga kelishuv biriktirgach shu yerda ko'rinadi.
        </div>
      ) : contracts.map((c: any) => (
        <div key={c.id} className="glass-strong p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold">{c.subjects?.name || c.groups?.name || "Umumiy"}</p>
              <p className="text-[10px] text-muted-foreground">{labelFor(c.contract_type)} · {c.currency}</p>
            </div>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {c.percentage != null && <div className="glass p-2 rounded-lg"><span className="text-muted-foreground">Foiz: </span><b>{c.percentage}%</b></div>}
            {c.per_lesson_amount != null && <div className="glass p-2 rounded-lg"><span className="text-muted-foreground">Dars: </span><b>{Number(c.per_lesson_amount).toLocaleString()}</b></div>}
            {c.monthly_amount != null && <div className="glass p-2 rounded-lg"><span className="text-muted-foreground">Oylik: </span><b>{Number(c.monthly_amount).toLocaleString()}</b></div>}
            {c.base_amount != null && <div className="glass p-2 rounded-lg"><span className="text-muted-foreground">Asos: </span><b>{Number(c.base_amount).toLocaleString()}</b></div>}
          </div>
          {c.notes && <p className="text-[11px] text-muted-foreground mt-2 italic">{c.notes}</p>}
        </div>
      ))}

      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pt-2">Oylik to'lovlar</h2>
      {payouts.length === 0 ? (
        <div className="glass p-6 text-center text-sm text-muted-foreground">Hali to'lov yozuvi yo'q</div>
      ) : payouts.map((p: any) => (
        <div key={p.id} className="glass p-3 flex items-center gap-3">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">{new Date(p.period_month).toLocaleDateString([], { year: "numeric", month: "long" })}</p>
            <p className="text-[10px] text-muted-foreground">
              Hisoblangan: <b>{Number(p.computed_amount).toLocaleString()}</b> · To'langan: <b>{Number(p.paid_amount).toLocaleString()}</b> {p.currency}
            </p>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            p.status === "paid" ? "bg-success/15 text-success" :
            p.status === "partial" ? "bg-warning/15 text-warning" : "bg-muted/40 text-muted-foreground"
          }`}>
            {p.status === "paid" ? "TO'LANDI" : p.status === "partial" ? "QISMAN" : "KUTILMOQDA"}
          </span>
        </div>
      ))}
    </motion.div>
  );
};

export default MyEarnings;
