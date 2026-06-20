import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { Logo } from '@/components/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import {
  LayoutDashboard,
  Users,
  FileText,
  Menu,
  X,
  LogOut,
  UserCheck,
  ClipboardList,
  StickyNote,
} from 'lucide-react';

interface AgentLayoutProps {
  children: React.ReactNode;
}

export function AgentLayout({ children }: AgentLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const { language, activeTenant } = useApp();
  const vertical = activeTenant?.business_type || 'consulting';
  const isTour = vertical === 'tour';
  const isAcademy = vertical === 'academy';

  let navItems = [
    { icon: LayoutDashboard, label: language === 'uz' ? 'Boshqaruv paneli' : 'Dashboard', href: '/agent/dashboard' },
    { icon: Users, label: language === 'uz' ? 'Talabalarim' : 'My Students', href: '/agent/students' },
    { icon: FileText, label: language === 'uz' ? 'Arizalar' : 'Applications', href: '/agent/applications' },
    { icon: StickyNote, label: language === 'uz' ? 'Eslatmalar' : 'Notes', href: '/agent/notes' },
    { icon: ClipboardList, label: language === 'uz' ? 'Vazifalar' : 'Tasks', href: '/agent/tasks' },
  ];

  if (isTour) {
    navItems = [
      { icon: LayoutDashboard, label: language === 'uz' ? 'Boshqaruv paneli' : 'Dashboard', href: '/agent/dashboard' },
      { icon: Users, label: language === 'uz' ? 'Mijozlarim / Lidlar' : 'My Clients / Leads', href: '/agent/students' },
      { icon: FileText, label: language === 'uz' ? 'Bronlar' : 'Bookings', href: '/agent/applications' },
      { icon: StickyNote, label: language === 'uz' ? 'Eslatmalar' : 'Notes', href: '/agent/notes' },
      { icon: ClipboardList, label: language === 'uz' ? 'Vazifalar' : 'Tasks', href: '/agent/tasks' },
    ];
  } else if (isAcademy) {
    navItems = [
      { icon: LayoutDashboard, label: language === 'uz' ? 'Boshqaruv paneli' : 'Dashboard', href: '/agent/dashboard' },
      { icon: Users, label: language === 'uz' ? "O'quvchilarim" : 'My Students', href: '/agent/students' },
      { icon: FileText, label: language === 'uz' ? 'Hujjatlar' : 'Documents', href: '/agent/applications' },
      { icon: StickyNote, label: language === 'uz' ? 'Eslatmalar' : 'Notes', href: '/agent/notes' },
      { icon: ClipboardList, label: language === 'uz' ? 'Vazifalar' : 'Tasks', href: '/agent/tasks' },
    ];
  }

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
            <div className="flex items-center gap-2">
              <Logo size="sm" />
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                Agent
              </span>
            </div>
            <button
              className="lg:hidden p-2 hover:bg-muted rounded-lg"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Agent Badge */}
          <div className="mx-4 mt-4 p-3 bg-primary/10 rounded-xl flex items-center gap-3">
            <UserCheck className="w-6 h-6 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Kirish darajasi</p>
              <p className="font-medium text-foreground">Konsultant</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Navigation */}
          <div className="p-4 border-t border-border space-y-1">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Chiqish</span>
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
              <h1 className="text-lg font-semibold text-foreground">Agent Paneli</h1>
            </div>
            <LanguageSwitcher />
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
