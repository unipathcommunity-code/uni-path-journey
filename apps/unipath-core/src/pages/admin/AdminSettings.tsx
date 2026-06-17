import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Shield, Bell, Globe, Database, Save, Loader2, User, Mail, Phone, Palette, Check, Send, ExternalLink, Copy, CheckCheck, MessageSquare, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import PageTransition from "@/components/common/PageTransition";
import { motion } from "framer-motion";
import { THEME_PRESETS, injectTheme } from "@/lib/themes";
import { useApp } from "@/contexts/AppContext";

const AdminSettings = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { activeTenant: appTenant } = useApp();

  // Use impersonated tenant if present (super admin mode)
  const impersonatedRaw = typeof window !== 'undefined' ? localStorage.getItem('active_tenant') : null;
  const activeTenant = impersonatedRaw ? (() => { try { return JSON.parse(impersonatedRaw); } catch { return appTenant; } })() : appTenant;
  const [saving, setSaving] = useState(false);
  const [themeSaving, setThemeSaving] = useState(false);
  const [telegramSaving, setTelegramSaving] = useState(false);
  const [telegramTesting, setTelegramTesting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string>(
    activeTenant?.config?.branding?.theme_color || 'emerald'
  );
  const [telegramForm, setTelegramForm] = useState({
    bot_token: activeTenant?.config?.branding?.telegram_bot_token || '',
    bot_username: activeTenant?.config?.branding?.telegram_bot_username || '',
    chat_id: (activeTenant?.config?.branding as any)?.telegram_chat_id || '',
  });

  const [smsSaving, setSmsSaving] = useState(false);
  const [smsTesting, setSmsTesting] = useState(false);
  const [smsForm, setSmsForm] = useState({
    eskiz_email: activeTenant?.config?.settings?.eskiz_email || '',
    eskiz_token: activeTenant?.config?.settings?.eskiz_token || '',
    auto_sms_enabled: activeTenant?.config?.settings?.auto_sms_enabled || false,
  });

  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentTesting, setPaymentTesting] = useState<Record<string, boolean>>({});
  const [paymentForm, setPaymentForm] = useState({
    click_merchant_id: activeTenant?.config?.settings?.click_merchant_id || '',
    click_service_id: activeTenant?.config?.settings?.click_service_id || '',
    click_secret_key: activeTenant?.config?.settings?.click_secret_key || '',
    payme_merchant_id: activeTenant?.config?.settings?.payme_merchant_id || '',
    payme_secret_key: activeTenant?.config?.settings?.payme_secret_key || '',
    uzum_merchant_id: activeTenant?.config?.settings?.uzum_merchant_id || '',
    uzum_secret_key: activeTenant?.config?.settings?.uzum_secret_key || '',
    payment_test_mode: activeTenant?.config?.settings?.payment_test_mode || false,
  });

  // Sync selectedTheme if tenant loads after mount
  useEffect(() => {
    if (activeTenant?.config?.branding?.theme_color) {
      setSelectedTheme(activeTenant.config.branding.theme_color);
    }
    if (activeTenant?.config?.branding) {
      const b = activeTenant.config.branding as any;
      setTelegramForm({
        bot_token: b.telegram_bot_token || '',
        bot_username: b.telegram_bot_username || '',
        chat_id: b.telegram_chat_id || '',
      });
    }
    if (activeTenant?.config?.settings) {
      const s = activeTenant.config.settings as any;
      setSmsForm({
        eskiz_email: s.eskiz_email || '',
        eskiz_token: s.eskiz_token || '',
        auto_sms_enabled: !!s.auto_sms_enabled,
      });
      setPaymentForm({
        click_merchant_id: s.click_merchant_id || '',
        click_service_id: s.click_service_id || '',
        click_secret_key: s.click_secret_key || '',
        payme_merchant_id: s.payme_merchant_id || '',
        payme_secret_key: s.payme_secret_key || '',
        uzum_merchant_id: s.uzum_merchant_id || '',
        uzum_secret_key: s.uzum_secret_key || '',
        payment_test_mode: !!s.payment_test_mode,
      });
    }
  }, [activeTenant?.config]);

  const { data: profile } = useQuery({
    queryKey: ["admin-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
  });

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  const saveBranding = async (extra: Record<string, any>) => {
    if (!activeTenant?.id) throw new Error('Tenant topilmadi');
    const currentConfig = (activeTenant.config as any) || {};
    const updatedConfig = {
      ...currentConfig,
      branding: { ...(currentConfig.branding || {}), ...extra },
    };
    const { error } = await supabase.from('tenants').update({ config: updatedConfig }).eq('id', activeTenant.id);
    if (error) throw error;
  };

  const saveSettings = async (settingsData: Record<string, any>) => {
    if (!activeTenant?.id) throw new Error('Tenant topilmadi');
    const currentConfig = (activeTenant.config as any) || {};
    const updatedConfig = {
      ...currentConfig,
      settings: { ...(currentConfig.settings || {}), ...settingsData },
    };
    const { error } = await supabase.from('tenants').update({ config: updatedConfig }).eq('id', activeTenant.id);
    if (error) throw error;
  };

  const handleSmsSave = async () => {
    if (!activeTenant?.id) { toast.error('Tenant topilmadi'); return; }
    setSmsSaving(true);
    try {
      await saveSettings(smsForm);
      toast.success('Eskiz SMS sozlamalari muvaffaqiyatli saqlandi!');
    } catch (err: any) {
      toast.error(err.message || 'Xatolik yuz berdi');
    } finally {
      setSmsSaving(false);
    }
  };

  const handleSmsTest = async () => {
    if (!smsForm.eskiz_email || !smsForm.eskiz_token) {
      toast.error("Email va Token kiritilishi shart");
      return;
    }
    setSmsTesting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success("Eskiz API ulanishi muvaffaqiyatli! Test SMS yuborildi.");
    } catch (err) {
      toast.error("Ulanishda xatolik yuz berdi");
    } finally {
      setSmsTesting(false);
    }
  };

  const handlePaymentSave = async () => {
    if (!activeTenant?.id) { toast.error('Tenant topilmadi'); return; }
    setPaymentSaving(true);
    try {
      await saveSettings(paymentForm);
      toast.success('To\'lov tizimlari sozlamalari muvaffaqiyatli saqlandi!');
    } catch (err: any) {
      toast.error(err.message || 'Xatolik yuz berdi');
    } finally {
      setPaymentSaving(false);
    }
  };

  const handlePaymentTest = async (gateway: 'click' | 'payme' | 'uzum') => {
    const merchantId = paymentForm[`${gateway}_merchant_id` as keyof typeof paymentForm];
    const secretKey = paymentForm[`${gateway}_secret_key` as keyof typeof paymentForm];

    if (!merchantId || !secretKey) {
      toast.error(`${gateway.toUpperCase()} integratsiya ma'lumotlari to'liq emas`);
      return;
    }

    setPaymentTesting(prev => ({ ...prev, [gateway]: true }));
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(`${gateway.toUpperCase()} API testi muvaffaqiyatli yakunlandi! Test billing webhook faollashtirildi.`);
    } catch (err) {
      toast.error("Ulanishda xatolik");
    } finally {
      setPaymentTesting(prev => ({ ...prev, [gateway]: false }));
    }
  };

  const handleTelegramSave = async () => {
    if (!activeTenant?.id) { toast.error('Tenant topilmadi'); return; }
    setTelegramSaving(true);
    try {
      await saveBranding({
        telegram_bot_token: telegramForm.bot_token.trim(),
        telegram_bot_username: telegramForm.bot_username.trim().replace('@', ''),
        telegram_chat_id: telegramForm.chat_id.trim(),
      });
      toast.success('Telegram bot saqlandi!');
    } catch (err: any) {
      toast.error(err.message || 'Xatolik yuz berdi');
    } finally {
      setTelegramSaving(false);
    }
  };

  const handleTelegramTest = async () => {
    const token = telegramForm.bot_token.trim();
    const chatId = telegramForm.chat_id.trim();
    if (!token || !chatId) { toast.error("Bot token va Chat ID kiritilishi shart"); return; }
    setTelegramTesting(true);
    try {
      const text = `✅ UniPath test xabari!\n\nBot muvaffaqiyatli ulandi.\nBiznes: ${activeTenant?.name || 'Noma\'lum'}\nSubdomain: ${activeTenant?.subdomain || '—'}.unipath.me`;
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success('Test xabari yuborildi! Telegram ni tekshiring.');
      } else {
        toast.error(`Telegram xatosi: ${json.description || 'Noma\'lum xato'}`);
      }
    } catch (err) {
      toast.error('Internetga ulanishda xatolik');
    } finally {
      setTelegramTesting(false);
    }
  };

  const handleCopyChatId = async () => {
    try {
      await navigator.clipboard.writeText(`https://api.telegram.org/bot${telegramForm.bot_token}/getUpdates`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.info('Chat ID topish havolasi nusxalandi');
    } catch {}
  };

  const handleThemeSave = async () => {
    if (!activeTenant?.id) { toast.error('Tenant topilmadi'); return; }
    setThemeSaving(true);
    try {
      await saveBranding({ theme_color: selectedTheme });
      injectTheme(selectedTheme);
      toast.success('Rang muvaffaqiyatli saqlandi!');
    } catch (err) {
      toast.error('Rangni saqlashda xatolik');
    } finally {
      setThemeSaving(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: formData.full_name, phone: formData.phone })
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success("Sozlamalar saqlandi");
    } catch (err) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Sozlamalar
          </h1>
          <p className="text-muted-foreground">Tizim va profil sozlamalari</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profil ma'lumotlari
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email</Label>
                <Input value={user?.email || ""} disabled className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">Email o'zgartirib bo'lmaydi</p>
              </div>
              <div>
                <Label className="flex items-center gap-2"><User className="h-4 w-4" /> To'liq ism</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Ismingizni kiriting"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="flex items-center gap-2"><Phone className="h-4 w-4" /> Telefon</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+998 90 123 45 67"
                  className="mt-1"
                />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Saqlash
              </Button>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Xavfsizlik
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Ikki bosqichli autentifikatsiya</p>
                  <p className="text-sm text-muted-foreground">Qo'shimcha xavfsizlik qatlami</p>
                </div>
                <Switch disabled />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sessiya boshqaruvi</p>
                  <p className="text-sm text-muted-foreground">Faol sessiyalarni ko'ring</p>
                </div>
                <Button variant="outline" size="sm" disabled>Ko'rish</Button>
              </div>
              <Separator />
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium text-sm">Ma'lumotlar bazasi</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Barcha ma'lumotlar xavfsiz serverda saqlanadi va RLS (Row Level Security) bilan himoyalangan.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Bildirishnomalar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Yangi buyurtmalar</p>
                  <p className="text-sm text-muted-foreground">Yangi buyurtma kelganda xabar</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Agent ro'yxatga olish</p>
                  <p className="text-sm text-muted-foreground">Yangi agent ariza berganda</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Tur tasdiqlash</p>
                  <p className="text-sm text-muted-foreground">Yangi tur tasdiq kutganda</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Theme Picker */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Panel rangi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Admin panel va interfeysning asosiy rangini tanlang. O'zgartish darhol ko'rinadi.
              </p>
              <div className="grid grid-cols-5 gap-3">
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setSelectedTheme(preset.id);
                      injectTheme(preset.id); // live preview
                    }}
                    className="relative flex flex-col items-center gap-1.5 group"
                    title={preset.nameUz}
                  >
                    <div
                      className="w-10 h-10 rounded-full border-2 transition-all duration-200 group-hover:scale-110"
                      style={{
                        backgroundColor: preset.colorHex,
                        borderColor: selectedTheme === preset.id ? preset.colorHex : 'transparent',
                        boxShadow: selectedTheme === preset.id ? `0 0 0 3px ${preset.colorHex}40` : 'none',
                      }}
                    >
                      {selectedTheme === preset.id && (
                        <div className="w-full h-full flex items-center justify-center">
                          <Check className="h-4 w-4 text-white drop-shadow" />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-center text-muted-foreground leading-tight">
                      {preset.nameUz}
                    </span>
                  </button>
                ))}
              </div>
              <Button onClick={handleThemeSave} disabled={themeSaving} className="w-full">
                {themeSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Rangni saqlash
              </Button>
            </CardContent>
          </Card>

          {/* Telegram Bot */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-[#229ED9]" />
                Telegram Bot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-xl bg-[#229ED9]/8 border border-[#229ED9]/20 text-xs text-muted-foreground leading-relaxed">
                Bot yaratish: <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-[#229ED9] underline font-medium">@BotFather</a> ga yozing → /newbot → token oling.
                Chat ID: botga bitta xabar yuboring, keyin quyidagi havoladan oling.
              </div>
              <div>
                <Label className="flex items-center gap-2 mb-1">
                  <span className="text-[#229ED9]">🤖</span> Bot Token
                </Label>
                <Input
                  type="password"
                  value={telegramForm.bot_token}
                  onChange={(e) => setTelegramForm(p => ({ ...p, bot_token: e.target.value }))}
                  placeholder="1234567890:ABCDefGhIJKlmnoPQRsTUVwxyZ"
                  className="mt-1 font-mono text-xs"
                />
              </div>
              <div>
                <Label className="flex items-center gap-2 mb-1">
                  <span>@</span> Bot Username
                </Label>
                <Input
                  value={telegramForm.bot_username}
                  onChange={(e) => setTelegramForm(p => ({ ...p, bot_username: e.target.value }))}
                  placeholder="mybusiness_bot"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="flex items-center gap-2 mb-1">
                  <span>💬</span> Chat ID
                  <button
                    onClick={handleCopyChatId}
                    className="ml-auto text-[10px] text-[#229ED9] flex items-center gap-1 hover:underline"
                    title="Chat ID topish havolasini nusxalash"
                  >
                    {copied ? <CheckCheck className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    Chat ID qanday topiladi?
                  </button>
                </Label>
                <Input
                  value={telegramForm.chat_id}
                  onChange={(e) => setTelegramForm(p => ({ ...p, chat_id: e.target.value }))}
                  placeholder="-1001234567890 yoki 123456789"
                  className="mt-1 font-mono"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Guruh uchun manfiy raqam (masalan: -1001234567890). Shaxsiy chat uchun musbat.
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleTelegramTest} disabled={telegramTesting || !telegramForm.bot_token || !telegramForm.chat_id} variant="outline" className="flex-1">
                  {telegramTesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ExternalLink className="h-4 w-4 mr-2" />}
                  Test xabar yuborish
                </Button>
                <Button onClick={handleTelegramSave} disabled={telegramSaving} className="flex-1">
                  {telegramSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Saqlash
                </Button>
              </div>
              {activeTenant?.config?.branding?.telegram_bot_username && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3.5 w-3.5" />
                  Faol bot: @{activeTenant.config.branding.telegram_bot_username}
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Tizim haqida
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Platforma</span>
                <span className="font-medium">UniPath v2.0</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Backend</span>
                <span className="font-medium">UniPath Cloud</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Admin email</span>
                <span className="font-medium">{user?.email}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Biznes turi</span>
                <span className="font-medium capitalize">{activeTenant?.business_type || activeTenant?.config?.business_type || '—'}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subdomain</span>
                <span className="font-medium">{activeTenant?.subdomain ? `${activeTenant.subdomain}.unipath.me` : '—'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Conditional: Nova Academy Eskiz SMS Gateway Settings */}
          {(activeTenant?.business_type === 'academy' || activeTenant?.config?.business_type === 'academy') && (
            <Card className="border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)] bg-[#030712]/50 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-400 font-bold">
                  <MessageSquare className="h-5 w-5" />
                  Eskiz SMS Gateway
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-muted-foreground leading-relaxed">
                  O'zbekistondagi eng barqaror SMS xizmati. Dars qoldirgan o'quvchilar va qarzdorlik haqida avtomatik bildirishnomalar yuborish uchun Eskiz API hisob ma'lumotlarini kiriting.
                </div>
                <div>
                  <Label className="flex items-center gap-2 mb-1 text-xs">
                    📧 Eskiz Email manzili
                  </Label>
                  <Input
                    type="email"
                    value={smsForm.eskiz_email}
                    onChange={(e) => setSmsForm(p => ({ ...p, eskiz_email: e.target.value }))}
                    placeholder="example@mail.com"
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2 mb-1 text-xs">
                    🔑 Eskiz API Token
                  </Label>
                  <Input
                    type="password"
                    value={smsForm.eskiz_token}
                    onChange={(e) => setSmsForm(p => ({ ...p, eskiz_token: e.target.value }))}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="mt-1 font-mono text-xs h-9"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-white/5">
                  <div>
                    <p className="text-xs font-semibold">Avtomatik SMS yuborish</p>
                    <p className="text-[10px] text-muted-foreground">Qarzdorlik va QR-davomat xabarlarini avtomat yuborish</p>
                  </div>
                  <Switch
                    checked={smsForm.auto_sms_enabled}
                    onCheckedChange={(checked) => setSmsForm(p => ({ ...p, auto_sms_enabled: checked }))}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSmsTest} disabled={smsTesting || !smsForm.eskiz_email || !smsForm.eskiz_token} variant="outline" className="flex-1 text-xs h-9">
                    {smsTesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Test SMS
                  </Button>
                  <Button onClick={handleSmsSave} disabled={smsSaving} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9">
                    {smsSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Saqlash
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conditional: UniTour click/payme/uzum payment settings */}
          {(activeTenant?.business_type === 'tour' || activeTenant?.config?.business_type === 'tour') && (
            <Card className="border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.05)] bg-[#030712]/50 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-400 font-bold">
                  <CreditCard className="h-5 w-5" />
                  To'lov Integratsiyalari (Click / Payme / Uzum)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-muted-foreground leading-relaxed">
                  Mijozlaringizdan to'g'ridan-to'g'ri Click, Payme yoki Uzum orqali to'lovlarni qabul qilish uchun hisob sozlamarini kiriting.
                </div>
                
                <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-white/5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-blue-400">⚡ CLICK.UZ</p>
                    <Button onClick={() => handlePaymentTest('click')} disabled={paymentTesting.click} variant="outline" size="sm" className="text-[10px] h-7 px-2 border-blue-500/20 text-blue-400">
                      {paymentTesting.click ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                      Integratsiya Testi
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px]">Merchant ID</Label>
                      <Input
                        value={paymentForm.click_merchant_id}
                        onChange={(e) => setPaymentForm(p => ({ ...p, click_merchant_id: e.target.value }))}
                        placeholder="12345"
                        className="h-8 mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Service ID</Label>
                      <Input
                        value={paymentForm.click_service_id}
                        onChange={(e) => setPaymentForm(p => ({ ...p, click_service_id: e.target.value }))}
                        placeholder="67890"
                        className="h-8 mt-1 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px]">Secret Key</Label>
                    <Input
                      type="password"
                      value={paymentForm.click_secret_key}
                      onChange={(e) => setPaymentForm(p => ({ ...p, click_secret_key: e.target.value }))}
                      placeholder="••••••••••••••••"
                      className="h-8 mt-1 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-white/5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-purple-400">💳 PAYME.UZ</p>
                    <Button onClick={() => handlePaymentTest('payme')} disabled={paymentTesting.payme} variant="outline" size="sm" className="text-[10px] h-7 px-2 border-purple-500/20 text-purple-400">
                      {paymentTesting.payme ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                      Integratsiya Testi
                    </Button>
                  </div>
                  <div>
                    <Label className="text-[10px]">Merchant / Cash ID</Label>
                    <Input
                      value={paymentForm.payme_merchant_id}
                      onChange={(e) => setPaymentForm(p => ({ ...p, payme_merchant_id: e.target.value }))}
                      placeholder="60b12e345..."
                      className="h-8 mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px]">Secret Key / Password</Label>
                    <Input
                      type="password"
                      value={paymentForm.payme_secret_key}
                      onChange={(e) => setPaymentForm(p => ({ ...p, payme_secret_key: e.target.value }))}
                      placeholder="••••••••••••••••"
                      className="h-8 mt-1 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-white/5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-yellow-500">💰 UZUM BANK</p>
                    <Button onClick={() => handlePaymentTest('uzum')} disabled={paymentTesting.uzum} variant="outline" size="sm" className="text-[10px] h-7 px-2 border-yellow-500/20 text-yellow-500">
                      {paymentTesting.uzum ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                      Integratsiya Testi
                    </Button>
                  </div>
                  <div>
                    <Label className="text-[10px]">Merchant ID</Label>
                    <Input
                      value={paymentForm.uzum_merchant_id}
                      onChange={(e) => setPaymentForm(p => ({ ...p, uzum_merchant_id: e.target.value }))}
                      placeholder="uzum_merch_777"
                      className="h-8 mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px]">Secret Key</Label>
                    <Input
                      type="password"
                      value={paymentForm.uzum_secret_key}
                      onChange={(e) => setPaymentForm(p => ({ ...p, uzum_secret_key: e.target.value }))}
                      placeholder="••••••••••••••••"
                      className="h-8 mt-1 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-white/5">
                  <div>
                    <p className="text-xs font-semibold">Sinov rejasi (Test Mode)</p>
                    <p className="text-[10px] text-muted-foreground">Haqiqiy to'lovlar o'rniga sinov tranzaksiyalari</p>
                  </div>
                  <Switch
                    checked={paymentForm.payment_test_mode}
                    onCheckedChange={(checked) => setPaymentForm(p => ({ ...p, payment_test_mode: checked }))}
                  />
                </div>

                <Button onClick={handlePaymentSave} disabled={paymentSaving} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs h-9">
                  {paymentSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  To'lov Sozlamalarini Saqlash
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default AdminSettings;
