import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Trash2, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { exportCsv } from "@/lib/exportCsv";
import { Download } from "lucide-react";

/** Owner/Admin: har fan uchun narx siyosati (oylik yoki dars-bo'yicha). */
const TuitionPlansPanel = () => {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({ subject_id: "", billing_mode: "monthly" as "monthly" | "per_lesson", amount: "", currency: "UZS" });

  const { data: plans = [] } = useQuery({
    queryKey: ["tuition-plans", profile?.organization_id],
    queryFn: async () => {
      const { data } = await supabase.from("tuition_plans").select("*, subjects(name)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects-for-plans", profile?.organization_id],
    queryFn: async () => {
      const { data } = await supabase.from("subjects").select("id, name").order("name");
      return data || [];
    },
  });

  const add = async () => {
    if (!form.subject_id || !form.amount) { toast.error("Fan va narx kerak"); return; }
    const { error } = await supabase.from("tuition_plans").insert({
      organization_id: profile?.organization_id,
      subject_id: form.subject_id,
      billing_mode: form.billing_mode,
      amount: Number(form.amount),
      currency: form.currency,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Narx siyosati qo'shildi");
    setForm({ subject_id: "", billing_mode: "monthly", amount: "", currency: "UZS" });
    qc.invalidateQueries({ queryKey: ["tuition-plans"] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("tuition_plans").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["tuition-plans"] });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-strong p-4 rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center"><DollarSign className="w-4 h-4 text-primary" /></div>
          <h3 className="font-semibold text-sm">Fan narxlari</h3>
        </div>
        {plans.length > 0 && (
          <button onClick={() => exportCsv("tuition-plans.csv", plans.map((p: any) => ({
            subject: p.subjects?.name, mode: p.billing_mode, amount: p.amount, currency: p.currency,
          })))} className="glass px-2 py-1 rounded-lg text-[10px] flex items-center gap-1"><Download className="w-3 h-3" />CSV</button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <select value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
          className="glass px-2 py-2 rounded-lg text-xs col-span-2">
          <option value="">Fan tanlang...</option>
          {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={form.billing_mode} onChange={(e) => setForm({ ...form, billing_mode: e.target.value as any })}
          className="glass px-2 py-2 rounded-lg text-xs">
          <option value="monthly">Oylik</option>
          <option value="per_lesson">Dars uchun</option>
        </select>
        <input type="number" placeholder="Summa" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className="glass px-2 py-2 rounded-lg text-xs" />
        <button onClick={add} className="bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg text-xs font-semibold flex items-center justify-center gap-1">
          <Plus className="w-3 h-3" />Qo'shish
        </button>
      </div>

      <div className="space-y-1.5">
        {plans.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">Hali narx siyosati yo'q</p>
        ) : plans.map((p: any) => (
          <div key={p.id} className="glass p-2.5 rounded-lg flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{p.subjects?.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {p.billing_mode === "monthly" ? "Oylik" : "Dars uchun"} · {Number(p.amount).toLocaleString()} {p.currency}
              </p>
            </div>
            <button onClick={() => remove(p.id)} className="p-1 rounded hover:bg-destructive/10 text-destructive">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default TuitionPlansPanel;
