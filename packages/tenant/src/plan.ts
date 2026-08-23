// ---------------------------------------------------------------------------
// Plan tiers and feature entitlements
// ---------------------------------------------------------------------------

export type PlanTier = 'starter' | 'growth' | 'enterprise';

export interface TierFeatures {
  // Capacity caps
  maxStaff: number;
  maxBranches: number;
  // Core features (starter+)
  barcodeSkaner: boolean;
  hasInvoices: boolean;
  // Growth+ features
  telegramBot: boolean;
  advancedAnalytics: boolean;
  aiCamera: boolean;
  aiSurveillance: boolean;
  allModules: boolean;
  multipleThemes: boolean;
  cloudStorage: '5GB' | '50GB' | 'Unlimited';
  apiAccess: boolean;
  hasMentors: boolean;
  // Enterprise-only features
  customDomain: boolean;
  aiSecurity: boolean;
  dataIsolation: boolean;
  prioritySupport: boolean;
  unlimitedStorage: boolean;
  slaGuarantee: boolean;
}

/** Map a raw DB plan string to the internal PlanTier key. */
export function planToTier(plan: string | null | undefined): PlanTier {
  const p = (plan ?? '').toLowerCase().trim();
  if (!p) return 'starter';

  // Plan names in `pricing_plans` are full product names — "Consulting Pro",
  // "Consulting Premium", "Office Enterprise" — not the bare tier words. Exact
  // matching sent every paying agency to the Starter tier and silently capped
  // them at 3 staff and 1 branch, so match on the keyword instead.
  // Order matters: check the top tier first.
  if (p.includes('enterprise') || p.includes('premium') || p.includes('unlimited')) {
    return 'enterprise';
  }
  if (p.includes('pro') || p.includes('growth') || p.includes('business')) {
    return 'growth';
  }
  return 'starter';
}

/** Convert an internal tier back to the DB/display plan string. */
export function tierToPlan(tier: PlanTier): string {
  if (tier === 'growth') return 'Pro';
  if (tier === 'enterprise') return 'Enterprise';
  return 'Starter';
}

export const TIER_FEATURES: Record<PlanTier, TierFeatures> = {
  starter: {
    maxStaff: 3,
    maxBranches: 1,
    barcodeSkaner: true,
    hasInvoices: true,
    telegramBot: false,
    advancedAnalytics: false,
    aiCamera: false,
    aiSurveillance: false,
    allModules: false,
    multipleThemes: false,
    cloudStorage: '5GB',
    apiAccess: false,
    hasMentors: false,
    customDomain: false,
    aiSecurity: false,
    dataIsolation: false,
    prioritySupport: false,
    unlimitedStorage: false,
    slaGuarantee: false,
  },
  growth: {
    maxStaff: 25,
    maxBranches: 5,
    barcodeSkaner: true,
    hasInvoices: true,
    telegramBot: true,
    advancedAnalytics: true,
    aiCamera: true,
    aiSurveillance: true,
    allModules: true,
    multipleThemes: true,
    cloudStorage: '50GB',
    apiAccess: true,
    hasMentors: true,
    customDomain: false,
    aiSecurity: false,
    dataIsolation: false,
    prioritySupport: false,
    unlimitedStorage: false,
    slaGuarantee: false,
  },
  enterprise: {
    maxStaff: Infinity,
    maxBranches: Infinity,
    barcodeSkaner: true,
    hasInvoices: true,
    telegramBot: true,
    advancedAnalytics: true,
    aiCamera: true,
    aiSurveillance: true,
    allModules: true,
    multipleThemes: true,
    cloudStorage: 'Unlimited',
    apiAccess: true,
    hasMentors: true,
    customDomain: true,
    aiSecurity: true,
    dataIsolation: true,
    prioritySupport: true,
    unlimitedStorage: true,
    slaGuarantee: true,
  },
};
