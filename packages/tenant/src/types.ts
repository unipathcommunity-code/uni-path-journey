import type { TenantConfig } from '@unipath/db';

export type { TenantConfig };

// ---------------------------------------------------------------------------
// Business verticals
// ---------------------------------------------------------------------------

/** All supported verticals. `consulting` is always the last-resort fallback. */
export type BusinessVertical =
  | 'tour'
  | 'academy'
  | 'hotel'
  | 'restaurant'
  | 'clinic'
  | 'gym'
  | 'manufacturing'
  | 'parking'
  | 'auto_service'
  | 'wholesale'
  | 'wedding_hall'
  | 'kindergarten'
  | 'library'
  | 'cosmetics'
  | 'stadium'
  | 'pharmacy'
  | 'consulting';

// ---------------------------------------------------------------------------
// Tenant domain model
// ---------------------------------------------------------------------------

export interface Tenant {
  id: string;
  name: string;
  subdomain: string | null;
  custom_domain: string | null;
  /** Canonical business vertical — resolved by mapTenant() from the DB row */
  business_type: BusinessVertical;
  config: TenantConfig | null;
  created_at: string | null;
  updated_at: string | null;
  status: string | null;
  plan: string | null;
  owner_email: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  has_unicoin: boolean | null;
}

// ---------------------------------------------------------------------------
// Branch domain model
// ---------------------------------------------------------------------------

export interface BranchConfig {
  id: string;
  name: string;
  city: string;
  address: string | null;
  currency: string;
  timezone: string;
  is_active: boolean;
}

// ---------------------------------------------------------------------------
// Tenant context value
// ---------------------------------------------------------------------------

export interface TenantContextValue {
  /** Resolved active tenant — null while loading or on the root domain */
  activeTenant: Tenant | null;
  isTenantLoading: boolean;
  /** Active branch within the tenant */
  activeBranch: BranchConfig | null;
  availableBranches: BranchConfig[];
  switchBranch: (branchId: string) => void;
  /** Refetch branches from DB */
  refetchBranches: () => Promise<void>;
  /** Whether the current view is in SuperAdmin impersonation mode */
  isImpersonating: boolean;
  /** End impersonation and return to the SuperAdmin's own tenant */
  endImpersonation: () => void;

  // ── Multi-business (owner) support ───────────────────────────────────────
  /** All tenants owned by the signed-in user (matched by owner_email). */
  ownedTenants: Tenant[];
  /** Refetch the owned-tenants list from DB. */
  refetchOwnedTenants: () => Promise<void>;
  /**
   * Switch the active tenant to another business the user owns. Persists the
   * selection to localStorage and re-resolves. No-op if the target is not
   * owned by the current user.
   */
  switchTenant: (tenantId: string) => void;
  /**
   * True when the active tenant was selected via an owner business-switch
   * (owner viewing one of their own businesses) — distinct from SuperAdmin
   * impersonation (`isImpersonating`).
   */
  isOwnerSwitch: boolean;
}
