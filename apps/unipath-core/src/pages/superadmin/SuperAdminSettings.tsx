import { useState, useEffect } from "react";
import {
  Save,
  Database,
  Key,
  Sliders,
  Cpu,
  Lock,
  Globe,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DefaultFeatures {
  accountant: boolean;
  mentor: boolean;
  api_access: boolean;
  unicoin: boolean;
}

const FEATURE_LABELS: { key: keyof DefaultFeatures; title: string; desc: string }[] = [
  { key: "accountant", title: "Buxgalter (Accountant) moduli", desc: "Invoyslar va to'lovlar boshqaruvi" },
  { key: "mentor", title: "Mentorlik moduli", desc: "Studentlarga shaxsiy mentor biriktirish" },
  { key: "api_access", title: "Tizim API kirish (API Access)", desc: "Tashqi integratsiyalar va API tokenlar" },
  { key: "unicoin", title: "UniCoin ballar tizimi", desc: "Gamifikatsiya va ichki kredit ballari" },
];

export default function SuperAdminSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingFeatures, setSavingFeatures] = useState(false);

  const [generalConfig, setGeneralConfig] = useState({
    appName: "UniPath",
    supportEmail: "support@unipath.me",
    allowSelfRegistration: true,
    maintenanceMode: false,
  });
  const [defaultFeatures, setDefaultFeatures] = useState<DefaultFeatures>({
    accountant: true,
    mentor: true,
    api_access: false,
    unicoin: false,
  });

  // Real system health
  const [health, setHealth] = useState<{ db: boolean; counts: Record<string, number | null> }>({
    db: false,
    counts: { tenants: null, profiles: null, pricing_plans: null },
  });

  // Env-based integration status (never shows the actual secret values)
  const integrations = [
    { label: "Supabase ulanishi", ok: !!import.meta.env.VITE_SUPABASE_URL },
    { label: "Supabase kaliti (anon)", ok: !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
    { label: "Stripe (to'lov)", ok: !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY },
    { label: "Telegram bot", ok: !!import.meta.env.VITE_TELEGRAM_BOT_TOKEN },
  ];

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from("platform_settings" as any).select("*").eq("id", "global").maybeSingle();
        if (data) {
          setGeneralConfig({
            appName: (data as any).app_name || "UniPath",
            supportEmail: (data as any).support_email || "",
            allowSelfRegistration: (data as any).allow_self_registration ?? true,
            maintenanceMode: (data as any).maintenance_mode ?? false,
          });
          if ((data as any).default_features) setDefaultFeatures((data as any).default_features);
        }
      } catch {
        /* table may not be migrated yet — keep defaults */
      } finally {
        setLoading(false);
      }

      // Real connectivity + row counts
      const [t, p, pl] = await Promise.all([
        supabase.from("tenants" as any).select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("pricing_plans" as any).select("*", { count: "exact", head: true }),
      ]);
      setHealth({
        db: !t.error,
        counts: { tenants: t.count ?? null, profiles: p.count ?? null, pricing_plans: pl.count ?? null },
      });
    }
    load();
  }, []);

  const persist = async (patch: Record<string, any>) => {
    const { error } = await supabase
      .from("platform_settings" as any)
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", "global");
    if (error) throw error;
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGeneral(true);
    try {
      await persist({
        app_name: generalConfig.appName,
        support_email: generalConfig.supportEmail,
        allow_self_registration: generalConfig.allowSelfRegistration,
        maintenance_mode: generalConfig.maintenanceMode,
      });
      toast({ title: "Sozlamalar saqlandi", description: "Umumiy platforma sozlamalari yangilandi." });
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message || "Saqlashda xatolik.", variant: "destructive" });
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleSaveFeatures = async () => {
    setSavingFeatures(true);
    try {
      await persist({ default_features: defaultFeatures });
      toast({ title: "Modullar yangilandi", description: "Yangi firmalar uchun standart modullar saqlandi." });
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message || "Saqlashda xatolik.", variant: "destructive" });
    } finally {
      setSavingFeatures(false);
    }
  };

  return (
    <div className="text-foreground font-sans space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platforma sozlamalari</h1>
        <p className="text-white/50 mt-1 text-sm">
          Umumiy parametrlar va standart modullar ma'lumotlar bazasida saqlanadi.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: General + Modules */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-muted/5 border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Globe className="w-5 h-5 text-amber-500" />
                Umumiy platforma sozlamalari
              </CardTitle>
              <CardDescription className="text-xs text-white/50">
                Tizimning asosiy parametrlari
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
              ) : (
                <form onSubmit={handleSaveGeneral} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-white/70 font-semibold">Tizim nomi (Brand Name)</label>
                      <Input
                        className="bg-black/50 border-white/10 text-white focus:border-amber-500"
                        value={generalConfig.appName}
                        onChange={(e) => setGeneralConfig({ ...generalConfig, appName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-white/70 font-semibold">Qo'llab-quvvatlash emaili</label>
                      <Input
                        type="email"
                        className="bg-black/50 border-white/10 text-white focus:border-amber-500"
                        value={generalConfig.supportEmail}
                        onChange={(e) => setGeneralConfig({ ...generalConfig, supportEmail: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="pt-2 space-y-3">
                    <div className="flex items-center justify-between p-3 bg-black/30 border border-white/5 rounded-xl">
                      <div>
                        <p className="font-semibold text-white text-sm">Mustaqil ro'yxatdan o'tish</p>
                        <p className="text-xs text-muted-foreground">Yangi firmalar onboarding orqali o'zlari qo'shila oladi.</p>
                      </div>
                      <Switch
                        checked={generalConfig.allowSelfRegistration}
                        onCheckedChange={(val) => setGeneralConfig({ ...generalConfig, allowSelfRegistration: val })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-black/30 border border-white/5 rounded-xl">
                      <div>
                        <p className="font-semibold text-rose-400 text-sm flex items-center gap-1.5">
                          <Lock className="w-4 h-4" /> Texnik xizmat rejimi (Maintenance)
                        </p>
                        <p className="text-xs text-muted-foreground">Platforma faqat Super Adminlar uchun ochiq bo'ladi.</p>
                      </div>
                      <Switch
                        checked={generalConfig.maintenanceMode}
                        onCheckedChange={(val) => setGeneralConfig({ ...generalConfig, maintenanceMode: val })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={savingGeneral} className="bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-2">
                      <Save className="w-4 h-4" />
                      {savingGeneral ? "Saqlanmoqda..." : "Sozlamalarni saqlash"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <Card className="bg-muted/5 border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Sliders className="w-5 h-5 text-amber-500" />
                Standart firma modullari
              </CardTitle>
              <CardDescription className="text-xs text-white/50">
                Yangi ro'yxatdan o'tgan firmalar uchun avtomatik yoqiladigan xususiyatlar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FEATURE_LABELS.map((f) => (
                  <div key={f.key} className="p-3 bg-black/30 border border-white/5 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white text-sm">{f.title}</p>
                      <p className="text-xs text-muted-foreground">{f.desc}</p>
                    </div>
                    <Switch
                      checked={defaultFeatures[f.key]}
                      onCheckedChange={(val) => setDefaultFeatures({ ...defaultFeatures, [f.key]: val })}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveFeatures} disabled={savingFeatures} className="bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-2">
                  <Save className="w-4 h-4" />
                  {savingFeatures ? "Saqlanmoqda..." : "Modullarni saqlash"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Integrations (read-only, env-based) */}
          <Card className="bg-muted/5 border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Key className="w-5 h-5 text-amber-500" />
                Tashqi integratsiyalar
              </CardTitle>
              <CardDescription className="text-xs text-white/50">
                Maxfiy kalitlar muhit o'zgaruvchilari (env) orqali sozlanadi — xavfsizlik uchun bu yerda ko'rsatilmaydi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {integrations.map((i) => (
                <div key={i.label} className="flex justify-between items-center text-sm p-2.5 bg-black/30 border border-white/5 rounded-lg">
                  <span className="text-white/70">{i.label}</span>
                  {i.ok ? (
                    <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Sozlangan</Badge>
                  ) : (
                    <Badge className="bg-white/5 text-white/40 border border-white/10">Sozlanmagan</Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: real system health */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-muted/5 border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Cpu className="w-5 h-5 text-amber-500" />
                Tizim salomatligi
              </CardTitle>
              <CardDescription className="text-xs text-white/50">Real Supabase ulanishi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/60">PostgreSQL ulanishi</span>
                {health.db ? (
                  <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ishlayapti
                  </Badge>
                ) : (
                  <Badge className="bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Ulanmadi
                  </Badge>
                )}
              </div>
              <div className="pt-3 border-t border-white/5 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-white/50">Firmalar</span><span className="text-white">{health.counts.tenants ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-white/50">Foydalanuvchilar</span><span className="text-white">{health.counts.profiles ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-white/50">Tarif rejalari</span><span className="text-white">{health.counts.pricing_plans ?? "—"}</span></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/5 border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Database className="w-5 h-5 text-amber-500" />
                Ma'lumotlar bazasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-white/50 leading-relaxed">
                Zaxira nusxalari Supabase loyihasi sozlamalarida (Database → Backups) avtomatik boshqariladi.
                To'liq nazorat uchun Supabase boshqaruv panelidan foydalaning.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
