import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart3, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { exportCsv } from "@/lib/exportCsv";

/** Owner/Admin: tanlangan oy uchun har bir o'qituvchi kelishuvi bo'yicha
 *  base / percent / per-lesson / bonus parchalanishi. */
const TeacherEarningsBreakdown = () => {
  const { profile } = useAuth();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM

  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts-breakdown", profile?.organization_id],
    queryFn: async () => {
      const { data } = await supabase.from("teacher_contracts")
        .select("id, teacher_id, contract_type, percentage, per_lesson_amount, monthly_amount, base_amount, bonus_rules, currency, subject_id, subjects(name)")
        .eq("is_active", true);
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers-bd", profile?.organization_id],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "teacher").eq("organization_id", profile?.organization_id);
      const ids = (roles || []).map((r: any) => r.user_id);
      if (ids.length === 0) return [];
      const { data } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ids);
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  const { data: lessonsCount = {} } = useQuery({
    queryKey: ["lessons-count-bd", month, profile?.organization_id],
    queryFn: async () => {
      const start = `${month}-01`;
      const end = new Date(new Date(start).setMonth(new Date(start).getMonth() + 1)).toISOString().slice(0, 10);
      const { data } = await supabase.from("lessons")
        .select("teacher_id, subject_id")
        .gte("starts_at", start).lt("starts_at", end);
      const map: Record<string, number> = {};
      (data || []).forEach((l: any) => {
        const k = `${l.teacher_id}::${l.subject_id || ""}`;
        map[k] = (map[k] || 0) + 1;
      });
      return map;
    },
  });

  const { data: charges = [] } = useQuery({
    queryKey: ["charges-bd", month, profile?.organization_id],
    queryFn: async () => {
      const { data } = await supabase.from("student_charges")
        .select("subject_id, paid_amount, group_id, groups(teacher_id)")
        .eq("period_month", `${month}-01`);
      return data || [];
    },
  });

  const teacherName = (id: string) => teachers.find((t: any) => t.user_id === id)?.full_name || "—";

  const breakdown = useMemo(() => {
    return contracts.map((c: any) => {
      const lessonsKey = `${c.teacher_id}::${c.subject_id || ""}`;
      const lessons = (lessonsCount as any)[lessonsKey] || 0;

      // Subject revenue from paid charges (for percent contracts)
      const subjectRevenue = charges
        .filter((ch: any) => ch.subject_id === c.subject_id && (!c.subject_id || ch.groups?.teacher_id === c.teacher_id))
        .reduce((s: number, ch: any) => s + Number(ch.paid_amount || 0), 0);

      const base = Number(c.base_amount || c.monthly_amount || 0);
      const percent = c.percentage ? (subjectRevenue * Number(c.percentage)) / 100 : 0;
      const perLesson = c.per_lesson_amount ? lessons * Number(c.per_lesson_amount) : 0;
      const bonus = Number((c.bonus_rules as any)?.fixed_bonus || 0);

      const total = base + percent + perLesson + bonus;
      return {
        contractId: c.id,
        teacher: teacherName(c.teacher_id),
        subject: c.subjects?.name || "Umumiy",
        type: c.contract_type,
        currency: c.currency,
        lessons,
        base, percent, perLesson, bonus, total,
      };
    });
  }, [contracts, lessonsCount, charges, teachers]);

  const chartData = breakdown.map((b) => ({
    name: `${b.teacher.split(" ")[0]} (${b.subject.slice(0, 8)})`,
    Asos: Math.round(b.base),
    Foiz: Math.round(b.percent),
    Dars: Math.round(b.perLesson),
    Bonus: Math.round(b.bonus),
  }));

  const totals = breakdown.reduce(
    (s, b) => ({ base: s.base + b.base, percent: s.percent + b.percent, perLesson: s.perLesson + b.perLesson, bonus: s.bonus + b.bonus, total: s.total + b.total }),
    { base: 0, percent: 0, perLesson: 0, bonus: 0, total: 0 }
  );

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-strong p-4 rounded-2xl space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center"><BarChart3 className="w-4 h-4 text-primary" /></div>
          <div>
            <h3 className="font-semibold text-sm">O'qituvchi daromadi parchalanishi</h3>
            <p className="text-[10px] text-muted-foreground">Asos · Foiz · Dars · Bonus</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
            className="glass px-2 py-1 rounded-lg text-xs bg-background" />
          {breakdown.length > 0 && (
            <button onClick={() => exportCsv(`earnings-${month}.csv`, breakdown.map((b) => ({
              teacher: b.teacher, subject: b.subject, type: b.type, lessons: b.lessons,
              base: b.base, percent: b.percent, per_lesson: b.perLesson, bonus: b.bonus, total: b.total, currency: b.currency,
            })))} className="glass px-2 py-1 rounded-lg text-[10px] flex items-center gap-1"><Download className="w-3 h-3" />CSV</button>
          )}
        </div>
      </div>

      {breakdown.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">Faol kelishuv yo'q</p>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: "Asos", value: totals.base, color: "text-blue-500" },
              { label: "Foiz", value: totals.percent, color: "text-emerald-500" },
              { label: "Dars", value: totals.perLesson, color: "text-amber-500" },
              { label: "Bonus", value: totals.bonus, color: "text-purple-500" },
            ].map((t) => (
              <div key={t.label} className="glass p-2 rounded-lg">
                <p className="text-[9px] text-muted-foreground uppercase">{t.label}</p>
                <p className={`text-xs font-bold ${t.color}`}>{Math.round(t.value).toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Asos" stackId="a" fill="hsl(217 91% 60%)" />
                <Bar dataKey="Foiz" stackId="a" fill="hsl(160 84% 45%)" />
                <Bar dataKey="Dars" stackId="a" fill="hsl(38 92% 55%)" />
                <Bar dataKey="Bonus" stackId="a" fill="hsl(270 80% 65%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="text-muted-foreground">
                <tr className="border-b border-border/40">
                  <th className="text-left py-1.5 px-2">O'qituvchi</th>
                  <th className="text-left">Fan</th>
                  <th className="text-right">Darslar</th>
                  <th className="text-right">Asos</th>
                  <th className="text-right">Foiz</th>
                  <th className="text-right">Dars</th>
                  <th className="text-right">Bonus</th>
                  <th className="text-right pr-2">Jami</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((b) => (
                  <tr key={b.contractId} className="border-b border-border/20">
                    <td className="py-1.5 px-2 font-medium">{b.teacher}</td>
                    <td>{b.subject}</td>
                    <td className="text-right">{b.lessons}</td>
                    <td className="text-right">{Math.round(b.base).toLocaleString()}</td>
                    <td className="text-right text-emerald-500">{Math.round(b.percent).toLocaleString()}</td>
                    <td className="text-right text-amber-500">{Math.round(b.perLesson).toLocaleString()}</td>
                    <td className="text-right text-purple-500">{Math.round(b.bonus).toLocaleString()}</td>
                    <td className="text-right pr-2 font-bold">{Math.round(b.total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default TeacherEarningsBreakdown;
