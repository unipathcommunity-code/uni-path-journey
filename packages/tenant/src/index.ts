// @unipath/tenant — Tenant resolution, plan limits, and gating for all UniPath apps.
//
// Usage:
//   import { TenantProvider, useTenant, usePlanLimits, PlanGate } from '@unipath/tenant';
//   import { BranchSwitcher } from '@unipath/tenant';

// Context + hook
export { TenantProvider, useTenant, TenantContext } from './TenantProvider';
export type { TenantProviderProps } from './TenantProvider';

// Domain types
export type {
  Tenant,
  BranchConfig,
  BusinessVertical,
  TenantContextValue,
  TenantConfig,
} from './types';

// Vertical detection helpers
export {
  VERTICAL_DETECT_ORDER,
  VERTICAL_LABELS,
  detectVerticalFromModules,
  mapTenant,
} from './verticals';

// Plan limits + tier features
export { usePlanLimits, planToTier, tierToPlan, TIER_FEATURES } from './usePlanLimits';
export type { PlanTier, TierFeatures, PlanLimits } from './usePlanLimits';

// Declarative gating components
export { PlanGate, UpgradeBadge, withPlanGate } from './PlanGate';
export type { PlanGateProps, UpgradeBadgeProps } from './PlanGate';

// Branch + app switcher UI
export { BranchSwitcher } from './BranchSwitcher';
export type { BranchSwitcherProps, AppEntry } from './BranchSwitcher';
