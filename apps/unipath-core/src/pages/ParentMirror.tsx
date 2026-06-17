import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, MapPin, Activity, Heart, BookOpen, Clock, CheckCircle2, TrendingUp, Shield, User as UserIcon, Loader2, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import ThemeLangSwitcher from "@/components/ThemeLangSwitcher";
import BackButton from "@/components/BackButton";
import NotificationsBell from "@/components/NotificationsBell";
import TelegramQuickWidget from "@/components/TelegramQuickWidget";
import BalancePanel from "@/components/student/BalancePanel";
import ChildLiveStatus from "@/components/parent/ChildLiveStatus";

interface ChildSummary {
  studentId: string;
  name: string;
  attendanceRate: number;
  totalLessons: number;
  presentCount: number;
  lastCheckIn: string | null;
  coins: number;
  recentActivity: { id: string; text: string; time: string; type: "checkin" | "grade" | "coin" | "homework" }[];
  subjects: { name: string; rate: number; status: "green" | "yellow" | "red" }[];
}

const ParentMirror = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: links } = await supabase
        .from("parent_students")
        .select("student_id")
        .eq("parent_id", user.id);

      const studentIds = (links || []).map((l: any) => l.student_id);
      if (studentIds.length === 0) {
        setChildren([]);
        setLoading(false);
        return;
      }

      const [profsRes, attRes, coinsRes, hwSubsRes, lessonsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name").in("user_id", studentIds),
        supabase.from("attendance").select("id, student_id, status, checked_in_at, lesson_id").in("student_id", studentIds).order("checked_in_at", { ascending: false }).limit(500),
        supabase.from("nova_coins").select("user_id, amount, reason, created_at").in("user_id", studentIds).order("created_at", { ascending: false }).limit(100),
        supabase.from("homework_submissions").select("student_id, score, status, submitted_at, homework_id").in("student_id", studentIds).order("submitted_at", { ascending: false }).limit(100),
        supabase.from("lessons").select("id, subject_id, subjects(name)"),
      ]);

      const profs = profsRes.data || [];
      const attendance = attRes.data || [];
      const coins = coinsRes.data || [];
      const hwSubs = hwSubsRes.data || [];
      const lessons = lessonsRes.data || [];
      const lessonSubjectMap = new Map<string, string>(
        lessons.map((l: any) => [l.id, l.subjects?.name || "—"]),
      );

      const summaries: ChildSummary[] = studentIds.map((sid) => {
        const p = profs.find((x: any) => x.user_id === sid);
        const myAtt = attendance.filter((a: any) => a.student_id === sid);
        const present = myAtt.filter((a: any) => a.status === "present").length;
        const total = myAtt.length;
        const lastCheckIn = myAtt.find((a: any) => a.checked_in_at)?.checked_in_at ?? null;
        const myCoins = coins.filter((c: any) => c.user_id === sid).reduce((s: number, c: any) => s + Number(c.amount), 0);

        // Per-subject rate
        const bySubj = new Map<string, { present: number; total: number }>();
        myAtt.forEach((a: any) => {
          const subj = lessonSubjectMap.get(a.lesson_id) || "—";
          const cur = bySubj.get(subj) || { present: 0, total: 0 };
          cur.total += 1;
          if (a.status === "present") cur.present += 1;
          bySubj.set(subj, cur);
        });
        const subjects = Array.from(bySubj.entries()).map(([name, v]) => {
          const rate = v.total > 0 ? Math.round((v.present / v.total) * 100) : 0;
          const status: "green" | "yellow" | "red" = rate >= 85 ? "green" : rate >= 60 ? "yellow" : "red";
          return { name, rate, status };
        }).slice(0, 6);

        // Activity feed
        const activity: ChildSummary["recentActivity"] = [];
        myAtt.slice(0, 3).forEach((a: any) => {
          if (!a.checked_in_at) return;
          activity.push({ id: a.id, text: `Darsga keldi (${a.status})`, time: timeAgo(a.checked_in_at), type: "checkin" });
        });
        coins.filter((c: any) => c.user_id === sid).slice(0, 3).forEach((c: any) => {
          activity.push({ id: c.created_at, text: `+${c.amount} NovaCoin · ${c.reason}`, time: timeAgo(c.created_at), type: "coin" });
        });
        hwSubs.filter((h: any) => h.student_id === sid).slice(0, 3).forEach((h: any) => {
          activity.push({ id: h.homework_id, text: h.score != null ? `Vazifa baholandi: ${h.score}` : `Vazifa topshirildi`, time: timeAgo(h.submitted_at || ""), type: h.score != null ? "grade" : "homework" });
        });

        return {
          studentId: sid,
          name: p?.full_name || "Farzand",
          attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
          totalLessons: total,
          presentCount: present,
          lastCheckIn,
          coins: myCoins,
          recentActivity: activity.slice(0, 6),
          subjects,
        };
      });

      setChildren(summaries);
      setLoading(false);
    };

    load();

    // Realtime: when a child's attendance changes, refresh
    const ch = supabase
      .channel(`parent-mirror-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "nova_coins" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const child = children[activeIdx];

  return (
    <div className="min-h-screen bg-background nova-grid-bg p-3 sm:p-6 relative overflow-hidden pb-10">
      <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 sm:gap-4 mb-6 z-10 relative">
        <BackButton to="/app" />
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-2xl font-bold font-heading text-gradient-primary truncate">{t("parent.live_mirror")}</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{t("parent.realtime_tracking")}</p>
          </div>
        </div>
        <NotificationsBell />
        <button onClick={() => navigate("/profile")} className="glass p-2 rounded-xl">
          <UserIcon className="w-4 h-4 text-muted-foreground" />
        </button>
        <ThemeLangSwitcher />
      </motion.div>

      <div className="max-w-5xl mx-auto space-y-5 relative z-10">
        <TelegramQuickWidget />
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
        ) : children.length === 0 ? (
          <div className="glass-strong p-10 text-center rounded-2xl">
            <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h2 className="text-lg font-heading font-bold mb-2">Farzand bog'lanmagan</h2>
            <p className="text-sm text-muted-foreground">Administrator sizni farzandingiz akkauntiga bog'lashi kerak.</p>
          </div>
        ) : (
          <>
            {children.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {children.map((c, i) => (
                  <button
                    key={c.studentId}
                    onClick={() => setActiveIdx(i)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
                      i === activeIdx ? "bg-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            {child && (
              <>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong p-6">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-2xl font-heading font-bold border border-accent/20 text-accent">
                      {(child.name[0] || "?").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-heading font-bold truncate">{child.name}</h2>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${child.lastCheckIn ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
                          {child.lastCheckIn ? "Faol" : "Hali keltirilmagan"}
                        </span>
                        {child.lastCheckIn && (
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeAgo(child.lastCheckIn)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-success/5 border border-success/10 text-center">
                      <CheckCircle2 className="w-5 h-5 text-success mx-auto mb-1" />
                      <p className="text-xl font-bold font-heading text-success">{child.attendanceRate}%</p>
                      <p className="text-[10px] text-muted-foreground">{t("parent.attendance_rate")}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-center">
                      <Activity className="w-5 h-5 text-primary mx-auto mb-1" />
                      <p className="text-xl font-bold font-heading text-primary">{child.totalLessons}</p>
                      <p className="text-[10px] text-muted-foreground">Darslar</p>
                    </div>
                    <div className="p-3 rounded-xl bg-warning/5 border border-warning/10 text-center">
                      <Coins className="w-5 h-5 text-warning mx-auto mb-1" />
                      <p className="text-xl font-bold font-heading text-warning">{child.coins}</p>
                      <p className="text-[10px] text-muted-foreground">NovaCoins</p>
                    </div>
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-strong p-6">
                    <h2 className="text-lg font-heading font-semibold mb-4 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-accent" /> {t("parent.subject_health")}
                    </h2>
                    {child.subjects.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">Hali fanlar bo'yicha ma'lumot yo'q</p>
                    ) : (
                      <div className="space-y-3">
                        {child.subjects.map((s, i) => {
                          const sc = s.status === "green" ? "text-success" : s.status === "yellow" ? "text-warning" : "text-destructive";
                          const bar = s.status === "green" ? "bg-success" : s.status === "yellow" ? "bg-warning" : "bg-destructive";
                          return (
                            <motion.div key={s.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm">{s.name}</span>
                                <span className={`text-sm font-bold ${sc}`}>{s.rate}%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-muted/50">
                                <div className={`h-full rounded-full ${bar} transition-all`} style={{ width: `${s.rate}%` }} />
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-strong p-6">
                    <h2 className="text-lg font-heading font-semibold mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" /> {t("parent.activity_feed")}
                    </h2>
                    {child.recentActivity.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">Hali faollik yo'q</p>
                    ) : (
                      <div className="space-y-2">
                        {child.recentActivity.map((a, i) => (
                          <motion.div key={`${a.type}-${a.id}-${i}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                            className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                              {a.type === "checkin" ? <MapPin className="w-4 h-4 text-primary" /> :
                                a.type === "coin" ? <Coins className="w-4 h-4 text-warning" /> :
                                a.type === "grade" ? <TrendingUp className="w-4 h-4 text-success" /> :
                                <BookOpen className="w-4 h-4 text-accent" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">{a.text}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </div>

                <ChildLiveStatus studentId={child.studentId} />
                <BalancePanel studentId={child.studentId} />

                <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1.5 pt-2">
                  <Shield className="w-3 h-3" /> Real vaqtda yangilanadi · Lovable Cloud
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

function timeAgo(iso: string) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "hozir";
  if (min < 60) return `${min} daq. oldin`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} soat oldin`;
  const d = Math.floor(h / 24);
  return `${d} kun oldin`;
}

export default ParentMirror;
