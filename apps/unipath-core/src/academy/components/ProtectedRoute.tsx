import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "superadmin" | "owner" | "admin" | "teacher" | "student" | "parent" | "accountant";
  /** If provided, ANY of these roles grants access. Takes precedence over requiredRole. */
  anyOfRoles?: Array<"superadmin" | "owner" | "admin" | "teacher" | "student" | "parent" | "accountant">;
}

const ProtectedRoute = ({ children, requiredRole, anyOfRoles }: ProtectedRouteProps) => {
  const { user, loading, hasRole } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

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

export default ProtectedRoute;
