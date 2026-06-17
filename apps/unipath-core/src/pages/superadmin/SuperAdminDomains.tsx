import { useState, useEffect } from "react";
import { 
  Globe, 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  Plus, 
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SuperAdminDomains() {
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Dialog State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [customDomainInput, setCustomDomainInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('tenants').select('*').order('name');
      if (error) throw error;

      setTenants(data || []);

      const domainList: any[] = [];
      data?.forEach(tenant => {
        // 1. Subdomain (if exists)
        if (tenant.subdomain) {
          domainList.push({
            id: `${tenant.id}-subdomain`,
            tenantId: tenant.id,
            domain: `${tenant.subdomain}.unipath.me`,
            tenantName: tenant.name,
            type: "subdomain",
            ssl: "active",
            status: "active"
          });
        }
        // 2. Custom Domain (if exists) — honest status: NOT verified until a real
        //    DNS check (verify-domain edge fn) has run. No faked "active".
        if (tenant.custom_domain) {
          const domainConfig = tenant.config?.domains?.[tenant.custom_domain] || {
            ssl: "pending",
            status: "unverified"
          };
          domainList.push({
            id: `${tenant.id}-custom`,
            tenantId: tenant.id,
            domain: tenant.custom_domain,
            tenantName: tenant.name,
            type: "custom",
            ssl: domainConfig.ssl || "pending",
            status: domainConfig.status || "unverified",
            checkedAt: domainConfig.checked_at || null,
          });
        }
      });

      setDomains(domainList);
    } catch (err: any) {
      console.error(err);
      toast({ 
        title: "Xatolik", 
        description: "Domenlarni yuklashda xatolik yuz berdi: " + err.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // Real DNS/SSL check via the verify-domain edge function. No faking — the
  // function does an actual DNS lookup and persists the true result.
  const handleVerifyDns = async (domainItem: any) => {
    try {
      setVerifyingId(domainItem.id);
      toast({ title: "Tekshirilmoqda...", description: "Domen DNS yozuvi haqiqatda tekshirilmoqda..." });

      const { data, error } = await supabase.functions.invoke('verify-domain', {
        body: { domain: domainItem.domain, tenantId: domainItem.tenantId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      const status = (data as any)?.status;
      const ok = status === 'active';
      toast({
        title: ok ? "Ulandi ✅" : "DNS hali tayyor emas",
        description: ok
          ? `${domainItem.domain} haqiqatan ulangan (DNS Vercel'ga ishora qilmoqda).`
          : status === 'dns_not_found'
            ? `${domainItem.domain} uchun DNS yozuvi topilmadi.`
            : `${domainItem.domain} DNS noto'g'ri sozlangan (Vercel'ga ishora qilmaydi).`,
        variant: ok ? undefined : "destructive",
      });

      fetchDomains();
    } catch (err: any) {
      toast({
        title: "Tekshirish ishlamadi",
        description: "verify-domain funksiyasi javob bermadi (deploy qilinganmi?): " + err.message,
        variant: "destructive",
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleLinkCustomDomain = async () => {
    if (!selectedTenantId || !customDomainInput) {
      toast({
        title: "Xatolik",
        description: "Barcha maydonlarni to'ldiring.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsAdding(true);
      
      const { error } = await supabase
        .from('tenants')
        .update({ custom_domain: customDomainInput })
        .eq('id', selectedTenantId);

      if (error) throw error;

      toast({
        title: "Muvaffaqiyatli",
        description: "Custom domen muvaffaqiyatli biriktirildi. Endi DNS va SSL ni tekshirishingiz mumkin.",
      });

      setIsAddDialogOpen(false);
      setSelectedTenantId("");
      setCustomDomainInput("");
      fetchDomains(); // Refresh
    } catch (err: any) {
      toast({
        title: "Xatolik",
        description: "Domen bog'lashda xatolik: " + err.message,
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteCustomDomain = async (tenantId: string, domainName: string) => {
    try {
      if (!confirm(`Haqiqatan ham ${domainName} custom domenini o'chirmoqchimisiz?`)) return;

      const { data: tenantData, error: fetchErr } = await supabase
        .from('tenants')
        .select('config')
        .eq('id', tenantId)
        .single();

      if (fetchErr) throw fetchErr;

      const currentConfig = tenantData?.config || {};
      const domainsConfig = { ...currentConfig.domains };
      delete domainsConfig[domainName];

      const { error: updateErr } = await supabase
        .from('tenants')
        .update({
          custom_domain: null,
          config: {
            ...currentConfig,
            domains: domainsConfig
          }
        })
        .eq('id', tenantId);

      if (updateErr) throw updateErr;

      toast({
        title: "O'chirildi",
        description: "Custom domen muvaffaqiyatli o'chirildi.",
      });

      fetchDomains(); // Refresh
    } catch (err: any) {
      toast({
        title: "Xatolik",
        description: "Domen o'chirishda xatolik: " + err.message,
        variant: "destructive"
      });
    }
  };

  const filteredDomains = domains.filter(d => 
    d.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.tenantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="text-foreground font-sans space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Domenlar boshqaruvi</h1>
          <p className="text-white/50 mt-1 text-sm">
            Firmalar uchun ajratilgan subdomenlar va shaxsiy (custom) domenlarni ulash hamda SSL sozlamalari
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-600 text-black gap-2">
              <Plus className="w-4 h-4" /> Yangi Domen Ulash
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Yangi custom domen ulash</DialogTitle>
              <DialogDescription className="text-white/60">
                Firma uchun shaxsiy domen (masalan: consulting.uz) biriktiring.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tenantSelect">Firma (Tenant)</Label>
                <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                  <SelectTrigger className="bg-black/50 border-white/10 text-white">
                    <SelectValue placeholder="Firma tanlang..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-white/10 text-white">
                    {tenants.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customDomain">Domen manzili</Label>
                <Input
                  id="customDomain"
                  placeholder="masalan: globaledu.uz"
                  className="bg-black/50 border-white/10 text-white"
                  value={customDomainInput}
                  onChange={(e) => setCustomDomainInput(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" className="text-white hover:bg-white/5" onClick={() => setIsAddDialogOpen(false)}>
                Bekor qilish
              </Button>
              <Button 
                className="bg-amber-500 hover:bg-amber-600 text-black" 
                onClick={handleLinkCustomDomain}
                disabled={isAdding}
              >
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Ulash
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-muted/10 border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-500" />
              Jami Domenlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {loading ? <Loader2 className="w-6 h-6 animate-spin text-amber-500" /> : domains.length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-muted/10 border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              SSL Aktiv
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">
              {loading ? <Loader2 className="w-6 h-6 animate-spin text-emerald-500" /> : domains.filter(d => d.ssl === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/10 border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-blue-400" />
              Custom Domenlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">
              {loading ? <Loader2 className="w-6 h-6 animate-spin text-blue-400" /> : domains.filter(d => d.type === 'custom').length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/10 border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              DNS Muammolari
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500">
              {loading ? <Loader2 className="w-6 h-6 animate-spin text-amber-500" /> : domains.filter(d => d.type === 'custom' && d.status !== 'active').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Domains Table */}
      <Card className="bg-muted/5 border-white/5 overflow-hidden">
        <CardHeader>
          <CardTitle>Domenlar Ro'yxati</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Domen yoki firma nomi bo'yicha izlash..." 
              className="pl-8 bg-black/50 border-white/10 text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          ) : domains.length === 0 ? (
            <div className="text-center py-12 text-white/50">
              Domenlar topilmadi
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="p-4">Domen manzili</th>
                  <th className="p-4">Tegishli Firma</th>
                  <th className="p-4">Turi</th>
                  <th className="p-4">SSL Holati</th>
                  <th className="p-4">Tizim holati</th>
                  <th className="p-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-white/80">
                {filteredDomains.map((d) => (
                  <motion.tr 
                    key={d.id}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.01)' }}
                    className="transition-colors"
                  >
                    <td className="p-4 font-semibold text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-white/40" />
                      {d.domain}
                      <a href={`https://${d.domain}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-amber-500 cursor-pointer transition-colors" />
                      </a>
                    </td>
                    <td className="p-4">{d.tenantName}</td>
                    <td className="p-4">
                      <Badge variant="outline" className="capitalize border-white/10 bg-white/5 text-white/70">
                        {d.type === 'subdomain' ? 'Subdomen' : 'Custom Domen'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={
                        d.ssl === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                        'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }>
                        {d.ssl === 'active' ? 'Faol SSL' : 'SSL Kutilmoqda'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {(() => {
                        const map: Record<string, { label: string; cls: string }> = {
                          active: { label: d.type === 'subdomain' ? 'Faol (subdomen)' : "Ulangan", cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
                          unverified: { label: 'Tekshirilmagan', cls: 'bg-white/5 text-white/50 border-white/10' },
                          dns_not_found: { label: 'DNS topilmadi', cls: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
                          dns_misconfigured: { label: 'DNS noto\'g\'ri', cls: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
                          pending_dns: { label: 'DNS kutilmoqda', cls: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
                        };
                        const s = map[d.status] || map.unverified;
                        return <Badge className={s.cls}>{s.label}</Badge>;
                      })()}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {d.type === 'custom' && (
                        <Button
                          size="sm"
                          className="bg-amber-500 hover:bg-amber-600 text-black h-8"
                          onClick={() => handleVerifyDns(d)}
                          disabled={verifyingId === d.id}
                        >
                          {verifyingId === d.id
                            ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                            : <RefreshCw className="w-3.5 h-3.5 mr-1" />} DNS Tekshirish
                        </Button>
                      )}
                      {d.type === 'custom' && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-8 px-2"
                          onClick={() => handleDeleteCustomDomain(d.tenantId, d.domain)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
