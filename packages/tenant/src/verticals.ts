import type { BusinessVertical, Tenant } from './types';
import type { TenantRow } from '@unipath/db';

// ---------------------------------------------------------------------------
// This platform serves consulting agencies only. `mapTenant` therefore always
// resolves to `consulting`; the helpers below are kept so callers have a single
// place to read the vertical from.
// ---------------------------------------------------------------------------

export const VERTICAL_DETECT_ORDER: BusinessVertical[] = ['consulting'];

/** Every tenant is a consulting agency. */
export function detectVerticalFromModules(
  _modules: Record<string, boolean | undefined> = {}
): BusinessVertical {
  return 'consulting';
}

/** Map a raw DB tenant row (or impersonation payload) to a typed Tenant. */
export function mapTenant(data: TenantRow & Record<string, unknown>): Tenant {
  return {
    id: data.id,
    name: data.name,
    subdomain: data.subdomain,
    custom_domain: data.custom_domain,
    business_type: 'consulting',
    config: data.config,
    created_at: data.created_at,
    updated_at: data.updated_at ?? null,
    status: data.status,
    plan: data.plan,
    owner_email: data.owner_email,
    owner_name: data.owner_name,
    owner_phone: data.owner_phone,
    has_unicoin: data.has_unicoin,
  };
}

// ---------------------------------------------------------------------------
// Human-readable vertical label (uz / ru / en)
// ---------------------------------------------------------------------------

export const VERTICAL_LABELS: Record<BusinessVertical, { uz: string; ru: string; en: string }> = {
  consulting: { uz: 'Konsalting', ru: 'Консалтинг', en: 'Consulting' },
};
