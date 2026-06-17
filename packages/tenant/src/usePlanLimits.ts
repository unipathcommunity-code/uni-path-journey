import { useTenant } from './TenantProvider';
import { planToTier, tierToPlan, TIER_FEATURES } from './plan';
import type { PlanTier, TierFeatures } from './plan';

export type { PlanTier, TierFeatures };
export { planToTier, tierToPlan, TIER_FEATURES };

export interface PlanLimits {
  tier: PlanTier;
  /** Plan name in DB/display format ('Starter' | 'Pro' | 'Enterprise') */
  plan: string;
  features: TierFeatures;
  /** Convenience shortcuts */
  hasMentors: boolean;
  hasInvoices: boolean;
  hasUniCoins: boolean;
  hasApiAccess: boolean;
  maxStaff: number;
  /** Legacy limits object (backward compat) */
  limits: {
    maxStaff: number;
    maxBranches: number;
    features: { aiSurveillance: boolean; barcodeSkaner: boolean };
  };
  /** Returns true when a boolean feature flag is NOT available on the current tier */
  isFeatureGated: (feature: keyof TierFeatures) => boolean;
  canAddStaff: (currentCount: number) => boolean;
  canAddBranch: (currentCount: number) => boolean;
}

/**
 * Returns plan-limit data for the currently active tenant.
 *
 * Resolution order:
 *   1. activeTenant.plan (DB string) → converted to PlanTier
 *   2. Falls back to 'starter' when no tenant is active
 *
 * Tenant-level module overrides (unicoin, api_access) are checked against
 * config.modules / config.features and take precedence over tier defaults.
 */
export function usePlanLimits(): PlanLimits {
  const { activeTenant } = useTenant();

  const tier: PlanTier = planToTier(activeTenant?.plan);
  const features = TIER_FEATURES[tier] ?? TIER_FEATURES.starter;

  const tenantModules = (activeTenant?.config?.modules ?? {}) as Record<string, boolean>;
  const tenantFeatures = (activeTenant?.config?.features ?? {}) as Record<string, boolean>;

  const hasUniCoins = !!(tenantModules.unicoin || tenantFeatures.unicoin);
  const hasApiAccess = features.apiAccess || !!(tenantModules.api || tenantFeatures.api_access);

  return {
    tier,
    plan: tierToPlan(tier),
    features,
    hasMentors: features.hasMentors,
    hasInvoices: features.hasInvoices,
    hasUniCoins,
    hasApiAccess,
    maxStaff: features.maxStaff,
    limits: {
      maxStaff: features.maxStaff,
      maxBranches: features.maxBranches,
      features: {
        aiSurveillance: features.aiSurveillance,
        barcodeSkaner: features.barcodeSkaner,
      },
    },
    isFeatureGated: (feature) => {
      const val = features[feature];
      return typeof val === 'boolean' ? !val : false;
    },
    canAddStaff: (count) => count < features.maxStaff,
    canAddBranch: (count) => count < features.maxBranches,
  };
}
