import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  org_type: string; // tutor | center | school | academy
  tier: string; // starter | pro | premium | enterprise | basic
  monthly_price: number;
  yearly_price: number | null;
  currency: string;
  max_students: number;
  max_teachers: number;
  features: Record<string, boolean>;
  description: string | null;
  highlight: boolean;
  sort_order: number;
  is_active: boolean;
}

export const usePlans = (orgType?: string) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (orgType) query = query.eq("org_type", orgType);
    const { data } = await query;
    if (data) {
      setPlans(
        data.map((p: any) => ({
          ...p,
          features: (p.features as Record<string, boolean>) || {},
        }))
      );
    }
    setLoading(false);
  }, [orgType]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return { plans, loading, refresh: fetchPlans };
};
