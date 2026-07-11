import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { useTenant, BranchSwitcher } from '@unipath/tenant';
import type { AppEntry } from '@unipath/tenant';
import { usePlanLimits, PlanTier } from '@/hooks/usePlanLimits';
import { useTranslation } from '@/lib/i18n';
import { Logo } from '@/components/Logo';
import { MeshBackground } from '@/components/MeshBackground';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useUserRole } from '@/hooks/useUserRole';
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  ClipboardList,
  Receipt,
  PieChart,
  Menu,
  X,
  LogOut,
  Shield,
  GraduationCap,
  Settings,
  Globe,
  Award,
  Bell,
  Briefcase,
  Home,
  CreditCard,
  Inbox,
  Bed,
  Pill,
  UtensilsCrossed,
  Dumbbell,
  Factory,
  Camera,
  Store,
  HeartPulse,
  Car,
  Wrench,
  Heart,
  Baby,
  BookOpen,
  Scissors,
  Trophy,
  BarChart3,
  Lock,
  UserCheck,
  Plane,
  MapPin,
  Calendar,
  Sparkles,
  LucideIcon,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

// ─── Tier badge appearance ────────────────────────────────────────────────────
const TIER_BADGE: Record<PlanTier, { label: string; cls: string }> = {
  starter:    { label: 'Starter',    cls: 'bg-sky-500/10 text-sky-400 border border-sky-500/20' },
  growth:     { label: 'Growth',     cls: 'bg-violet-500/10 text-violet-400 border border-violet-500/20' },
  enterprise: { label: 'Enterprise', cls: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
};

// ─── Business-vertical → primary nav items ───────────────────────────────────
type VerticalNavItem = { icon: LucideIcon; label: string; href: string };

const VERTICAL_NAV: Record<string, VerticalNavItem[]> = {
  consulting:    [
    { icon: PieChart,      label: 'CRM Pipeline', href: '/admin/crm' },
    { icon: ClipboardList, label: 'Arizalar',      href: '/admin/applications' },
    { icon: FolderOpen,    label: 'Hujjatlar',     href: '/admin/documents' },
    { icon: GraduationCap, label: 'Talabalar',     href: '/admin/students' },
    { icon: Plane,         label: 'Viza & Yo\'l',  href: '/admin/arrival' },
    { icon: Award,         label: 'Grantlar',      href: '/admin/grants' },
  ],
  academy:       [
    { icon: GraduationCap, label: 'Guruhlar & Davomat',    href: '/admin/academy' },
    { icon: BookOpen,      label: 'O\'qituvchilar',         href: '/admin/users' },
    { icon: ClipboardList, label: 'To\'lovlar & Hisobot',   href: '/admin/accounting' },
    { icon: Bell,          label: 'E\'lonlar',              href: '/admin/announcements' },
  ],
  tour:          [
    { icon: Plane,         label: 'Tur Paketlar',          href: '/admin/tour' },
    { icon: ClipboardList, label: 'Bronlar & Buyurtmalar',  href: '/admin/crm' },
    { icon: Users,         label: 'Agentlar & Xodimlar',   href: '/admin/users' },
    { icon: Receipt,       label: 'To\'lovlar',             href: '/admin/accounting' },
    { icon: Bell,          label: 'E\'lonlar',              href: '/admin/announcements' },
  ],
  gym:           [
    { icon: LayoutDashboard, label: 'Boshqaruv', href: '/admin/gym?tab=overview' },
    { icon: Calendar,        label: 'Jadval',     href: '/admin/gym?tab=schedule' },
    { icon: Users,           label: "A'zolar",    href: '/admin/gym?tab=members' },
    { icon: UserCheck,       label: 'Check-in',   href: '/admin/gym?tab=checkin' },
    { icon: ClipboardList,   label: 'Bronlar',    href: '/admin/gym?tab=bookings' },
    { icon: CreditCard,      label: 'Abonement',  href: '/admin/gym?tab=plans' },
    { icon: BarChart3,       label: 'Hisobot',    href: '/admin/gym?tab=reports' },
  ],
  hotel:         [
    { icon: LayoutDashboard, label: 'Boshqaruv',   href: '/admin/hotel?tab=overview' },
    { icon: Calendar,        label: 'Kalendar',     href: '/admin/hotel?tab=calendar' },
    { icon: ClipboardList,   label: 'Bronlar',      href: '/admin/hotel?tab=bookings' },
    { icon: Users,           label: 'Mehmonlar',    href: '/admin/hotel?tab=guests' },
    { icon: Sparkles,        label: 'Tozalash',     href: '/admin/hotel?tab=housekeeping' },
    { icon: Bed,             label: 'Xonalar',      href: '/admin/hotel?tab=rooms' },
    { icon: CreditCard,      label: 'Narxlar',      href: '/admin/hotel?tab=rates' },
    { icon: BarChart3,       label: 'Hisobotlar',   href: '/admin/hotel?tab=reports' },
  ],
  restaurant:    [
    { icon: LayoutDashboard, label: 'Boshqaruv',     href: '/admin/restaurant?tab=overview' },
    { icon: Receipt,         label: 'Buyurtma (POS)', href: '/admin/restaurant?tab=pos' },
    { icon: UtensilsCrossed, label: 'Oshxona (KDS)',  href: '/admin/restaurant?tab=kds' },
    { icon: CreditCard,      label: 'Kassa',          href: '/admin/restaurant?tab=cashier' },
    { icon: BookOpen,        label: 'Menyu',          href: '/admin/restaurant?tab=menu' },
    { icon: Store,           label: 'Stollar & QR',   href: '/admin/restaurant?tab=tables' },
    { icon: BarChart3,       label: 'Hisobotlar',     href: '/admin/restaurant?tab=reports' },
  ],
  clinic:        [
    { icon: HeartPulse,    label: 'Bemorlar',   href: '/admin/clinic' },
    { icon: ClipboardList, label: 'Qabullar',   href: '/admin/clinic' },
  ],
  pharmacy:      [
    { icon: Pill,          label: 'Mahsulotlar',href: '/admin/inventory' },
    { icon: ClipboardList, label: 'Buyurtmalar',href: '/admin/inventory' },
  ],
  manufacturing: [
    { icon: Factory,       label: 'Ishlab Chiqarish', href: '/admin/manufacturing' },
    { icon: Store,         label: 'Ombor',      href: '/admin/inventory' },
  ],
  parking:       [
    { icon: Car,           label: 'Joylar',     href: '/admin/parking' },
    { icon: ClipboardList, label: 'Bronlar',    href: '/admin/parking' },
  ],
  auto_service:  [
    { icon: Wrench,        label: 'Servis',     href: '/admin/auto-service' },
    { icon: ClipboardList, label: 'Buyurtmalar',href: '/admin/auto-service' },
  ],
  wedding_hall:  [
    { icon: LayoutDashboard, label: 'Boshqaruv',   href: '/admin/wedding-hall?tab=overview' },
    { icon: Calendar,        label: 'Kalendar',     href: '/admin/wedding-hall?tab=calendar' },
    { icon: ClipboardList,   label: 'Buyurtmalar',  href: '/admin/wedding-hall?tab=bookings' },
    { icon: CreditCard,      label: "To'lovlar",    href: '/admin/wedding-hall?tab=payments' },
    { icon: Heart,           label: 'Zallar',       href: '/admin/wedding-hall?tab=halls' },
    { icon: BarChart3,       label: 'Hisobotlar',   href: '/admin/wedding-hall?tab=reports' },
  ],
  kindergarten:  [
    { icon: Baby,          label: 'Bolalar',    href: '/admin/kindergarten' },
    { icon: ClipboardList, label: 'Qabullar',   href: '/admin/kindergarten' },
  ],
  library:       [
    { icon: BookOpen,      label: 'Kitoblar',   href: '/admin/library' },
    { icon: ClipboardList, label: 'Ro\'yxat',   href: '/admin/library' },
  ],
  cosmetics:     [
    { icon: Scissors,      label: 'Xizmatlar',  href: '/admin/cosmetics' },
    { icon: ClipboardList, label: 'Buyurtmalar',href: '/admin/cosmetics' },
  ],
  stadium:       [
    { icon: Trophy,        label: 'Maydon',     href: '/admin/stadium' },
    { icon: ClipboardList, label: 'Bronlar',    href: '/admin/stadium' },
  ],
};

// ─── Cross-app entries for BranchSwitcher ────────────────────────────────────
// Each vertical surfaces the relevant vertical-specific app module in the
// dropdown so operators can deep-link directly from the switcher.

function buildAppsForVertical(vertical: string, lang: string, tenantName?: string): AppEntry[] {
  if (vertical === 'academy') {
    return [
      {
        id: 'nova',
        icon: '🎓',
        label: tenantName || (lang === 'uz' ? 'O\'quv Markazi' : lang === 'ru' ? 'Учебный Центр' : 'Academy'),
        href: '/admin/academy',
      },
    ];
  }
  if (vertical === 'tour') {
    return [
      {
        id: 'unitour',
        icon: '✈️',
        label: tenantName || (lang === 'uz' ? 'Turizm Boshqaruvi' : lang === 'ru' ? 'Управление турами' : 'Tour Management'),
        href: '/admin/tour',
      },
    ];
  }
  return [];
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { language } = useApp();
  const { activeTenant, activeBranch, isImpersonating, endImpersonation } = useTenant();
  const { tier, features, hasMentors, hasInvoices } = usePlanLimits();
  const t = useTranslation(language);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAccountant } = useUserRole();

  // Vertical is already resolved by mapTenant() inside TenantProvider
  const vertical = (activeTenant?.business_type as string) || 'consulting';
  const tierBadge = TIER_BADGE[tier] || TIER_BADGE.starter;

  const handleSignOut = async () => {
    try {
      localStorage.removeItem('active_tenant');
      await Promise.race([
        signOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 1000))
      ]);
    } catch (e) {
      console.warn("Sign out failed or timed out:", e);
      if (typeof window !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
            localStorage.removeItem(key);
          }
        }
      }
    } finally {
      // Hard-reload — subdomain tenant qayta resolve bo'ladi
      // va TenantPublicPage (biznes bosh sahifasi) ko'rsatiladi
      window.location.href = '/';
    }
  };

  // ── Vertical-aware labels ───────────────────────────────────────────────────
  const isAcademy = vertical === 'academy';
  const isTour    = vertical === 'tour';

  const staffLabel =
    isAcademy
      ? (language === 'ru' ? 'Учителя & Персонал' : language === 'uz' ? 'O\'qituvchilar' : 'Teachers')
      : isTour
      ? (language === 'ru' ? 'Агенты & Персонал' : language === 'uz' ? 'Agentlar' : 'Agents')
      : (language === 'ru' ? 'Сотрудники' : language === 'uz' ? 'Xodimlar' : 'Staff');

  const dashLabel =
    language === 'ru' ? 'Панель' : language === 'uz' ? 'Boshqaruv' : 'Dashboard';

  // ── Nav sections ────────────────────────────────────────────────────────────

  // 1. Always visible core items
  let coreItems = [
    { icon: LayoutDashboard, label: dashLabel,  href: '/admin/dashboard' },
    { icon: Users,           label: staffLabel, href: '/admin/users' },
  ];

  // 2. Vertical-specific main module items
  let verticalItems = VERTICAL_NAV[vertical] ?? VERTICAL_NAV.consulting;

  if (isAcademy) {
    coreItems = [{ icon: LayoutDashboard, label: dashLabel, href: '/admin/dashboard' }];
    verticalItems = [
      { icon: GraduationCap, label: language === 'uz' ? 'Guruhlar & Davomat' : language === 'ru' ? 'Группы & Посещаемость' : 'Groups & Attendance', href: '/admin/dashboard' },
      { icon: Users,         label: language === 'uz' ? "O'qituvchilar"       : language === 'ru' ? 'Учителя & Персонал'        : 'Teachers & Staff',   href: '/admin/users' },
      { icon: ClipboardList, label: language === 'uz' ? "To'lovlar & Hisobot" : language === 'ru' ? 'Оплаты & Отчётность'       : 'Payments & Reports', href: '/admin/accounting' },
      { icon: Bell,          label: language === 'uz' ? "E'lonlar"            : language === 'ru' ? 'Объявления'                : 'Announcements',      href: '/admin/announcements' },
    ];
  } else if (isTour) {
    coreItems = [{ icon: LayoutDashboard, label: dashLabel, href: '/admin/dashboard' }];
    verticalItems = [
      { icon: Plane,         label: language === 'uz' ? 'Tur Paketlar'          : language === 'ru' ? 'Тур-пакеты'            : 'Tour Packages',      href: '/admin/dashboard' },
      { icon: ClipboardList, label: language === 'uz' ? 'Bronlar & Buyurtmalar' : language === 'ru' ? 'Бронирования'          : 'Bookings',           href: '/admin/crm' },
      { icon: UserCheck,     label: language === 'uz' ? 'Lidlar (CRM)'          : language === 'ru' ? 'Лиды (CRM)'            : 'Leads (CRM)',        href: '/admin/crm' },
      { icon: Users,         label: language === 'uz' ? 'Agentlar & Xodimlar'   : language === 'ru' ? 'Агенты & Персонал'     : 'Agents & Staff',     href: '/admin/users' },
      { icon: Receipt,       label: language === 'uz' ? "To'lovlar & Moliya"    : language === 'ru' ? 'Финансы'               : 'Finance',            href: '/admin/accounting' },
      { icon: Globe,         label: language === 'uz' ? 'Viza & Hujjatlar'      : language === 'ru' ? 'Виза & Документы'      : 'Visa & Docs',        href: '/admin/dashboard' },
      { icon: Bell,          label: language === 'uz' ? "E'lonlar"              : language === 'ru' ? 'Объявления'            : 'Announcements',      href: '/admin/announcements' },
    ];
  }
  const verticalHasAnnouncements = isAcademy || isTour;

  // 3. Communication (only for verticals that don't inline it)
  const commsItems = verticalHasAnnouncements
    ? []
    : [{ icon: Bell, label: language === 'ru' ? 'Объявления' : language === 'uz' ? 'E\'lonlar' : 'Announcements', href: '/admin/announcements' }];

  // 4. Finance / HR — consulting always shows finance; others plan-gated
  const financeItems: { icon: typeof Receipt; label: string; href: string; locked: boolean }[] = [];
  const isConsulting = !isAcademy && !isTour;
  if (isConsulting) {
    // Consulting vertikali uchun Buxgalteriya va To'lovlar har doim ko'rinadi
    financeItems.push({
      icon: Receipt,
      label: language === 'ru' ? 'Бухгалтерия' : language === 'uz' ? 'Buxgalteriya' : 'Accounting',
      href: '/admin/accounting',
      locked: false,
    });
    financeItems.push({
      icon: CreditCard,
      label: language === 'ru' ? 'Платежи' : language === 'uz' ? 'To\'lovlar' : 'Payments',
      href: '/admin/payments',
      locked: false,
    });
  }
  if (hasMentors && vertical === 'consulting') {
    financeItems.push({
      icon: UserCheck,
      label: language === 'ru' ? 'Менторы' : language === 'uz' ? 'Mentorlar' : 'Mentors',
      href: '/admin/mentors',
      locked: false,
    });
  }

  // 5. Advanced features — show always but lock for Starter
  const advancedItems = [
    {
      icon: BarChart3,
      label: language === 'ru' ? 'Аналитика' : language === 'uz' ? 'Tahlil' : 'Analytics',
      href: '/admin/analytics',
      locked: !features.advancedAnalytics,
      badge: 'Growth',
    },
    {
      icon: Camera,
      label: language === 'ru' ? 'AI Камеры' : language === 'uz' ? 'AI Kameralar' : 'AI Cameras',
      href: '/admin/cameras',
      locked: !features.aiCamera,
      badge: 'Growth',
    },
  ];

  // 6. Super Admin tools (impersonation mode only)
  const superAdminItems = [
    { icon: Globe,         label: t.adminCountries || 'Countries',     href: '/admin/countries' },
    { icon: GraduationCap,label: t.adminUniversities || 'Universities',href: '/admin/universities' },
    { icon: Award,         label: t.adminGrants || 'Grants',           href: '/admin/grants' },
    { icon: Briefcase,     label: t.adminJobs || 'Jobs',               href: '/admin/jobs' },
    { icon: Home,          label: t.adminHousing || 'Housing',         href: '/admin/housing' },
    { icon: Inbox,         label: t.adminContactRequests || 'Messages', href: '/admin/contact-requests' },
  ];

  const isRestrictedRole = isAccountant;

  // ── Cross-app entries for BranchSwitcher ─────────────────────────────────
  const appsForSwitcher = buildAppsForVertical(vertical, language, activeTenant?.name);

  // ── Render helpers ──────────────────────────────────────────────────────────

  const NavLink = ({ icon: Icon, label, href }: { icon: LucideIcon; label: string; href: string }) => {
    const isActive = location.pathname === href;
    const isDarkTheme = isAcademy || isTour;
    return (
      <Link
        to={href}
        onClick={() => setSidebarOpen(false)}
        className={`
          group flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 text-sm
          ${isActive
            ? (isDarkTheme ? 'bg-white/10 text-white font-semibold' : 'bg-primary/10 text-primary font-semibold')
            : (isDarkTheme ? 'text-white/60 hover:bg-white/5 hover:text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground')
          }
        `}
      >
        <span className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-all duration-200
          ${isActive
            ? 'bg-gradient-to-br from-primary/80 to-primary text-white shadow-md shadow-primary/30 ring-1 ring-white/25'
            : (isDarkTheme ? 'bg-white/5 text-white/70 group-hover:bg-white/10' : 'bg-muted text-muted-foreground group-hover:bg-background group-hover:text-foreground')
          }`}>
          <Icon className="w-4 h-4" />
        </span>
        <span className="truncate">{label}</span>
      </Link>
    );
  };

  const LockedNavItem = ({ icon: Icon, label, badge }: { icon: LucideIcon; label: string; badge: string }) => (
    <div className="flex items-center justify-between px-3 py-2 rounded-xl text-sm text-muted-foreground/40 cursor-not-allowed select-none">
      <div className="flex items-center gap-3">
        <span className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 bg-muted/50">
          <Icon className="w-4 h-4 shrink-0" />
        </span>
        <span className="truncate">{label}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Lock className="w-3 h-3" />
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 font-medium">{badge}</span>
      </div>
    </div>
  );

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div className={`text-[10px] font-bold px-4 pb-1 pt-2 uppercase tracking-wider ${isAcademy || isTour ? 'text-white/30' : 'text-muted-foreground/50'}`}>
      {children}
    </div>
  );

  return (
    <div className={`relative min-h-screen flex ${isAcademy || isTour ? 'text-white dark' : 'text-foreground'}`}>

      {/* Glassmorphism gradient-mesh backdrop (theme-tinted) */}
      <MeshBackground dark={isAcademy || isTour} />

      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="fixed top-0 left-0 w-full z-[60] bg-amber-500 text-black text-center text-xs font-bold py-1">
          {t.adminImpersonationAlert} {activeTenant?.name}.
          <button
            className="ml-4 underline hover:text-white"
            onClick={endImpersonation}
          >
            {t.adminReturnToSuperAdmin}
          </button>
        </div>
      )}

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen w-68
          transform transition-transform duration-300 lg:transform-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          backdrop-blur-2xl
          ${isAcademy || isTour ? 'bg-[#09090b]/80 text-white border-r border-white/10 dark' : 'bg-card/70 border-r border-white/40 shadow-[1px_0_30px_-12px_hsl(240_50%_30%_/_0.25)]'}
        `}
        style={{ width: '268px' }}
      >
        <div className="flex flex-col h-full">

          {/* Brand header */}
          <div className={`flex items-center justify-between px-4 py-3 border-b ${isAcademy || isTour ? 'border-white/10' : 'border-border'}`}>
            <div className="flex items-center gap-2 min-w-0">
              {activeTenant ? (
                <>
                  {activeTenant.config?.branding?.logo_url ? (
                    <img src={activeTenant.config.branding.logo_url} alt={activeTenant.name} className="h-7 w-7 rounded-lg object-contain shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                      {activeTenant.name?.charAt(0)?.toUpperCase() || 'T'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className={`font-semibold text-sm truncate leading-tight ${isAcademy || isTour ? 'text-white' : 'text-foreground'}`}>{activeTenant.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${tierBadge.cls}`}>
                        {tierBadge.label}
                      </span>
                      <span 
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded cursor-pointer transition-colors ${isAcademy || isTour ? 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'}`}
                        onClick={() => {
                          navigator.clipboard.writeText(activeTenant.id);
                          alert('Business ID (Tenant ID) nusxalandi: ' + activeTenant.id);
                        }}
                        title="Nusxa olish uchun bosing"
                      >
                        ID: {activeTenant.id.substring(0, 8)}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Logo size="sm" />
                  <span className="px-2 py-1 bg-destructive/10 text-destructive text-xs font-medium rounded">Admin</span>
                </>
              )}
            </div>
            <button className={`lg:hidden p-1.5 rounded-lg ${isAcademy || isTour ? 'hover:bg-white/5' : 'hover:bg-muted'}`} onClick={() => setSidebarOpen(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Branch + App switcher — shared component from @unipath/tenant */}
          {activeTenant && (
            <div className="pt-2 px-0">
              <BranchSwitcher
                lang={language as 'uz' | 'ru' | 'en'}
                apps={appsForSwitcher}
                onNavigate={(href) => { navigate(href); setSidebarOpen(false); }}
                showVertical={true}
                className="mx-3 mb-2"
              />
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">

            {/* Core */}
            <SectionLabel>{language === 'ru' ? 'Главное' : language === 'uz' ? 'Asosiy' : 'Main'}</SectionLabel>
            {coreItems.map(item => <NavLink key={item.href} {...item} />)}

            {/* Business vertical section — hidden for restricted roles (accountant) */}
            {!isRestrictedRole && (
              <div className="pt-2">
                <SectionLabel>
                  {isAcademy
                    ? (language === 'ru' ? 'Учебный центр' : language === 'uz' ? 'O\'quv Markaz' : 'Academy')
                    : isTour
                    ? (language === 'ru' ? 'Тур агентство' : language === 'uz' ? 'Tur Agentlik' : 'Tour Agency')
                    : (language === 'ru' ? 'Бизнес' : language === 'uz' ? 'Biznes' : 'Business')}
                </SectionLabel>
                {verticalItems.map(item => <NavLink key={item.href} {...item} />)}
              </div>
            )}

            {/* Communication — hidden for accountant */}
            {!isRestrictedRole && (
              <div className="pt-2">
                {commsItems.map(item => <NavLink key={item.href} {...item} />)}
              </div>
            )}

            {/* Finance / HR (if plan allows) */}
            {financeItems.length > 0 && (
              <div className="pt-2">
                <SectionLabel>
                  {language === 'ru' ? 'Финансы & HR' : language === 'uz' ? 'Moliya & HR' : 'Finance & HR'}
                </SectionLabel>
                {financeItems.map(item => <NavLink key={item.href} icon={item.icon} label={item.label} href={item.href} />)}
              </div>
            )}

            {/* Advanced (AI / Analytics) — visible but locked for Starter; hidden for accountant */}
            {!isRestrictedRole && <div className="pt-2">
              <SectionLabel>
                {language === 'ru' ? 'Расширенные' : language === 'uz' ? 'Kengaytirilgan' : 'Advanced'}
              </SectionLabel>
              {advancedItems.map(item =>
                item.locked
                  ? <LockedNavItem key={item.href} icon={item.icon} label={item.label} badge={item.badge} />
                  : <NavLink key={item.href} icon={item.icon} label={item.label} href={item.href} />
              )}
            </div>}

            {/* Super Admin tools (impersonation mode + consulting vertical) */}
            {isImpersonating && vertical === 'consulting' && (
              <div className="pt-2">
                <SectionLabel>Super Admin</SectionLabel>
                {superAdminItems.map(item => <NavLink key={item.href} {...item} />)}
              </div>
            )}

          </nav>

          {/* Bottom: Settings + Logout */}
          <div className={`px-3 py-3 border-t ${isAcademy || isTour ? 'border-white/10' : 'border-border'} space-y-0.5`}>
            <NavLink icon={Settings} label={language === 'ru' ? 'Настройки' : language === 'uz' ? 'Sozlamalar' : 'Settings'} href="/admin/settings" />
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${isAcademy || isTour ? 'text-white/60 hover:bg-white/5 hover:text-rose-400' : 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive'}`}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>{t.adminLogout}</span>
            </button>
          </div>

        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className={`sticky top-0 z-30 backdrop-blur-2xl border-b ${isAcademy || isTour ? 'bg-[#09090b]/70 border-white/10 text-white dark' : 'bg-background/60 border-white/40 text-foreground'}`}>
          <div className="flex items-center justify-between h-14 px-4 md:px-6">
            <div className="flex items-center gap-3">
              <button
                className={`lg:hidden p-2 rounded-lg ${isAcademy || isTour ? 'hover:bg-white/5 text-white' : 'hover:bg-muted text-foreground'}`}
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className={`text-base font-semibold truncate leading-tight ${isAcademy || isTour ? 'text-white' : 'text-foreground'}`}>
                  {activeTenant?.name ?? t.adminDashboard}
                </h1>
                {activeBranch && (
                  <p className={`text-[11px] flex items-center gap-1 leading-tight ${isAcademy || isTour ? 'text-white/60' : 'text-muted-foreground'}`}>
                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{activeBranch.name}{activeBranch.city ? ` · ${activeBranch.city}` : ''}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <button
                onClick={handleSignOut}
                className={`lg:hidden p-2 rounded-lg transition-all ${isAcademy || isTour ? 'text-white/60 hover:text-rose-400 hover:bg-white/5' : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'}`}
                title={t.adminLogout || 'Log Out'}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>

    </div>
  );
}
