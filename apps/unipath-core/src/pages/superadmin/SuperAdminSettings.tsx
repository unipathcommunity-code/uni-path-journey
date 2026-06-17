import { useState } from "react";
import { 
  Settings, 
  Save, 
  Database, 
  Key, 
  Sliders, 
  Cpu, 
  Layers,
  RefreshCw,
  Lock,
  Globe,
  Mail,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function SuperAdminSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // General Settings
  const [generalConfig, setGeneralConfig] = useState({
    appName: "UniPath Journey",
    supportEmail: "support@unipath.me",
    allowSelfRegistration: true,
    maintenanceMode: false
  });

  // Default Tenant Features
  const [defaultFeatures, setDefaultFeatures] = useState({
    accountant: true,
    mentor: true,
    api_access: false,
    unicoin: false
  });

  // API Integrations
  const [apiKeys, setApiKeys] = useState({
    stripeMode: "test",
    stripeKey: "sk_test_51Nx...xxxxxxxx",
    googleClientId: "9823...apps.googleusercontent.com",
    smtpHost: "smtp.mailgun.org"
  });

  // Diagnostics states
  const [dbStatus, setDbStatus] = useState("operational");
  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Sozlamalar saqlandi",
        description: "Umumiy platforma sozlamalari muvaffaqiyatli yangilandi.",
      });
    }, 800);
  };

  const handleSaveFeatures = () => {
    toast({
      title: "Modullar yangilandi",
      description: "Yangi firmalar uchun standart yoqilgan modullar saqlandi.",
    });
  };

  const handleSaveApi = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "API kalitlar yangilandi",
      description: "Integratsiya sozlamalari saqlandi.",
    });
  };

  const handleDbBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      setIsBackingUp(false);
      toast({
        title: "Backup yaratildi",
        description: "Ma'lumotlar bazasi zaxira nusxasi muvaffaqiyatli saqlandi.",
      });
    }, 2000);
  };

  return (
    <div className="text-foreground font-sans space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Platforma sozlamalari</h1>
        <p className="text-white/50 mt-1 text-sm">
          UniPath tizimining umumiy parametrlari, API kalitlari, to'lov sozlamalari va diagnostic vositalari
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: General & Modules Configuration (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* General Platform Settings */}
          <Card className="bg-muted/5 border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Globe className="w-5 h-5 text-amber-500" />
                Umumiy Platforma Sozlamalari
              </CardTitle>
              <CardDescription className="text-xs text-white/50">
                Tizimning asosiy parametrlari va tashqi ko'rinish sozlamalari
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                    <label className="text-xs text-white/70 font-semibold">Qo'llab-quvvatlash emaili (Support)</label>
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
                      <p className="font-semibold text-white text-sm">Konsaltinglar mustaqil ro'yxatdan o'tishi</p>
                      <p className="text-xs text-muted-foreground">Yoqilgan bo'lsa, yangi firmalar onboarding orqali o'zlari qo'shila oladi.</p>
                    </div>
                    <Switch 
                      checked={generalConfig.allowSelfRegistration}
                      onCheckedChange={(val) => setGeneralConfig({ ...generalConfig, allowSelfRegistration: val })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-black/30 border border-white/5 rounded-xl">
                    <div>
                      <p className="font-semibold text-rose-400 text-sm flex items-center gap-1.5">
                        <Lock className="w-4 h-4" />
                        Texnik xizmat ko'rsatish rejimi (Maintenance)
                      </p>
                      <p className="text-xs text-muted-foreground">Yoqilgan bo'lsa, platforma faqat Super Adminlar uchun ochiq bo'ladi.</p>
                    </div>
                    <Switch 
                      checked={generalConfig.maintenanceMode}
                      onCheckedChange={(val) => setGeneralConfig({ ...generalConfig, maintenanceMode: val })}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-2">
                    <Save className="w-4 h-4" />
                    {loading ? "Saqlanmoqda..." : "Sozlamalarni Saqlash"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Default Tenant Module Settings */}
          <Card className="bg-muted/5 border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Sliders className="w-5 h-5 text-amber-500" />
                Standart Firma Modullari
              </CardTitle>
              <CardDescription className="text-xs text-white/50">
                Yangi ro'yxatdan o'tgan consulting firmalari uchun avtomatik yoqiladigan xususiyatlar (features)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-black/30 border border-white/5 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white text-sm">Buxgalter (Accountant) moduli</p>
                    <p className="text-xs text-muted-foreground">Invoyslar va to'lovlar boshqaruvi</p>
                  </div>
                  <Switch 
                    checked={defaultFeatures.accountant}
                    onCheckedChange={(val) => setDefaultFeatures({ ...defaultFeatures, accountant: val })}
                  />
                </div>

                <div className="p-3 bg-black/30 border border-white/5 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white text-sm">Mentorlik moduli</p>
                    <p className="text-xs text-muted-foreground">Studentlarga shaxsiy mentor biriktirish</p>
                  </div>
                  <Switch 
                    checked={defaultFeatures.mentor}
                    onCheckedChange={(val) => setDefaultFeatures({ ...defaultFeatures, mentor: val })}
                  />
                </div>

                <div className="p-3 bg-black/30 border border-white/5 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white text-sm">Tizim API kirish (API Access)</p>
                    <p className="text-xs text-muted-foreground">Tashqi integratsiyalar va API tokenlar</p>
                  </div>
                  <Switch 
                    checked={defaultFeatures.api_access}
                    onCheckedChange={(val) => setDefaultFeatures({ ...defaultFeatures, api_access: val })}
                  />
                </div>

                <div className="p-3 bg-black/30 border border-white/5 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white text-sm">UniCoin ballar tizimi</p>
                    <p className="text-xs text-muted-foreground">Gamifikatsiya va ichki kredit ballari</p>
                  </div>
                  <Switch 
                    checked={defaultFeatures.unicoin}
                    onCheckedChange={(val) => setDefaultFeatures({ ...defaultFeatures, unicoin: val })}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveFeatures} className="bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-2">
                  <Save className="w-4 h-4" />
                  Modullarni Saqlash
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Third Party API Keys */}
          <Card className="bg-muted/5 border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Key className="w-5 h-5 text-amber-500" />
                Tashqi API Integratsiyalari
              </CardTitle>
              <CardDescription className="text-xs text-white/50">
                To'lov tizimlari, OAuth va Email provayderlari kalitlari
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveApi} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/70 font-semibold">Stripe Muhiti (Mode)</label>
                    <select
                      className="w-full bg-black/50 border border-white/10 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                      value={apiKeys.stripeMode}
                      onChange={(e) => setApiKeys({ ...apiKeys, stripeMode: e.target.value })}
                    >
                      <option value="test">Sandbox / Test Mode</option>
                      <option value="live">Live / Production Mode</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-white/70 font-semibold">Stripe Secret API Key</label>
                    <Input 
                      type="password"
                      className="bg-black/50 border-white/10 text-white focus:border-amber-500 font-mono text-xs"
                      value={apiKeys.stripeKey}
                      onChange={(e) => setApiKeys({ ...apiKeys, stripeKey: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-white/70 font-semibold">Google OAuth Client ID</label>
                    <Input 
                      className="bg-black/50 border-white/10 text-white focus:border-amber-500 text-xs font-mono"
                      value={apiKeys.googleClientId}
                      onChange={(e) => setApiKeys({ ...apiKeys, googleClientId: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-white/70 font-semibold">Mailgun SMTP Host</label>
                    <Input 
                      className="bg-black/50 border-white/10 text-white focus:border-amber-500 text-xs"
                      value={apiKeys.smtpHost}
                      onChange={(e) => setApiKeys({ ...apiKeys, smtpHost: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-2">
                    <Save className="w-4 h-4" />
                    API Integratsiyani Saqlash
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Diagnostics & DB Status (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* System Diagnostics */}
          <Card className="bg-muted/5 border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Cpu className="w-5 h-5 text-amber-500" />
                Tizim Salomatligi (Health)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/60">PostgreSQL Database</span>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Operational</Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/60">Edge Functions (Supabase)</span>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Active</Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/60">Stripe Webhooks</span>
                  <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20">Slow Response</Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/60">Mail Delivery (SMTP)</span>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Connected</Badge>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-2">
                <div className="flex justify-between text-xs text-white/40">
                  <span>Server CPU</span>
                  <span>14%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '14%' }}></div>
                </div>
                
                <div className="flex justify-between text-xs text-white/40 pt-2">
                  <span>RAM Xotira</span>
                  <span>42% (3.3 GB / 8.0 GB)</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '42%' }}></div>
                </div>
              </div>

              <Button variant="outline" className="w-full mt-2 border-white/10 hover:bg-white/5 text-white gap-2">
                <RefreshCw className="w-4 h-4" />
                Keshni tozalash (Clear Cache)
              </Button>
            </CardContent>
          </Card>

          {/* Database Backup Section */}
          <Card className="bg-muted/5 border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Database className="w-5 h-5 text-amber-500" />
                Ma'lumotlar Bazasi (Backup)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-white/50 leading-relaxed">
                Tizimning to'liq zaxira nusxasini (SQL formatda) yaratib, uni xavfsiz kompyuteringizga yuklab olishingiz mumkin.
              </p>
              
              <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center text-xs text-white/60">
                  <span>Oxirgi avtomatik backup</span>
                  <span className="text-white">Bugun, 04:00</span>
                </div>
                <div className="flex justify-between items-center text-xs text-white/60">
                  <span>Zaxira o'lchami</span>
                  <span className="text-white">18.4 MB</span>
                </div>
              </div>

              <Button 
                onClick={handleDbBackup} 
                disabled={isBackingUp}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-2"
              >
                <Database className="w-4 h-4" />
                {isBackingUp ? "Yaratilmoqda..." : "Zaxira Nusxasi (Backup) Yaratish"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
