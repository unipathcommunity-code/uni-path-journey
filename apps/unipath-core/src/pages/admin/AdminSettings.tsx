import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Shield, Bell, Globe, Database, Save, Loader2, User, Mail, Phone, Palette, Check, Send, ExternalLink, Copy, CheckCheck, Image as ImageIcon, Upload, Trash2 } from "lucide-react";
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

// Downscale + convert an uploaded image to a small PNG data URL (stored in config.branding.logo_url).
// Avoids needing a configured Supabase Storage bucket — the logo travels inside the tenant config.
function downscaleImage(file: File, max: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas mavjud emas'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error("Rasmni o'qib bo'lmadi"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Faylni o'qib bo'lmadi"));
    reader.readAsDataURL(file);
  });
}

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
  }, [activeTenant?.config?.branding]);

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

  const [logoUrl, setLogoUrl] = useState<string>((activeTenant?.config?.branding as any)?.logo_url || '');
  const [logoSaving, setLogoSaving] = useState(false);

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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Faqat rasm fayli tanlang'); return; }
    if (file.size > 3 * 1024 * 1024) { toast.error("Rasm hajmi 3MB dan kichik bo'lsin"); return; }
    setLogoSaving(true);
    try {
      const dataUrl = await downscaleImage(file, 512);
      await saveBranding({ logo_url: dataUrl });
      setLogoUrl(dataUrl);
      toast.success("Logo saqlandi! Saytingizda ko'rinadi.");
    } catch (err: any) {
      toast.error(err.message || 'Logo yuklashda xatolik');
    } finally {
      setLogoSaving(false);
      e.target.value = '';
    }
  };

  const handleLogoRemove = async () => {
    setLogoSaving(true);
    try {
      await saveBranding({ logo_url: '' });
      setLogoUrl('');
      toast.success("Logo o'chirildi");
    } catch {
      toast.error('Xatolik yuz berdi');
    } finally {
      setLogoSaving(false);
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

          {/* Brending — Logo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Logotip (Brending)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Biznesingiz logosi — saytingiz sarlavhasida, kabinet panelida va hujjatlarda avtomatik ko'rinadi.
              </p>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl border border-border bg-muted/40 flex items-center justify-center overflow-hidden shrink-0">
                  {logoUrl
                    ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    : <span className="text-2xl font-black text-muted-foreground">{(activeTenant?.name || 'U').charAt(0).toUpperCase()}</span>}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <label>
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={logoSaving} />
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer border border-border hover:bg-muted transition ${logoSaving ? 'opacity-60 pointer-events-none' : ''}`}>
                        {logoSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Logo yuklash
                      </span>
                    </label>
                    {logoUrl && (
                      <button onClick={handleLogoRemove} disabled={logoSaving} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-rose-500 hover:bg-rose-500/10 transition">
                        <Trash2 className="h-4 w-4" /> O'chirish
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">PNG yoki JPG · kvadrat shakl tavsiya etiladi · maks 3MB.</p>
                </div>
              </div>
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
                <span className="font-medium capitalize">{activeTenant?.business_type || '—'}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subdomain</span>
                <span className="font-medium">{activeTenant?.subdomain ? `${activeTenant.subdomain}.unipath.me` : '—'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
};

export default AdminSettings;
