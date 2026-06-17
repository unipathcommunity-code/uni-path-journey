import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useTranslation } from '@/lib/i18n';
import { Logo } from '@/components/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Bell,
  ChevronRight,
  GraduationCap,
  FileText,
  Plane,
  Briefcase,
  Settings,
  User,
  Home,
  Building,
  Menu,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Shield,
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isLoading, signOut } = useAuth();
  const { isAdmin } = useAdminRole();
  const { language, selectedCountry } = useApp();
  const t = useTranslation(language);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-pulse text-lg">{t.loading}</div>
      </div>
    );
  }

  const navItems = [
    { icon: Home, label: t.dashboard, href: '/dashboard', active: true },
    { icon: Search, label: t.searchUniversities, href: '/search' },
    { icon: FileText, label: t.myApplications, href: '/applications' },
    { icon: FileText, label: t.documents, href: '/documents' },
    { icon: Plane, label: t.visa, href: '/visa' },
    { icon: Building, label: t.boarding, href: '/boarding' },
    { icon: Briefcase, label: t.jobs, href: '/jobs' },
    ...(isAdmin ? [{ icon: Shield, label: 'Admin Panel', href: '/admin' }] : []),
  ];

  const bottomNavItems = [
    { icon: User, label: t.profile, href: '/dashboard' },
    { icon: Settings, label: t.settings, href: '/dashboard' },
  ];

  const applicationStats = [
    { label: 'In Progress', count: 3, color: 'bg-warning', icon: Clock },
    { label: 'Submitted', count: 2, color: 'bg-primary', icon: CheckCircle2 },
    { label: 'Accepted', count: 1, color: 'bg-success', icon: TrendingUp },
    { label: 'Action Needed', count: 1, color: 'bg-destructive', icon: AlertCircle },
  ];

  const recentApplications = [
    {
      university: 'Seoul National University',
      program: 'Computer Science',
      status: 'In Review',
      statusColor: 'text-warning',
      progress: 75,
      deadline: '2024-03-15',
      flag: '🇰🇷',
    },
    {
      university: 'Korea University',
      program: 'Business Administration',
      status: 'Documents Pending',
      statusColor: 'text-destructive',
      progress: 45,
      deadline: '2024-03-20',
      flag: '🇰🇷',
    },
    {
      university: 'Yonsei University',
      program: 'International Studies',
      status: 'Submitted',
      statusColor: 'text-primary',
      progress: 100,
      deadline: '2024-02-28',
      flag: '🇰🇷',
    },
  ];

  const upcomingTasks = [
    { task: 'Upload bank statement', deadline: 'Today', urgent: true },
    { task: 'Complete SOP for Seoul National', deadline: 'In 3 days', urgent: false },
    { task: 'Schedule visa interview', deadline: 'In 1 week', urgent: false },
  ];

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-card border-r border-border
          transform transition-transform duration-300 lg:transform-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Logo size="sm" />
            <button
              className="lg:hidden p-2 hover:bg-muted rounded-lg"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selected Country */}
          {selectedCountry && (
            <div className="mx-4 mt-4 p-3 bg-secondary rounded-xl flex items-center gap-3">
              <span className="text-2xl">{selectedCountry.flag}</span>
              <div>
                <p className="text-xs text-muted-foreground">Studying in</p>
                <p className="font-medium text-secondary-foreground">
                  {language === 'uz'
                    ? selectedCountry.name_uz || selectedCountry.name
                    : language === 'ru'
                    ? selectedCountry.name_ru || selectedCountry.name
                    : selectedCountry.name}
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${
                    item.active
                      ? 'bg-primary text-primary-foreground shadow-glow'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Bottom Navigation */}
          <div className="p-4 border-t border-border space-y-1">
            {bottomNavItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
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
              
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t.searchPlaceholder}
                  className="pl-10 w-80 bg-muted border-0"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              </Button>
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                JD
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 md:p-6 space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Welcome back, John! 👋
            </h1>
            <p className="text-primary-foreground/80 mb-6">
              You have 2 applications that need your attention today.
            </p>
            <Button variant="secondary" className="gap-2">
              <Search className="w-4 h-4" />
              {t.searchUniversities}
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {applicationStats.map((stat) => (
              <div
                key={stat.label}
                className="bg-card rounded-2xl p-5 border border-border card-hover"
              >
                <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                  <stat.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <p className="text-3xl font-bold text-foreground">{stat.count}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Applications */}
            <div className="lg:col-span-2 bg-card rounded-2xl border border-border overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Recent Applications</h2>
                <Link
                  to="/applications"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  {t.viewAll}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="divide-y divide-border">
                {recentApplications.map((app, i) => (
                  <div key={i} className="p-5 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{app.flag}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-foreground truncate">
                              {app.university}
                            </h3>
                            <p className="text-sm text-muted-foreground">{app.program}</p>
                          </div>
                          <span className={`text-sm font-medium ${app.statusColor} whitespace-nowrap`}>
                            {app.status}
                          </span>
                        </div>
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>Progress</span>
                            <span>{app.progress}%</span>
                          </div>
                          <Progress value={app.progress} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Tasks */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="p-5 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Upcoming Tasks</h2>
              </div>
              <div className="p-4 space-y-3">
                {upcomingTasks.map((task, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border ${
                      task.urgent
                        ? 'border-destructive/30 bg-destructive/5'
                        : 'border-border bg-muted/30'
                    }`}
                  >
                    <p className="font-medium text-foreground text-sm">{task.task}</p>
                    <p
                      className={`text-xs mt-1 ${
                        task.urgent ? 'text-destructive' : 'text-muted-foreground'
                      }`}
                    >
                      {task.deadline}
                    </p>
                  </div>
                ))}
              </div>
              <div className="p-4 pt-0">
                <Button variant="outline" className="w-full">
                  View All Tasks
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
