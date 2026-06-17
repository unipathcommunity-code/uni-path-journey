import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBranch } from "@/hooks/useBranch";
import { toast } from "sonner";
import {
  CheckCircle2, XCircle, Clock, MapPin, BookMarked, ChevronDown, ChevronUp,
  Save, FileText, Send, Users as UsersIcon, FileSpreadsheet,
} from "lucide-react";
import { exportCsv } from "@/lib/exportCsv";

/**
 * TodayCommandCenter — ustozning bugungi darslar uchun universal panel:
 * - Bugungi har bir dars uchun: davomat (kim keldi/kelmadi), mavzu tanlash,
 *   izoh saqlash, vazifa qilmaganlarni ko'rib Telegramga yuborish.
 */
const TodayCommandCenter = () => {
  const { user, profile } = useAuth();
  const { activeBranchId } = useBranch();
  const qc = useQueryClient();
  const [openLessonId, setOpenLessonId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [topicSel, setTopicSel] = useState<Record<string, string>>({});

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

  const { data: lessons = [] } = useQuery({
    queryKey: ["today-lessons", user?.id, activeBranchId],
    queryFn: async () => {
      if (!user) return [];
      let q = supabase.from("lessons")
        .select("*, subjects(name), rooms(name)")
        .eq("teacher_id", user.id)
        .gte("starts_at", todayStart.toISOString())
        .lte("starts_at", todayEnd.toISOString())
        .order("starts_at", { ascending: true });
      if (activeBranchId) q = q.eq("branch_id", activeBranchId);
      const { data } = await q;
      return data || [];
    },
    enabled: !!user,
  });

  const exportToday = async () => {
    if (lessons.length === 0) return;
    const lessonIds = lessons.map((l: any) => l.id);
    // gather rosters + attendance + homework status per (lesson, student)
    const { data: grps } = await supabase.from("groups")
      .select("id, subject_id").eq("teacher_id", user!.id);
    const groupBySubject = new Map<string, string[]>();
    (grps || []).forEach((g: any) => {
      const arr = groupBySubject.get(g.subject_id) || []; arr.push(g.id);
      groupBySubject.set(g.subject_id, arr);
    });
    const allGroupIds = (grps || []).map((g: any) => g.id);
    const { data: members } = allGroupIds.length
      ? await supabase.from("group_members").select("student_id, group_id, profiles!inner(full_name)").in("group_id", allGroupIds)
      : { data: [] as any[] };
    const { data: att } = await supabase.from("attendance")
      .select("lesson_id, student_id, status, checked_in_at").in("lesson_id", lessonIds);
    const attMap = new Map((att || []).map((a: any) => [`${a.lesson_id}:${a.student_id}`, a]));
    const { data: hws } = await supabase.from("homework").select("id, title, lesson_id").in("lesson_id", lessonIds);
    const hwIds = (hws || []).map((h: any) => h.id);
    const { data: subs } = hwIds.length
      ? await supabase.from("homework_submissions").select("homework_id, student_id, status, score").in("homework_id", hwIds)
      : { data: [] as any[] };
    const subMap = new Map((subs || []).map((s: any) => [`${s.homework_id}:${s.student_id}`, s]));

    const rows: any[] = [];
    lessons.forEach((l: any) => {
      const groupIds = groupBySubject.get(l.subject_id) || [];
      const seen = new Set<string>();
      const lessonHws = (hws || []).filter((h: any) => h.lesson_id === l.id);
      (members || []).filter((m: any) => groupIds.includes(m.group_id)).forEach((m: any) => {
        if (seen.has(m.student_id)) return; seen.add(m.student_id);
        const a = attMap.get(`${l.id}:${m.student_id}`) as any;
        const hwSummary = lessonHws.length === 0 ? "—" : lessonHws.map((h: any) => {
          const s = subMap.get(`${h.id}:${m.student_id}`) as any;
          return `${h.title}: ${s ? `${s.status}${s.score != null ? ` (${s.score})` : ""}` : "yo'q"}`;
        }).join(" | ");
        rows.push({
          Sana: new Date(l.starts_at).toLocaleDateString(),
          Vaqt: new Date(l.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          Dars: l.title,
          Fan: l.subjects?.name || "",
          Xona: l.rooms?.name || "",
          Oquvchi: m.profiles?.full_name || "—",
          Davomat: a?.status || "absent",
          Vaqti: a?.checked_in_at ? new Date(a.checked_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
          Vazifa: hwSummary,
        });
      });
    });
    if (rows.length === 0) { toast.error("Eksport uchun ma'lumot yo'q"); return; }
    exportCsv(`bugungi-davomat-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Bugungi darslar — komanda markazi
        </h2>
        <button onClick={exportToday} disabled={lessons.length === 0}
          className="glass px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-muted/40 disabled:opacity-50">
          <FileSpreadsheet className="w-3 h-3" /> Excel
        </button>
      </div>
      {lessons.length === 0 && (
        <div className="glass-strong p-6 text-center">
          <p className="text-sm text-muted-foreground">Bugun rejalashtirilgan darsingiz yo'q</p>
        </div>
      )}
      {lessons.map((l: any) => (
        <LessonCard
          key={l.id}
          lesson={l}
          open={openLessonId === l.id}
          onToggle={() => setOpenLessonId(openLessonId === l.id ? null : l.id)}
          notes={notes[l.id] ?? l.teacher_notes ?? ""}
          setNotes={(v) => setNotes((s) => ({ ...s, [l.id]: v }))}
          topicSel={topicSel[l.id] ?? l.topic_id ?? ""}
          setTopicSel={(v) => setTopicSel((s) => ({ ...s, [l.id]: v }))}
          orgId={profile?.organization_id}
          teacherId={user!.id}
          onSaved={() => qc.invalidateQueries({ queryKey: ["today-lessons"] })}
        />
      ))}
    </div>
  );
};

interface LessonCardProps {
  lesson: any;
  open: boolean;
  onToggle: () => void;
  notes: string;
  setNotes: (v: string) => void;
  topicSel: string;
  setTopicSel: (v: string) => void;
  orgId?: string;
  teacherId: string;
  onSaved: () => void;
}

const LessonCard = ({ lesson, open, onToggle, notes, setNotes, topicSel, setTopicSel, orgId, teacherId, onSaved }: LessonCardProps) => {
  const qc = useQueryClient();
  const start = new Date(lesson.starts_at);
  const end = new Date(lesson.ends_at);
  const now = new Date();
  const isLive = start <= now && end >= now;
  const isPast = end < now;

  // Topics for this lesson's subject (planned + covered)
  const { data: topics = [] } = useQuery({
    queryKey: ["topics-for-subject", lesson.subject_id, teacherId],
    queryFn: async () => {
      const { data } = await supabase.from("lesson_topics")
        .select("id, title, status, position")
        .eq("subject_id", lesson.subject_id)
        .eq("teacher_id", teacherId)
        .order("position", { ascending: true });
      return data || [];
    },
    enabled: open && !!lesson.subject_id,
  });

  // Students from groups for this subject + their attendance for this lesson
  const { data: roster = [] } = useQuery({
    queryKey: ["lesson-roster", lesson.id],
    queryFn: async () => {
      // groups for this subject taught by this teacher
      const { data: grps } = await supabase.from("groups")
        .select("id").eq("teacher_id", teacherId).eq("subject_id", lesson.subject_id);
      const groupIds = (grps || []).map((g: any) => g.id);
      if (groupIds.length === 0) return [];
      const { data: members } = await supabase.from("group_members")
        .select("student_id, profiles!inner(full_name)").in("group_id", groupIds);
      const studentIds = Array.from(new Set((members || []).map((m: any) => m.student_id)));
      const { data: att } = await supabase.from("attendance")
        .select("student_id, status").eq("lesson_id", lesson.id).in("student_id", studentIds);
      const attMap = new Map((att || []).map((a: any) => [a.student_id, a.status]));
      const seen = new Set<string>();
      return (members || []).filter((m: any) => {
        if (seen.has(m.student_id)) return false;
        seen.add(m.student_id);
        return true;
      }).map((m: any) => ({
        student_id: m.student_id,
        name: m.profiles?.full_name || "—",
        status: (attMap.get(m.student_id) as string) || "absent",
      }));
    },
    enabled: open,
  });

  const markAttendance = useMutation({
    mutationFn: async ({ student_id, status }: { student_id: string; status: string }) => {
      // upsert attendance row for this lesson+student
      const { data: existing } = await supabase.from("attendance")
        .select("id").eq("lesson_id", lesson.id).eq("student_id", student_id).maybeSingle();
      if (existing) {
        await supabase.from("attendance").update({
          status, checked_in_at: status === "present" ? new Date().toISOString() : null,
        }).eq("id", existing.id);
      } else {
        await supabase.from("attendance").insert({
          lesson_id: lesson.id, student_id, status,
          organization_id: orgId,
          checked_in_at: status === "present" ? new Date().toISOString() : null,
        });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lesson-roster", lesson.id] }),
    onError: (e: any) => toast.error(e.message || "Davomatni saqlab bo'lmadi"),
  });

  const saveLesson = useMutation({
    mutationFn: async () => {
      const upd: any = { teacher_notes: notes };
      if (topicSel) upd.topic_id = topicSel;
      await supabase.from("lessons").update(upd).eq("id", lesson.id);
      // Mark topic covered if selected
      if (topicSel) {
        await supabase.from("lesson_topics").update({
          status: "covered", covered_at: new Date().toISOString(),
        }).eq("id", topicSel).neq("status", "covered");
      }
    },
    onSuccess: () => { toast.success("Saqlandi"); onSaved(); },
    onError: (e: any) => toast.error(e.message || "Saqlab bo'lmadi"),
  });

  const presentCount = roster.filter((r) => r.status === "present").length;
  const absentCount = roster.length - presentCount;

  return (
    <motion.div layout className={`glass-strong p-4 ${isLive ? "border-success/40" : ""}`}>
      <button onClick={onToggle} className="w-full flex items-center justify-between text-left">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isLive && <span className="w-2 h-2 rounded-full bg-success animate-pulse" />}
            <span className={`text-[10px] font-bold uppercase ${isLive ? "text-success" : isPast ? "text-muted-foreground" : "text-primary"}`}>
              {isLive ? "Hozir" : isPast ? "Tugagan" : "Kutilmoqda"}
            </span>
          </div>
          <h3 className="font-bold text-foreground truncate">{lesson.title}</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1"><BookMarked className="w-3 h-3" />{lesson.subjects?.name}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{lesson.rooms?.name || "Xona kiritilmagan"}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-4 space-y-4"
          >
            {/* Davomat */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <UsersIcon className="w-3.5 h-3.5" /> Davomat ({roster.length})
                </p>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-success">✓ {presentCount}</span>
                  <span className="text-destructive">✗ {absentCount}</span>
                </div>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {roster.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">O'quvchi topilmadi</p>
                )}
                {roster.map((r) => (
                  <div key={r.student_id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                      {r.name[0]?.toUpperCase() || "?"}
                    </div>
                    <span className="flex-1 text-sm truncate">{r.name}</span>
                    <button
                      onClick={() => markAttendance.mutate({ student_id: r.student_id, status: "present" })}
                      className={`p-1.5 rounded-lg transition ${r.status === "present" ? "bg-success text-success-foreground" : "bg-background text-muted-foreground hover:text-success"}`}
                      aria-label="Keldi"
                    ><CheckCircle2 className="w-4 h-4" /></button>
                    <button
                      onClick={() => markAttendance.mutate({ student_id: r.student_id, status: "absent" })}
                      className={`p-1.5 rounded-lg transition ${r.status === "absent" ? "bg-destructive text-destructive-foreground" : "bg-background text-muted-foreground hover:text-destructive"}`}
                      aria-label="Kelmadi"
                    ><XCircle className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>

            {/* Mavzu tanlash */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookMarked className="w-3.5 h-3.5" /> Bugun o'tilgan mavzu
              </p>
              {topics.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Bu fan uchun avval "Mavzular" bo'limidan reja qo'shing.</p>
              ) : (
                <select
                  value={topicSel}
                  onChange={(e) => setTopicSel(e.target.value)}
                  className="w-full glass px-3 py-2 rounded-lg text-sm bg-background"
                >
                  <option value="">— Tanlang —</option>
                  {topics.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.position + 1}. {t.title} {t.status === "covered" ? "✓" : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Izoh */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Dars izohi
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Bolalar nimalarni o'zlashtirdi, kim qiynalishdi, uy vazifa..."
                rows={3}
                className="w-full glass px-3 py-2 rounded-lg text-sm bg-background resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => saveLesson.mutate()}
                disabled={saveLesson.isPending}
                className="flex-1 bg-gradient-to-br from-accent to-primary text-primary-foreground py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saveLesson.isPending ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TodayCommandCenter;
