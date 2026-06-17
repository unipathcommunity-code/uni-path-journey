import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  User as UserIcon, Mail, Shield, LogOut, GraduationCap, BookOpen, Eye,
  Activity, Coins, FileText, Calendar, Loader2,
} from "lucide-react";
import BackButton from "@/components/BackButton";
import AvatarUpload from "@/components/student/AvatarUpload";
import ThemeLangSwitcher from "@/components/ThemeLangSwitcher";
import ProfileEditForm from "@/components/profile/ProfileEditForm";
import TelegramBind from "@/components/TelegramBind";
import TelegramStatus from "@/components/TelegramStatus";

const Profile = () => {
  const { user, profile, roles, signOut, hasRole } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const role = roles[0] || "student";

  const { data: stats, isLoading } = useQuery({
    queryKey: ["profile-stats", user?.id, role],
    queryFn: async () => {
      if (!user) return null;
      if (role === "student") {
        const [att, coins, hw] = await Promise.all([
          supabase.from("attendance").select("status").eq("student_id", user.id),
          supabase.from("nova_coins").select("amount").eq("user_id", user.id),
          supabase.from("homework_submissions").select("status").eq("student_id", user.id),
        ]);
        const total = att.data?.length || 0;
        const present = att.data?.filter(a => a.status === "present").length || 0;
        const balance = (coins.data || []).reduce((s, c) => s + c.amount, 0);
        return {
          attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
          totalLessons: total,
          coins: balance,
          submissions: hw.data?.length || 0,
        };
      }
      if (role === "teacher") {
        const [lessons, hw] = await Promise.all([
          supabase.from("lessons").select("id, status").eq("teacher_id", user.id),
          supabase.from("homework").select("id").eq("teacher_id", user.id),
        ]);
        return {
          totalLessons: lessons.data?.length || 0,
          liveLessons: lessons.data?.filter(l => l.status === "live").length || 0,
          assignedHomework: hw.data?.length || 0,
        };
      }
      if (role === "parent") {
        const links = await supabase.from("parent_students").select("student_id").eq("parent_id", user.id);
        return { children: links.data?.length || 0 };
      }
      // admin
      const [users, lessons, rooms] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("lessons").select("id", { count: "exact", head: true }),
        supabase.from("rooms").select("id", { count: "exact", head: true }),
      ]);
      return { users: users.count || 0, lessons: lessons.count || 0, rooms: rooms.count || 0 };
    },
    enabled: !!user,
  });

  const roleConfig = {
    student: { icon: GraduationCap, color: "text-accent", bg: "bg-accent/10", label: t("nav.student") },
    teacher: { icon: BookOpen, color: "text-primary", bg: "bg-primary/10", label: t("nav.teacher") },
    parent: { icon: Eye, color: "text-warning", bg: "bg-warning/10", label: t("nav.parent") },
    admin: { icon: Shield, color: "text-destructive", bg: "bg-destructive/10", label: t("nav.admin") },
  };
  const cfg = roleConfig[role as keyof typeof roleConfig];
  const RoleIcon = cfg.icon;

  return (
    <div className="min-h-screen bg-background nova-grid-bg pb-10 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />

      <header className="sticky top-0 z-40 glass px-3 sm:px-4 py-3 flex items-center justify-between gap-2">
        <BackButton to="/app" />
        <h1 className="text-base sm:text-lg font-bold font-heading text-gradient-primary truncate">{t("profile.title")}</h1>
        <ThemeLangSwitcher />
      </header>

      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 space-y-4 relative z-10">
        {/* Hero card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong p-6 sm:p-8 text-center">
          <div className="flex justify-center mb-4">
            <AvatarUpload size="hero" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-foreground">{profile?.full_name || t("profile.no_name")}</h2>
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-1.5">
            <Mail className="w-3 h-3" />
            <span className="truncate">{user?.email}</span>
          </div>
          <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
            <RoleIcon className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">{cfg.label}</span>
          </div>
        </motion.div>

        {/* Real-time Telegram link status — updates instantly via Supabase channel */}
        <TelegramStatus />

        {/* Role-specific stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-strong p-4 sm:p-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("profile.your_stats")}</h3>
          {isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {role === "student" && (
                <>
                  <StatBox icon={Activity} label={t("student.attendance")} value={`${stats?.attendanceRate || 0}%`} color="success" />
                  <StatBox icon={Calendar} label={t("evolution.lessons")} value={stats?.totalLessons || 0} color="primary" />
                  <StatBox icon={Coins} label="NovaCoins" value={stats?.coins || 0} color="warning" />
                  <StatBox icon={FileText} label={t("student.homework")} value={stats?.submissions || 0} color="accent" />
                </>
              )}
              {role === "teacher" && (
                <>
                  <StatBox icon={Calendar} label={t("admin.lessons")} value={stats?.totalLessons || 0} color="primary" />
                  <StatBox icon={Activity} label={t("admin.live_now")} value={stats?.liveLessons || 0} color="success" />
                  <StatBox icon={FileText} label={t("student.homework")} value={stats?.assignedHomework || 0} color="accent" />
                </>
              )}
              {role === "parent" && (
                <StatBox icon={UserIcon} label={t("profile.linked_children")} value={stats?.children || 0} color="primary" />
              )}
              {role === "admin" && (
                <>
                  <StatBox icon={UserIcon} label={t("admin.total_users")} value={stats?.users || 0} color="primary" />
                  <StatBox icon={Calendar} label={t("admin.lessons")} value={stats?.lessons || 0} color="accent" />
                  <StatBox icon={Shield} label={t("admin.rooms")} value={stats?.rooms || 0} color="warning" />
                </>
              )}
            </div>
          )}
        </motion.div>

        {/* Edit form: name + password */}
        <ProfileEditForm />

        {/* Telegram binding — available to every role (student/teacher/parent/admin/owner/accountant) */}
        <TelegramBind />

        {/* Quick links */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-strong p-4 sm:p-5 space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("profile.quick_actions")}</h3>
          <button onClick={() => navigate("/app")} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors text-left">
            <UserIcon className="w-4 h-4 text-primary" />
            <span className="text-sm flex-1">{t("nav.dashboard")}</span>
          </button>
          {hasRole("admin") && (
            <button onClick={() => navigate("/admin")} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors text-left">
              <Shield className="w-4 h-4 text-destructive" />
              <span className="text-sm flex-1">{t("nav.admin")}</span>
            </button>
          )}
          {hasRole("teacher") && (
            <button onClick={() => navigate("/teacher")} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors text-left">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-sm flex-1">{t("nav.teacher")}</span>
            </button>
          )}
          {hasRole("parent") && (
            <button onClick={() => navigate("/parent")} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors text-left">
              <Eye className="w-4 h-4 text-warning" />
              <span className="text-sm flex-1">{t("common.mirror")}</span>
            </button>
          )}
          <button onClick={signOut} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/10 text-destructive transition-colors text-left">
            <LogOut className="w-4 h-4" />
            <span className="text-sm flex-1">{t("nav.sign_out")}</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
};

const StatBox = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) => (
  <div className="p-3 rounded-xl bg-muted/20 border border-border/20">
    <Icon className={`w-4 h-4 text-${color} mb-1.5`} />
    <p className="text-lg font-bold font-heading text-foreground leading-none">{value}</p>
    <p className="text-[10px] text-muted-foreground mt-1 truncate">{label}</p>
  </div>
);

export default Profile;
