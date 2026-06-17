import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, BookOpen, User, Radio, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  studentId: string;
}

interface LessonRow {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  status: string;
  subjects?: { name: string } | null;
  rooms?: { name: string } | null;
  profiles?: { full_name: string } | null;
}

/**
 * ChildLiveStatus — ota-ona uchun farzandning HOZIR qayerda ekanligi
 * va bugungi to'liq jadvali. Real-time yangilanadi (lessons + attendance).
 */
const ChildLiveStatus = ({ studentId }: Props) => {
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!studentId) return;
    const load = async () => {
      // Talabaning bugungi guruh darslari
      const { data: gm } = await supabase
        .from("group_members")
        .select("group_id, groups(id)")
        .eq("student_id", studentId);
      const groupIds = (gm || []).map((g: any) => g.group_id).filter(Boolean);

      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(); end.setHours(23, 59, 59, 999);

      // Lessons jadvalida group_id ustuni bo'lmasligi mumkin —
      // shuning uchun teacher_id bo'yicha filtrlash o'rniga subject_id orqali ham olamiz.
      const { data: groups } = await supabase
        .from("groups")
        .select("subject_id, teacher_id")
        .in("id", groupIds.length ? groupIds : ["00000000-0000-0000-0000-000000000000"]);
      const subjIds = Array.from(new Set((groups || []).map((g: any) => g.subject_id).filter(Boolean)));
      const teacherIds = Array.from(new Set((groups || []).map((g: any) => g.teacher_id).filter(Boolean)));

      if (subjIds.length === 0 && teacherIds.length === 0) {
        setLessons([]); return;
      }

      const { data } = await supabase
        .from("lessons")
        .select("id, title, starts_at, ends_at, status, teacher_id, subjects(name), rooms(name)")
        .gte("starts_at", start.toISOString())
        .lte("starts_at", end.toISOString())
        .or(
          [
            subjIds.length ? `subject_id.in.(${subjIds.join(",")})` : "",
            teacherIds.length ? `teacher_id.in.(${teacherIds.join(",")})` : "",
          ].filter(Boolean).join(","),
        )
        .order("starts_at", { ascending: true });

      const tIds = Array.from(new Set((data || []).map((l: any) => l.teacher_id).filter(Boolean)));
      let tMap = new Map<string, string>();
      if (tIds.length) {
        const { data: profs } = await supabase.from("profiles").select("user_id, full_name").in("user_id", tIds);
        tMap = new Map((profs || []).map((p: any) => [p.user_id, p.full_name || "Ustoz"]));
      }
      setLessons(((data || []) as any[]).map((l) => ({ ...l, profiles: { full_name: tMap.get(l.teacher_id) || "Ustoz" } })) as any);
    };
    load();

    const ch = supabase
      .channel(`child-live-${studentId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "lessons" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [studentId]);

  const live = lessons.find((l) => {
    const s = new Date(l.starts_at).getTime();
    const e = new Date(l.ends_at).getTime();
    return now >= s && now <= e;
  });
  const next = lessons.find((l) => new Date(l.starts_at).getTime() > now);

  const fmt = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="glass-strong p-4 rounded-2xl">
        <div className="flex items-center gap-2 mb-3">
          <Radio className={`w-4 h-4 ${live ? "text-success animate-pulse" : "text-muted-foreground"}`} />
          <h3 className="text-sm font-semibold">Hozir qayerda</h3>
        </div>
        {live ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-success uppercase tracking-widest">● Live</span>
              <span className="text-base font-heading font-semibold">{live.subjects?.name || live.title}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-1 text-muted-foreground"><MapPin className="w-3 h-3" /> {live.rooms?.name || "—"}</div>
              <div className="flex items-center gap-1 text-muted-foreground"><User className="w-3 h-3" /> {live.profiles?.full_name || "Ustoz"}</div>
              <div className="flex items-center gap-1 text-muted-foreground font-mono"><Clock className="w-3 h-3" /> {fmt(live.starts_at)}–{fmt(live.ends_at)}</div>
            </div>
          </div>
        ) : next ? (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Hozir darsda emas. Keyingi dars:</p>
            <p className="text-sm font-semibold">{next.subjects?.name || next.title}</p>
            <p className="text-[11px] text-muted-foreground">
              {fmt(next.starts_at)} · {next.rooms?.name || "—"} · {next.profiles?.full_name || "Ustoz"}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Bugun darslar yo'q yoki tugagan.</p>
        )}
      </div>

      <div className="glass-strong p-4 rounded-2xl">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Bugungi jadval</h3>
        </div>
        {lessons.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">Bugunga dars belgilanmagan</p>
        ) : (
          <div className="space-y-1.5">
            {lessons.map((l) => {
              const s = new Date(l.starts_at).getTime();
              const e = new Date(l.ends_at).getTime();
              const isLive = now >= s && now <= e;
              const isPast = now > e;
              return (
                <div key={l.id} className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                  isLive ? "bg-success/10 border border-success/30" :
                  isPast ? "opacity-60" : "bg-muted/20"
                }`}>
                  <span className="font-mono text-[11px] w-20 shrink-0">{fmt(l.starts_at)}–{fmt(l.ends_at)}</span>
                  <BookOpen className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate font-medium">{l.subjects?.name || l.title}</span>
                  <span className="text-muted-foreground truncate hidden sm:inline">{l.profiles?.full_name}</span>
                  <span className="text-muted-foreground">{l.rooms?.name}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ChildLiveStatus;
