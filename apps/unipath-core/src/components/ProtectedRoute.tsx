import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@unipath/tenant";
import { Loader2 } from "lucide-react";
import PageLoader from "@/components/common/PageLoader";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  anyOfRoles?: string[];
  requireSuperAdmin?: boolean;
  requireAdmin?: boolean;
  requireAgent?: boolean;
  allowedRoles?: string[];
}

function getRoleRedirect(role: string | null): string {
  switch (role) {
    case "super_admin":
    case "superadmin":
      return "/super-admin";
    case "admin":
    case "company_owner":
    case "owner":
    case "company_staff":
      return "/admin";
    case "moderator":
      return "/operator";
    default:
      return "/dashboard";
  }
}

const ProtectedRoute = ({
  children,
  requiredRole,
  anyOfRoles,
  requireSuperAdmin,
  requireAdmin,
  requireAgent,
  allowedRoles,
}: ProtectedRouteProps) => {
  const { user, loading, userRole, hasRole } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const { isImpersonating, endImpersonation } = useTenant();

  // Check if user is an agent (has entry in agents table)
  const { data: agentStatus, isLoading: agentLoading } = useQuery({
    queryKey: ["is-agent", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("agents")
        .select("id, is_active, status")
        .eq("user_id", user?.id)
        .maybeSingle();
      if (error) return { isAgent: false, isPending: false };
      if (!data) return { isAgent: false, isPending: false };
      if (data.is_active && data.status === "verified") return { isAgent: true, isPending: false };
      if (data.status === "pending") return { isAgent: false, isPending: true };
      return { isAgent: false, isPending: false };
    },
    enabled: !!user?.id && !!requireAgent,
  });

  if (loading || (requireAgent && agentLoading)) {
    return <PageLoader size="lg" text="Yuklanmoqda..." />;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // ROOT DOMAIN SECURITY CHECK: 
  // Regular users (students/agents) are NOT allowed on the root domain!
  // Super admins and Business owners/admins are allowed, but they must be
  // redirected to their respective hubs (Super-Admin Panel or Owner Hub).
  const isRootDomain = 
    window.location.hostname === 'unipath.me' || 
    window.location.hostname === 'www.unipath.me' || 
    window.location.hostname === 'unipath.uz' || 
    window.location.hostname === 'www.unipath.uz' || 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.hostname.includes('vercel.app');

  if (isRootDomain) {
    const isSuperAdmin = hasRole("super_admin") || hasRole("superadmin");
    const isOwnerOrAdmin = isSuperAdmin || hasRole("owner") || hasRole("admin") || hasRole("company_owner");
      
    if (!isOwnerOrAdmin) {
      return <Navigate to="/auth?error=wrong_domain" replace />;
    }

    // Block tenant-specific routes on the root domain
    const isTenantSpecificRoute = 
      location.pathname.startsWith('/student') || 
      location.pathname.startsWith('/agent') || 
      location.pathname.startsWith('/accountant');

    if (isTenantSpecificRoute) {
      if (isSuperAdmin) {
        return <Navigate to="/super-admin" replace />;
      } else {
        return <Navigate to="/hub" replace />;
      }
    }

    // Clear active tenant if navigating back to main entry portals
    if (isSuperAdmin && location.pathname.startsWith('/super-admin')) {
      localStorage.removeItem('active_tenant');
      if (isImpersonating) {
        endImpersonation();
      }
    } else if (!isSuperAdmin && location.pathname === '/hub') {
      localStorage.removeItem('active_tenant');
    }

    const hasActiveTenant = !!localStorage.getItem('active_tenant');

    if (!hasActiveTenant) {
      if (isSuperAdmin) {
        // Super admin must go to super-admin dashboard
        if (!location.pathname.startsWith('/super-admin')) {
          return <Navigate to="/super-admin" replace />;
        }
      } else {
        // Business owner/admin must go to owner hub
        if (location.pathname !== '/hub' && location.pathname !== '/tizimlashtirish' && location.pathname !== '/onboarding') {
          return <Navigate to="/hub" replace />;
        }
      }
    }
  }

  // 1. Super Admin check
  if (requireSuperAdmin && !hasRole("super_admin") && !hasRole("superadmin")) {
    return <Navigate to="/dashboard" replace />;
  }

  // 2. Admin level check
  if (requireAdmin && !hasRole("admin") && !hasRole("super_admin") && !hasRole("superadmin") && !hasRole("company_owner") && !hasRole("owner")) {
    return <Navigate to="/dashboard" replace />;
  }

  // 3. Agent check
  if (requireAgent) {
    if (!agentStatus?.isAgent) {
      if (agentStatus?.isPending) {
        return <Navigate to="/dashboard" state={{ agentPending: true }} replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  // 4. Allowed Roles (exact match lists)
  if (allowedRoles && allowedRoles.length > 0) {
    if (!userRole || !allowedRoles.includes(userRole)) {
      const redirectPath = getRoleRedirect(userRole);
      if (location.pathname.startsWith(redirectPath)) {
        return <Navigate to="/dashboard" replace />;
      }
      return <Navigate to={redirectPath} replace />;
    }
  }

  // 5. Lovable Required/Any of Roles
  const accessDenied = anyOfRoles
    ? !anyOfRoles.some((r) => hasRole(r))
    : requiredRole && !hasRole(requiredRole);

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-background nova-grid-bg flex items-center justify-center p-6">
        <div className="glass-strong p-8 text-center max-w-sm">
          <h2 className="text-xl font-heading font-bold text-foreground mb-2">{t("common.access_denied")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("common.access_denied_desc")} <span className="text-primary font-semibold">{anyOfRoles?.join(" / ") || requiredRole}</span> {t("common.role_required")}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export { ProtectedRoute };
export default ProtectedRoute;
