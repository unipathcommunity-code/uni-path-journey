import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Phone, Send, Download, AlertTriangle, Edit3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { exportCsv } from "@/lib/exportCsv";
import AdjustChargeModal from "./AdjustChargeModal";

/** Admin/Accountant: barcha qarzdor o'quvchilar ro'yxati + qo'l bilan Telegram. */
const StudentDebtsPanel = () => {
  const { profile } = useAuth();
  const [adjustTarget, setAdjustTarget] = useState<any>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["student-debts", profile?.organization_id],
    queryFn: async () => {
      const { data: charges } = await supabase
        .from("student_charges")
        .select("*, subjects(name)")
        .neq("status", "paid").neq("status", "waived")
        .order("created_at", { ascending: false });
      const list = charges || [];
      const studentIds = Array.from(new Set(list.map((c: any) => c.student_id)));
      if (studentIds.length === 0) return { rows: [], rawCharges: [] as any[] };
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name").in("user_id", studentIds);
      const nameById = new Map((profs || []).map((p: any) => [p.user_id, p.full_name]));
      const byStudent = new Map<string, { id: string; name: string; total: number; currency: string; items: any[] }>();
      list.forEach((c: any) => {
        const remain = Number(c.amount) - Number(c.paid_amount || 0);
        const cur = byStudent.get(c.student_id) || { id: c.student_id, name: (nameById.get(c.student_id) as string) || "—", total: 0, currency: c.currency, items: [] };
        cur.total += remain;
        cur.items.push({ id: c.id, amount: c.amount, currency: c.currency, subject: c.subjects?.name, remain, period: c.period_month, student_name: nameById.get(c.student_id) });
        byStudent.set(c.student_id, cur);
      });
      return { rows: Array.from(byStudent.values()).sort((a, b) => b.total - a.total), rawCharges: list };
    },
    enabled: !!profile?.organization_id,
  });

  const rows = data?.rows || [];

  const sendTelegramAll = async () => {
    if (rows.length === 0) return;
    const targets: string[] = [];
    for (const r of rows) {
      targets.push(r.id);
      const { data: parents } = await supabase.from("parent_students").select("parent_id").eq("student_id", r.id);
      (parents || []).forEach((p: any) => targets.push(p.parent_id));
    }
    const { error } = await supabase.functions.invoke("notify-telegram", {
      body: {
        user_ids: Array.from(new Set(targets)),
        title: "💳 To'lov eslatmasi",
        message: "Hurmatli foydalanuvchi, to'lov qarzingiz mavjud. Iltimos, markazga murojaat qiling.",
      },
    });
    if (error) { toast.error("Telegram yuborilmadi"); return; }
    toast.success(`${targets.length} ta foydalanuvchiga Telegram yuborildi`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-strong p-4 rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-destructive/15 flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-destructive" /></div>
          <div>
            <h3 className="font-semibold text-sm">Qarzdor o'quvchilar</h3>
            <p className="text-[10px] text-muted-foreground">{rows.length} ta · jami {rows.reduce((s, r) => s + r.total, 0).toLocaleString()} {rows[0]?.currency || ""}</p>
          </div>
        </div>
        <div className="flex gap-1">
          {rows.length > 0 && (<>
            <button onClick={sendTelegramAll} className="glass px-2 py-1 rounded-lg text-[10px] flex items-center gap-1 hover:bg-primary/10 text-primary">
              <Send className="w-3 h-3" />Telegram
            </button>
            <button onClick={() => exportCsv("debts.csv", rows.map((r) => ({ name: r.name, total: r.total, currency: r.currency })))}
              className="glass px-2 py-1 rounded-lg text-[10px] flex items-center gap-1"><Download className="w-3 h-3" />CSV</button>
          </>)}
        </div>
      </div>

      <div className="space-y-1.5 max-h-[420px] overflow-y-auto">
        {isLoading ? <p className="text-xs text-muted-foreground text-center py-3">Yuklanmoqda...</p> :
         rows.length === 0 ? <p className="text-xs text-success text-center py-3">🎉 Qarzdorlar yo'q</p> :
         rows.map((r) => (
          <div key={r.id} className="glass p-2.5 rounded-lg space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{r.name}</p>
              </div>
              <span className="text-xs font-bold text-destructive whitespace-nowrap">{r.total.toLocaleString()} {r.currency}</span>
              <a href={`tel:`} title="Qo'ng'iroq" className="p-1.5 rounded hover:bg-success/10 text-success"><Phone className="w-3.5 h-3.5" /></a>
            </div>
            <div className="flex flex-wrap gap-1 pl-1">
              {r.items.map((i: any) => (
                <button key={i.id} onClick={() => setAdjustTarget(i)}
                  className="text-[10px] glass px-1.5 py-0.5 rounded flex items-center gap-1 hover:bg-warning/10">
                  <Edit3 className="w-2.5 h-2.5" />
                  {i.subject || "Fan"}: {i.remain.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AdjustChargeModal charge={adjustTarget} onClose={() => setAdjustTarget(null)} onDone={() => refetch()} />
    </motion.div>
  );
};

export default StudentDebtsPanel;
