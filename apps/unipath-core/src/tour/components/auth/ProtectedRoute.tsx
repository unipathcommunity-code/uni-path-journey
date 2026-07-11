import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import UniTourLoader from "@/components/common/UniTourLoader";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireAgent?: boolean;
}

// Unified platform role groups (same as core useUserRole).
const ADMIN_ROLES = ["super_admin", "admin", "owner", "manager", "accountant"];
const AGENT_ROLES = ["agent", "specialist", "mentor"];

const ProtectedRoute = ({ children, allowedRoles, requireAgent }: ProtectedRouteProps) => {
  const { user, loading, userRole } = useAuth();
  const location = useLocation();

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
    return <UniTourLoader size="lg" text="Yuklanmoqda..." />;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Agent-specific route protection
  if (requireAgent) {
    if (!agentStatus?.isAgent) {
      if (agentStatus?.isPending) {
        // Agent is pending verification — redirect to dashboard with info
        return <Navigate to="/dashboard" state={{ agentPending: true }} replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Role-based access check
  if (allowedRoles && allowedRoles.length > 0) {
    if (!userRole || !allowedRoles.includes(userRole)) {
      // Redirect to the appropriate panel based on actual role
      const redirectPath = getRoleRedirect(userRole);
      
      // Prevent redirect loops — if already at the redirect target, show 403
      if (location.pathname.startsWith(redirectPath)) {
        return <Navigate to="/dashboard" replace />;
      }
      
      return <Navigate to={redirectPath} replace />;
    }
  }

  return <>{children}</>;
};

function getRoleRedirect(role: string | null): string {
  if (role && ADMIN_ROLES.includes(role)) return "/admin";
  if (role && AGENT_ROLES.includes(role)) return "/agent";
  return "/dashboard";
}

export default ProtectedRoute;
