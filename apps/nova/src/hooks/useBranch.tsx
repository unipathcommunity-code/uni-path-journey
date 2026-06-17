import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";

export interface Branch {
  id: string;
  name: string;
  city: string | null;
  is_main: boolean;
  is_active: boolean;
}

interface BranchContextType {
  branches: Branch[];
  activeBranchId: string | null;
  activeBranch: Branch | null;
  setActiveBranchId: (id: string | null) => void;
  loading: boolean;
  refresh: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

const STORAGE_PREFIX = "nova:active-branch-id";
const keyFor = (userId?: string | null) =>
  userId ? `${STORAGE_PREFIX}:${userId}` : STORAGE_PREFIX;

export const BranchProvider = ({ children }: { children: ReactNode }) => {
  const { user, hasRole } = useAuth();
  const { org } = useOrganization();
  const [branches, setBranches] = useState<Branch[]>([]);
  // Per-user storage key — switching accounts keeps each one's own default branch.
  const [activeBranchId, setActiveBranchIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Re-hydrate active branch whenever the signed-in user changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = user ? localStorage.getItem(keyFor(user.id)) : null;
    setActiveBranchIdState(stored);
  }, [user?.id]);

  const refresh = useCallback(async () => {
    if (!user || !org?.id) {
      setBranches([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let query = supabase
      .from("branches")
      .select("id, name, city, is_main, is_active")
      .eq("organization_id", org.id)
      .eq("is_active", true)
      .order("is_main", { ascending: false })
      .order("name");

    // For non-owner/superadmin, restrict to assigned branches
    if (!hasRole("owner") && !hasRole("superadmin")) {
      const { data: assignments } = await supabase
        .from("branch_assignments")
        .select("branch_id")
        .eq("user_id", user.id);
      const ids = (assignments || []).map((a: any) => a.branch_id);
      if (ids.length === 0) {
        setBranches([]);
        setLoading(false);
        return;
      }
      query = query.in("id", ids);
    }

    const { data } = await query;
    const list = (data as Branch[]) || [];
    setBranches(list);

    // Resolve active branch: stored value if still valid, else main, else first
    setActiveBranchIdState((current) => {
      if (current && list.some((b) => b.id === current)) return current;
      const main = list.find((b) => b.is_main);
      const next = main?.id || list[0]?.id || null;
      if (next && typeof window !== "undefined") localStorage.setItem(keyFor(user?.id), next);
      return next;
    });

    setLoading(false);
  }, [user, org?.id, hasRole]);

  const setActiveBranchId = useCallback((id: string | null) => {
    setActiveBranchIdState(id);
    if (typeof window !== "undefined") {
      const k = keyFor(user?.id);
      if (id) localStorage.setItem(k, id);
      else localStorage.removeItem(k);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener("nova:branches-updated", onUpdate);
    return () => window.removeEventListener("nova:branches-updated", onUpdate);
  }, [refresh]);

  const activeBranch = branches.find((b) => b.id === activeBranchId) || null;

  return (
    <BranchContext.Provider value={{ branches, activeBranchId, activeBranch, setActiveBranchId, loading, refresh }}>
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used within BranchProvider");
  return ctx;
};
