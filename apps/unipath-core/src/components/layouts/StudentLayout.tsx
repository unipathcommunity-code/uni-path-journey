import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp, type SelectedCountry } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useTranslation } from '@/lib/i18n';
import { Logo } from '@/components/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { UniAIChat } from '@/components/UniAIChat';
import { SpinWheel } from '@/components/SpinWheel';
import { useBusinessMode } from '@/hooks/useBusinessMode';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';
import { GlobalSearch } from '@/components/GlobalSearch';
import { supabase } from '@/integrations/supabase/client';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { IdentityGateModal } from '@/components/IdentityGateModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

import { MobileBottomNav } from '@/components/MobileBottomNav';
import {
  Home,
  FileText,
  Plane,
  User,
  Menu,
  X,
  LogOut,
  GraduationCap,
  FolderOpen,
  Shield,
  Award,
  Briefcase,
  Building,
  ChevronDown,
  Globe,
  Search,
  Users,
} from 'lucide-react';

interface StudentLayoutProps {
  children: React.ReactNode;
}
function CountrySwitcher() {
  const { language, selectedCountry, setSelectedCountry } = useApp();
  const [open, setOpen] = useState(false);
  const [countries, setCountries] = useState<SelectedCountry[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase
        .from('countries')
        .select('id, name, name_uz, name_ru, flag, image_url, avg_tuition')
        .eq('is_active', true)
        .order('display_order');
      if (data) setCountries(data as unknown as SelectedCountry[]);
    })();
  }, [open]);

  const displayName = (c: SelectedCountry) =>
    language === 'uz' ? c.name_uz || c.name :
    language === 'ru' ? c.name_ru || c.name : c.name;

  const studyingInLabel = language === 'uz' ? "O'qish davlati" : language === 'ru' ? 'Страна обучения' : 'Studying in';
  const changeLabel = language === 'uz' ? "O'zgartirish" : language === 'ru' ? 'Изменить' : 'Change';
  const selectLabel = language === 'uz' ? 'Davlatni tanlang' : language === 'ru' ? 'Выберите страну' : 'Select country';

  if (!selectedCountry && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mx-4 mt-4 p-3 bg-muted rounded-xl flex items-center gap-3 hover:bg-muted/80 transition-colors text-left w-[calc(100%-2rem)]"
      >
        <Globe className="w-5 h-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{selectLabel}</span>
      </button>
    );
  }

  return (
    <div className="mx-4 mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-3 bg-secondary rounded-xl flex items-center gap-3 hover:bg-secondary/80 transition-colors text-left"
      >
        <span className="text-2xl">{selectedCountry?.flag || '🌍'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{studyingInLabel}</p>
          <p className="font-medium text-secondary-foreground truncate">
            {selectedCountry ? displayName(selectedCountry) : selectLabel}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-2 bg-card border border-border rounded-xl shadow-lg max-h-64 overflow-y-auto animate-slide-up">
          {countries.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCountry(c);
                setOpen(false);
                navigate('/search');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left ${
                selectedCountry?.name === c.name ? 'bg-primary/10' : ''
              }`}
            >
              <span className="text-xl">{c.flag}</span>
              <span className="text-sm font-medium text-foreground">{displayName(c)}</span>
              {selectedCountry?.name === c.name && (
                <span className="ml-auto text-primary text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function StudentLayout({ children }: StudentLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { language, selectedCountry, activeTenant } = useApp();
  const { isAdmin } = useUserRole();
  const t = useTranslation(language);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isComplete, loading: profileLoading } = useProfileCompletion();
  const { isUniCoin } = useBusinessMode();
  const [identityComplete, setIdentityComplete] = useState<boolean | null>(null);
  const [identityChecked, setIdentityChecked] = useState(false);

  // Check if basic identity fields are filled (name, phone, telegram)
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, phone, telegram_username')
        .eq('user_id', user.id)
        .maybeSingle();
      const hasIdentity = !!(
        data?.full_name?.trim() &&
        data?.phone?.trim()
      );
      setIdentityComplete(hasIdentity);
      setIdentityChecked(true);
    })();
  }, [user]);



  // Redirect to profile if trying to access /search or /apply without complete profile
  useEffect(() => {
    const gatedPaths = ['/search'];
    if (!isComplete && gatedPaths.some(p => location.pathname.startsWith(p))) {
      navigate('/student/profile', { replace: true });
    }
  }, [location.pathname, isComplete, navigate]);

  const adminLabel =
    language === 'uz' ? 'Admin panel' : language === 'ru' ? 'Админ панель' : 'Admin Panel';

  const handleSignOut = async () => {
    try {
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
      navigate('/auth');
    }
  };

  const grantsLabel = language === 'uz' ? 'Grantlar' : language === 'ru' ? 'Гранты' : 'Grants';
  const jobsLabel = language === 'uz' ? 'Ishlar' : language === 'ru' ? 'Работа' : 'Jobs';
  const housingLabel = language === 'uz' ? 'Turar joy' : language === 'ru' ? 'Жильё' : 'Housing';
  const arrivalLabel = language === 'uz' ? 'Kutib olish' : language === 'ru' ? 'Встреча' : 'Arrival';
  const mentorsLabel = language === 'uz' ? 'Mentorlar' : language === 'ru' ? 'Менторы' : 'Mentors';

  const vertical = activeTenant?.business_type || 'consulting';
  const isAcademy = vertical === 'academy';
  const isTour = vertical === 'tour';

  let allNavItems: any[] = [];

  if (isAcademy) {
    allNavItems = [
      { icon: Home, label: language === 'uz' ? 'Boshqaruv' : language === 'ru' ? 'Панель' : 'Dashboard', href: '/student/dashboard', key: 'dashboard' },
      { icon: GraduationCap, label: language === 'uz' ? 'Guruhlarim' : language === 'ru' ? 'Мои группы' : 'My Classes', href: '/student/academy', key: 'academy' },
      { icon: Award, label: language === 'uz' ? 'Natijalar' : language === 'ru' ? 'Результаты' : 'Results', href: '/student/evolution', key: 'evolution' },
      { icon: FolderOpen, label: t.documents, href: '/student/documents', key: 'documents' },
      { icon: User, label: t.profile, href: '/student/profile', key: 'profile' },
      ...(isAdmin ? [{ icon: Shield, label: adminLabel, href: '/admin/dashboard', key: 'admin' }] : []),
    ];
  } else if (isTour) {
    allNavItems = [
      { icon: Home, label: language === 'uz' ? 'Boshqaruv' : language === 'ru' ? 'Панель' : 'Dashboard', href: '/student/dashboard', key: 'dashboard' },
      { icon: Plane, label: language === 'uz' ? 'Sayohatlarim' : language === 'ru' ? 'Мои туры' : 'My Tours', href: '/student/tours', key: 'tours' },
      { icon: FolderOpen, label: language === 'uz' ? 'Hujjatlar' : language === 'ru' ? 'Документы' : 'Documents', href: '/student/documents', key: 'documents' },
      { icon: User, label: t.profile, href: '/student/profile', key: 'profile' },
      ...(isAdmin ? [{ icon: Shield, label: adminLabel, href: '/admin/dashboard', key: 'admin' }] : []),
    ];
  } else {
    allNavItems = [
      { icon: Home, label: t.dashboard, href: '/student/dashboard', key: 'dashboard' },
      { icon: GraduationCap, label: t.myApplications, href: '/student/applications', key: 'applications' },
      { icon: Users, label: mentorsLabel, href: '/student/mentors', key: 'mentors' },
      { icon: Award, label: grantsLabel, href: '/student/grants', key: 'grants' },
      { icon: FolderOpen, label: t.documents, href: '/student/documents', key: 'documents' },
      { icon: Plane, label: t.visa, href: '/student/visa', key: 'visa' },
      { icon: Briefcase, label: jobsLabel, href: '/student/jobs', key: 'jobs' },
      { icon: Building, label: housingLabel, href: '/student/housing', key: 'housing' },
      { icon: Plane, label: arrivalLabel, href: '/student/arrival', key: 'arrival' },
      { icon: User, label: t.profile, href: '/student/profile', key: 'profile' },
      ...(isAdmin ? [{ icon: Shield, label: adminLabel, href: '/admin/dashboard', key: 'admin' }] : []),
    ];
  }

  // Filter out admin-hidden tabs
  const navItems = allNavItems.filter(item => {
    const configSettings = activeTenant?.config?.settings;
    if (item.key === 'jobs' && configSettings?.hideJobBoard) return false;
    if (item.key === 'housing' && configSettings?.hideHousing) return false;
    if (item.key === 'grants' && configSettings?.hideGrants) return false;
    if (item.key === 'mentors' && configSettings?.hideMentors) return false;
    return true;
  });

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userInitials = userName.slice(0, 2).toUpperCase();

  return (
    <div className={`min-h-screen flex ${isAcademy || isTour ? 'bg-[#020202] text-white dark' : 'bg-muted/30 text-foreground'}`}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen
          w-full sm:w-80 lg:w-64
          bg-card border-r border-border
          transform transition-transform duration-300 ease-in-out lg:transform-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isAcademy || isTour ? 'bg-[#09090b] text-white border-white/10' : 'bg-card border-border'}
        `}
      >
        <div className="flex flex-col h-full">

          {/* ── Mobile Header: User info + Close ── */}
          <div className="lg:hidden flex items-center justify-between px-4 py-4 border-b border-border">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <button
              className="p-2 hover:bg-muted rounded-xl transition-colors flex-shrink-0"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* ── Desktop: Logo ── */}
          <div className="hidden lg:flex items-center p-4 border-b border-border">
            <Logo size="sm" />
          </div>

          {/* ── Country Switcher (Desktop only — mobile is cleaner without it) ── */}
          {!isAcademy && !isTour && (
            <div className="hidden lg:block">
              <CountrySwitcher />
            </div>
          )}

          {/* ── Navigation ── */}
          <nav className="flex-1 p-3 overflow-y-auto">

            {/* Mobile: show ALL nav items in sidebar */}
            <div className="lg:hidden space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.key}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Desktop: show ALL items */}
            <div className="hidden lg:block space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.key}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-glow'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* ── Bottom: Language + Logout ── */}
          <div className="p-3 border-t border-border space-y-1">
            {/* Logout — always visible, prominent */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-all duration-200 font-medium"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{t.logout || (language === 'uz' ? 'Chiqish' : language === 'ru' ? 'Выйти' : 'Log Out')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 md:px-6">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2 hover:bg-muted rounded-lg"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div className="hidden md:block">
                <GlobalSearch />
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <div className="md:hidden">
                <GlobalSearch />
              </div>
              <LanguageSwitcher />
              <button
                onClick={handleSignOut}
                className="lg:hidden p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                title={t.logout || 'Log Out'}
              >
                <LogOut className="w-5 h-5" />
              </button>
              <NotificationsDropdown />
              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold cursor-pointer hover:opacity-90 transition-opacity ring-2 ring-primary/20">
                    {userInitials}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none truncate">{userName}</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/student/profile" className="w-full flex items-center gap-2 cursor-pointer">
                      <User className="w-4 h-4" />
                      <span>{t.profile}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t.logout}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-6 pb-20 lg:pb-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav onMenuOpen={() => setSidebarOpen(true)} />

      {/* UniAI Chatbot */}
      <UniAIChat />

      {/* Lucky Spin Wheel — UniCoin mode only */}
      {isUniCoin && <SpinWheel />}

      {/* Identity Gate Modal - blocks everything until identity is completed */}
      {identityChecked && identityComplete === false && (
        <IdentityGateModal onComplete={() => setIdentityComplete(true)} />
      )}
    </div>
  );
}
