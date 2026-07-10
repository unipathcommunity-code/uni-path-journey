import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Shield, Bell, Globe, Database, Save, Loader2, User, Mail, Phone, Palette, Check } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { THEME_PRESETS, injectTheme } from "@/lib/themes";
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

const AdminSettings = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { activeTenant } = useApp();
  const [saving, setSaving] = useState(false);
  const [themeSaving, setThemeSaving] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string>(
    (activeTenant?.config as any)?.branding?.theme_color || "blue"
  );

  const handleThemeSelect = async (themeId: string) => {
    setSelectedTheme(themeId);
    injectTheme(themeId); // apply instantly
    if (!activeTenant?.id) return;
    setThemeSaving(true);
    try {
      const cfg = (activeTenant.config as any) || {};
      const updated = { ...cfg, branding: { ...(cfg.branding || {}), theme_color: themeId } };
      const { error } = await supabase.from("tenants").update({ config: updated }).eq("id", activeTenant.id);
      if (error) throw error;
      toast.success("Mavzu rangi saqlandi!");
    } catch (e: any) {
      toast.error(e.message || "Xatolik");
    } finally {
      setThemeSaving(false);
    }
  };

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
  useState(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
      });
    }
  });

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

        {/* Theme / brand color picker */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" /> Mavzu rangi (Brending)
              {themeSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Firmangiz rangini tanlang — sayt va panelга darrov qo'llanadi.</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-3">
              {THEME_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleThemeSelect(p.id)}
                  className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all hover:scale-105 ${
                    selectedTheme === p.id ? "border-primary shadow-lg" : "border-border hover:border-primary/40"
                  }`}
                  title={p.name}
                >
                  <span className="w-9 h-9 rounded-full shadow-inner ring-2 ring-white/50" style={{ backgroundColor: p.colorHex }} />
                  <span className="text-[10px] font-medium text-center leading-tight truncate w-full">{p.name}</span>
                  {selectedTheme === p.id && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

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
                <span className="font-medium">UniTour v2.0</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Backend</span>
                <span className="font-medium">UniTour Cloud</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Admin email</span>
                <span className="font-medium">{user?.email}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rol</span>
                <span className="font-medium text-destructive">Super Admin</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
};

export default AdminSettings;
