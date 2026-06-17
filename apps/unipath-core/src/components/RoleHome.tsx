import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/**
 * RoleHome — single landing route after login. Sends each user to the
 * dashboard that matches their PRIMARY role so panels never bleed into
 * each other.
 *
 *  superadmin → /superadmin
 *  owner      → /owner
 *  admin      → /admin
 *  accountant → /accountant
 *  teacher    → /teacher
 *  parent     → /parent
 *  student    → renders its child (StudentDashboard)
 *
 * Superadmins also see student panel only when they explicitly visit /app
 * after a redirect from another panel — the hook puts platform first.
 */
const RoleHome = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, roles } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const impersonatedTenantRaw = localStorage.getItem('active_tenant');
  const impersonatedTenant = impersonatedTenantRaw ? (() => { try { return JSON.parse(impersonatedTenantRaw); } catch { return null; } })() : null;

  if (impersonatedTenant && (roles.includes("superadmin") || roles.includes("super_admin"))) {
    let vertical = impersonatedTenant.business_type || impersonatedTenant.config?.business_type || impersonatedTenant.vertical || 'consulting';
    vertical = String(vertical).toLowerCase().trim();
    if (vertical === 'nova' || vertical === 'edu') vertical = 'academy';
    if (vertical === 'unitour' || vertical === 'tour_farm' || vertical === 'travel') vertical = 'tour';

    if (vertical === 'academy') return <Navigate to="/admin" replace />;
    if (vertical === 'tour') return <Navigate to="/company" replace />;
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Priority order: highest authority first
  if (roles.includes("superadmin")) return <Navigate to="/superadmin" replace />;
  if (roles.includes("owner")) return <Navigate to="/owner" replace />;
  if (roles.includes("admin")) return <Navigate to="/admin" replace />;
  if (roles.includes("accountant")) return <Navigate to="/accountant" replace />;
  if (roles.includes("teacher")) return <Navigate to="/teacher" replace />;
  if (roles.includes("parent")) return <Navigate to="/parent" replace />;

  // Student (or no role yet) → render the student dashboard
  return <>{children}</>;
};

export default RoleHome;
