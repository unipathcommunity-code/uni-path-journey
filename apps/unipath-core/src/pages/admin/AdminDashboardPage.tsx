import { useApp } from '@/contexts/AppContext';
import AdminTour from './AdminTour';
import AdminAcademy from './AdminAcademy';
import AdminHotel from './AdminHotel';
import AdminRestaurant from './AdminRestaurant';
import AdminGym from './AdminGym';
import AdminManufacturing from './AdminManufacturing';
import AdminClinic from './AdminClinic';
import AdminParking from './AdminParking';
import AdminAutoService from './AdminAutoService';
import AdminWeddingHall from './AdminWeddingHall';
import AdminKindergarten from './AdminKindergarten';
import AdminLibrary from './AdminLibrary';
import AdminCosmetics from './AdminCosmetics';
import AdminStadium from './AdminStadium';
import AdminCarShowroom from './AdminCarShowroom';
import AdminConsulting from './AdminConsulting';

export default function AdminDashboardPage() {
  const { activeTenant } = useApp();

  // ── VERTICAL DETECTION ──────────────────────────────────────────────────────
  const impersonatedTenantRaw = localStorage.getItem('active_tenant');
  const impersonatedTenant = impersonatedTenantRaw ? JSON.parse(impersonatedTenantRaw) : null;
  const effectiveTenant = impersonatedTenant || activeTenant;
  const activeModules = (effectiveTenant?.config?.modules ?? {}) as Record<string, boolean>;

  const VERTICAL_ORDER = [
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
    'consulting',
  ];

  const detectVertical = (modules: Record<string, boolean> = {}): string =>
    VERTICAL_ORDER.find((v) => modules[v] === true) ?? 'consulting';

  const rawVertical =
    (effectiveTenant as any)?.vertical ||
    effectiveTenant?.business_type ||
    effectiveTenant?.config?.business_type ||
    detectVertical(activeModules);

  let vertical = String(rawVertical || 'consulting').toLowerCase().trim();
  if (vertical === 'nova' || vertical === 'edu') vertical = 'academy';
  if (vertical === 'unitour' || vertical === 'tour_farm' || vertical === 'travel') vertical = 'tour';

  // ── ROUTE TO VERTICAL DASHBOARDS ────────────────────────────────────────────
  if (vertical === 'tour')          return <AdminTour />;
  if (vertical === 'academy')       return <AdminAcademy />;
  if (vertical === 'hotel')         return <AdminHotel />;
  if (vertical === 'restaurant')    return <AdminRestaurant />;
  if (vertical === 'gym')           return <AdminGym />;
  if (vertical === 'manufacturing') return <AdminManufacturing />;
  if (vertical === 'clinic')        return <AdminClinic />;
  if (vertical === 'parking')       return <AdminParking />;
  if (vertical === 'auto_service')  return <AdminAutoService />;
  if (vertical === 'wedding_hall')  return <AdminWeddingHall />;
  if (vertical === 'kindergarten')  return <AdminKindergarten />;
  if (vertical === 'library')       return <AdminLibrary />;
  if (vertical === 'cosmetics')     return <AdminCosmetics />;
  if (vertical === 'stadium')       return <AdminStadium />;
  if (vertical === 'car_showroom')  return <AdminCarShowroom />;

  // Default consulting dashboard fallback
  return <AdminConsulting />;
}

