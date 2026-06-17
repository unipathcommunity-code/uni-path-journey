import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, MapPin, Users, Settings, Menu, X, Wallet, Calculator, Share2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import logo from "@/assets/unitour-logo-new.png";

const AgentLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useTranslation();

  const menuItems = [
    { path: "/agent", label: t("agent.home"), icon: LayoutDashboard, exact: true },
    { path: "/agent/tours", label: t("agent.myTours"), icon: MapPin },
    { path: "/agent/clients", label: t("agent.myClients"), icon: Users },
    { path: "/agent/referrals", label: t("agent.referrals"), icon: Share2 },
    { path: "/agent/earnings", label: t("agent.earnings"), icon: Wallet },
    { path: "/agent/accounting", label: t("agent.accounting"), icon: Calculator },
    { path: "/agent/settings", label: t("agent.settings"), icon: Settings },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50 flex items-center px-4">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <span className="ml-4 font-semibold text-lg">{t("agent.title")}</span>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <Link to="/"><Button variant="ghost" size="icon"><Home className="h-5 w-5" /></Button></Link>
        </div>
      </header>

      <aside className={cn("fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-40 transition-transform duration-300", "lg:translate-x-0", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="UniTour" className="h-10 w-auto" />
            <div>
              <h1 className="font-bold text-lg">{t("agent.title")}</h1>
              <p className="text-xs text-muted-foreground">{t("agent.subtitle")}</p>
            </div>
          </Link>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
              className={cn("flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors", isActive(item.path, item.exact) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl p-4 border border-green-200 dark:border-green-800">
            <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">{t("agent.activeContract")}</p>
            <p className="text-xs text-green-600 dark:text-green-400">{t("agent.commission")}: 10%</p>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default AgentLayout;
