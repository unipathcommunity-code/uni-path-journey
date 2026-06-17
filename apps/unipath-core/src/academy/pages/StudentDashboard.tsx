import { motion, AnimatePresence } from "framer-motion";
import {
  ScanFace, Bell, Shield, LayoutDashboard, TrendingUp, Coins, Eye, BookOpen, Loader2,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useStudentDashboard } from "@/hooks/useStudentDashboard";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/DashboardHeader";
import LiveClassCard from "@/components/student/LiveClassCard";
import ScheduleTimeline from "@/components/student/ScheduleTimeline";
import ProgressCompass from "@/components/student/ProgressCompass";
import PaymentTracker from "@/components/student/PaymentTracker";
import HomeworkPanel from "@/components/student/HomeworkPanel";
import NotificationAlarm from "@/components/student/NotificationAlarm";
import MotivationAlert from "@/components/student/MotivationAlert";
import CameraQRCheckin from "@/components/student/CameraQRCheckin";
import BiometricCheckin from "@/components/BiometricCheckin";
import AIChatbot from "@/components/student/AIChatbot";
import TelegramQuickWidget from "@/components/TelegramQuickWidget";
import StudentTests from "@/components/student/StudentTests";
import BalancePanel from "@/components/student/BalancePanel";
import StudentResourceLibrary from "@/components/student/StudentResourceLibrary";

interface RealPayment {
  id: string;
  description: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "overdue";
  dueDate: string;
}

