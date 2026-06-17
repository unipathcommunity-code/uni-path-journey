import React, { ReactNode } from 'react';
import { usePlanLimits } from './usePlanLimits';
import type { TierFeatures, PlanTier } from './plan';

// ---------------------------------------------------------------------------
// PlanGate — declarative feature-gating component
// ---------------------------------------------------------------------------

export interface PlanGateProps {
  /**
   * A boolean feature key from TierFeatures to check.
   * e.g. feature="telegramBot" hides children on the Starter plan.
   */
  feature?: keyof TierFeatures;
  /**
   * Minimum tier required (inclusive).
   * e.g. minTier="growth" shows children for growth + enterprise only.
   */
  minTier?: PlanTier;
  /** Rendered when the feature is NOT available. Defaults to null. */
  fallback?: ReactNode;
  children: ReactNode;
}

const TIER_ORDER: Record<PlanTier, number> = {
  starter: 0,
  growth: 1,
  enterprise: 2,
};

/**
 * Conditionally renders children based on the active tenant's plan tier.
 *
 * Examples:
 *   <PlanGate feature="telegramBot">...</PlanGate>
 *   <PlanGate minTier="enterprise" fallback={<UpgradeBanner />}>...</PlanGate>
 *   <PlanGate feature="advancedAnalytics" minTier="growth">...</PlanGate>
 */
export function PlanGate({ feature, minTier, fallback = null, children }: PlanGateProps) {
  const { features, tier } = usePlanLimits();

  // Check boolean feature flag
  if (feature !== undefined) {
    const val = features[feature];
    if (typeof val === 'boolean' && !val) return <>{fallback}</>;
  }

  // Check minimum tier
  if (minTier !== undefined) {
    if (TIER_ORDER[tier] < TIER_ORDER[minTier]) return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// UpgradeBadge — inline "Upgrade to Growth" hint for locked features
// ---------------------------------------------------------------------------

export interface UpgradeBadgeProps {
  requiredTier?: PlanTier;
  className?: string;
}

export function UpgradeBadge({ requiredTier = 'growth', className = '' }: UpgradeBadgeProps) {
  const tierLabel = requiredTier === 'enterprise' ? 'Enterprise' : 'Growth';
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
        'bg-amber-500/15 text-amber-400 border border-amber-500/30',
        className,
      ].join(' ')}
    >
      {tierLabel}+
    </span>
  );
}

// ---------------------------------------------------------------------------
// withPlanGate — HOC variant for class/function component wrapping
// ---------------------------------------------------------------------------

export function withPlanGate<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  gateProps: Omit<PlanGateProps, 'children'>
) {
  return function GatedComponent(props: P) {
    return (
      <PlanGate {...gateProps}>
        <WrappedComponent {...props} />
      </PlanGate>
    );
  };
}
