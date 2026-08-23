import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";

export interface Branch {
  id: string;
  name: string;
  city: string | null;
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

const STORAGE_PREFIX = "unipath:active-branch-id";
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

  const userId = user?.id ?? null;
  const orgId = org?.id ?? null;

  // hasRole is read through a ref so a re-created callback identity can never
  // retrigger this effect (that was the source of the infinite update loop).
  const hasRoleRef = useRef(hasRole);
  hasRoleRef.current = hasRole;

  const refresh = useCallback(async () => {
    if (!userId || !orgId) {
      setBranches([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let query = supabase
      .from("branches")
      .select("id, name, city, is_active")
      .eq("tenant_id", orgId)
      .eq("is_active", true)
      .order("name");

    // For non-owner/superadmin, restrict to assigned branches
    if (!hasRoleRef.current("owner") && !hasRoleRef.current("superadmin")) {
      const { data: assignments } = await supabase
        .from("branch_assignments")
        .select("branch_id")
        .eq("user_id", userId);
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
      const next = list[0]?.id || null;
      if (next && typeof window !== "undefined") localStorage.setItem(keyFor(userId), next);
      return next;
    });

    setLoading(false);
  }, [userId, orgId]);

  const setActiveBranchId = useCallback((id: string | null) => {
    setActiveBranchIdState(id);
    if (typeof window !== "undefined") {
      const k = keyFor(userId);
      if (id) localStorage.setItem(k, id);
      else localStorage.removeItem(k);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener("unipath:branches-updated", onUpdate);
    return () => window.removeEventListener("unipath:branches-updated", onUpdate);
  }, [refresh]);

  const activeBranch = useMemo(
    () => branches.find((b) => b.id === activeBranchId) || null,
    [branches, activeBranchId],
  );

  const value = useMemo(
    () => ({ branches, activeBranchId, activeBranch, setActiveBranchId, loading, refresh }),
    [branches, activeBranchId, activeBranch, setActiveBranchId, loading, refresh],
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
};

export const useBranch = () => {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used within BranchProvider");
  return ctx;
};
