import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Users, Clock, BarChart3, Wand2, Presentation,
  Shield, ChevronRight, TrendingUp, TrendingDown, User as UserIcon, ClipboardList,
  AlertTriangle, FileText, ListChecks, Library, Award,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useBranch } from "@/hooks/useBranch";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/DashboardHeader";
import AILessonPlanner from "@/components/teacher/AILessonPlanner";
import AIPresentationGenerator from "@/components/teacher/AIPresentationGenerator";
import HomeworkCRUD from "@/components/teacher/HomeworkCRUD";
import JadvalPreview from "@/components/teacher/JadvalPreview";
import NotificationsBell from "@/components/NotificationsBell";
import TelegramQuickWidget from "@/components/TelegramQuickWidget";
import TodayCommandCenter from "@/components/teacher/TodayCommandCenter";
import SyllabusManager from "@/components/teacher/SyllabusManager";
import ResourceLibrary from "@/components/teacher/ResourceLibrary";
import HomeworkAlerts from "@/components/teacher/HomeworkAlerts";
import TestBuilder from "@/components/teacher/TestBuilder";
import CertificateIssueModal from "@/components/teacher/CertificateIssueModal";
import MyEarnings from "@/components/teacher/MyEarnings";
import { exportCsv } from "@/lib/exportCsv";
import { Download, Wallet } from "lucide-react";

type Tab = "today" | "live" | "plan" | "syllabus" | "library" | "students" | "homework" | "alerts" | "tests" | "earnings" | "ai-planner" | "presentations";

