// ============================================================
// Tenant (firma) status — single source of truth for the Super Admin panel.
// ============================================================
// The DB historically stores BOTH 'approved' and 'active' for a live tenant
// (SuperAdminDashboard wrote 'approved', SuperAdminUsers wrote 'active'), and
// the access-gating in useUserRole / PendingApproval treats them identically.
// To stop the same tenant from looking different across panel pages, every
// read/filter/label MUST go through these helpers. Writes use ACTIVE as the
// canonical "make live" value; reads stay tolerant of the legacy 'approved'.

export type TenantStatus = "active" | "approved" | "pending" | "suspended" | "rejected";

/** Statuses that mean the tenant is live and its users may sign in. */
export const LIVE_STATUSES = ["active", "approved"] as const;

/** Canonical value to WRITE when activating a tenant. */
export const ACTIVE_STATUS = "active";

export const isLiveStatus = (status?: string | null): boolean =>
  !!status && (LIVE_STATUSES as readonly string[]).includes(status);

export const isPendingStatus = (status?: string | null): boolean => status === "pending";

export const isBlockedStatus = (status?: string | null): boolean =>
  status === "suspended" || status === "rejected";

/** Uzbek label shown in the UI. */
export const tenantStatusLabel = (status?: string | null): string => {
  if (isLiveStatus(status)) return "Faol";
  switch (status) {
    case "pending":
      return "Kutilmoqda";
    case "suspended":
      return "Bloklangan";
    case "rejected":
      return "Rad etilgan";
    default:
      return "Noma'lum";
  }
};

/** Tailwind badge classes matching the panel's dark glass theme. */
export const tenantStatusBadgeClass = (status?: string | null): string => {
  if (isLiveStatus(status)) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  if (isPendingStatus(status)) return "bg-amber-500/10 text-amber-500 border-amber-500/20";
  return "bg-rose-500/10 text-rose-500 border-rose-500/20";
};
