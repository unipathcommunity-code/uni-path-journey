import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Trash2, FileSignature, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { exportCsv } from "@/lib/exportCsv";

type ContractType = "percentage" | "per_lesson" | "monthly_salary" | "base_plus_bonus";

/** Owner: o'qituvchi bilan kelishuvlar — faqat direktor (va buxgalter o'qiy oladi). */
const TeacherContractsPanel = () => {
  const { profile, user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    teacher_id: "", contract_type: "percentage" as ContractType,
    percentage: "", per_lesson_amount: "", monthly_amount: "", base_amount: "",
    currency: "UZS", notes: "",
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ["teacher-contracts", profile?.organization_id],
    queryFn: async () => {
      const { data } = await supabase.from("teacher_contracts")
        .select("*, profiles!teacher_contracts_teacher_id_fkey(full_name)")
        .order("created_at", { ascending: false });
      // fallback: ikkinchi query bilan profillarni olib kelish — relation bo'lmasa
      return data || [];
    },
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers-for-contracts", profile?.organization_id],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles")
        .select("user_id").eq("role", "teacher")
        .eq("organization_id", profile?.organization_id);
      const ids = (roles || []).map((r: any) => r.user_id);
      if (ids.length === 0) return [];
      const { data } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ids);
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  const teacherName = (id: string) =>
    teachers.find((t: any) => t.user_id === id)?.full_name || "—";

  const add = async () => {
    if (!form.teacher_id) { toast.error("O'qituvchi tanlang"); return; }
    const payload: any = {
      organization_id: profile?.organization_id,
      teacher_id: form.teacher_id,
      contract_type: form.contract_type,
      currency: form.currency,
      notes: form.notes || null,
      created_by: user?.id,
    };
    if (form.contract_type === "percentage") payload.percentage = Number(form.percentage || 0);
    if (form.contract_type === "per_lesson") payload.per_lesson_amount = Number(form.per_lesson_amount || 0);
    if (form.contract_type === "monthly_salary") payload.monthly_amount = Number(form.monthly_amount || 0);
    if (form.contract_type === "base_plus_bonus") {
      payload.base_amount = Number(form.base_amount || 0);
      payload.percentage = form.percentage ? Number(form.percentage) : null;
    }
    const { error } = await supabase.from("teacher_contracts").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Kelishuv saqlandi");
    setForm({ ...form, teacher_id: "", percentage: "", per_lesson_amount: "", monthly_amount: "", base_amount: "", notes: "" });
    qc.invalidateQueries({ queryKey: ["teacher-contracts"] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("teacher_contracts").update({ is_active: false }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["teacher-contracts"] });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-strong p-4 rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-warning/15 flex items-center justify-center"><FileSignature className="w-4 h-4 text-warning" /></div>
          <div>
            <h3 className="font-semibold text-sm">O'qituvchi kelishuvlari</h3>
            <p className="text-[10px] text-muted-foreground">Faqat direktor va buxgalter ko'radi</p>
          </div>
        </div>
        {contracts.length > 0 && (
          <button onClick={() => exportCsv("contracts.csv", contracts.map((c: any) => ({
            teacher: teacherName(c.teacher_id), type: c.contract_type, percentage: c.percentage,
            per_lesson: c.per_lesson_amount, monthly: c.monthly_amount, base: c.base_amount, currency: c.currency,
          })))} className="glass px-2 py-1 rounded-lg text-[10px] flex items-center gap-1"><Download className="w-3 h-3" />CSV</button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <select value={form.teacher_id} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
          className="glass px-2 py-2 rounded-lg text-xs col-span-2">
          <option value="">O'qituvchi...</option>
          {teachers.map((t: any) => <option key={t.user_id} value={t.user_id}>{t.full_name}</option>)}
        </select>
        <select value={form.contract_type} onChange={(e) => setForm({ ...form, contract_type: e.target.value as ContractType })}
          className="glass px-2 py-2 rounded-lg text-xs">
          <option value="percentage">Foiz</option>
          <option value="per_lesson">Dars uchun</option>
          <option value="monthly_salary">Oylik</option>
          <option value="base_plus_bonus">Asos+Bonus</option>
        </select>
        <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
          className="glass px-2 py-2 rounded-lg text-xs" placeholder="UZS" />
        {form.contract_type === "percentage" && (
          <input type="number" placeholder="Foiz %" value={form.percentage} onChange={(e) => setForm({ ...form, percentage: e.target.value })}
            className="glass px-2 py-2 rounded-lg text-xs" />
        )}
        {form.contract_type === "per_lesson" && (
          <input type="number" placeholder="Dars summasi" value={form.per_lesson_amount} onChange={(e) => setForm({ ...form, per_lesson_amount: e.target.value })}
            className="glass px-2 py-2 rounded-lg text-xs" />
        )}
        {form.contract_type === "monthly_salary" && (
          <input type="number" placeholder="Oylik" value={form.monthly_amount} onChange={(e) => setForm({ ...form, monthly_amount: e.target.value })}
            className="glass px-2 py-2 rounded-lg text-xs" />
        )}
        {form.contract_type === "base_plus_bonus" && (<>
          <input type="number" placeholder="Asos" value={form.base_amount} onChange={(e) => setForm({ ...form, base_amount: e.target.value })}
            className="glass px-2 py-2 rounded-lg text-xs" />
          <input type="number" placeholder="Bonus %" value={form.percentage} onChange={(e) => setForm({ ...form, percentage: e.target.value })}
            className="glass px-2 py-2 rounded-lg text-xs" />
        </>)}
        <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Izoh" className="glass px-2 py-2 rounded-lg text-xs col-span-2" />
        <button onClick={add} className="bg-gradient-to-r from-warning to-accent text-primary-foreground rounded-lg text-xs font-semibold flex items-center justify-center gap-1 col-span-2 sm:col-span-1">
          <Plus className="w-3 h-3" />Saqlash
        </button>
      </div>

      <div className="space-y-1.5">
        {contracts.filter((c: any) => c.is_active).length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">Hali kelishuv yo'q</p>
        ) : contracts.filter((c: any) => c.is_active).map((c: any) => (
          <div key={c.id} className="glass p-2.5 rounded-lg flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{teacherName(c.teacher_id)}</p>
              <p className="text-[10px] text-muted-foreground">
                {c.contract_type === "percentage" && `${c.percentage}%`}
                {c.contract_type === "per_lesson" && `${Number(c.per_lesson_amount).toLocaleString()} / dars`}
                {c.contract_type === "monthly_salary" && `${Number(c.monthly_amount).toLocaleString()} / oy`}
                {c.contract_type === "base_plus_bonus" && `${Number(c.base_amount).toLocaleString()} + ${c.percentage || 0}%`}
                {" · "}{c.currency}
              </p>
            </div>
            <button onClick={() => remove(c.id)} className="p-1 rounded hover:bg-destructive/10 text-destructive">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default TeacherContractsPanel;
