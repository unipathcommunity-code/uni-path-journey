import { useEffect, useState } from "react";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface BindingRow {
  id: string;
  username: string | null;
  bound_at: string;
  notifications_enabled: boolean;
}

/**
 * Compact real-time Telegram link status.
 * Subscribes to telegram_chats inserts/updates/deletes for the current user.
 */
const TelegramStatus = () => {
  const { user } = useAuth();
  const [latest, setLatest] = useState<BindingRow | null>(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("telegram_chats")
      .select("id, username, bound_at, notifications_enabled")
      .eq("user_id", user.id)
      .order("bound_at", { ascending: false });
    const rows = (data as BindingRow[]) || [];
    setLatest(rows[0] ?? null);
    setCount(rows.length);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    if (!user) return;
    const ch = supabase
      .channel(`tg-status-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "telegram_chats", filter: `user_id=eq.${user.id}` },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const linked = !!latest;

  // Loading skeleton
  if (loading) {
    return (
      <div className="glass p-3 rounded-xl flex items-center gap-3 animate-pulse">
        <div className="w-9 h-9 rounded-lg bg-muted/50" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-24 rounded bg-muted/50" />
          <div className="h-2.5 w-40 rounded bg-muted/40" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass p-3 rounded-xl flex items-center gap-3 border ${
        linked ? "border-success/30" : "border-warning/30"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
          linked ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
        }`}
      >
        <Send className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Telegram
          </span>
          {linked ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Bog'langan
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-warning">
              <span className="w-1.5 h-1.5 rounded-full bg-warning" />
              Bog'lanmagan
            </span>
          )}
        </div>
        {linked ? (
          <p className="text-xs text-foreground truncate">
            {latest.username ? `@${latest.username}` : "Akkount"}
            <span className="text-muted-foreground">
              {" · "}
              {formatRelative(latest.bound_at)}
            </span>
            {count > 1 && (
              <span className="text-muted-foreground"> · +{count - 1}</span>
            )}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground truncate">
            Pastdan kod oling — bildirishnomalar Telegramga keladi
          </p>
        )}
      </div>
      {linked ? (
        <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" />
      )}
    </motion.div>
  );
};

function formatRelative(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "hozirgina";
  if (min < 60) return `${min} daq. oldin`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} soat oldin`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} kun oldin`;
  return new Date(iso).toLocaleDateString();
}

export default TelegramStatus;
