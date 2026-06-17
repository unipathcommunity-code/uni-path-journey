import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Eye, Loader2, MessageSquare, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Mode = "preview" | "send";

const JadvalPreview = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>("preview");
  const [loading, setLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [sentInfo, setSentInfo] = useState<{ chatId: number | null } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const run = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg(null);
    setSentInfo(null);
    try {
      const { data, error } = await supabase.functions.invoke("jadval-preview", {
        body: { send: mode === "send" },
      });
      if (error) throw error;
      const payload = data as { preview: string; sent: boolean; chat_id: number | null; error?: string };
      setPreviewHtml(payload.preview ?? null);
      if (payload.error) {
        setErrorMsg(payload.error);
        toast.error(payload.error);
      } else if (payload.sent) {
        setSentInfo({ chatId: payload.chat_id });
        toast.success(t("teacher.jadval_sent") || "Telegramga yuborildi");
      } else {
        toast.success(t("teacher.jadval_previewed") || "Preview tayyor");
      }
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong p-5 rounded-2xl space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-accent" />
            {t("teacher.jadval_preview_title") || "Telegram /jadval preview"}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {t("teacher.jadval_preview_desc") ||
              "Bugungi darslaringizni Telegram bot formatida ko'ring va o'zingizning chatga sinab yuboring."}
          </p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="glass rounded-xl p-1 flex gap-1">
        <button
          onClick={() => setMode("preview")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            mode === "preview"
              ? "bg-gradient-to-br from-accent to-primary text-primary-foreground shadow-md shadow-accent/30"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          {t("teacher.preview_only") || "Faqat ko'rish"}
        </button>
        <button
          onClick={() => setMode("send")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            mode === "send"
              ? "bg-gradient-to-br from-success to-accent text-primary-foreground shadow-md shadow-success/30"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          {t("teacher.send_to_telegram") || "Telegramga yuborish"}
        </button>
      </div>

      <button
        onClick={run}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold text-sm shadow-md shadow-primary/30 hover:opacity-95 transition disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t("common.loading") || "Yuklanmoqda..."}
          </>
        ) : previewHtml ? (
          <>
            <RefreshCw className="w-4 h-4" />
            {mode === "send"
              ? t("teacher.regenerate_send") || "Qayta yuborish"
              : t("teacher.regenerate_preview") || "Yangilash"}
          </>
        ) : (
          <>
            {mode === "send" ? <Send className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {mode === "send"
              ? t("teacher.send_to_telegram") || "Telegramga yuborish"
              : t("teacher.show_preview") || "Preview ko'rsatish"}
          </>
        )}
      </button>

      {/* Preview output — render Telegram HTML safely (only <b>, <code>, <i>, <br>) */}
      {previewHtml && (
        <div className="glass rounded-xl p-4 border border-border/50">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3" />
            {t("teacher.bot_preview") || "Bot ko'rinishi"}
          </div>
          <pre
            className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed"
            // Telegram HTML output is generated server-side from a fixed template
            // (titles + topics from our own DB). Sanitize-light: strip <script>/<style>.
            dangerouslySetInnerHTML={{
              __html: previewHtml.replace(/<\/?(script|style|iframe|img|svg)[^>]*>/gi, ""),
            }}
          />
        </div>
      )}

      {sentInfo && (
        <div className="text-xs text-success flex items-center gap-1.5">
          <Send className="w-3 h-3" />
          {t("teacher.sent_to_chat") || "Yuborildi:"} #{sentInfo.chatId}
        </div>
      )}

      {errorMsg && (
        <div className="text-xs text-destructive">{errorMsg}</div>
      )}
    </motion.div>
  );
};

export default JadvalPreview;
