import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Package, Calendar, Settings, LogOut, Menu, Plus,
  Palette, FileText, Users, MessageSquare, Globe, BarChart3,
  Building2, ExternalLink, Loader2, ShieldAlert, GitBranch, UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useMyCompany } from "@/hooks/useTourCompany";
import { BranchProvider } from "@/hooks/useTourBranches";
import BranchSwitcher from "@/components/company/BranchSwitcher";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import logo from "@/assets/unitour-logo-new.png";

const navItems = [
  { href: "/company", label: "Boshqaruv", icon: LayoutDashboard },
  { href: "/company/branches", label: "Filiallar", icon: GitBranch },
  { href: "/company/tours", label: "Turlar", icon: Package },
  { href: "/company/bookings", label: "Buyurtmalar", icon: Calendar },
  { href: "/company/customers", label: "Mijozlar", icon: UserRound },
  { href: "/company/leads", label: "Lidlar", icon: MessageSquare },
  { href: "/company/posts", label: "Yangiliklar", icon: FileText },
  { href: "/company/team", label: "Jamoa", icon: Users },
  { href: "/company/analytics", label: "Statistika", icon: BarChart3 },
  { href: "/company/branding", label: "Brend", icon: Palette },
  { href: "/company/site", label: "Sayt", icon: Globe },
  { href: "/company/settings", label: "Sozlamalar", icon: Settings },
];

const CompanyLayoutInner = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data, isLoading } = useMyCompany();

  const isActive = (href: string) =>
    href === "/company" ? location.pathname === "/company" : location.pathname.startsWith(href);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-muted/30 p-4 text-center">
        <Building2 className="h-12 w-12 text-primary" strokeWidth={1.5} />
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold tracking-tight">Sizda kompaniya yo'q</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            UniTour'da kompaniyangizni ro'yxatdan o'tkazing va shaxsiy saytingizga ega bo'ling.
          </p>
        </div>
        <Button onClick={() => navigate("/register-company")} className="rounded-xl">
          <Plus className="h-4 w-4 mr-1.5" strokeWidth={2} /> Kompaniya yaratish
        </Button>
      </div>
    );
  }

  const { company, role, impersonated } = data as any;
  const siteUrl = `${window.location.origin}/${company.slug}`;

  const stopImpersonation = () => {
    sessionStorage.removeItem("impersonating_company");
    window.location.href = "/admin/tour-companies";
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-foreground transform transition-transform lg:transform-none ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="px-4 pt-4 pb-3 border-b border-background/10">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <img src={logo} alt="UniTour" className="h-7 brightness-0 invert" />
              <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-medium">
                Company
              </span>
            </Link>
            <div className="flex items-center gap-2 text-background mb-3">
              {company.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="h-8 w-8 rounded-lg object-cover" />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-xs font-semibold">
                  {company.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate leading-tight">{company.name}</p>
                <p className="text-[10px] opacity-60 capitalize mt-0.5">{role}</p>
              </div>
            </div>
            <BranchSwitcher dark />
          </div>

          <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition ${
                    active
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-background/70 hover:bg-background/10 hover:text-background"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-2.5 border-t border-background/10 space-y-1">
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-background/70 hover:text-background hover:bg-background/10 transition"
            >
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} /> Saytni ko'rish
            </a>
            <button
              onClick={async () => {
                await signOut();
                window.location.href = `/${company.slug}`;
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-background/70 hover:text-background hover:bg-background/10 transition"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} /> Chiqish
            </button>
          </div>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="lg:ml-64">
        {impersonated && (
          <div className="bg-amber-500 text-amber-950 text-xs md:text-sm px-4 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldAlert className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              <span className="truncate">
                Super admin sifatida <strong>{company.name}</strong> nomidan kirgansiz
              </span>
            </div>
            <Button size="sm" variant="ghost" className="text-amber-950 hover:bg-amber-950/10 h-7" onClick={stopImpersonation}>
              Chiqish
            </Button>
          </div>
        )}
        <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border/60">
          <div className="flex items-center justify-between px-4 h-14">
            <button className="lg:hidden p-1.5 -ml-1.5 text-foreground" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <div className="flex items-center gap-3 ml-auto">
              <LanguageSwitcher />
              <Badge variant="outline" className="capitalize text-[10px] font-normal">
                {role}
              </Badge>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
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

const CompanyLayout = () => (
  <BranchProvider>
    <CompanyLayoutInner />
  </BranchProvider>
);

export default CompanyLayout;
