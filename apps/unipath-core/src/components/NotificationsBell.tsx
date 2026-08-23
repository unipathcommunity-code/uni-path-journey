import { useEffect, useState } from "react";
import { Bell, X, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Notif {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Universal real-time notifications bell — usable in any role's dashboard header.
 */
const NotificationsBell = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id, title, message, type, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setItems((data as Notif[]) || []);
  };

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase
      .channel(`bell-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as Notif;
          setItems((prev) => [n, ...prev].slice(0, 20));
          toast(n.title, { description: n.message });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const unread = items.filter((n) => !n.is_read).length;

  const dismiss = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  };

  const dismissAll = async () => {
    const ids = items.filter((n) => !n.is_read).map((n) => n.id);
    if (ids.length === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase.from("notifications").update({ is_read: true }).in("id", ids);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="glass p-2 rounded-xl hover:bg-muted/40 transition relative"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              className="absolute right-0 top-12 z-50 w-80 glass-strong rounded-2xl p-3 shadow-xl shadow-primary/10 max-h-[70vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-1 mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Bildirishnomalar
                </p>
                {unread > 0 && (
                  <button
                    onClick={dismissAll}
                    className="text-[10px] text-primary font-semibold hover:underline"
                  >
                    Hammasini o'qildi
                  </button>
                )}
              </div>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Bildirishnomalar yo'q
                </p>
              ) : (
                <div className="space-y-1.5">
                  {items.map((n) => {
                    const Icon =
                      false
                        ? AlertTriangle
                        : n.type === "success"
                          ? CheckCircle2
                          : Info;
                    const colorClass = false
                      ? "text-destructive"
                      : n.type === "success"
                        ? "text-success"
                        : "text-primary";
                    return (
                      <div
                        key={n.id}
                        className={`flex items-start gap-2 p-2 rounded-lg transition ${
                          n.is_read ? "opacity-60" : "bg-muted/20"
                        }`}
                      >
                        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colorClass}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {n.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground line-clamp-2">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {timeAgo(n.created_at)}
                          </p>
                        </div>
                        {!n.is_read && (
                          <button
                            onClick={() => dismiss(n.id)}
                            className="p-1 rounded hover:bg-muted/40"
                            aria-label="Dismiss"
                          >
                            <X className="w-3 h-3 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "hozir";
  if (min < 60) return `${min} daq.`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} soat`;
  const d = Math.floor(h / 24);
  return `${d} kun`;
}

export default NotificationsBell;
