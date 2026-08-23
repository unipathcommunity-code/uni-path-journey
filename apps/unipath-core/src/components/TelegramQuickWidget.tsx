import { useEffect, useState } from "react";
import { Send, CheckCircle2, AlertCircle, X, Wand2, Copy, ExternalLink, Loader2, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useApp } from "@/contexts/AppContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Each agency configures its own bot in Admin → Sozlamalar; this is the
// platform-wide fallback used until they do.
const DEFAULT_BOT_USERNAME = "unipath_bot";

interface BindingRow {
  id: string;
  username: string | null;
  bound_at: string;
}

/**
 * TelegramQuickWidget — compact, dashboard-friendly Telegram pairing card.
 *
 * Renders as a thin status banner that:
 *  - shows a green "Bog'langan" pill when the user already paired their account
 *  - shows an amber "Bog'lash" CTA otherwise → opens a modal with the full
 *    3-step pairing flow (open bot → get 6-digit code → /link <code>) so we
 *    don't pollute every dashboard with the big widget while still giving
 *    students/teachers/parents instant access from their main screen.
 *
 * The full TelegramBind widget on /profile is the canonical surface; this
 * is the entry-point that lives on the role dashboards.
 */
const TelegramQuickWidget = () => {
  const { user } = useAuth();
  const { activeTenant } = useApp();
  const botUsername =
    (activeTenant?.config?.branding?.telegram_bot_username || DEFAULT_BOT_USERNAME).replace(/^@/, "");
  const botLink = `https://t.me/${botUsername}`;
  const navigate = useNavigate();
  const [latest, setLatest] = useState<BindingRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const refresh = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("telegram_chats")
      .select("id, username, bound_at")
      .eq("user_id", user.id)
      .order("bound_at", { ascending: false })
      .limit(1);
    setLatest(((data as any) || [])[0] ?? null);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    if (!user) return;
    const ch = supabase
      .channel(`tg-quick-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "telegram_chats", filter: `user_id=eq.${user.id}` },
        () => {
          refresh();
          setOpen(false);
          setCode(null);
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  // Countdown for the active code
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
      if (diff <= 0) {
        setCode(null);
        setExpiresAt(null);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const generateCode = async () => {
    if (!user) return;
    setGenerating(true);
    const newCode = String(Math.floor(100000 + Math.random() * 900000));
    const exp = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("telegram_link_codes")
      .insert({ code: newCode, user_id: user.id, expires_at: exp });
    if (error) toast.error(error.message);
    else { setCode(newCode); setExpiresAt(exp); }
    setGenerating(false);
  };

  const copyCmd = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(`/link ${code}`);
    toast.success("Buyruq nusxalandi");
  };

  if (loading || !user) return null;
  const linked = !!latest;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeLeft = `${mins}:${secs.toString().padStart(2, "0")}`;

  return (
    <>
      <motion.button
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => (linked ? navigate("/profile") : setOpen(true))}
        className={`w-full glass rounded-xl px-3 py-2 flex items-center gap-2.5 border transition hover:scale-[1.005] active:scale-[0.99] ${
          linked
            ? "border-success/30 hover:border-success/50"
            : "border-warning/40 hover:border-warning/60"
        }`}
      >
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
          linked ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
        }`}>
          <Send className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground leading-none">
            Telegram
          </p>
          <p className="text-xs font-semibold truncate mt-0.5">
            {linked
              ? `${latest.username ? "@" + latest.username : "Bog'langan"} — boshqarish`
              : "Bildirishnomalarni Telegramga ulash"}
          </p>
        </div>
        {linked ? (
          <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
        ) : (
          <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-warning text-warning-foreground flex-shrink-0">
            Bog'lash
          </span>
        )}
      </motion.button>

      {/* Modal pairing wizard */}
      <AnimatePresence>
        {open && !linked && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-6"
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-2xl p-5 max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#229ED9] flex items-center justify-center">
                    <Send className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-heading font-bold">Telegramga ulash</h3>
                </div>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-muted/60">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {!code ? (
                <>
                  <ol className="space-y-2.5">
                    <Step n={1}>
                      <strong>Botni oching</strong>
                      <a href={botLink} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 ml-1 px-2 py-0.5 rounded bg-[#229ED9]/15 text-[#229ED9] text-xs font-mono font-semibold hover:bg-[#229ED9]/25">
                        <ExternalLink className="w-3 h-3" /> @{botUsername}
                      </a>
                    </Step>
                    <Step n={2}>Pastdagi tugmadan 6 raqamli kod oling.</Step>
                    <Step n={3}>Botga <code className="font-mono text-primary">/link &lt;kod&gt;</code> yozib yuboring.</Step>
                  </ol>
                  <button
                    onClick={generateCode}
                    disabled={generating}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm shadow-lg disabled:opacity-50"
                  >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    Bog'lash kodini olish
                  </button>
                </>
              ) : (
                <>
                  <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Kodingiz
                      </span>
                      <span className="text-[10px] font-mono font-bold text-warning">⏱ {timeLeft}</span>
                    </div>
                    <div className="text-center font-mono text-4xl font-black text-primary tracking-[0.4em]">
                      {code}
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
                      <MessageCircle className="w-3.5 h-3.5 text-[#229ED9] flex-shrink-0" />
                      <code className="font-mono text-xs flex-1 truncate">/link {code}</code>
                      <button onClick={copyCmd} className="p-1.5 rounded bg-primary text-primary-foreground hover:opacity-90">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <a href={botLink} target="_blank" rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#229ED9] text-white text-sm font-semibold">
                    <ExternalLink className="w-4 h-4" /> Botni ochish va kodni yuborish
                  </a>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    Bog'lanish kutilmoqda — bu oyna avtomatik yopiladi
                  </div>
                </>
              )}

              <button
                onClick={() => navigate("/profile")}
                className="w-full text-[11px] text-muted-foreground hover:text-foreground transition"
              >
                To'liq sozlamalar — Profile sahifasida
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <li className="flex gap-2.5 text-sm leading-relaxed">
    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
      {n}
    </span>
    <span className="flex-1 pt-0.5">{children}</span>
  </li>
);

export default TelegramQuickWidget;
