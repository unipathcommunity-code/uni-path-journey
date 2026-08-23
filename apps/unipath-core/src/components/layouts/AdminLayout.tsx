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
  GraduationCap,
  Settings,
  Globe,
  Award,
  Bell,
  Briefcase,
  Home,
  CreditCard,
  Inbox,
  BarChart3,
  Lock,
  UserCheck,
  Plane,
  MapPin,
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

// ─── Consulting primary nav items ───────────────────────────────────────────
type NavItem = { icon: LucideIcon; label: string; href: string };

const CONSULTING_NAV: NavItem[] = [
  { icon: PieChart,      label: 'CRM Pipeline', href: '/admin/crm' },
  { icon: ClipboardList, label: 'Arizalar',      href: '/admin/applications' },
  { icon: FolderOpen,    label: 'Hujjatlar',     href: '/admin/documents' },
  { icon: GraduationCap, label: 'Talabalar',     href: '/admin/students' },
  { icon: Plane,         label: "Viza & Yo'l",  href: '/admin/arrival' },
  { icon: Award,         label: 'Grantlar',      href: '/admin/grants' },
];

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

  const staffLabel =
    language === 'ru' ? 'Сотрудники' : language === 'uz' ? 'Xodimlar' : 'Staff';

  const dashLabel =
    language === 'ru' ? 'Панель' : language === 'uz' ? 'Boshqaruv' : 'Dashboard';

  // ── Nav sections ────────────────────────────────────────────────────────────

  // 1. Always visible core items
  const coreItems = [
    { icon: LayoutDashboard, label: dashLabel,  href: '/admin/dashboard' },
    { icon: Users,           label: staffLabel, href: '/admin/users' },
  ];

  // 2. Consulting main module items
  const verticalItems = CONSULTING_NAV;

  // 3. Communication
  const commsItems = [
    { icon: Bell, label: language === 'ru' ? 'Объявления' : language === 'uz' ? "E'lonlar" : 'Announcements', href: '/admin/announcements' },
  ];

  // 4. Finance / HR
  const financeItems: { icon: typeof Receipt; label: string; href: string; locked: boolean }[] = [
    {
      icon: Receipt,
      label: language === 'ru' ? 'Бухгалтерия' : language === 'uz' ? 'Buxgalteriya' : 'Accounting',
      href: '/admin/accounting',
      locked: false,
    },
    {
      icon: CreditCard,
      label: language === 'ru' ? 'Платежи' : language === 'uz' ? "To'lovlar" : 'Payments',
      href: '/admin/payments',
      locked: false,
    },
  ];
  if (hasMentors) {
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
  const appsForSwitcher: AppEntry[] = [];

  // ── Render helpers ──────────────────────────────────────────────────────────

  const NavLink = ({ icon: Icon, label, href }: { icon: LucideIcon; label: string; href: string }) => {
    const isActive = location.pathname === href;
    return (
      <Link
        to={href}
        onClick={() => setSidebarOpen(false)}
        className={`
          group flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 text-sm
          ${isActive
            ? 'bg-primary/10 text-primary font-semibold'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }
        `}
      >
        <span className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-all duration-200
          ${isActive
            ? 'bg-gradient-to-br from-primary/80 to-primary text-white shadow-md shadow-primary/30 ring-1 ring-white/25'
            : 'bg-muted text-muted-foreground group-hover:bg-background group-hover:text-foreground'
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
    <div className={`text-[10px] font-bold px-4 pb-1 pt-2 uppercase tracking-wider text-muted-foreground/50`}>
      {children}
    </div>
  );

  return (
    <div className={`relative min-h-screen flex text-foreground`}>

      {/* Glassmorphism gradient-mesh backdrop (theme-tinted) */}
      <MeshBackground dark={false} />

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
          bg-card/70 border-r border-white/40 shadow-[1px_0_30px_-12px_hsl(240_50%_30%_/_0.25)]
        `}
        style={{ width: '268px' }}
      >
        <div className="flex flex-col h-full">

          {/* Brand header */}
          <div className={`flex items-center justify-between px-4 py-3 border-b border-border`}>
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
                    <p className={`font-semibold text-sm truncate leading-tight text-foreground`}>{activeTenant.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${tierBadge.cls}`}>
                        {tierBadge.label}
                      </span>
                      <span 
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded cursor-pointer transition-colors bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground`}
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
            <button className={`lg:hidden p-1.5 rounded-lg hover:bg-muted`} onClick={() => setSidebarOpen(false)}>
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
                  {language === 'ru' ? 'Бизнес' : language === 'uz' ? 'Biznes' : 'Business'}
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

            {/* Super Admin tools (impersonation mode) */}
            {isImpersonating && (
              <div className="pt-2">
                <SectionLabel>Super Admin</SectionLabel>
                {superAdminItems.map(item => <NavLink key={item.href} {...item} />)}
              </div>
            )}

          </nav>

          {/* Bottom: Settings + Logout */}
          <div className={`px-3 py-3 border-t border-border space-y-0.5`}>
            <NavLink icon={Settings} label={language === 'ru' ? 'Настройки' : language === 'uz' ? 'Sozlamalar' : 'Settings'} href="/admin/settings" />
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 text-muted-foreground hover:bg-destructive/10 hover:text-destructive`}
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
        <header className={`sticky top-0 z-30 backdrop-blur-2xl border-b bg-background/60 border-white/40 text-foreground`}>
          <div className="flex items-center justify-between h-14 px-4 md:px-6">
            <div className="flex items-center gap-3">
              <button
                className={`lg:hidden p-2 rounded-lg hover:bg-muted text-foreground`}
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className={`text-base font-semibold truncate leading-tight text-foreground`}>
                  {activeTenant?.name ?? t.adminDashboard}
                </h1>
                {activeBranch && (
                  <p className={`text-[11px] flex items-center gap-1 leading-tight text-muted-foreground`}>
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
                className={`lg:hidden p-2 rounded-lg transition-all text-muted-foreground hover:text-destructive hover:bg-destructive/10`}
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
