import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface TourCompany {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  telegram: string | null;
  instagram: string | null;
  facebook: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  country: string;
  about_html: string | null;
  theme_config: Record<string, unknown>;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  status: "pending" | "approved" | "suspended";
  is_active: boolean;
  is_featured: boolean;
  subscription_plan: string;
  commission_rate: number;
  total_tours: number;
  total_bookings: number;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

/** Returns the tour company that the current user belongs to (as owner or staff).
 *  When a super admin has impersonation set in sessionStorage, returns that company instead. */
export const useMyCompany = () => {
  const { user } = useAuth();
  const impersonateId = typeof window !== "undefined" ? sessionStorage.getItem("impersonating_company") : null;

  return useQuery({
    queryKey: ["my-company", user?.id, impersonateId],
    enabled: !!user?.id,
    queryFn: async () => {
      if (impersonateId) {
        const { data: company } = await (supabase as any)
          .from("tour_companies").select("*").eq("id", impersonateId).maybeSingle();
        if (company) return { company: company as TourCompany, role: "owner" as const, impersonated: true };
      }

      const { data: membership, error: mErr } = await (supabase as any)
        .from("tour_company_members")
        .select("company_id, role, is_active")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .order("role", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (mErr || !membership) return null;

      const { data: company, error: cErr } = await (supabase as any)
        .from("tour_companies")
        .select("*")
        .eq("id", membership.company_id)
        .maybeSingle();

      if (cErr || !company) return null;
      return { company: company as TourCompany, role: membership.role as "owner" | "staff", impersonated: false };
    },
  });
};

/** Public lookup by slug — used by the tenant site. */
export const useCompanyBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["company-by-slug", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("tour_companies")
        .select("*")
        .eq("slug", slug!)
        .eq("status", "approved")
        .eq("is_active", true)
        .maybeSingle();
      if (error || !data) return null;
      return data as TourCompany;
    },
  });
};
