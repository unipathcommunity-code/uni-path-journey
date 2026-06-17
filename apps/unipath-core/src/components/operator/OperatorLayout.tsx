import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, Calendar, Settings, LogOut, Menu, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import logo from "@/assets/unitour-logo.png";

const OperatorLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { t } = useTranslation();

  const navItems = [
    { href: "/operator", label: t("operator.dashboard"), icon: LayoutDashboard },
    { href: "/operator/tours", label: t("operator.myTours"), icon: Package },
    { href: "/operator/bookings", label: t("operator.bookings"), icon: Calendar },
    { href: "/operator/settings", label: t("operator.settings"), icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/operator") return location.pathname === "/operator";
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform lg:transform-none ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="UniTour" className="h-10" />
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">{t("operator.title")}</span>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} to={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive(item.href) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-border">
            <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={async () => { await signOut(); navigate("/auth"); }}>
              <LogOut className="h-5 w-5 mr-3" />
              {t("operator.logout")}
            </Button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 bg-background border-b border-border">
          <div className="flex items-center justify-between px-4 h-16">
            <button className="lg:hidden p-2 text-foreground" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-4 ml-auto">
              <LanguageSwitcher />
              <Link to="/operator/tours/new">
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t("operator.newTour")}
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
};

export default OperatorLayout;