const TeacherDashboard = () => {
  const { profile, user } = useAuth();
  const { t } = useLanguage();
  const { activeBranchId } = useBranch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [certFor, setCertFor] = useState<{ id: string; name: string } | null>(null);

  const { data: lessons = [] } = useQuery({
    queryKey: ["teacher-lessons", user?.id, activeBranchId],
    queryFn: async () => {
      if (!user) return [];
      let q = (supabase as any).from("lessons").select("*, subjects(name), rooms(name)")
        .eq("teacher_id", user.id).order("starts_at", { ascending: true });
      if (activeBranchId) q = q.eq("branch_id", activeBranchId);
      const { data } = await q;
      return data || [];
    },
    enabled: !!user,
  });

  // Real students: anyone in groups taught by this teacher + their attendance %
  const { data: students = [] } = useQuery({
    queryKey: ["teacher-students", user?.id, activeBranchId],
    queryFn: async () => {
      if (!user) return [];
      let grpsQ = (supabase as any).from("groups").select("id").eq("teacher_id", user.id);
      if (activeBranchId) grpsQ = grpsQ.eq("branch_id", activeBranchId);
      const { data: grps } = await grpsQ;
      const groupIds = (grps || []).map((g: any) => g.id);
      if (groupIds.length === 0) return [];
      const { data: members } = await (supabase as any)
        .from("group_members")
        .select("student_id, profiles!inner(user_id, full_name)")
        .in("group_id", groupIds);
      const studentIds = Array.from(new Set((members || []).map((m: any) => m.student_id)));
      if (studentIds.length === 0) return [];
      // Attendance over teacher's lessons (filtered by active branch so stats reflect the selected filial)
      let tlQ = (supabase as any).from("lessons").select("id").eq("teacher_id", user.id);
      if (activeBranchId) tlQ = tlQ.eq("branch_id", activeBranchId);
      const { data: teacherLessons } = await tlQ;
      const lessonIds = (teacherLessons || []).map((l: any) => l.id);
      const { data: att } = lessonIds.length
        ? await (supabase as any)
            .from("attendance")
            .select("student_id, status")
            .in("lesson_id", lessonIds)
            .in("student_id", studentIds)
        : { data: [] as any[] };
      const byStudent = new Map<string, { present: number; total: number }>();
      (att || []).forEach((a: any) => {
        const cur = byStudent.get(a.student_id) || { present: 0, total: 0 };
        cur.total += 1;
        if (a.status === "present") cur.present += 1;
        byStudent.set(a.student_id, cur);
      });
      // Homework scores (teacher's own homework only)
      const { data: hwIds } = await (supabase as any).from("homework").select("id").eq("teacher_id", user.id);
      const hwIdsArr = (hwIds || []).map((h: any) => h.id);
      const { data: subs } = hwIdsArr.length
        ? await (supabase as any)
            .from("homework_submissions")
            .select("student_id, score")
            .in("homework_id", hwIdsArr)
            .not("score", "is", null)
        : { data: [] as any[] };
      const hwByStudent = new Map<string, { sum: number; n: number }>();
      (subs || []).forEach((s: any) => {
        const cur = hwByStudent.get(s.student_id) || { sum: 0, n: 0 };
        cur.sum += Number(s.score) || 0;
        cur.n += 1;
        hwByStudent.set(s.student_id, cur);
      });
      // Build list
      const seen = new Set<string>();
      const rows = (members || [])
        .filter((m: any) => {
          if (seen.has(m.student_id)) return false;
          seen.add(m.student_id);
          return true;
        })
        .map((m: any) => {
          const a = byStudent.get(m.student_id) || { present: 0, total: 0 };
          const attendance = a.total > 0 ? Math.round((a.present / a.total) * 100) : 0;
          const h = hwByStudent.get(m.student_id);
          const avg = h && h.n > 0 ? Math.round(h.sum / h.n) : attendance; // fallback
          return {
            id: m.student_id,
            name: m.profiles?.full_name || "—",
            avg,
            attendance,
          };
        })
        .sort((a, b) => b.avg - a.avg);
      return rows;
    },
    enabled: !!user,
  });

  const now = new Date();
  const liveLessons = lessons.filter((l: any) => new Date(l.starts_at) <= now && new Date(l.ends_at) >= now);
  const upcomingLessons = lessons.filter((l: any) => new Date(l.starts_at) > now);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "today", label: "Bugun", icon: ListChecks },
    { id: "live", label: t("teacher.live"), icon: Clock },
    { id: "syllabus", label: "Mavzular", icon: BookOpen },
    { id: "library", label: "Kutubxona", icon: Library },
    { id: "homework", label: t("teacher.homework"), icon: ClipboardList },
    { id: "alerts", label: "Ogohlantirish", icon: AlertTriangle },
    { id: "tests", label: "Testlar", icon: FileText },
    { id: "students", label: t("teacher.students"), icon: Users },
    { id: "earnings", label: "Mening oyligim", icon: Wallet },
    { id: "plan", label: t("teacher.plan"), icon: BookOpen },
    { id: "ai-planner", label: t("teacher.ai_planner"), icon: Wand2 },
    { id: "presentations", label: t("teacher.presentations"), icon: Presentation },
  ];

  const getCategory = (avg: number) => {
    if (avg >= 80) return { label: t("teacher.top"), color: "text-success", bg: "bg-success/10" };
    if (avg >= 60) return { label: t("teacher.average"), color: "text-warning", bg: "bg-warning/10" };
    return { label: t("teacher.at_risk"), color: "text-destructive", bg: "bg-destructive/10" };
  };

  return (
    <div className="min-h-screen bg-background nova-grid-bg p-3 sm:p-6 relative overflow-hidden pb-10">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-accent/3 blur-[150px] pointer-events-none" />

      <DashboardHeader
        layer="teacher"
        title={t("teacher.hub")}
        subtitle={profile?.full_name || t("nav.teacher")}
        backTo="/app"
        actions={
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <button onClick={() => navigate("/profile")} className="glass p-2 rounded-xl hover:bg-muted/40 transition" aria-label="Profile">
              <UserIcon className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        }
      />

      {/* Unified tab bar — same active style as DashboardHeader gradient tile language */}
      <div className="max-w-2xl mx-auto mb-4 -mt-2 glass rounded-2xl p-1.5 flex gap-1 overflow-x-auto scrollbar-hide relative z-10">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                active
                  ? "bg-gradient-to-br from-accent to-primary text-primary-foreground shadow-md shadow-accent/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />{tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeBranchId || "all"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl mx-auto space-y-4 relative z-10"
        >
        <TelegramQuickWidget />
        {activeTab === "live" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("teacher.current_classes")}</h2>
            {liveLessons.length === 0 ? (
              <div className="glass-strong p-6 text-center"><p className="text-sm text-muted-foreground">{t("teacher.no_active")}</p></div>
            ) : liveLessons.map((l: any) => (
              <div key={l.id} className="glass-strong p-4 border-primary/30">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-xs text-success font-semibold uppercase">Live</span>
                </div>
                <h3 className="font-bold text-foreground">{l.title}</h3>
                <p className="text-xs text-muted-foreground">{l.subjects?.name} · {l.rooms?.name || "TBA"}</p>
              </div>
            ))}
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pt-2">{t("teacher.coming_up")}</h2>
            {upcomingLessons.slice(0, 5).map((l: any) => (
              <div key={l.id} className="glass p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{l.title}</h3>
                  <p className="text-xs text-muted-foreground">{l.subjects?.name} · {new Date(l.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
            {upcomingLessons.length === 0 && <div className="glass p-4 text-center"><p className="text-sm text-muted-foreground">{t("teacher.no_lessons")}</p></div>}

            {/* Telegram /jadval preview — confirm formatting before sending */}
            <div className="pt-2">
              <JadvalPreview />
            </div>
          </motion.div>
        )}

        {activeTab === "plan" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("teacher.all_lessons")}</h2>
              {lessons.length > 0 && (
                <button
                  onClick={() => exportCsv("my-lessons.csv", lessons.map((l: any) => ({
                    title: l.title, subject: l.subjects?.name || "", room: l.rooms?.name || "",
                    starts_at: l.starts_at, ends_at: l.ends_at, status: l.status,
                  })))}
                  className="glass px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-muted/40 transition"
                >
                  <Download className="w-3 h-3" /> CSV
                </button>
              )}
            </div>
            {lessons.length === 0 ? (
              <div className="glass-strong p-6 text-center"><p className="text-sm text-muted-foreground">{t("teacher.no_lessons")}</p></div>
            ) : lessons.map((l: any) => {
              const start = new Date(l.starts_at); const end = new Date(l.ends_at); const isPast = end < now;
              return (
                <div key={l.id} className={`glass p-4 ${isPast ? "opacity-60" : ""}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{l.title}</h3>
                      <p className="text-xs text-muted-foreground">{l.subjects?.name} · {l.rooms?.name || "TBA"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-foreground">{start.toLocaleDateString()}</p>
                      <p className="text-[10px] text-muted-foreground">{start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {activeTab === "students" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("teacher.student_intel")}</h2>
            {students.length === 0 ? (
              <div className="glass-strong p-6 text-center">
                <p className="text-sm text-muted-foreground">Hozircha guruhingizda o'quvchi yo'q</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="glass p-3 text-center">
                    <p className="text-lg font-bold text-success">{students.filter((s) => s.avg >= 80).length}</p>
                    <p className="text-[10px] text-muted-foreground">{t("teacher.top")}</p>
                  </div>
                  <div className="glass p-3 text-center">
                    <p className="text-lg font-bold text-warning">{students.filter((s) => s.avg >= 60 && s.avg < 80).length}</p>
                    <p className="text-[10px] text-muted-foreground">{t("teacher.average")}</p>
                  </div>
                  <div className="glass p-3 text-center">
                    <p className="text-lg font-bold text-destructive">{students.filter((s) => s.avg < 60).length}</p>
                    <p className="text-[10px] text-muted-foreground">{t("teacher.at_risk")}</p>
                  </div>
                </div>
                {students.map((s, i) => {
                  const cat = getCategory(s.avg);
                  return (
                    <motion.div key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="glass p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground">{(s.name[0] || "?").toUpperCase()}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground">Avg: {s.avg}% · {t("student.attendance")}: {s.attendance}%</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cat.bg} ${cat.color}`}>{cat.label}</span>
                      <button onClick={() => setCertFor({ id: s.id, name: s.name })}
                        title="Sertifikat berish"
                        className="p-1.5 rounded-lg bg-warning/10 hover:bg-warning/20 text-warning">
                        <Award className="w-3.5 h-3.5" />
                      </button>
                      {s.avg >= 80 ? <TrendingUp className="w-3.5 h-3.5 text-success" /> : s.avg < 60 ? <TrendingDown className="w-3.5 h-3.5 text-destructive" /> : <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />}
                    </motion.div>
                  );
                })}
              </>
            )}
          </motion.div>
        )}

        {activeTab === "today" && <TodayCommandCenter />}
        {activeTab === "syllabus" && <SyllabusManager />}
        {activeTab === "library" && <ResourceLibrary />}
        {activeTab === "alerts" && <HomeworkAlerts />}
        {activeTab === "tests" && <TestBuilder />}
        {activeTab === "earnings" && <MyEarnings />}
        {activeTab === "homework" && <HomeworkCRUD />}
        {activeTab === "ai-planner" && <AILessonPlanner />}
        {activeTab === "presentations" && <AIPresentationGenerator />}

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1.5 pb-4">
          <Shield className="w-3 h-3" /> NOVA {t("teacher.hub")}
        </motion.p>
        </motion.div>
      </AnimatePresence>
      <CertificateIssueModal open={!!certFor} onClose={() => setCertFor(null)} student={certFor} />
    </div>
  );
};

export default TeacherDashboard;
