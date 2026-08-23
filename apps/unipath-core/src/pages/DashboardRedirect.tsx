import { useEffect } from 'react';
import { Navigate, useLocation } from "react-router-dom";
import { Building2 } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useApp } from "@/contexts/AppContext";

export default function DashboardRedirect() {
  const { user, isLoading: authLoading } = useAuth();
  const { role, tenantStatus, isLoading: roleLoading } = useUserRole();
  const { activeTenant, isTenantLoading } = useApp();
  const location = useLocation();

  const isLoading = authLoading || roleLoading || isTenantLoading;

  useEffect(() => {
    console.log("DashboardRedirect state diagnostics:", {
      isLoading,
      authLoading,
      roleLoading,
      isTenantLoading,
      userId: user?.id,
      userRole: role,
      tenantStatus,
      activeTenantId: activeTenant?.id,
    });
  }, [isLoading, authLoading, roleLoading, isTenantLoading, user, role, tenantStatus, activeTenant]);

  const impersonatedTenantRaw = localStorage.getItem('active_tenant');
  let impersonatedTenant: any = null;
  if (impersonatedTenantRaw) {
    try { impersonatedTenant = JSON.parse(impersonatedTenantRaw); }
    catch { localStorage.removeItem('active_tenant'); }
  }
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <span className="text-lg font-medium">Yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  const isRootDomain = 
    window.location.hostname === 'unipath.me' || 
    window.location.hostname === 'www.unipath.me' || 
    window.location.hostname === 'unipath.uz' || 
    window.location.hostname === 'www.unipath.uz' || 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.hostname.includes('vercel.app');

  if (isRootDomain) {
    if (role === "super_admin") {
      if (impersonatedTenant) return <Navigate to={'/admin'} replace />;
      localStorage.removeItem('active_tenant');
      return <Navigate to="/super-admin" replace />;
    }
    if (role === "owner" || role === "admin") {
      if (impersonatedTenant) return <Navigate to={'/admin'} replace />;
      localStorage.removeItem('active_tenant');
      return <Navigate to="/hub" replace />;
    }
    // Regular users cannot be on the root domain!
    localStorage.removeItem('active_tenant');
    return <Navigate to="/auth?error=wrong_domain" replace />;
  }

  // From this point on, we are definitely on a subdomain (e.g. myagency.unipath.me)

  // Super admin always goes to the global control panel, on any host — never
  // let them fall through to the student dashboard.
  if (role === "super_admin") {
    return <Navigate to="/super-admin" replace />;
  }

  if (tenantStatus === "pending") {
    return <Navigate to="/pending-approval" replace />;
  }

  // Admin-level roles → admin workspace
  if (["admin", "owner", "manager"].includes(role ?? "")) {
    return <Navigate to={'/admin'} replace />;
  }
  // Agent-level roles → agent workspace
  if (["agent", "specialist", "mentor"].includes(role ?? "")) {
    return <Navigate to="/agent/dashboard" replace />;
  }
  if (role === "accountant") return <Navigate to="/accountant" replace />;

  // End-users (clients / students) → the study-abroad dashboard
  return <Navigate to="/student/dashboard" replace />;
}

