import { lazy, Suspense } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Loader2 } from 'lucide-react';

const AdminTour = lazy(() => import('./AdminTour'));
const AdminAcademy = lazy(() => import('./AdminAcademy'));
const AdminHotel = lazy(() => import('./AdminHotel'));
const AdminRestaurant = lazy(() => import('./AdminRestaurant'));
const AdminGym = lazy(() => import('./AdminGym'));
const AdminManufacturing = lazy(() => import('./AdminManufacturing'));
const AdminClinic = lazy(() => import('./AdminClinic'));
const AdminParking = lazy(() => import('./AdminParking'));
const AdminAutoService = lazy(() => import('./AdminAutoService'));
const AdminWeddingHall = lazy(() => import('./AdminWeddingHall'));
const AdminKindergarten = lazy(() => import('./AdminKindergarten'));
const AdminLibrary = lazy(() => import('./AdminLibrary'));
const AdminCosmetics = lazy(() => import('./AdminCosmetics'));
const AdminStadium = lazy(() => import('./AdminStadium'));
const AdminCarShowroom = lazy(() => import('./AdminCarShowroom'));
const AdminInventory = lazy(() => import('./AdminInventory'));
const AdminWholesale = lazy(() => import('./AdminWholesale'));
const AdminConsulting = lazy(() => import('./AdminConsulting'));

const DashboardLoader = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

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
  const renderDashboard = () => {
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
    if (vertical === 'pharmacy')      return <AdminInventory />;
    if (vertical === 'wholesale')     return <AdminWholesale />;

    return <AdminConsulting />;
  };

  return (
    <Suspense fallback={<DashboardLoader />}>
      {renderDashboard()}
    </Suspense>
  );
}


