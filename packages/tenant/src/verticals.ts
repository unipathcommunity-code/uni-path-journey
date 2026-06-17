import type { BusinessVertical, Tenant } from './types';
import type { TenantRow } from '@unipath/db';

// ---------------------------------------------------------------------------
// Vertical detection order
// CRITICAL: `consulting` must always be LAST — it is the fallback, not a primary.
// ---------------------------------------------------------------------------

export const VERTICAL_DETECT_ORDER: BusinessVertical[] = [
  'tour',
  'academy',
  'hotel',
  'restaurant',
  'clinic',
  'gym',
  'manufacturing',
  'parking',
  'auto_service',
  'wholesale',
  'wedding_hall',
  'kindergarten',
  'library',
  'cosmetics',
  'stadium',
  'pharmacy',
  'car_showroom',
  'consulting', // ← MUST remain last
];

/**
 * Scan the tenant's `config.modules` boolean flags to infer vertical.
 * Returns 'consulting' if no flag matches.
 */
export function detectVerticalFromModules(
  modules: Record<string, boolean | undefined> = {}
): BusinessVertical {
  return (
    VERTICAL_DETECT_ORDER.find((v) => modules[v] === true) ?? 'consulting'
  );
}

/** Normalize raw vertical/alias strings to the canonical BusinessVertical. */
function normalizeVertical(raw: string): BusinessVertical {
  const v = raw.toLowerCase().trim();
  if (v === 'nova' || v === 'edu') return 'academy';
  if (v === 'unitour' || v === 'tour_farm' || v === 'travel') return 'tour';
  if (VERTICAL_DETECT_ORDER.includes(v as BusinessVertical)) return v as BusinessVertical;
  return 'consulting';
}

/**
 * Map a raw DB tenant row (or impersonation payload) to a typed Tenant.
 *
 * Priority chain (do NOT reorder):
 *   1. data.vertical          — DB enum column (most authoritative)
 *   2. data.business_type     — Already-mapped objects (SuperAdmin impersonation)
 *   3. data.config.business_type — JSONB config field (set at registration)
 *   4. detectVerticalFromModules — scan config.modules boolean flags
 */
export function mapTenant(data: TenantRow & Record<string, unknown>): Tenant {
  const config = data.config as Record<string, unknown> | null;
  const rawVertical =
    (data.vertical as string | null) ||
    (data.business_type as string | null) ||
    (config?.business_type as string | null) ||
    detectVerticalFromModules(
      ((config?.modules ?? {}) as Record<string, boolean | undefined>)
    );

  const businessType = normalizeVertical(rawVertical || 'consulting');

  return {
    id: data.id,
    name: data.name,
    subdomain: data.subdomain,
    custom_domain: data.custom_domain,
    business_type: businessType,
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
// Human-readable vertical labels (uz / ru / en)
// ---------------------------------------------------------------------------

export const VERTICAL_LABELS: Record<BusinessVertical, { uz: string; ru: string; en: string }> = {
  tour: { uz: 'Turizm', ru: 'Туризм', en: 'Tourism' },
  academy: { uz: 'Ta\'lim', ru: 'Образование', en: 'Academy' },
  hotel: { uz: 'Mehmonxona', ru: 'Отель', en: 'Hotel' },
  restaurant: { uz: 'Restoran', ru: 'Ресторан', en: 'Restaurant' },
  clinic: { uz: 'Klinika', ru: 'Клиника', en: 'Clinic' },
  gym: { uz: 'Sport zali', ru: 'Спортзал', en: 'Gym' },
  manufacturing: { uz: 'Ishlab chiqarish', ru: 'Производство', en: 'Manufacturing' },
  parking: { uz: 'Avtoturargoh', ru: 'Парковка', en: 'Parking' },
  auto_service: { uz: 'Avtoseryiz', ru: 'Автосервис', en: 'Auto Service' },
  wholesale: { uz: 'Optom savdo', ru: 'Оптовая торговля', en: 'Wholesale' },
  wedding_hall: { uz: 'To\'yxona', ru: 'Банкетный зал', en: 'Wedding Hall' },
  kindergarten: { uz: 'Bog\'cha', ru: 'Детский сад', en: 'Kindergarten' },
  library: { uz: 'Kutubxona', ru: 'Библиотека', en: 'Library' },
  cosmetics: { uz: 'Kosmetika', ru: 'Косметика', en: 'Cosmetics' },
  stadium: { uz: 'Stadion', ru: 'Стадион', en: 'Stadium' },
  pharmacy: { uz: 'Dorixona', ru: 'Аптека', en: 'Pharmacy' },
  car_showroom: { uz: 'Avtosalon', ru: 'Автосалон', en: 'Car Showroom' },
  consulting: { uz: 'Konsalting', ru: 'Консалтинг', en: 'Consulting' },
};
