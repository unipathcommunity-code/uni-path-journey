import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Users, Settings, LogOut, Menu, Mail,
  ShieldCheck, MessageSquare, Ticket, History, Bell,
  BarChart3, Briefcase, CreditCard, Bot, Receipt, Search, Sparkles,
  Inbox, Grid3x3, Map, MapPin, Building2, Car, UserCheck, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import { useApp } from "@/contexts/AppContext";
import { useUserRole } from "@/hooks/useUserRole";
import { MeshBackground } from "@/components/MeshBackground";

type NavItem = { href: string; label: string; icon: any };
type NavGroup = { label: string; items: NavItem[] };

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { t } = useTranslation();
  const { activeTenant } = useApp();
  const { role } = useUserRole();

  const roleLabel =
    role === 'super_admin' ? 'Super admin'
    : (role === 'owner' || role === 'admin') ? 'Administrator'
    : role === 'manager' ? 'Menejer'
    : role === 'accountant' ? 'Buxgalter'
    : role === 'agent' ? 'Agent'
    : 'Foydalanuvchi';
  const logoUrl = (activeTenant as any)?.config?.branding?.logo_url as string | undefined;

  const groups: NavGroup[] = [
    {
      label: "Asosiy",
      items: [
        { href: "/admin", label: "Boshqaruv paneli", icon: LayoutDashboard },
        { href: "/admin/analytics", label: "Statistika", icon: BarChart3 },
      ],
    },
    {
      // This tour company's own catalog (platform-wide SaaS admin lives ONLY at /super-admin)
      label: "Turlar & Yo'nalishlar",
      items: [
        { href: "/admin/tours", label: "Turlar", icon: Map },
        { href: "/admin/tours/new", label: "Yangi tur qo'shish", icon: Plus },
        { href: "/admin/destinations", label: "Yo'nalishlar", icon: MapPin },
        { href: "/admin/hotels", label: "Mehmonxonalar", icon: Building2 },
        { href: "/admin/vehicles", label: "Transport", icon: Car },
        { href: "/admin/agents", label: "Agentlar", icon: UserCheck },
      ],
    },
    {
      label: "Boshqaruv",
      items: [
        { href: "/admin/bookings", label: "Buyurtmalar", icon: Ticket },
        { href: "/admin/users", label: "Foydalanuvchilar", icon: Users },
        { href: "/admin/notifications", label: "Bildirishnomalar", icon: Bell },
        { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
      ],
    },
    {
      label: "Tizim",
      items: [
        { href: "/admin/audit-log", label: "Harakat tarixi", icon: History },
        { href: "/admin/settings", label: "Sozlamalar", icon: Settings },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(href);
  };

  const initial = (user?.email || "A").charAt(0).toUpperCase();

  return (
    <div className="relative min-h-screen">
      <MeshBackground />
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-background/70 backdrop-blur-2xl border-r border-white/40 transform transition-transform lg:transform-none ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex flex-col h-full">
          <div className="px-5 py-5 border-b">
            <Link to="/admin" className="flex items-center gap-2.5">
              {logoUrl ? (
                <img src={logoUrl} alt={activeTenant?.name || 'Logo'} className="h-9 w-9 rounded-xl object-contain shadow-md bg-white/5" />
              ) : (
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold shadow-md">
                  {activeTenant?.name ? activeTenant.name.charAt(0).toUpperCase() : <Sparkles className="h-4 w-4" />}
                </div>
              )}
              <div className="leading-tight min-w-0">
                <p className="font-bold text-sm truncate max-w-[150px]">{activeTenant?.name || 'Tur agentligi'}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="h-2.5 w-2.5" /> Tur agentligi
                </p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
            {groups.map((g) => (
              <div key={g.label}>
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{g.label}</p>
                <div className="space-y-0.5">
                  {g.items.map((item) => (
                    <Link key={item.href} to={item.href} onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isActive(item.href)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}>
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-3 border-t">
            <div className="flex items-center gap-2.5 px-2 py-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">{initial}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user?.email}</p>
                <p className="text-[10px] text-muted-foreground">{roleLabel}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={async () => { await signOut(); navigate("/auth"); }}>
              <LogOut className="h-4 w-4 mr-2" />
              {t("nav.logout")}
            </Button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 bg-background/60 backdrop-blur-2xl border-b border-white/40">
          <div className="flex items-center justify-between gap-4 px-4 md:px-6 h-16">
            <button className="lg:hidden p-2 text-foreground" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </button>
            <div className="hidden md:flex items-center flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Qidirish: tur, foydalanuvchi, buyurtma..." className="pl-9 h-9 rounded-xl bg-muted/50 border-0 focus-visible:bg-background" />
              </div>
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <LanguageSwitcher />
              <Button size="sm" variant="ghost" className="rounded-full h-9 w-9 p-0">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
