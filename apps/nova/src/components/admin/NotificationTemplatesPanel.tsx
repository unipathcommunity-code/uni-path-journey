import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MessageSquare, Save, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

/** Admin: Telegram/in-app xabar shablonlarini sozlash. */
type Kind = "charge_created" | "debt_reminder_student" | "debt_reminder_parent" | "payment_receipt";
type Channel = "telegram" | "inapp";

const KINDS: { value: Kind; label: string; defaultTitle: string; defaultBody: string }[] = [
  {
    value: "charge_created",
    label: "Yangi qarz yozilganda",
    defaultTitle: "💳 Yangi to'lov majburiyati",
    defaultBody: "{{subject}} uchun {{amount}} {{currency}} qarz yozildi. Iltimos, {{due_date}} gacha to'lang.",
  },
  {
    value: "debt_reminder_student",
    label: "Qarz eslatmasi (talaba)",
    defaultTitle: "💳 To'lov eslatmasi",
    defaultBody: "Hurmatli {{student_name}}, {{subject}} uchun {{remain}} {{currency}} qarzingiz mavjud.",
  },
  {
    value: "debt_reminder_parent",
    label: "Qarz eslatmasi (ota-ona)",
    defaultTitle: "💳 Farzandingizning qarzi",
    defaultBody: "{{student_name}} — {{subject}} fani uchun {{remain}} {{currency}} qarz bor.",
  },
  {
    value: "payment_receipt",
    label: "To'lov qabul qilindi (chek)",
    defaultTitle: "✅ To'lov qabul qilindi",
    defaultBody: "{{amount}} {{currency}} qabul qilindi. Qoldiq qarz: {{remain}} {{currency}}. Rahmat!",
  },
];

const CHANNELS: { value: Channel; label: string }[] = [
  { value: "telegram", label: "Telegram" },
  { value: "inapp", label: "Ilova" },
];

const VARS = ["{{student_name}}", "{{subject}}", "{{amount}}", "{{currency}}", "{{remain}}", "{{due_date}}", "{{period}}"];

const NotificationTemplatesPanel = () => {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [kind, setKind] = useState<Kind>("charge_created");
  const [channel, setChannel] = useState<Channel>("telegram");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);

  const { data: templates = [] } = useQuery({
    queryKey: ["notif-templates", profile?.organization_id],
    queryFn: async () => {
      const { data } = await supabase.from("notification_templates").select("*");
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  useEffect(() => {
    const def = KINDS.find((k) => k.value === kind)!;
    const existing = templates.find((t: any) => t.kind === kind && t.channel === channel);
    setTitle(existing?.title ?? def.defaultTitle);
    setBody(existing?.body ?? def.defaultBody);
    setIsEnabled(existing?.is_enabled ?? true);
  }, [kind, channel, templates]);

  const save = async () => {
    if (!profile?.organization_id) return;
    const existing = templates.find((t: any) => t.kind === kind && t.channel === channel);
    const payload = {
      organization_id: profile.organization_id,
      kind, channel, title, body, is_enabled: isEnabled,
    };
    const { error } = existing
      ? await supabase.from("notification_templates").update(payload).eq("id", existing.id)
      : await supabase.from("notification_templates").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Shablon saqlandi");
    qc.invalidateQueries({ queryKey: ["notif-templates"] });
  };

  const resetDefault = () => {
    const def = KINDS.find((k) => k.value === kind)!;
    setTitle(def.defaultTitle);
    setBody(def.defaultBody);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-strong p-4 rounded-2xl space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center"><MessageSquare className="w-4 h-4 text-primary" /></div>
        <div>
          <h3 className="font-semibold text-sm">Xabar shablonlari</h3>
          <p className="text-[10px] text-muted-foreground">Telegram va ilova bildirishnomalarini moslashtiring</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select value={kind} onChange={(e) => setKind(e.target.value as Kind)} className="glass px-2 py-1.5 rounded-lg text-xs bg-background">
          {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
        <select value={channel} onChange={(e) => setChannel(e.target.value as Channel)} className="glass px-2 py-1.5 rounded-lg text-xs bg-background">
          {CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sarlavha"
        className="w-full glass px-3 py-2 rounded-lg text-sm bg-background" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Xabar matni" rows={4}
        className="w-full glass px-3 py-2 rounded-lg text-sm bg-background resize-none" />

      <div className="flex flex-wrap gap-1">
        {VARS.map((v) => (
          <button key={v} onClick={() => setBody((b) => b + " " + v)}
            className="text-[10px] glass px-1.5 py-0.5 rounded hover:bg-primary/10 text-primary">{v}</button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} />
        Yoqilgan
      </label>

      <div className="flex gap-2">
        <button onClick={save} className="flex-1 glass px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-1 bg-primary/10 text-primary">
          <Save className="w-3.5 h-3.5" /> Saqlash
        </button>
        <button onClick={resetDefault} className="glass px-3 py-2 rounded-lg text-xs flex items-center gap-1">
          <RotateCcw className="w-3.5 h-3.5" /> Standart
        </button>
      </div>

      <div className="glass p-2 rounded-lg text-[10px] text-muted-foreground">
        <b>Oldindan ko'rish:</b><br />
        <span className="font-medium text-foreground">{title.replace(/\{\{(\w+)\}\}/g, (_, k) => ({
          student_name: "Behruz Hasanov", subject: "Ingliz tili", amount: "350 000", currency: "UZS",
          remain: "350 000", due_date: "2026-05-01", period: "2026-04",
        } as any)[k] || _)}</span><br />
        <span>{body.replace(/\{\{(\w+)\}\}/g, (_, k) => ({
          student_name: "Behruz Hasanov", subject: "Ingliz tili", amount: "350 000", currency: "UZS",
          remain: "350 000", due_date: "2026-05-01", period: "2026-04",
        } as any)[k] || _)}</span>
      </div>
    </motion.div>
  );
};

export default NotificationTemplatesPanel;
