import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Users, Settings, LogOut, Menu,
  ShieldCheck, Ticket, Bell, BarChart3, CreditCard,
  Receipt, Search, FileText, UserCheck, Calendar,
  MessageSquare, BookOpen, Wallet, TrendingUp,
  Building2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

type NavItem = { href: string; label: string; icon: any; badge?: number };
type NavGroup = { label: string; items: NavItem[] };

const VERTICAL_LABELS: Record<string, string> = {
  tour: "Tour CRM",
  academy: "Academy",
  consulting: "Consulting",
  hotel: "Hotel",
  restaurant: "Restoran",
  clinic: "Klinika",
  gym: "Sport zal",
  manufacturing: "Ishlab chiqarish",
  parking: "Parkovka",
  auto_service: "Avtoservis",
  wholesale: "Ulgurji",
  wedding_hall: "To'yxona",
  kindergarten: "Bog'cha",
  library: "Kutubxona",
  cosmetics: "Kosmetika",
  stadium: "Stadium",
  pharmacy: "Dorixona",
};

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [role, setRole] = useState<string>("admin");
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { activeTenant } = useApp();
  const { t } = useTranslation();

  const vertical = activeTenant?.business_type || "consulting";
  const tenantName = activeTenant?.name || "UniPath";
  const verticalLabel = VERTICAL_LABELS[vertical] || "Admin";

  // Fetch user role
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.role) setRole(data.role);
      });
  }, [user?.id]);

  // Fetch unread notification count from contact_requests
  useEffect(() => {
    if (!activeTenant?.id) return;
    const RKEY = `notif_read_${activeTenant.id}`;
    const readIds: Set<string> = new Set(
      JSON.parse(localStorage.getItem(RKEY) || "[]")
    );

    supabase
      .from("contact_requests")
      .select("id", { count: "exact" })
      .eq("tenant_id", activeTenant.id)
      .then(({ data }) => {
        const unread = (data || []).filter(
          (r: any) => !readIds.has(`contact_${r.id}`)
        ).length;
        setUnreadCount(unread);
      });
  }, [activeTenant?.id, location.pathname]);

  // ── Build nav groups based on vertical ────────────────────────────────────
  const isSuperAdmin = role === "super_admin";

  const coreGroup: NavGroup = {
    label: "Asosiy",
    items: [
      { href: "/admin/dashboard", label: "Boshqaruv paneli", icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Statistika", icon: BarChart3 },
    ],
  };

  // Vertical-specific items
  const verticalItems: Record<string, NavItem[]> = {
    tour: [
      { href: "/admin/dashboard", label: "Tour Dashboard", icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Statistika", icon: TrendingUp },
    ],
    academy: [
      { href: "/admin/dashboard", label: "Academy Dashboard", icon: LayoutDashboard },
      { href: "/admin/students", label: "O'quvchilar", icon: Users },
      { href: "/admin/analytics", label: "Statistika", icon: BarChart3 },
    ],
    consulting: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/students", label: "Mijozlar", icon: Users },
      { href: "/admin/applications", label: "Arizalar", icon: FileText },
      { href: "/admin/documents", label: "Hujjatlar", icon: BookOpen },
      { href: "/admin/crm", label: "CRM Pipeline", icon: UserCheck },
      { href: "/admin/analytics", label: "Statistika", icon: BarChart3 },
    ],
  };

  const mainItems = verticalItems[vertical] || [
    { href: "/admin/dashboard", label: "Boshqaruv paneli", icon: LayoutDashboard },
    { href: "/admin/analytics", label: "Statistika", icon: BarChart3 },
  ];

  const clientGroup: NavGroup = {
    label: "Mijozlar",
    items: [
      { href: "/admin/notifications", label: "Bildirishnomalar", icon: Bell, badge: unreadCount },
      { href: "/admin/accounting", label: "Moliya", icon: Wallet },
    ],
  };

  const systemGroup: NavGroup = {
    label: "Tizim",
    items: [
      { href: "/admin/settings", label: "Sozlamalar", icon: Settings },
    ],
  };

  // Super admin only gets extra SaaS management items
  const saasGroup: NavGroup | null = isSuperAdmin
    ? {
        label: "SaaS Boshqaruv",
        items: [
          { href: "/admin/users", label: "Foydalanuvchilar", icon: Users },
          { href: "/admin/subscriptions", label: "Obunalar", icon: CreditCard },
          { href: "/admin/billing", label: "Hisob-kitoblar", icon: Receipt },
          { href: "/admin/support", label: "Qo'llab-quvvatlash", icon: MessageSquare },
        ],
      }
    : null;

  const groups: NavGroup[] = [
    { label: "Asosiy", items: mainItems },
    clientGroup,
    ...(saasGroup ? [saasGroup] : []),
    systemGroup,
  ];

  const isActive = (href: string) => {
    if (href === "/admin/dashboard" || href === "/admin") {
      return location.pathname === "/admin/dashboard" || location.pathname === "/admin";
    }
    return location.pathname.startsWith(href);
  };

  const initial = (tenantName || "A").charAt(0).toUpperCase();
  const roleLabel: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    owner: "Egasi",
    manager: "Menejer",
    accountant: "Buxgalter",
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform transition-transform duration-300 lg:transform-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-5 py-5 border-b flex items-center justify-between">
            <Link to="/admin/dashboard" className="flex items-center gap-2.5 min-w-0">
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md flex-shrink-0"
                style={{ background: "hsl(var(--primary))" }}
              >
                {initial}
              </div>
              <div className="leading-tight min-w-0">
                <p className="font-bold text-sm truncate">{tenantName}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="h-2.5 w-2.5 flex-shrink-0" />
                  <span className="truncate">{verticalLabel}</span>
                </p>
              </div>
            </Link>
            <button
              className="lg:hidden p-1 text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
            {groups.map((g) => (
              <div key={g.label}>
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {g.label}
                </p>
                <div className="space-y-0.5">
                  {g.items.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive(item.href)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && item.badge > 0 ? (
                        <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {item.badge > 99 ? "99+" : item.badge}
                        </span>
                      ) : null}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t">
            <div className="flex items-center gap-2.5 px-2 py-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm flex-shrink-0">
                {(user?.email || "A").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user?.email}</p>
                <p className="text-[10px] text-muted-foreground">{roleLabel[role] || role}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-foreground gap-2"
              onClick={async () => {
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
                  navigate("/");
                }
              }}
            >
              <LogOut className="h-4 w-4" />
              Chiqish
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b">
          <div className="flex items-center justify-between gap-4 px-4 md:px-6 h-16">
            <button
              className="lg:hidden p-2 text-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="hidden md:flex items-center flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Qidirish..."
                  className="pl-9 h-9 rounded-xl bg-muted/50 border-0 focus-visible:bg-background"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <LanguageSwitcher />
              <Link to="/admin/notifications" className="relative">
                <Button size="sm" variant="ghost" className="rounded-full h-9 w-9 p-0">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Link to="/admin/settings">
                <Button size="sm" variant="ghost" className="rounded-full h-9 w-9 p-0">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
