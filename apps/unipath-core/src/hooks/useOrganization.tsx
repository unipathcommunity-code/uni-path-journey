import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
  org_type: string;
}

interface OrgContextType {
  org: Organization | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrg = useCallback(async () => {
    if (!userId) {
      setOrg(null);
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }
    const { data: orgRow } = await supabase
      .from("organizations")
      .select("id, name, slug, logo_url, primary_color, accent_color, org_type")
      .eq("id", profile.organization_id)
      .single();
    if (orgRow) setOrg(orgRow);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchOrg();
    const onUpdate = () => fetchOrg();
    window.addEventListener("unipath:org-updated", onUpdate);
    return () => window.removeEventListener("unipath:org-updated", onUpdate);
  }, [fetchOrg]);

  // Apply org branding as CSS variables (HSL strings stored in DB)
  useEffect(() => {
    if (!org) return;
    const root = document.documentElement;
    root.style.setProperty("--primary", org.primary_color);
    root.style.setProperty("--accent", org.accent_color);
  }, [org]);

  const orgValue = useMemo(() => ({ org, loading, refresh: fetchOrg }), [org, loading, fetchOrg]);

  return (
    <OrgContext.Provider value={orgValue}>
      {children}
    </OrgContext.Provider>
  );
};

export const useOrganization = () => {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrganization must be used within OrganizationProvider");
  return ctx;
};
