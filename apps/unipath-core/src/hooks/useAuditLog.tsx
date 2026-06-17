import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type ActionType = "create" | "update" | "delete" | "view" | "assign" | "revoke" | "login" | "logout";
type EntityType = "user" | "agent" | "booking" | "document" | "tour" | "notification" | "settings";

interface LogOptions {
  actionType: ActionType;
  entityType: EntityType;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export const useAuditLog = () => {
  const { user } = useAuth();

  const log = async (options: LogOptions) => {
    if (!user) return;

    try {
      const { error } = await (supabase as any)
        .from("audit_logs")
        .insert({
          user_id: user.id,
          action_type: options.actionType,
          entity_type: options.entityType,
          entity_id: options.entityId,
          old_values: options.oldValues,
          new_values: options.newValues,
          metadata: options.metadata,
          user_agent: navigator.userAgent,
        });

      if (error) {
        console.error("Failed to log audit:", error);
      }
    } catch (err) {
      console.error("Audit log error:", err);
    }
  };

  return { log };
};

// Standalone function for use outside React components
export const logAudit = async (
  userId: string,
  options: Omit<LogOptions, "userId">
) => {
  try {
    const { error } = await (supabase as any)
      .from("audit_logs")
      .insert({
        user_id: userId,
        action_type: options.actionType,
        entity_type: options.entityType,
        entity_id: options.entityId,
        old_values: options.oldValues,
        new_values: options.newValues,
        metadata: options.metadata,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "server",
      });

    if (error) {
      console.error("Failed to log audit:", error);
    }
  } catch (err) {
    console.error("Audit log error:", err);
  }
};
