import { usePlanLimits } from './usePlanLimits';

export type BusinessMode = 'unicoin' | 'paid';

/**
 * Hook to check the business mode (unicoin or paid) for the current tenant.
 * Determined automatically by the tenant's plan limits.
 */
export function useBusinessMode() {
  const { hasUniCoins } = usePlanLimits();
  const mode: BusinessMode = hasUniCoins ? 'unicoin' : 'paid';

  return {
    mode,
    isUniCoin: hasUniCoins,
    isPaid: !hasUniCoins,
    loading: false,
  };
}
