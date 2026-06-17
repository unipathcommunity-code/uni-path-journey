import { motion } from "framer-motion";
import { UserCog, Shield, ChevronDown } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

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
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const toggleRole = async (userId: string, role: AppRole, hasRole: boolean) => {
    setUpdating(true);
    try {
      if (hasRole) {
        await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      } else {
        await supabase.from("user_roles").insert({ user_id: userId, role });
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
