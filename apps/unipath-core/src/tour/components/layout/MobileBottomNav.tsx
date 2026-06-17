import { Link, useLocation } from "react-router-dom";
import { Home, LayoutGrid, DollarSign, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

const MobileBottomNav = () => {
  const location = useLocation();
  const { user, userRole } = useAuth();

  const dashboardHref = (() => {
    if (!user) return "/auth";
    if (userRole === "super_admin" || userRole === "admin") return "/admin";
    if (userRole === "moderator") return "/operator";
    if (userRole === "company_owner" || userRole === "company_staff") return "/company";
    return "/dashboard";
  })();

  const tabs = [
    { href: "/", label: "Bosh sahifa", icon: Home },
    { href: "/#features", label: "Imkoniyatlar", icon: LayoutGrid },
    { href: "/#pricing", label: "Narxlar", icon: DollarSign },
    { href: dashboardHref, label: user ? "Panelim" : "Kirish", icon: User },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    if (href.startsWith("/#")) return false;
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around h-14 px-1">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              to={tab.href}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1"
            >
              {active && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-[1px] w-8 h-0.5 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon className={`h-5 w-5 transition-colors ${active ? "text-primary stroke-[2.5]" : "text-muted-foreground"}`} />
              <span className={`text-[10px] font-medium leading-tight transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
