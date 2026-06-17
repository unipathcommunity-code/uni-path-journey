import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyCompany } from "@/hooks/useTourCompany";
import { toast } from "sonner";

export interface Branch {
  id: string;
  company_id: string;
  name: string;
  slug: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  manager_user_id: string | null;
  is_active: boolean;
  is_main: boolean;
  notes: string | null;
  created_at: string;
}

const PLAN_LIMITS: Record<string, number> = { free: 1, pro: 3, premium: 10, enterprise: 999 };

export const useMyBranches = () => {
  const { data: companyData } = useMyCompany();
  const companyId = companyData?.company.id;
  return useQuery({
    queryKey: ["my-branches", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("company_branches")
        .select("*")
        .eq("company_id", companyId!)
        .order("is_main", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as Branch[];
    },
  });
};

export const useBranchLimit = () => {
  const { data: companyData } = useMyCompany();
  const plan = (companyData as any)?.company?.subscription_plan || "free";
  return PLAN_LIMITS[plan.toLowerCase()] ?? 1;
};

export const useUpsertBranch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (b: Partial<Branch> & { company_id: string; name: string }) => {
      const payload = { ...b, slug: b.slug || b.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) };
      const { data, error } = await (supabase as any).from("company_branches").upsert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-branches"] });
      toast.success("Filial saqlandi");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useDeleteBranch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("company_branches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-branches"] });
      toast.success("Filial o'chirildi");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

// ---- Branch context (current selection) ----
interface BranchCtx {
  currentBranchId: string | null; // null = "All branches"
  setCurrentBranchId: (id: string | null) => void;
  branches: Branch[];
  current: Branch | null;
}

const Ctx = createContext<BranchCtx | null>(null);

export const BranchProvider = ({ children }: { children: ReactNode }) => {
  const { data: branches = [] } = useMyBranches();
  const [currentBranchId, setRaw] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("current_branch_id");
  });

  const setCurrentBranchId = (id: string | null) => {
    setRaw(id);
    if (id) sessionStorage.setItem("current_branch_id", id);
    else sessionStorage.removeItem("current_branch_id");
  };

  // Auto-clear if current branch no longer exists
  useEffect(() => {
    if (currentBranchId && branches.length && !branches.find((b) => b.id === currentBranchId)) {
      setCurrentBranchId(null);
    }
  }, [branches, currentBranchId]);

  const current = useMemo(
    () => branches.find((b) => b.id === currentBranchId) || null,
    [branches, currentBranchId]
  );

  return (
    <Ctx.Provider value={{ currentBranchId, setCurrentBranchId, branches, current }}>
      {children}
    </Ctx.Provider>
  );
};

export const useBranch = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBranch must be inside BranchProvider");
  return ctx;
};
