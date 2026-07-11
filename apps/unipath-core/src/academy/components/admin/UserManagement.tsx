import { motion } from "framer-motion";
import { UserCog, Shield, ChevronDown } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { useApp } from "@/contexts/AppContext";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

// Map academy role names to the unified platform role + pick the highest one for
// tenant_memberships (single role per user per tenant, which the router reads).
const ROLE_RANK: Record<string, number> = {
  super_admin: 100, superadmin: 100, owner: 90, admin: 80, manager: 70,
  accountant: 60, teacher: 50, mentor: 45, agent: 40, specialist: 35,
  parent: 20, student: 10, member: 5,
};
const mapRole = (r: string) => (r === "superadmin" ? "super_admin" : r);
const pickTopRole = (roles: string[]) => {
  if (!roles.length) return "student";
  return roles.map(mapRole).sort((a, b) => (ROLE_RANK[b] ?? 30) - (ROLE_RANK[a] ?? 30))[0];
};

interface UserWithRoles {
  id: string;
  user_id: string;
  full_name: string | null;
  roles: AppRole[];
}

interface UserManagementProps {
  users: UserWithRoles[];
  onRefresh: () => void;
}

const ALL_ROLES: AppRole[] = ["owner", "admin", "teacher", "student", "parent", "accountant"];

const roleBadgeColors: Record<AppRole, string> = {
  superadmin: "bg-destructive/30 text-destructive",
  owner: "bg-primary/30 text-primary",
  admin: "bg-destructive/20 text-destructive",
  teacher: "bg-primary/20 text-primary",
  student: "bg-accent/20 text-accent",
  parent: "bg-warning/20 text-warning",
  accountant: "bg-secondary/30 text-secondary-foreground",
};

const UserManagement = ({ users, onRefresh }: UserManagementProps) => {
  const { t } = useLanguage();
  const { activeTenant } = useApp();
  const tid = activeTenant?.id;
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const toggleRole = async (userId: string, role: AppRole, hasRole: boolean) => {
    setUpdating(true);
    try {
      // Academy's own org-scoped list (kept for the multi-role display) — now
      // tenant-scoped via organization_id so roles no longer go global.
      if (hasRole) {
        await supabase.from("user_roles").delete()
          .eq("user_id", userId).eq("role", role).eq("organization_id", tid as any);
      } else {
        await (supabase as any).from("user_roles")
          .insert({ user_id: userId, role, organization_id: tid });
      }

      // Unified source of truth the router reads: set the membership to the user's
      // highest remaining role for THIS tenant.
      const current = users.find((u) => u.user_id === userId)?.roles ?? [];
      const next = hasRole ? current.filter((r) => r !== role) : [...current, role];
      const topRole = pickTopRole(next as string[]);
      if (tid) {
        await (supabase as any).from("tenant_memberships")
          .upsert({ user_id: userId, tenant_id: tid, role: topRole, status: "active" },
                  { onConflict: "user_id,tenant_id" });
      }

      toast.success(`Role ${hasRole ? "removed" : "assigned"}`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-strong p-6"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <UserCog className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-lg font-heading font-semibold">{t("admin.user_management")}</h2>
        <span className="ml-auto text-xs text-muted-foreground">{users.length} {t("admin.users_count")}</span>
      </div>

      {users.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">{t("admin.no_users")}</p>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {users.map((user) => (
            <div key={user.user_id} className="rounded-xl border border-border bg-muted/20 overflow-hidden">
              <button
                onClick={() => setExpandedUser(expandedUser === user.user_id ? null : user.user_id)}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted/30 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.full_name || "Unnamed User"}
                  </p>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    {user.roles.map((role) => (
                      <span key={role} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${roleBadgeColors[role]}`}>
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedUser === user.user_id ? "rotate-180" : ""}`} />
              </button>

              {expandedUser === user.user_id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="px-4 pb-4 border-t border-border pt-3"
                >
                  <p className="text-xs text-muted-foreground mb-3">{t("admin.toggle_roles")}</p>
                  <div className="flex gap-2 flex-wrap">
                    {ALL_ROLES.map((role) => {
                      const has = user.roles.includes(role);
                      return (
                        <button
                          key={role}
                          disabled={updating}
                          onClick={() => toggleRole(user.user_id, role, has)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                            has
                              ? `${roleBadgeColors[role]} border border-current/20`
                              : "bg-muted/50 text-muted-foreground border border-border hover:bg-muted"
                          }`}
                        >
                          {has ? "✓ " : ""}{role}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default UserManagement;
