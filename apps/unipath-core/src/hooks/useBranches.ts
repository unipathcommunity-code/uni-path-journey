import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore, BranchConfig } from '@/store/useTenantStore';
import { useApp } from '@/contexts/AppContext';
import { usePlanLimits } from './usePlanLimits';

export type { BranchConfig };

export interface AddBranchData {
  name: string;
  city: string;
  address?: string;
  currency?: string;
  timezone?: string;
}

export function useBranches() {
  const { activeTenant } = useApp();
  const {
    activeBranch,
    availableBranches,
    setBranches,
    switchBranch: storeSwitchBranch,
  } = useTenantStore();
  const { features, canAddBranch } = usePlanLimits();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch branches from Supabase ──────────────────────────────────────────
  const fetchBranches = useCallback(async () => {
    if (!activeTenant?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('branches')
        .select('id, name, city, address, currency, timezone, is_active, tenant_id')
        .eq('tenant_id', activeTenant.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (fetchErr) throw fetchErr;
      if (data) {
        const mapped: BranchConfig[] = data.map((b) => ({
          id: b.id,
          name: b.name,
          city: b.city ?? '',
          address: b.address ?? null,
          currency: b.currency ?? 'USD',
          timezone: b.timezone ?? 'Asia/Tashkent',
          is_active: b.is_active,
        }));
        setBranches(mapped);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Filiallar yuklanmadi');
    } finally {
      setIsLoading(false);
    }
  }, [activeTenant?.id, setBranches]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // ── Switch active branch ──────────────────────────────────────────────────
  const switchBranch = useCallback(
    (branchId: string) => {
      storeSwitchBranch(branchId);
    },
    [storeSwitchBranch]
  );

  // ── Add a new branch (plan-limited) ──────────────────────────────────────
  const addBranch = useCallback(
    async (data: AddBranchData): Promise<BranchConfig> => {
      if (!activeTenant?.id) throw new Error('Tenant topilmadi');

      const currentCount = availableBranches.length;
      if (!canAddBranch(currentCount)) {
        const limit = features.maxBranches;
        throw new Error(
          `Tarif chegarasi: maksimal ${limit === Infinity ? 'cheksiz' : limit} ta filial. Tarifni yangilang.`
        );
      }

      setIsSaving(true);
      try {
        const { data: branch, error: insertErr } = await supabase
          .from('branches')
          .insert({
            name: data.name,
            city: data.city,
            address: data.address ?? null,
            currency: data.currency ?? 'UZS',
            timezone: data.timezone ?? 'Asia/Tashkent',
            country: 'UZ',
            is_active: true,
            tenant_id: activeTenant.id,
          })
          .select('id, name, city, address, currency, timezone, is_active')
          .single();

        if (insertErr) throw insertErr;

        await fetchBranches();

        return {
          id: branch.id,
          name: branch.name,
          city: branch.city ?? '',
          address: branch.address ?? null,
          currency: branch.currency ?? 'UZS',
          timezone: branch.timezone ?? 'Asia/Tashkent',
          is_active: branch.is_active,
        };
      } finally {
        setIsSaving(false);
      }
    },
    [activeTenant?.id, availableBranches.length, canAddBranch, features.maxBranches, fetchBranches]
  );

  // ── Update branch name/address ────────────────────────────────────────────
  const updateBranch = useCallback(
    async (branchId: string, updates: Partial<AddBranchData>) => {
      const { error: updateErr } = await supabase
        .from('branches')
        .update(updates)
        .eq('id', branchId);
      if (updateErr) throw updateErr;
      await fetchBranches();
    },
    [fetchBranches]
  );

  // ── Deactivate branch ─────────────────────────────────────────────────────
  const deactivateBranch = useCallback(
    async (branchId: string) => {
      if (availableBranches.length <= 1) {
        throw new Error('Kamida bitta filial bo\'lishi kerak');
      }
      const { error: deactivateErr } = await supabase
        .from('branches')
        .update({ is_active: false })
        .eq('id', branchId);
      if (deactivateErr) throw deactivateErr;
      // If we deactivated the active branch, switch to first available
      if (activeBranch?.id === branchId) {
        const next = availableBranches.find((b) => b.id !== branchId);
        if (next) storeSwitchBranch(next.id);
      }
      await fetchBranches();
    },
    [activeBranch?.id, availableBranches, storeSwitchBranch, fetchBranches]
  );

  const maxBranches = features.maxBranches;
  const canAddMore = canAddBranch(availableBranches.length);
  const atLimit = !canAddMore && maxBranches !== Infinity;

  return {
    branches: availableBranches,
    activeBranch,
    switchBranch,
    addBranch,
    updateBranch,
    deactivateBranch,
    isLoading,
    isSaving,
    error,
    refetch: fetchBranches,
    canAddMore,
    atLimit,
    maxBranches,
    branchCount: availableBranches.length,
  };
}

// ── Passthrough provider ──────────────────────────────────────────────────────
// Branch state lives in the Zustand store + useBranches hook, so no real context
// provider is needed. This passthrough exists only to satisfy legacy imports
// (e.g. tour CompanyLayout) during the ecosystem unification.
export function BranchProvider({ children }: { children: ReactNode }) {
  return children as ReactNode;
}

// ── Shared Aliases for Company Pages ──────────────────────────────────────────

export interface Branch {
  id: string;
  name: string;
  city: string;
  address: string | null;
  currency: string;
  timezone: string;
  is_active: boolean;
  phone?: string | null;
  email?: string | null;
  company_id?: string | null;
  is_main?: boolean | null;
}

export function useBranch() {
  const res = useBranches();
  return {
    current: res.activeBranch as any,
    currentBranchId: res.activeBranch?.id || null,
    setCurrentBranchId: res.switchBranch,
    branches: res.branches as any,
    switchBranch: res.switchBranch,
    isLoading: res.isLoading,
    error: res.error,
  };
}

export function useMyBranches() {
  const res = useBranches();
  return {
    data: res.branches as any,
    isLoading: res.isLoading,
    refetch: res.refetch,
  };
}

export function useUpsertBranch() {
  const res = useBranches();
  return {
    mutate: async (branch: any, options?: { onSuccess?: () => void }) => {
      try {
        let result;
        if (branch.id) {
          await res.updateBranch(branch.id, branch);
          result = branch;
        } else {
          result = await res.addBranch(branch);
        }
        options?.onSuccess?.();
        return result;
      } catch (err) {
        throw err;
      }
    },
    mutateAsync: async (branch: any, options?: { onSuccess?: () => void }) => {
      try {
        let result;
        if (branch.id) {
          await res.updateBranch(branch.id, branch);
          result = branch;
        } else {
          result = await res.addBranch(branch);
        }
        options?.onSuccess?.();
        return result;
      } catch (err) {
        throw err;
      }
    },
    isPending: res.isSaving,
    isLoading: res.isSaving,
  };
}

export function useDeleteBranch() {
  const res = useBranches();
  return {
    mutate: async (id: string) => {
      await res.deactivateBranch(id);
    },
    mutateAsync: async (id: string) => {
      await res.deactivateBranch(id);
    },
    isPending: false,
    isLoading: false,
  };
}

export function useBranchLimit() {
  const res = useBranches();
  return {
    data: {
      limit: res.maxBranches,
      count: res.branchCount,
      canAddMore: res.canAddMore,
      atLimit: res.atLimit,
    },
    isLoading: false,
  };
}

