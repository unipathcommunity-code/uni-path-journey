import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { AlertTriangle, Send, Loader2, FileSpreadsheet } from "lucide-react";
import { exportCsv } from "@/lib/exportCsv";

/**
 * HomeworkAlerts — vazifa qilmagan o'quvchilar ro'yxati.
 * Ustoz tugma bilan tanlanganlarni ota-onaga Telegram/ilova orqali ogohlantiradi.
 * Avtomatik kunlik xabarlar pg_cron orqali serverdan yuboriladi.
 */
const HomeworkAlerts = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);

  const { data: missing = [] } = useQuery({
    queryKey: ["missing-hw", user?.id],
    queryFn: async () => {
      // Active homework whose due_date has passed within last 30 days, by this teacher
      const since = new Date(); since.setDate(since.getDate() - 30);
      const { data: hws } = await supabase.from("homework")
        .select("id, title, due_date, lesson_id, lessons(subject_id, subjects(name))")
        .eq("teacher_id", user!.id)
        .gte("due_date", since.toISOString())
        .lte("due_date", new Date().toISOString());
      if (!hws || hws.length === 0) return [];
      const hwIds = hws.map((h: any) => h.id);

      // Students assigned to those homework via group membership of the lesson's subject
      const subjectIds = Array.from(new Set(hws.map((h: any) => h.lessons?.subject_id).filter(Boolean)));
      const { data: grps } = await supabase.from("groups").select("id, subject_id")
        .eq("teacher_id", user!.id).in("subject_id", subjectIds);
      const groupBySubject = new Map<string, string[]>();
      (grps || []).forEach((g: any) => {
        const arr = groupBySubject.get(g.subject_id) || []; arr.push(g.id);
        groupBySubject.set(g.subject_id, arr);
      });
      const allGroupIds = (grps || []).map((g: any) => g.id);
      const { data: members } = allGroupIds.length
        ? await supabase.from("group_members").select("student_id, group_id, profiles!inner(full_name)").in("group_id", allGroupIds)
        : { data: [] as any[] };

      // Submissions
      const { data: subs } = await supabase.from("homework_submissions")
        .select("homework_id, student_id").in("homework_id", hwIds);
      const submitted = new Set((subs || []).map((s: any) => `${s.homework_id}:${s.student_id}`));

      const rows: any[] = [];
      hws.forEach((hw: any) => {
        const sid = hw.lessons?.subject_id;
        const groupIds = groupBySubject.get(sid) || [];
        const seen = new Set<string>();
        (members || []).filter((m: any) => groupIds.includes(m.group_id)).forEach((m: any) => {
          if (seen.has(m.student_id)) return;
          seen.add(m.student_id);
          if (!submitted.has(`${hw.id}:${m.student_id}`)) {
            rows.push({
              key: `${hw.id}:${m.student_id}`,
              hw_id: hw.id, hw_title: hw.title, due_date: hw.due_date,
              subject: hw.lessons?.subjects?.name || "—",
              student_id: m.student_id, student_name: m.profiles?.full_name || "—",
            });
          }
        });
      });
      return rows;
    },
    enabled: !!user,
  });

  const toggleAll = () => {
    if (Object.keys(selected).length === missing.length) setSelected({});
    else setSelected(Object.fromEntries(missing.map((m: any) => [m.key, true])));
  };

  const sendAlerts = async () => {
    const chosen = missing.filter((m: any) => selected[m.key]);
    if (chosen.length === 0) { toast.error("Hech kim tanlanmadi"); return; }
    setSending(true);
    try {
      // Group by student to avoid spam
      const byStudent = new Map<string, any[]>();
      chosen.forEach((c: any) => {
        const arr = byStudent.get(c.student_id) || []; arr.push(c); byStudent.set(c.student_id, arr);
      });
      const userIds = Array.from(byStudent.keys());
      // Also collect parent IDs from parent_students
      const { data: links } = await supabase.from("parent_students").select("parent_id, student_id").in("student_id", userIds);
      const parentIds = (links || []).map((l: any) => l.parent_id);
      const targetIds = Array.from(new Set([...userIds, ...parentIds]));

      // Build a single combined message per (parent or student) target
      const studentToParents = new Map<string, string[]>();
      (links || []).forEach((l: any) => {
        const arr = studentToParents.get(l.student_id) || []; arr.push(l.parent_id);
        studentToParents.set(l.student_id, arr);
      });

      // Insert in-app notifications
      const notifRows: any[] = [];
      byStudent.forEach((items, studentId) => {
        const titles = items.map((i: any) => `• ${i.subject}: "${i.hw_title}"`).join("\n");
        const msg = `Quyidagi vazifalar bajarilmadi:\n${titles}`;
        const recipients = [studentId, ...(studentToParents.get(studentId) || [])];
        recipients.forEach((rid) => {
          notifRows.push({
            user_id: rid,
            title: "⚠️ Bajarilmagan vazifa",
            message: msg,
            type: "homework",
            is_alarm: true,
          });
        });
      });
      if (notifRows.length > 0) {
        const { error: nErr } = await supabase.from("notifications").insert(notifRows);
        if (nErr) console.warn("notif insert err", nErr.message);
      }

      // Telegram via existing notify-telegram
      const { error: tgErr } = await supabase.functions.invoke("notify-telegram", {
        body: {
          user_ids: targetIds,
          title: "Bajarilmagan vazifa",
          message: chosen.map((c: any) => `• ${c.student_name} — ${c.subject}: "${c.hw_title}"`).join("\n"),
        },
      });
      if (tgErr) console.warn("telegram err", tgErr.message);

      toast.success(`${targetIds.length} ta qabul qiluvchiga yuborildi`);
      setSelected({});
      qc.invalidateQueries({ queryKey: ["missing-hw"] });
    } catch (e: any) {
      toast.error(e.message || "Yuborishda xatolik");
    } finally { setSending(false); }
  };

  const exportXls = () => {
    if (missing.length === 0) return;
    exportCsv("vazifa-bajarmaganlar.csv", missing.map((m: any) => ({
      Oquvchi: m.student_name, Fan: m.subject, Vazifa: m.hw_title, Muddat: new Date(m.due_date).toLocaleDateString(),
    })));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" /> Vazifa bajarmaganlar
        </h2>
        <div className="flex gap-2">
          <button onClick={async () => {
            // Quick action: notify all students of teacher's published tests
            const { data: tests } = await supabase.from("tests")
              .select("id, title").eq("teacher_id", user!.id).eq("status", "published");
            if (!tests || tests.length === 0) { toast.error("Published test yo'q"); return; }
            const { data: grps } = await supabase.from("groups").select("id").eq("teacher_id", user!.id);
            const gids = (grps || []).map((g: any) => g.id);
            if (gids.length === 0) return;
            const { data: members } = await supabase.from("group_members").select("student_id").in("group_id", gids);
            const sids = Array.from(new Set((members || []).map((m: any) => m.student_id)));
            if (sids.length === 0) return;
            const titles = tests.map((t: any) => `• ${t.title}`).join("\n");
            await supabase.from("notifications").insert(sids.map((sid: string) => ({
              user_id: sid, title: "📝 Yangi testlar", message: `Yechish uchun ochiq testlar:\n${titles}`,
              type: "test", is_alarm: true,
            })));
            await supabase.functions.invoke("notify-telegram", {
              body: { user_ids: sids, title: "Yangi testlar", message: titles },
            });
            toast.success(`${sids.length} ta o'quvchiga test yuborildi`);
          }}
            className="glass px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-muted/40">
            <Send className="w-3 h-3" /> Testlarni yuborish
          </button>
          <button onClick={exportXls} disabled={missing.length === 0}
            className="glass px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-muted/40 disabled:opacity-50">
            <FileSpreadsheet className="w-3 h-3" /> Excel
          </button>
        </div>
      </div>

      {missing.length === 0 ? (
        <div className="glass-strong p-6 text-center">
          <p className="text-sm text-muted-foreground">Hammasi a'lo — vazifa bajarmaganlar yo'q ✨</p>
        </div>
      ) : (
        <>
          <div className="glass-strong p-3 flex items-center justify-between">
            <button onClick={toggleAll} className="text-xs font-semibold text-primary">
              {Object.keys(selected).length === missing.length ? "Bekor qilish" : `Hammasini tanlash (${missing.length})`}
            </button>
            <button onClick={sendAlerts} disabled={sending || Object.values(selected).filter(Boolean).length === 0}
              className="bg-gradient-to-br from-warning to-destructive text-destructive-foreground px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50">
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Telegramga yuborish
            </button>
          </div>
          <div className="space-y-1.5">
            {missing.map((m: any) => (
              <label key={m.key} className="glass p-3 flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!selected[m.key]}
                  onChange={(e) => setSelected((s) => ({ ...s, [m.key]: e.target.checked }))}
                  className="w-4 h-4" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.student_name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {m.subject} · {m.hw_title} · muddat {new Date(m.due_date).toLocaleDateString()}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default HomeworkAlerts;