const StudentDashboard = () => {
  const { user, profile, hasRole } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { isEnabled } = useFeatureFlag();
  const { schedule, notifications, homework, progress, dismissNotification, refreshHomework, loading } = useStudentDashboard();
  const [showCheckin, setShowCheckin] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [payments, setPayments] = useState<RealPayment[]>([]);
  const [totalDebt, setTotalDebt] = useState(0);

  useEffect(() => {
    if (!user) return;
    const loadPayments = async () => {
      const { data } = await supabase
        .from("payments")
        .select("id, description, amount, currency, status, due_date, paid_at")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      const now = Date.now();
      const mapped: RealPayment[] = (data || []).map((p: any) => {
        let status: RealPayment["status"] = "pending";
        if (p.status === "paid" || p.paid_at) status = "paid";
        else if (p.due_date && new Date(p.due_date).getTime() < now) status = "overdue";
        return {
          id: p.id,
          description: p.description,
          amount: Number(p.amount),
          currency: p.currency || "UZS",
          status,
          dueDate: p.due_date ? new Date(p.due_date).toLocaleDateString() : "—",
        };
      });
      setPayments(mapped);
      setTotalDebt(mapped.filter((m) => m.status !== "paid").reduce((s, m) => s + m.amount, 0));
    };
    loadPayments();
    const ch = supabase
      .channel(`student-pay-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments", filter: `student_id=eq.${user.id}` }, loadPayments)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const liveClass = schedule.find((s) => s.status === "live");
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Quick-action tiles use the same gradient-tile language as DashboardHeader.
  // Each item: { icon, label, action, tile (gradient bg + glow) }
  type QuickAction = { icon: LucideIcon; label: string; action: () => void; tile: string };
  const storeUnlocked = isEnabled("nova_store");
  const quickActions: QuickAction[] = [
    {
      icon: ScanFace,
      label: t("student.check_in"),
      action: () => setShowBiometric(true),
      tile: "bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30",
    },
    {
      icon: TrendingUp,
      label: t("student.evolution"),
      action: () => navigate("/evolution"),
      tile: "bg-gradient-to-br from-success to-success/70 shadow-lg shadow-success/30",
    },
    // Nova-Store is hidden until SuperAdmin enables `nova_store` for the org's plan.
    ...(storeUnlocked
      ? [{
          icon: Coins,
          label: t("student.store"),
          action: () => navigate("/store"),
          tile: "bg-gradient-to-br from-warning to-warning/70 shadow-lg shadow-warning/30",
        } as QuickAction]
      : []),
    hasRole("admin")
      ? { icon: LayoutDashboard, label: t("nav.admin"), action: () => navigate("/admin"),
          tile: "bg-gradient-to-br from-destructive to-warning shadow-lg shadow-destructive/30" }
      : hasRole("teacher")
      ? { icon: BookOpen, label: t("nav.teacher"), action: () => navigate("/teacher"),
          tile: "bg-gradient-to-br from-accent to-primary shadow-lg shadow-accent/30" }
      : hasRole("parent")
      ? { icon: Eye, label: t("common.mirror"), action: () => navigate("/parent"),
          tile: "bg-gradient-to-br from-success to-primary shadow-lg shadow-success/30" }
      : { icon: Bell, label: t("student.alerts"), action: () => setShowNotifications(true),
          tile: "bg-gradient-to-br from-accent to-accent/70 shadow-lg shadow-accent/30" },
  ];

  return (
    <div className="min-h-screen bg-background nova-grid-bg p-3 sm:p-6 relative overflow-hidden pb-10">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/3 blur-[150px] pointer-events-none" />

      <DashboardHeader
        layer="student"
        title={t("nav.student") || "Student"}
        subtitle={profile?.full_name || ""}
        backTo="/app"
        actions={
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="glass p-2 rounded-xl hover:bg-muted/40 transition relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        }
      />

      <AnimatePresence>
        {showNotifications && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 right-4 z-50 w-80 glass-strong p-3 space-y-2 max-h-80 overflow-y-auto rounded-2xl">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">{t("student.notifications")}</p>
            <NotificationAlarm notifications={notifications.map((n) => ({
              id: n.id, title: n.title, message: n.message, type: n.type as any, isAlarm: n.is_alarm, createdAt: new Date(n.created_at),
            }))} onDismiss={dismissNotification} />
            {notifications.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">{t("student.all_caught_up")}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-lg mx-auto space-y-4 relative z-10">
        <TelegramQuickWidget />
        {liveClass ? (
          <LiveClassCard subject={liveClass.subject} room={liveClass.room} teacher={liveClass.teacher}
            teacherStatus="present" startsAt={liveClass.startsAt} endsAt={liveClass.endsAt} isLive />
        ) : schedule.length > 0 ? (
          <LiveClassCard subject={schedule[0].subject} room={schedule[0].room} teacher={schedule[0].teacher}
            teacherStatus="present" startsAt={schedule[0].startsAt} endsAt={schedule[0].endsAt} isLive={false} />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-strong p-6 text-center rounded-2xl">
            <p className="text-sm text-muted-foreground">{t("student.no_classes")}</p>
          </motion.div>
        )}

        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {quickActions.map((item, i) => (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              whileTap={{ scale: 0.95 }}
              whileHover={{ y: -2 }}
              onClick={item.action}
              className="glass rounded-2xl p-3 flex flex-col items-center gap-2 group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.tile} group-hover:scale-110 transition-transform`}>
                <item.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-[10px] sm:text-xs text-foreground/80 font-semibold text-center leading-tight">{item.label}</span>
            </motion.button>
          ))}
        </div>

        <ScheduleTimeline items={schedule} />
        {/* Show motivation alert ONLY when there are real ≥3 missed classes for a real subject */}
        {progress.missedBySubject[0] && progress.missedBySubject[0].count >= 3 && (
          <MotivationAlert
            missedCount={progress.missedBySubject[0].count}
            subject={progress.missedBySubject[0].subject}
          />
        )}
        <div className="grid grid-cols-1 gap-4">
          <ProgressCompass
            level={progress.level}
            averageScore={progress.averageScore}
            trend={progress.trend}
            attendanceRate={progress.attendanceRate}
          />
          <PaymentTracker payments={payments} totalDebt={totalDebt} />
        </div>
        <BalancePanel />
        <StudentResourceLibrary />
        <StudentTests />
        {homework.length > 0 ? (
          <HomeworkPanel items={homework} onSubmitted={refreshHomework} />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-strong p-5 text-center">
            <p className="text-sm text-muted-foreground">{t("student.no_homework") || "No homework yet"}</p>
          </motion.div>
        )}

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1.5 pb-4">
          <Shield className="w-3 h-3" /> NOVA · {t("auth.founded_by")}
        </motion.p>
      </div>

      <AnimatePresence>
        {showCheckin && <CameraQRCheckin onClose={() => setShowCheckin(false)} />}
        {showBiometric && <BiometricCheckin onClose={() => setShowBiometric(false)} />}
      </AnimatePresence>
      <AIChatbot />
    </div>
  );
};

export default StudentDashboard;
