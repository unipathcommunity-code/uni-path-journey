import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Canonical feature keys. Add new ones here as we ship modules.
 * These mirror the `features` JSONB column on `subscription_plans`.
 */
export type FeatureKey =
  | "ai_tutor"
  | "homework"
  | "payments"
  | "biometric"
  | "nova_store"
  | "live_classes"
  | "parent_mirror"
  | "qr_attendance"
  | "ai_presentation"
  | "ai_lesson_planner"
  | "crm"
  | "website_builder"
  | "telegram_bot"
  | "advanced_analytics"
  | "white_label"
  | "custom_domain"
  | "priority_support"
  | "api_access";

interface PlanInfo {
  id: string;
  code: string;
  name: string;
  tier: string;
  monthly_price: number;
  max_students: number;
  max_teachers: number;
}

interface FeatureFlagContextType {
  plan: PlanInfo | null;
  features: Record<string, boolean>;
  organizationId: string | null;
  loading: boolean;
  isEnabled: (key: FeatureKey) => boolean;
  refresh: () => Promise<void>;
  /** True only after the server-validated response has been received at least once. */
  serverValidated: boolean;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

export const FeatureFlagProvider = ({ children }: { children: ReactNode }) => {
  const { user, hasRole } = useAuth();
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverValidated, setServerValidated] = useState(false);

  const fetchFromServer = async () => {
    if (!user) {
      setPlan(null);
      setFeatures({});
      setOrganizationId(null);
      setServerValidated(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Server-validated: edge function uses service-role to read plan + org_has_feature logic
      const { data, error } = await supabase.functions.invoke("verify-feature-access", {});
      if (error) throw error;
      if (data) {
        setPlan(data.plan ?? null);
        setFeatures((data.features as Record<string, boolean>) || {});
        setOrganizationId(data.organization_id ?? null);
        setServerValidated(true);
      }
    } catch (e) {
      console.warn("[useFeatureFlag] server validation failed, continuing degraded", e);
      // Fail-soft: never blank-screen the app — just disable premium gates.
      setFeatures({});
      setPlan(null);
      setOrganizationId(null);
      setServerValidated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFromServer();
    const onUpdate = () => fetchFromServer();
    window.addEventListener("nova:org-updated", onUpdate);
    window.addEventListener("nova:plan-updated", onUpdate);
    return () => {
      window.removeEventListener("nova:org-updated", onUpdate);
      window.removeEventListener("nova:plan-updated", onUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const isEnabled = (key: FeatureKey): boolean => {
    if (hasRole && hasRole("superadmin")) return true;
    return Boolean(features[key]);
  };

  return (
    <FeatureFlagContext.Provider
      value={{ plan, features, organizationId, loading, isEnabled, refresh: fetchFromServer, serverValidated }}
    >
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const useFeatureFlag = () => {
  const ctx = useContext(FeatureFlagContext);
  if (!ctx) throw new Error("useFeatureFlag must be used within FeatureFlagProvider");
  return ctx;
};

/** Convenience hook: returns just the boolean for a single feature key. */
export const useFeature = (key: FeatureKey) => {
  const { isEnabled, loading, serverValidated } = useFeatureFlag();
  return { enabled: isEnabled(key), loading, serverValidated };
};
