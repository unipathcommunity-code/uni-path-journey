import { motion, AnimatePresence } from "framer-motion";
import {
  Users, GraduationCap, BookOpen, Activity, Coins, DoorOpen,
  BarChart3, Loader2, User as UserIcon, Crown, Wallet
} from "lucide-react";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAdminStats } from "@/hooks/useAdminStats";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { useBranch } from "@/hooks/useBranch";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import DashboardHeader from "@/components/DashboardHeader";
import StatCard from "@/components/admin/StatCard";
import RoomCRUD from "@/components/admin/RoomCRUD";
import LessonCRUD from "@/components/admin/LessonCRUD";
import UserManagement from "@/components/admin/UserManagement";
import AdminCharts from "@/components/admin/AdminCharts";
import SubjectCRUD from "@/components/admin/SubjectCRUD";
import GroupCRUD from "@/components/admin/GroupCRUD";
import GroupMembersCRUD from "@/components/admin/GroupMembersCRUD";
import RoomQRManager from "@/components/admin/RoomQRManager";
import BrandingSettings from "@/components/admin/BrandingSettings";
import TelegramQuickWidget from "@/components/TelegramQuickWidget";
import StudentDebtsPanel from "@/components/admin/StudentDebtsPanel";
import TeacherPayoutsPanel from "@/components/admin/TeacherPayoutsPanel";
import NotificationTemplatesPanel from "@/components/admin/NotificationTemplatesPanel";
import TeacherEarningsBreakdown from "@/components/admin/TeacherEarningsBreakdown";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data, isLoading, refetch } = useAdminStats();
  const { t } = useLanguage();
  const { hasRole } = useAuth();
  const { branches, activeBranchId, setActiveBranchId } = useBranch();
  const { isEnabled } = useFeatureFlag();

  // Sync ?branch=ID from URL into active branch on first load.
  // Set immediately (so all queries use it) — useBranch.refresh() will validate.
  useEffect(() => {
    const id = searchParams.get("branch");
    if (!id) return;
    if (branches.length === 0 || branches.some((b) => b.id === id)) {
      setActiveBranchId(id);
    }
  }, [searchParams, branches, setActiveBranchId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const stats = data?.stats;
  const showQR = isEnabled("qr_attendance");
  const showPayments = isEnabled("payments");

  return (
    <div className="min-h-screen bg-background nova-grid-bg p-3 sm:p-6 relative overflow-hidden pb-10">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/3 blur-[200px] pointer-events-none" />

      <DashboardHeader
        layer="admin"
        title={t("admin.command_center")}
        subtitle={t("admin.god_eye")}
        actions={
          <>
            {hasRole("owner") && (
              <button onClick={() => navigate("/owner")}
                className="glass p-2 rounded-xl border border-warning/40 hover:bg-warning/10 transition"
                aria-label="Owner" title="Owner Panel">
                <Crown className="w-4 h-4 text-warning" />
              </button>
            )}
            {/* Super admin panel lives ONLY at the platform /super-admin — not inside a tenant panel. */}
            <button onClick={() => navigate("/profile")} className="glass p-2 rounded-xl hover:bg-muted/40 transition" aria-label="Profile">
              <UserIcon className="w-4 h-4 text-muted-foreground" />
            </button>
          </>
        }
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeBranchId || "all"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-7xl mx-auto space-y-4 sm:space-y-6 relative z-10"
        >
        <TelegramQuickWidget />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          <StatCard icon={Users} label={t("admin.total_users")} value={stats?.totalUsers || 0} delay={0.05} />
          <StatCard icon={GraduationCap} label={t("admin.students")} value={stats?.totalStudents || 0} color="accent" delay={0.1} />
          <StatCard icon={BookOpen} label={t("admin.teachers")} value={stats?.totalTeachers || 0} color="primary" delay={0.15} />
          <StatCard icon={Activity} label={t("admin.live_now")} value={stats?.liveLessons || 0} color="success" sublabel={`${stats?.upcomingLessons || 0} ${t("admin.upcoming")}`} delay={0.2} />
          <StatCard icon={Coins} label={t("admin.novacoins")} value={stats?.totalCoinsIssued || 0} color="warning" delay={0.25} />
        </div>

        {/* Quick-launch — only Accountant remains for admin (gated by feature). 
            Website Builder, CRM, Plans, Telegram bot are SuperAdmin-only and live in /superadmin. */}
        {showPayments && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={() => navigate("/accountant")}
              className="glass p-4 rounded-xl text-left hover:bg-muted/40 transition flex items-center gap-3 active:scale-[0.98]">
              <div className="w-10 h-10 rounded-lg bg-success/15 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-success" />
              </div>
              <div>
                <div className="font-semibold text-sm">{t("admin.accountant")}</div>
                <div className="text-xs text-muted-foreground">{t("admin.accountant_desc")}</div>
              </div>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-4 lg:col-span-1">
            <StatCard icon={BarChart3} label={t("admin.attendance_rate")} value={`${stats?.attendanceRate || 0}%`}
              sublabel={t("admin.overall_checkin")} color="success" delay={0.3} />
            <StatCard icon={DoorOpen} label={t("admin.rooms")} value={stats?.totalRooms || 0}
              sublabel={t("admin.configured_spaces")} color="accent" delay={0.35} />
          </div>
          <div className="lg:col-span-2">
            <RoomCRUD rooms={data?.rooms || []} onRefresh={() => refetch()} />
          </div>
        </div>

        <div className={`grid grid-cols-1 ${showQR ? "lg:grid-cols-2" : ""} gap-4`}>
          <BrandingSettings />
          {showQR && <RoomQRManager rooms={data?.rooms || []} onRefresh={() => refetch()} />}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SubjectCRUD subjects={data?.subjects || []} onRefresh={() => refetch()} />
          <GroupCRUD
            groups={data?.groups || []}
            subjects={data?.subjects || []}
            teachers={data?.teachers || []}
            onRefresh={() => refetch()}
          />
        </div>

        <GroupMembersCRUD
          groups={data?.groups || []}
          students={(data?.users || []).filter((u: any) => u.roles.includes("student")).map((u: any) => ({
            user_id: u.user_id,
            full_name: u.full_name,
          }))}
          onRefresh={() => refetch()}
        />

        <LessonCRUD lessons={data?.lessons || []} rooms={data?.rooms || []} onRefresh={() => refetch()} />

        <AdminCharts payments={data?.payments || []} attendance={data?.attendance || []} roles={data?.roles || []} />

        {showPayments && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <StudentDebtsPanel />
              <TeacherPayoutsPanel />
            </div>
            <TeacherEarningsBreakdown />
            <NotificationTemplatesPanel />
          </>
        )}

        <UserManagement users={data?.users || []} onRefresh={() => refetch()} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
