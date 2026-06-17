import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CompanyCustomer {
  id: string;
  company_id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  account_type: "customer" | "staff";
  is_active: boolean;
}

/**
 * Per-company customer membership. A user must have a company_customers row
 * for the given company to access bookings/profile inside that company's site.
 */
export const useCompanyCustomer = (companyId?: string) => {
  const { user } = useAuth();
  const [data, setData] = useState<CompanyCustomer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !companyId) {
      setData(null); setLoading(false); return;
    }
    setLoading(true);
    (supabase as any)
      .from("company_customers")
      .select("*")
      .eq("company_id", companyId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        setData(data || null);
        setLoading(false);
      });
  }, [user, companyId]);

  return { customer: data, loading };
};
