import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/hooks/useBranch";

export const useAdminStats = () => {
  const { activeBranchId } = useBranch();

  return useQuery({
    // queryKey includes activeBranchId so switching branches refetches automatically
    queryKey: ["admin-stats", activeBranchId],
    queryFn: async () => {
      // Helper: apply branch filter only when a branch is selected.
      const withBranch = (q: any) =>
        activeBranchId ? q.eq("branch_id", activeBranchId) : q;

      const [roomsRes, lessonsRes, subjectsRes, groupsRes] = await Promise.all([
        withBranch(supabase.from("rooms").select("*")),
        withBranch(supabase.from("lessons").select("*")),
        supabase.from("subjects").select("*").order("name"), // org-wide
        withBranch(supabase.from("groups").select("*").order("name")),
      ]);

      const lessons = lessonsRes.data || [];
      const lessonIds = lessons.map((l: any) => l.id);

      // Attendance restricted to current branch's lessons
      const { data: attendance = [] } = lessonIds.length
        ? await supabase.from("attendance").select("*").in("lesson_id", lessonIds)
        : { data: [] as any[] };

      // Users / roles: members assigned to this branch (or org-wide if no branch)
      let userIds: string[] | null = null;
      if (activeBranchId) {
        const { data: assigns } = await supabase
          .from("branch_assignments")
          .select("user_id")
          .eq("branch_id", activeBranchId);
        userIds = Array.from(new Set((assigns || []).map((a: any) => a.user_id)));

        // Also include students that are members of groups in this branch
        const groupIds = (groupsRes.data || []).map((g: any) => g.id);
        if (groupIds.length) {
          const { data: members } = await supabase
            .from("group_members")
            .select("student_id")
            .in("group_id", groupIds);
          (members || []).forEach((m: any) => {
            if (!userIds!.includes(m.student_id)) userIds!.push(m.student_id);
          });
        }
      }

      const profilesQ = supabase.from("profiles").select("id, full_name, user_id, created_at");
      const rolesQ = supabase.from("user_roles").select("*");
      const [usersRes, rolesRes] = await Promise.all([
        userIds && userIds.length ? profilesQ.in("user_id", userIds) : profilesQ,
        userIds && userIds.length ? rolesQ.in("user_id", userIds) : rolesQ,
      ]);

      const roles = rolesRes.data || [];
      const users = (usersRes.data || []).map((u) => ({
        ...u,
        roles: roles.filter((r) => r.user_id === u.user_id).map((r) => r.role),
      }));

      const totalStudents = roles.filter((r) => r.role === "student").length;
      const totalTeachers = roles.filter((r) => r.role === "teacher").length;
      const totalParents = roles.filter((r) => r.role === "parent").length;
      const totalAdmins = roles.filter((r) => r.role === "admin").length;

      const liveLessons = lessons.filter((l: any) => l.status === "live").length;
      const upcomingLessons = lessons.filter((l: any) => l.status === "upcoming").length;

      const presentCount = attendance.filter((a: any) => a.status === "present").length;
      const attendanceRate = attendance.length > 0
        ? Math.round((presentCount / attendance.length) * 100)
        : 0;

      // NovaCoins / payments scoped by user set when branch is selected
      const coinsQ = supabase.from("nova_coins").select("*");
      const paymentsQ = activeBranchId
        ? supabase.from("payments").select("*").eq("branch_id", activeBranchId)
        : supabase.from("payments").select("*");
      const [coinsRes, paymentsRes] = await Promise.all([
        userIds && userIds.length ? coinsQ.in("user_id", userIds) : coinsQ,
        paymentsQ,
      ]);

      const coins = coinsRes.data || [];
      const totalCoinsIssued = coins.reduce((sum: number, c: any) => sum + (c.amount > 0 ? c.amount : 0), 0);

      const teachers = users.filter((u) => u.roles.includes("teacher"));

      return {
        users,
        teachers,
        roles,
        rooms: roomsRes.data || [],
        lessons,
        attendance,
        coins,
        payments: paymentsRes.data || [],
        subjects: subjectsRes.data || [],
        groups: groupsRes.data || [],
        stats: {
          totalUsers: users.length,
          totalStudents,
          totalTeachers,
          totalParents,
          totalAdmins,
          liveLessons,
          upcomingLessons,
          attendanceRate,
          totalCoinsIssued,
          totalRooms: (roomsRes.data || []).length,
          totalSubjects: (subjectsRes.data || []).length,
          totalGroups: (groupsRes.data || []).length,
        },
      };
    },
  });
};
