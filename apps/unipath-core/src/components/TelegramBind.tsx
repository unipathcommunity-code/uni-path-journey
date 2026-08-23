import { useEffect, useState } from "react";
import { Send, Check, Copy, Loader2, Wand2, Bot, ExternalLink, MessageCircle, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import FeatureGate from "@/components/FeatureGate";

interface Binding {
  id: string;
  chat_id: number;
  username: string | null;
  notifications_enabled: boolean;
  bound_at: string;
}

const BOT_USERNAME = "unipath_bot"; // fallback; agencies set their own in Admin → Sozlamalar
const BOT_LINK = `https://t.me/${BOT_USERNAME}`;

/**
 * TelegramBind — visual, step-by-step Telegram pairing.
 *
 * Why this redesign?
 *   The previous version dumped the steps into a plain ordered list which
 *   left users staring at "ID kiritsin qaerga?". The new flow guides them
 *   visually: open the bot → copy /link <code> → wait for realtime confirm.
 *   The big numbered cards mirror Telegram's own onboarding so non-tech
 *   users instantly know where to tap.
 */
const TelegramBind = () => {
  const { user } = useAuth();
  const [bindings, setBindings] = useState<Binding[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState<string | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("telegram_chats")
      .select("*")
      .eq("user_id", user.id)
      .order("bound_at", { ascending: false });
    setBindings((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  // Countdown for the 15-min code
  useEffect(() => {
    if (!codeExpiresAt) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(codeExpiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
      if (diff <= 0) {
        setCode(null);
        setCodeExpiresAt(null);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [codeExpiresAt]);

  // Realtime: bot inserts a new binding for me → close the wizard
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`tg-bind-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "telegram_chats", filter: `user_id=eq.${user.id}` },
        () => {
          toast.success("✅ Telegram akkounti bog'landi!");
          setCode(null);
          setCodeExpiresAt(null);
          load();
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const generateCode = async () => {
    if (!user) return;
    setGenerating(true);
    const newCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("telegram_link_codes")
      .insert({ code: newCode, user_id: user.id, expires_at: expiresAt });
    if (error) {
      toast.error(error.message);
    } else {
      setCode(newCode);
      setCodeExpiresAt(expiresAt);
      toast.success("Kod yaratildi — endi botga yuboring");
    }
    setGenerating(false);
  };

  const copyCommand = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(`/link ${code}`);
    toast.success("Buyruq nusxalandi — botga joylang");
  };

  const copyJustCode = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    toast.success("Faqat kod nusxalandi");
  };

  const toggle = async (b: Binding) => {
    const { error } = await supabase
      .from("telegram_chats")
      .update({ notifications_enabled: !b.notifications_enabled })
      .eq("id", b.id);
    if (error) toast.error(error.message); else load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("telegram_chats").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("O'chirildi"); load(); }
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeLeft = `${mins}:${secs.toString().padStart(2, "0")}`;

  return (
    <FeatureGate feature="telegram_bot">
      <div className="glass-strong p-5 sm:p-6 rounded-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#229ED9] to-[#1d8ec5] flex items-center justify-center shadow-md">
            <Send className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-base">Telegram bildirishnomalar</h3>
            <p className="text-xs text-muted-foreground">
              Darslar, baholar va to'lovlar haqida xabarlar to'g'ridan-to'g'ri Telegramga keladi
            </p>
          </div>
        </div>

        {/* No bindings yet → onboarding wizard */}
        {!loading && bindings.length === 0 && !code && (
          <div className="space-y-3">
            <StepCard
              n={1}
              title="Botni oching"
              desc={`Telegramda @${BOT_USERNAME} ni oching va "Start" tugmasini bosing.`}
              cta={
                <a
                  href={BOT_LINK}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 rounded-lg bg-[#229ED9] text-white text-xs font-semibold hover:opacity-90 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> @{BOT_USERNAME}
                </a>
              }
            />
            <StepCard
              n={2}
              title="Kod oling"
              desc="Pastdagi tugmani bosing — sizga 6 raqamli maxfiy kod beriladi (15 daqiqa amal qiladi)."
            />
            <StepCard
              n={3}
              title="Botga yuboring"
              desc="Kodni botga /link 123456 shaklida yuboring. Bog'langaningizdan so'ng bu sahifa avtomatik yangilanadi."
            />

            <button
              onClick={generateCode}
              disabled={generating}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm shadow-lg hover:opacity-95 transition disabled:opacity-50 active:scale-[0.99]"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              Bog'lash kodini olish
            </button>
          </div>
        )}

        {/* Active code → big visual card with copy + countdown + waiting indicator */}
        <AnimatePresence>
          {code && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-5 space-y-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-primary" />
                  <span className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
                    Sizning kodingiz
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-warning">
                  ⏱ {timeLeft}
                </span>
              </div>

              <button
                onClick={copyJustCode}
                className="w-full text-center font-mono text-4xl sm:text-5xl font-black text-primary tracking-[0.4em] py-2 hover:bg-primary/5 rounded-xl transition"
                title="Kodni nusxalash"
              >
                {code}
              </button>

              <div className="rounded-xl bg-muted/50 p-3 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#229ED9] flex-shrink-0" />
                <code className="font-mono text-sm font-semibold flex-1 truncate">/link {code}</code>
                <button
                  onClick={copyCommand}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition active:scale-95"
                >
                  <Copy className="w-3 h-3" /> Nusxa
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={BOT_LINK}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#229ED9] text-white text-sm font-semibold hover:opacity-90 transition active:scale-[0.99]"
                >
                  <ExternalLink className="w-4 h-4" /> Botni ochish
                </a>
                <div className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-muted/40 text-xs text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  Bog'lanish kutilmoqda…
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                💡 <strong>Yordam:</strong> Kodni nusxalang → @{BOT_USERNAME} ga o'ting → xabar oynasiga qo'ying →
                yuborish tugmasini bosing. Bog'langan zahoti bu oyna avtomatik yopiladi.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {loading && (
          <div className="text-center py-4"><Loader2 className="w-5 h-5 text-primary animate-spin inline" /></div>
        )}

        {/* Existing bindings */}
        {!loading && bindings.length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
              Bog'langan akkountlar
            </div>
            {bindings.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#229ED9]/15 flex items-center justify-center flex-shrink-0">
                    <Send className="w-4 h-4 text-[#229ED9]" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono text-sm font-semibold truncate">
                      {b.username ? `@${b.username}` : `Chat #${b.chat_id}`}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(b.bound_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => toggle(b)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      b.notifications_enabled
                        ? "bg-success/20 text-success hover:bg-success/30"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    {b.notifications_enabled ? <><Check className="w-3 h-3 inline -mt-0.5" /> Yoq.</> : "O'ch."}
                  </button>
                  <button
                    onClick={() => remove(b.id)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20 transition"
                  >
                    O'chirish
                  </button>
                </div>
              </div>
            ))}
            {!code && (
              <button
                onClick={generateCode}
                disabled={generating}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-dashed border-border hover:bg-muted/40 transition flex items-center justify-center gap-1.5"
              >
                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                Yana akkount bog'lash
              </button>
            )}
          </div>
        )}
      </div>
    </FeatureGate>
  );
};

/* ── Reusable numbered step card ─────────────────────────────────── */
const StepCard = ({
  n, title, desc, cta,
}: { n: number; title: string; desc: string; cta?: React.ReactNode }) => (
  <div className="flex gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/40">
    <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
      {n}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold leading-tight">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
      {cta}
    </div>
  </div>
);

export default TelegramBind;
