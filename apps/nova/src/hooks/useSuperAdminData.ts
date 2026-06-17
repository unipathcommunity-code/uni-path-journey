import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TenantRow {
  id: string;
  name: string;
  slug: string;
  org_type: string;
  status: string;
  billing_tier: string;
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
  contact_email: string | null;
  contact_phone: string | null;
  city: string | null;
  notes: string | null;
  features: Record<string, boolean>;
  monthly_price: number | null;
  currency: string | null;
  max_students: number | null;
  trial_ends_at: string | null;
  created_at: string;
}

export interface LeadRow {
  id: string;
  org_name: string;
  org_type: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  city: string | null;
  expected_students: number | null;
  message: string | null;
  source: string | null;
  stage: string;
  notes: string | null;
  created_org_id: string | null;
  created_at: string;
}

export const useSuperAdminData = () => {
  return useQuery({
    queryKey: ["superadmin-data"],
    queryFn: async () => {
      const [orgsRes, leadsRes, profilesRes, paymentsRes, attendanceRes, lessonsRes, rolesRes] =
        await Promise.all([
          supabase.from("organizations").select("*").order("created_at", { ascending: false }),
          supabase.from("leads").select("*").order("created_at", { ascending: false }),
          supabase.from("profiles").select("user_id, organization_id, full_name, created_at"),
          supabase.from("payments").select("organization_id, amount, status, currency, paid_at, created_at"),
          supabase.from("attendance").select("organization_id, status, created_at"),
          supabase.from("lessons").select("organization_id, starts_at, status"),
          supabase.from("user_roles").select("organization_id, role, user_id"),
        ]);

      const orgs = (orgsRes.data || []) as unknown as TenantRow[];
      const leads = (leadsRes.data || []) as unknown as LeadRow[];

      // Aggregate per-org stats
      const statsByOrg: Record<string, {
        students: number; teachers: number; revenue: number;
        attendance_rate: number; lessons: number;
      }> = {};

      for (const org of orgs) {
        const profilesInOrg = (profilesRes.data || []).filter((p) => p.organization_id === org.id);
        const rolesInOrg = (rolesRes.data || []).filter((r) => r.organization_id === org.id);
        const studentIds = new Set(rolesInOrg.filter((r) => r.role === "student").map((r) => r.user_id));
        const teacherIds = new Set(rolesInOrg.filter((r) => r.role === "teacher").map((r) => r.user_id));

        const paymentsInOrg = (paymentsRes.data || []).filter((p) => p.organization_id === org.id);
        const revenue = paymentsInOrg
          .filter((p) => p.status === "paid")
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);

        const attendanceInOrg = (attendanceRes.data || []).filter((a) => a.organization_id === org.id);
        const presentCount = attendanceInOrg.filter((a) => a.status === "present").length;
        const attendance_rate = attendanceInOrg.length > 0
          ? Math.round((presentCount / attendanceInOrg.length) * 100) : 0;

        const lessonsInOrg = (lessonsRes.data || []).filter((l) => l.organization_id === org.id);

        statsByOrg[org.id] = {
          students: studentIds.size,
          teachers: teacherIds.size,
          revenue,
          attendance_rate,
          lessons: lessonsInOrg.length,
        };
      }

      // Global totals
      const totalRevenue = (paymentsRes.data || [])
        .filter((p) => p.status === "paid")
        .reduce((s, p) => s + Number(p.amount || 0), 0);

      const global = {
        totalOrgs: orgs.length,
        activeOrgs: orgs.filter((o) => o.status === "active").length,
        totalStudents: (rolesRes.data || []).filter((r) => r.role === "student").length,
        totalTeachers: (rolesRes.data || []).filter((r) => r.role === "teacher").length,
        totalRevenue,
        totalLeads: leads.length,
        newLeads: leads.filter((l) => l.stage === "new").length,
        wonLeads: leads.filter((l) => l.stage === "won").length,
      };

      return { orgs, leads, statsByOrg, global };
    },
    staleTime: 30_000,
  });
};
