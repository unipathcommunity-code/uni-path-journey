import { useTenantStore } from '@/store/useTenantStore';
import { useApp } from '@/contexts/AppContext';

export type PlanTier = 'starter' | 'growth' | 'enterprise';

export interface TierFeatures {
  // Staff & branch caps
  maxStaff: number;
  maxBranches: number;
  // Core features
  barcodeSkaner: boolean;
  telegramBot: boolean;
  advancedAnalytics: boolean;
  // Growth+ features
  aiCamera: boolean;
  aiSurveillance: boolean;
  allModules: boolean;         // Finance, HR, Inventory
  multipleThemes: boolean;
  cloudStorage: string;        // '5GB' | '50GB' | 'Unlimited'
  apiAccess: boolean;
  // Enterprise-only
  customDomain: boolean;
  aiSecurity: boolean;
  dataIsolation: boolean;
  prioritySupport: boolean;
  unlimitedStorage: boolean;
  slaGuarantee: boolean;
  // Convenience flags used by AdminLayout
  hasMentors: boolean;
  hasInvoices: boolean;
}

/** Maps DB plan string to internal tier key */
export function planToTier(plan: string | null | undefined): PlanTier {
  const p = (plan ?? '').toLowerCase().trim();
  if (p === 'pro' || p === 'growth' || p === 'growth (pro)') return 'growth';
  if (p === 'enterprise') return 'enterprise';
  return 'starter';
}

const TIER_FEATURES: Record<PlanTier, TierFeatures> = {
  starter: {
    maxStaff: 3,
    maxBranches: 1,
    barcodeSkaner: true,
    telegramBot: false,
    advancedAnalytics: false,
    aiCamera: false,
    aiSurveillance: false,
    allModules: false,
    multipleThemes: false,
    cloudStorage: '5GB',
    apiAccess: false,
    customDomain: false,
    aiSecurity: false,
    dataIsolation: false,
    prioritySupport: false,
    unlimitedStorage: false,
    slaGuarantee: false,
    hasMentors: false,
    hasInvoices: true,
  },
  growth: {
    maxStaff: 25,
    maxBranches: 5,
    barcodeSkaner: true,
    telegramBot: true,
    advancedAnalytics: true,
    aiCamera: true,
    aiSurveillance: true,
    allModules: true,
    multipleThemes: true,
    cloudStorage: '50GB',
    apiAccess: true,
    customDomain: false,
    aiSecurity: false,
    dataIsolation: false,
    prioritySupport: false,
    unlimitedStorage: false,
    slaGuarantee: false,
    hasMentors: true,
    hasInvoices: true,
  },
  enterprise: {
    maxStaff: Infinity,
    maxBranches: Infinity,
    barcodeSkaner: true,
    telegramBot: true,
    advancedAnalytics: true,
    aiCamera: true,
    aiSurveillance: true,
    allModules: true,
    multipleThemes: true,
    cloudStorage: 'Unlimited',
    apiAccess: true,
    customDomain: true,
    aiSecurity: true,
    dataIsolation: true,
    prioritySupport: true,
    unlimitedStorage: true,
    slaGuarantee: true,
    hasMentors: true,
    hasInvoices: true,
  },
};

export const usePlanLimits = () => {
  // Primary source: useTenantStore (typed tier)
  const currentTenant = useTenantStore((state) => state.currentTenant);
  // Fallback: AppContext activeTenant (raw DB plan string)
  const { activeTenant } = useApp();

  // Resolve tier: TenantStore first, AppContext as fallback
  const tier: PlanTier = currentTenant?.tier
    ? currentTenant.tier
    : planToTier(activeTenant?.plan);

  const features = TIER_FEATURES[tier] || TIER_FEATURES.starter;

  // UniCoin: enabled via tenant config module (not just tier-based)
  const tenantModules = (activeTenant?.config?.modules ?? {}) as Record<string, boolean>;
  const tenantFeatures = (activeTenant?.config?.features ?? {}) as Record<string, boolean>;
  const hasUniCoins = !!(tenantModules.unicoin || tenantFeatures.unicoin);

  // API access: plan-based OR tenant config override
  const hasApiAccess = features.apiAccess || !!(tenantModules.api || tenantFeatures.api_access);

  // Backward-compat `plan` string in DB/display format
  const plan: string =
    tier === 'growth' ? 'Pro' :
    tier === 'enterprise' ? 'Enterprise' :
    'Starter';

  return {
    tier,
    features,
    // Backward compat: plan in DB format ('Starter' | 'Pro' | 'Enterprise')
    plan,
    // Legacy compat: limits object
    limits: {
      maxStaff: features.maxStaff,
      maxBranches: features.maxBranches,
      features: {
        aiSurveillance: features.aiSurveillance,
        barcodeSkaner: features.barcodeSkaner,
      },
    },
    // Convenience shortcuts
    hasMentors: features.hasMentors,
    hasInvoices: features.hasInvoices,
    hasUniCoins,
    hasApiAccess,
    // Quick staff cap shortcut (used by AdminUsers)
    maxStaff: features.maxStaff,
    // Check if a specific feature is gated (locked) for current tier
    isFeatureGated: (f: keyof TierFeatures) => {
      const val = features[f];
      if (typeof val === 'boolean') return !val;
      return false;
    },
    // Quota checks
    canAddStaff: (currentCount: number) => currentCount < features.maxStaff,
    canAddBranch: (currentCount: number) => currentCount < features.maxBranches,
  };
};
