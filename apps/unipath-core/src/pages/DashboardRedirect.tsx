import { Navigate, useLocation } from "react-router-dom";
import { 
  GraduationCap, 
  Plane, 
  Building2, 
  Dumbbell, 
  Bed, 
  UtensilsCrossed, 
  Loader2 
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useApp } from "@/contexts/AppContext";

export default function DashboardRedirect() {
  const { user, isLoading: authLoading } = useAuth();
  const { role, tenantStatus, isLoading: roleLoading } = useUserRole();
  const { activeTenant, isTenantLoading } = useApp();
  const location = useLocation();

  const isLoading = authLoading || roleLoading || isTenantLoading;

  const impersonatedTenantRaw = localStorage.getItem('active_tenant');
  const impersonatedTenant = impersonatedTenantRaw ? JSON.parse(impersonatedTenantRaw) : null;
  const effectiveTenant = impersonatedTenant || activeTenant;
  
  const activeModules = (effectiveTenant?.config?.modules ?? {}) as Record<string, boolean>;
  const VORDER = [
    'tour', 'academy', 'hotel', 'restaurant', 'clinic', 'gym',
    'manufacturing', 'parking', 'auto_service', 'wholesale',
    'wedding_hall', 'kindergarten', 'library', 'cosmetics',
    'stadium', 'pharmacy', 'consulting',
  ];
  const rawV =
    (effectiveTenant as any)?.vertical ||
    effectiveTenant?.business_type ||
    effectiveTenant?.config?.business_type ||
    effectiveTenant?.config?.vertical ||
    VORDER.find(v => activeModules[v] === true) ||
    'consulting';
  let vertical = String(rawV).toLowerCase().trim();
  if (vertical === 'nova' || vertical === 'edu') vertical = 'academy';
  if (vertical === 'unitour' || vertical === 'tour_farm') vertical = 'tour';

  if (isLoading) {
    let LoadingIcon = Loader2;
    let iconClass = "w-8 h-8 text-primary animate-spin";

    if (vertical === "tour") {
      LoadingIcon = Plane;
      iconClass = "w-8 h-8 text-primary animate-bounce";
    } else if (vertical === "academy") {
      LoadingIcon = GraduationCap;
      iconClass = "w-8 h-8 text-primary animate-pulse";
    } else if (vertical === "consulting") {
      LoadingIcon = Building2;
      iconClass = "w-8 h-8 text-primary animate-pulse";
    } else if (vertical === "gym") {
      LoadingIcon = Dumbbell;
      iconClass = "w-8 h-8 text-primary animate-bounce";
    } else if (vertical === "hotel") {
      LoadingIcon = Bed;
      iconClass = "w-8 h-8 text-primary animate-pulse";
    } else if (vertical === "restaurant") {
      LoadingIcon = UtensilsCrossed;
      iconClass = "w-8 h-8 text-primary animate-pulse";
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <LoadingIcon className={iconClass} />
          </div>
          <span className="text-lg font-medium">Yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  const getAdminPath = (v: string) => {
    return '/admin/dashboard';
  };

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
      if (impersonatedTenant) return <Navigate to={getAdminPath(vertical)} replace />;
      localStorage.removeItem('active_tenant');
      return <Navigate to="/super-admin" replace />;
    }
    if (role === "owner" || role === "admin") {
      if (impersonatedTenant) return <Navigate to={getAdminPath(vertical)} replace />;
      localStorage.removeItem('active_tenant');
      return <Navigate to="/hub" replace />;
    }
    // Regular users cannot be on the root domain!
    localStorage.removeItem('active_tenant');
    return <Navigate to="/auth?error=wrong_domain" replace />;
  }

  // From this point on, we are definitely on a subdomain (e.g. nova.unipath.me)
  
  if (tenantStatus === "pending") {
    return <Navigate to="/pending-approval" replace />;
  }

  // Admin-level roles → admin workspace
  if (["admin", "owner", "manager"].includes(role ?? "")) {
    return <Navigate to={getAdminPath(vertical)} replace />;
  }
  // Agent-level roles → agent workspace
  if (["agent", "specialist", "mentor"].includes(role ?? "")) {
    return <Navigate to="/agent/dashboard" replace />;
  }
  if (role === "teacher") return <Navigate to="/teacher" replace />;
  if (role === "accountant") return <Navigate to="/accountant" replace />;
  if (role === "parent") return <Navigate to="/parent" replace />;
  
  // Everyone else → student dashboard
  return <Navigate to="/student/dashboard" replace />;
}

