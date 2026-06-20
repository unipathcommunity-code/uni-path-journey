import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import {
  Building2,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  Shield,
  CreditCard,
  Globe,
  Bell,
  LayoutDashboard,
} from 'lucide-react';


interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      navigate('/');
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Bosh panel', href: '/super-admin' },
    { icon: Building2, label: 'Firmalar', href: '/super-admin/tenants' },
    { icon: Users, label: 'Adminlar (Firma Egalari)', href: '/super-admin/users' },
    { icon: CreditCard, label: "To'lovlar", href: '/super-admin/billing' },
    { icon: BarChart3, label: 'Analitika', href: '/super-admin/analytics' },
    { icon: Globe, label: 'Domenlar', href: '/super-admin/domains' },
    { icon: Bell, label: 'Bildirishnomalar', href: '/super-admin/notifications' },
  ];


  const bottomNavItems = [
    { icon: Settings, label: 'Sozlamalar', href: '/super-admin/settings' },
  ];

  return (
    <div className="superadmin-theme min-h-screen text-foreground font-sans superadmin-bg flex flex-col">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 w-full z-50 bg-background/10 backdrop-blur-xl border-b border-white/5 flex justify-between items-center px-6 h-16">
        <div className="flex items-center gap-4">
          <button
            className="lg:hidden p-2 hover:bg-white/5 rounded-lg text-foreground/60"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="ml-2 px-3 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/30">
              Super Admin
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/40">
            <Users className="w-4 h-4 text-primary" />
          </div>
        </div>
      </header>

      <div className="flex pt-16 min-h-[calc(100vh-4rem)] flex-1">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <aside
          className={`
            fixed lg:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-72 bg-sidebar/50 backdrop-blur-xl border-r border-white/5
            flex flex-col shrink-0 overflow-y-auto transition-transform duration-300 lg:transform-none
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div>
              {/* Admin Badge */}
              <div className="glass-card rounded-2xl p-4 flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Shield className="w-6 h-6 text-background" />
                </div>
                <div>
                  <p className="text-foreground/50 text-[10px] uppercase font-bold tracking-widest">Huquq darajasi</p>
                  <p className="text-foreground font-semibold text-sm">Platforma egasi</p>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.label}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        group flex items-center gap-3 px-4 py-3 rounded-r-xl transition-all duration-200
                        ${
                          isActive
                            ? 'sidebar-item-active text-primary'
                            : 'text-foreground/70 hover:text-primary hover:bg-white/5'
                        }
                      `}
                    >
                      <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-primary' : 'text-foreground/50'}`} />
                      <span className="font-semibold text-xs tracking-wide">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 space-y-1">
              {bottomNavItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                      ${
                        isActive
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'text-foreground/70 hover:text-primary hover:bg-white/5'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5 text-foreground/50 group-hover:text-primary" />
                    <span className="font-semibold text-xs tracking-wide">{item.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
              >
                <LogOut className="w-5 h-5 text-destructive" />
                <span className="font-semibold text-xs tracking-wide">Chiqish</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-background/20">
          {children}
        </main>
      </div>

      {/* Footer for large screens */}
      <footer className="relative w-full border-t border-white/5 py-12 px-6 text-center bg-sidebar/70 backdrop-blur-md">
        <h3 className="text-xl font-bold text-foreground mb-4">UniPath Global OS</h3>
        <p className="text-xs text-foreground/50 mb-6">© 2024 UniPath Global. Multi-Vertical B2B SaaS Platform — Consulting, Tour, Academy, Hotel.</p>
        <div className="flex flex-wrap justify-center gap-8 mb-8">
          <a className="text-xs font-semibold text-foreground/70 hover:text-primary transition-colors" href="#">Maxfiylik Siyosati</a>
          <a className="text-xs font-semibold text-foreground/70 hover:text-primary transition-colors" href="#">Xizmat Shartnomasi</a>
          <a className="text-xs font-semibold text-foreground/70 hover:text-primary transition-colors" href="#">Muvofiqlik</a>
          <a className="text-xs font-semibold text-foreground/70 hover:text-primary transition-colors" href="#">Global Tarmoq</a>
        </div>
      </footer>
    </div>
  );
}
