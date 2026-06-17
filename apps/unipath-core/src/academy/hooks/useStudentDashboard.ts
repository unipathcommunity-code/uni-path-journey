import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface ScheduleItem {
  id: string;
  subject: string;
  room: string;
  teacher: string;
  startsAt: Date;
  endsAt: Date;
  status: "completed" | "live" | "upcoming";
}

export interface HomeworkItem {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status: "pending" | "submitted" | "graded";
  score?: number;
  maxScore: number;
}

export interface StudentProgress {
  attendanceRate: number;          // 0-100, real
  averageScore: number;            // 0-100, real (from graded homework). 0 if no graded subs.
  level: number;                   // derived from total earned coins (every 100 coins = +1 level), min 1
  trend: "up" | "down" | "stable"; // last-7-days vs prior-7-days
  missedBySubject: { subject: string; count: number }[]; // real missed in last 30 days
}

export const useStudentDashboard = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [progress, setProgress] = useState<StudentProgress>({
    attendanceRate: 0,
    averageScore: 0,
    level: 1,
    trend: "stable",
    missedBySubject: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchHomework = async (userId: string) => {
    // Fetch all active homework joined with lesson + subject
    const { data: hw } = await supabase
      .from("homework")
      .select("id, title, due_date, max_score, lessons(subjects(name))")
      .eq("status", "active")
      .order("due_date", { ascending: true });

    if (!hw) return;

    // Fetch this student's submissions in one shot
    const ids = hw.map((h: any) => h.id);
    const { data: subs } = ids.length
      ? await supabase
          .from("homework_submissions")
          .select("homework_id, status, score")
          .eq("student_id", userId)
          .in("homework_id", ids)
      : { data: [] as any[] };

    const subMap = new Map<string, any>();
    (subs || []).forEach((s: any) => subMap.set(s.homework_id, s));

    const mapped: HomeworkItem[] = hw.map((h: any) => {
      const sub = subMap.get(h.id);
      let status: HomeworkItem["status"] = "pending";
      if (sub?.status === "graded") status = "graded";
      else if (sub?.status === "submitted" || sub) status = "submitted";
      return {
        id: h.id,
        title: h.title,
        subject: h.lessons?.subjects?.name || "—",
        dueDate: new Date(h.due_date).toLocaleDateString(),
        status,
        score: sub?.score ?? undefined,
        maxScore: h.max_score ?? 100,
      };
    });
    setHomework(mapped);
  };

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 86400000);

      // Today's lessons — only ones tied to groups the student belongs to
      const { data: gm } = await supabase
        .from("group_members")
        .select("group_id, groups(subject_id, teacher_id)")
        .eq("student_id", user.id);
      const subjectIds = Array.from(new Set((gm || []).map((g: any) => g.groups?.subject_id).filter(Boolean)));
      const teacherIds = Array.from(new Set((gm || []).map((g: any) => g.groups?.teacher_id).filter(Boolean)));

      let lessonsQ = supabase
        .from("lessons")
        .select("*, rooms(name), subjects(name), teacher_profile:profiles!lessons_teacher_id_fkey(full_name)")
        .gte("starts_at", todayStart.toISOString())
        .lt("starts_at", todayEnd.toISOString())
        .order("starts_at");
      if (subjectIds.length > 0) lessonsQ = lessonsQ.in("subject_id", subjectIds);
      const { data: lessons } = await lessonsQ;

      if (lessons) {
        const filtered = subjectIds.length === 0
          ? [] // student has no group yet
          : lessons.filter((l: any) =>
              teacherIds.length === 0 || teacherIds.includes(l.teacher_id)
            );
        const mapped: ScheduleItem[] = filtered.map((l: any) => {
          const start = new Date(l.starts_at);
          const end = new Date(l.ends_at);
          let status: "completed" | "live" | "upcoming" = "upcoming";
          if (now >= start && now <= end) status = "live";
          else if (now > end) status = "completed";
          return {
            id: l.id,
            subject: l.subjects?.name || l.title,
            room: l.rooms?.name || "TBD",
            teacher: l.teacher_profile?.full_name || "—",
            startsAt: start,
            endsAt: end,
            status,
          };
        });
        setSchedule(mapped);
      }

      // Notifications
      const { data: notifs } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(10);
      if (notifs) setNotifications(notifs);

      await fetchHomework(user.id);
      await fetchProgress(user.id);
      setLoading(false);
    };

    // Real progress: real attendance %, real avg score from graded HW, real coin-derived level,
    // real trend over last 14 days, and real per-subject "missed" counts. No fake numbers.
    async function fetchProgress(userId: string) {
      // Attendance for this student
      const { data: att } = await supabase
        .from("attendance")
        .select("status, created_at, lesson_id, lessons(subject_id, subjects(name))")
        .eq("student_id", userId)
        .order("created_at", { ascending: false })
        .limit(500);
      const total = (att || []).length;
      const present = (att || []).filter((a: any) => a.status === "present").length;
      const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

      // Trend: present% in last 7 days vs prior 7 days
      const nowMs = Date.now();
      const day = 86400000;
      const recent = (att || []).filter((a: any) => nowMs - new Date(a.created_at).getTime() <= 7 * day);
      const prior = (att || []).filter((a: any) => {
        const t = new Date(a.created_at).getTime();
        return nowMs - t > 7 * day && nowMs - t <= 14 * day;
      });
      const pct = (arr: any[]) =>
        arr.length === 0 ? null : (arr.filter((a) => a.status === "present").length / arr.length) * 100;
      const recentPct = pct(recent);
      const priorPct = pct(prior);
      let trend: StudentProgress["trend"] = "stable";
      if (recentPct != null && priorPct != null) {
        if (recentPct - priorPct > 5) trend = "up";
        else if (priorPct - recentPct > 5) trend = "down";
      }

      // Missed by subject in last 30 days (status = "absent")
      const cutoff = nowMs - 30 * day;
      const missedMap = new Map<string, number>();
      (att || []).forEach((a: any) => {
        if (a.status !== "absent") return;
        if (new Date(a.created_at).getTime() < cutoff) return;
        const name = a.lessons?.subjects?.name || "—";
        missedMap.set(name, (missedMap.get(name) || 0) + 1);
      });
      const missedBySubject = Array.from(missedMap.entries())
        .map(([subject, count]) => ({ subject, count }))
        .sort((a, b) => b.count - a.count);

      // Average score from graded submissions only
      const { data: subs } = await supabase
        .from("homework_submissions")
        .select("score, max_score:homework(max_score)")
        .eq("student_id", userId)
        .not("score", "is", null);
      const scored = (subs || []).filter((s: any) => s.score != null);
      const averageScore =
        scored.length === 0
          ? 0
          : Math.round(
              scored.reduce((sum: number, s: any) => {
                const max = s.max_score?.max_score || 100;
                return sum + (Number(s.score) / max) * 100;
              }, 0) / scored.length
            );

      // Level from total positive coins earned (every 100 = +1 level), min 1
      const { data: coins } = await supabase
        .from("nova_coins")
        .select("amount")
        .eq("user_id", userId);
      const totalEarned = (coins || []).reduce(
        (sum: number, c: any) => sum + (c.amount > 0 ? c.amount : 0),
        0
      );
      const level = Math.max(1, Math.floor(totalEarned / 100) + 1);

      setProgress({ attendanceRate, averageScore, level, trend, missedBySubject });
    }

    fetchData();

    // Realtime: notifications
    const notifChannel = supabase
      .channel("student-notifications")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const n = payload.new as any;
        setNotifications((prev) => [n, ...prev]);
        toast(n.title, { description: n.message });
      })
      .subscribe();

    // Realtime: new homework appears immediately
    const hwChannel = supabase
      .channel("student-homework")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "homework",
      }, () => {
        fetchHomework(user.id);
      })
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "homework_submissions",
        filter: `student_id=eq.${user.id}`,
      }, () => {
        fetchHomework(user.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(hwChannel);
    };
  }, [user]);

  const dismissNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  };

  const refreshHomework = () => user && fetchHomework(user.id);

  return { schedule, notifications, homework, progress, dismissNotification, refreshHomework, loading };
};
