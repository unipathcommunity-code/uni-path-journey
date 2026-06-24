import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isLiveStatus, isPendingStatus, isBlockedStatus } from "@/lib/tenantStatus";

// ============================================================
// Super Admin — real platform statistics.
// ============================================================
// Single fetch of the three real tables that back the whole panel (tenants,
// profiles, pricing_plans) + derived aggregates. Replaces the dead
// useSuperAdminData hook which queried an `organizations` table that does not
// exist in this database. Everything here is REAL data — no mock numbers.

export interface SaTenant {
  id: string;
  name: string;
  vertical: string;
  status: string;
  plan: string | null;
  subdomain: string | null;
  custom_domain: string | null;
  owner_name: string | null;
  owner_email: string | null;
  monthlyPrice: number; // resolved from pricing_plans (UZS), 0 if unknown
  currency: string;
  created_at: string;
}

/** Human label per vertical id (kept here so all pages share one source). */
export const VERTICAL_LABELS: Record<string, string> = {
  consulting: "Konsalting",
  tour: "Turizm",
  academy: "Akademiya",
  hotel: "Mehmonxona",
  restaurant: "Restoran",
  pharmacy: "Dorixona",
  gym: "Sport zali",
  manufacturing: "Ishlab chiqarish",
  auto_service: "Avtoservis",
  clinic: "Klinika",
  parking: "Avtoturargoh",
  wedding_hall: "To'yxona",
  kindergarten: "Bog'cha",
  library: "Kutubxona",
  cosmetics: "Kosmetika",
  stadium: "Stadion",
  car_showroom: "Avtosalon",
};

export const verticalLabel = (v?: string | null): string =>
  (v && VERTICAL_LABELS[v]) || v || "Konsalting";

/** pricing_plans.price is free-text like "199 000" — turn it into a number. */
const parsePrice = (raw: unknown): number => {
  if (raw == null) return 0;
  const digits = String(raw).replace(/[^0-9]/g, "");
  return digits ? parseInt(digits, 10) : 0;
};

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const MONTH_LABELS = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];

export const useSuperAdminStats = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["superadmin-stats", user?.id],
    queryFn: async () => {
      const [tenantsRes, profilesRes, plansRes] = await Promise.all([
        supabase.from("tenants" as any).select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("user_id, role, created_at"),
        supabase.from("pricing_plans" as any).select("vertical, name, price, currency"),
      ]);

      const rawTenants = (tenantsRes.data || []) as any[];
      const profiles = (profilesRes.data || []) as any[];
      const plans = (plansRes.data || []) as any[];

      // Price lookup: `${vertical}|${name}` -> { price, currency }
      const priceByPlan = new Map<string, { price: number; currency: string }>();
      for (const p of plans) {
        priceByPlan.set(`${p.vertical}|${p.name}`, {
          price: parsePrice(p.price),
          currency: p.currency || "UZS",
        });
      }

      const tenants: SaTenant[] = rawTenants.map((t) => {
        const vertical = t.vertical || t.config?.business_type || "consulting";
        const plan = t.plan || null;
        const match = plan ? priceByPlan.get(`${vertical}|${plan}`) : undefined;
        return {
          id: t.id,
          name: t.name,
          vertical,
          status: t.status || "pending",
          plan,
          subdomain: t.subdomain || null,
          custom_domain: t.custom_domain || null,
          owner_name: t.owner_name || null,
          owner_email: t.owner_email || null,
          monthlyPrice: match?.price || 0,
          currency: match?.currency || "UZS",
          created_at: t.created_at,
        };
      });

      const liveTenants = tenants.filter((t) => isLiveStatus(t.status));

      // Vertical distribution (all tenants)
      const byVertical: Record<string, number> = {};
      for (const t of tenants) byVertical[t.vertical] = (byVertical[t.vertical] || 0) + 1;

      // Plan distribution (live tenants only — that is what is billable)
      const byPlan: Record<string, number> = {};
      for (const t of liveTenants) {
        const key = t.plan || "—";
        byPlan[key] = (byPlan[key] || 0) + 1;
      }

      // User role distribution
      const byRole: Record<string, number> = {};
      for (const p of profiles) {
        const r = p.role || "user";
        byRole[r] = (byRole[r] || 0) + 1;
      }

      // Real MRR = sum of monthly plan price across live tenants (UZS)
      const mrr = liveTenants.reduce((s, t) => s + t.monthlyPrice, 0);

      // Real 6-month signup trend from tenants.created_at
      const now = new Date();
      const trend: { label: string; count: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = monthKey(d);
        const count = tenants.filter((t) => t.created_at && monthKey(new Date(t.created_at)) === key).length;
        trend.push({ label: MONTH_LABELS[d.getMonth()], count });
      }

      return {
        tenants,
        liveTenants,
        totals: {
          tenants: tenants.length,
          live: liveTenants.length,
          pending: tenants.filter((t) => isPendingStatus(t.status)).length,
          blocked: tenants.filter((t) => isBlockedStatus(t.status)).length,
          users: profiles.length,
          owners: byRole["owner"] || 0,
          mrr,
        },
        byVertical,
        byPlan,
        byRole,
        trend,
      };
    },
    staleTime: 30_000,
  });
};

export type SuperAdminStats = NonNullable<ReturnType<typeof useSuperAdminStats>["data"]>;
