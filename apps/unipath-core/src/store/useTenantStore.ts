import { create } from 'zustand';

export type BusinessVertical = 
  | 'consulting' 
  | 'academy' 
  | 'hotel' 
  | 'wedding' 
  | 'kindergarten' 
  | 'pharmacy' 
  | 'wholesale' 
  | 'restaurant' 
  | 'gym' 
  | 'cosmetics' 
  | 'library' 
  | 'auto_service' 
  | 'manufacturing' 
  | 'stadium' 
  | 'clinic' 
  | 'perfume' 
  | 'parking' 
  | 'online_shop'
  | 'tour_farm';

export interface TenantConfig { 
  id: string; 
  name: string; 
  subdomain: string; 
  vertical: BusinessVertical; 
  tier: 'starter' | 'growth' | 'enterprise'; 
  theme: { 
    primaryColor: string; 
    sidebarColor: string; 
    accentColor: string; 
  } 
}

export interface BranchConfig {
  id: string;
  name: string;
  city: string;
  address: string | null;
  currency: string;
  timezone: string;
  is_active: boolean;
}

interface TenantState { 
  currentTenant: TenantConfig | null; 
  activeBranch: BranchConfig | null; 
  availableBranches: BranchConfig[]; 
  setTenant: (tenant: TenantConfig) => void; 
  setBranches: (branches: BranchConfig[]) => void; 
  switchBranch: (branchId: string) => void; 
}

export const useTenantStore = create<TenantState>((set) => ({
  currentTenant: null, 
  activeBranch: null, 
  availableBranches: [],
  setTenant: (tenant) => set({ currentTenant: tenant }),
  setBranches: (branches) => set({ availableBranches: branches, activeBranch: branches[0] || null }),
  switchBranch: (branchId) => set((state) => {
    const target = state.availableBranches.find((b) => b.id === branchId);
    return target ? { activeBranch: target } : {};
  }),
}));
