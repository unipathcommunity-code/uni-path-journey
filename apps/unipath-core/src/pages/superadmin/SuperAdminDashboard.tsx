import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Users,
  CreditCard,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  UserCheck,
  Coins,
  Hourglass,
  Trash2,
  Plane,
  Bed,
  LayoutGrid,
  Database,
  Percent,
  Smartphone,
  GraduationCap,
  ClipboardList,
  TrendingUp,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SystemHealth } from "@/components/superadmin/SystemHealth";

// Business vertical config
const VERTICALS = [
  { id: 'consulting', name: 'Konsalting / Ta\'lim agentligi', icon: Building2, color: 'text-primary' },
  { id: 'tour', name: 'Tur agentlik (UniTour)', icon: Plane, color: 'text-sky-400' },
  { id: 'academy', name: 'O\'quv markazi (NOVA)', icon: GraduationCap, color: 'text-emerald-400' },
  { id: 'hotel', name: 'Mehmonxona', icon: Bed, color: 'text-amber-400' },
  { id: 'restaurant', name: 'Restoran', icon: ClipboardList, color: 'text-orange-400' },
  { id: 'clinic', name: 'Klinika', icon: UserCheck, color: 'text-rose-400' },
  { id: 'gym', name: 'Sport zal', icon: TrendingUp, color: 'text-green-400' },
];


export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterVertical, setFilterVertical] = useState<string>("all");

  // Dialog state
  const [isDialogOpen] = useState(false); // Managed through parent routing or simple modal
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({ name: '', subdomain: '', businessType: 'consulting' });
  const [isCreating, setIsCreating] = useState(false);
  
  // Delete state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // New Vertical Specific Settings State (Offline / LocalStorage backed)
  const [tenantConfigs, setTenantConfigs] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem('unipath_tenant_configs');
    return saved ? JSON.parse(saved) : {};
  });

  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTenants();
  }, []);


  const fetchTenants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('tenants').select('*').order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const mapped = data?.map(t => ({
        id: t.id,
        name: t.name,
        subdomain: t.subdomain || null,
        custom_domain: t.custom_domain || null,
        domain: t.subdomain ? `${t.subdomain}.unipath.me` : (t.custom_domain || 'N/A'),
        status: t.status || 'pending',
        plan: t.plan || 'Starter',
        students: 0,
        owner_name: t.owner_name,
        owner_email: t.owner_email,
        owner_phone: t.owner_phone,
        // Preserve full config so branding/settings survive impersonation
        config: t.config || null,
        // Read from DB `vertical` enum column first, then legacy config fallbacks
        business_type: (t as any).vertical || (t as any).business_type || t.config?.business_type || (t.config?.modules?.academy ? 'academy' : null) || (t.config?.modules?.tour ? 'tour' : null) || 'consulting',
        features: t.config?.features || {
          accountant: false,
          mentor: false,
          api_access: false,
          unicoin: false
        }
      })) || [];

      setTenants(mapped);
    } catch (error: any) {
      console.error("Error fetching tenants:", error);
      const saved = localStorage.getItem('unipath_tenants');
      let localMapped: any[] = [];
      if (saved) {
        try {
          localMapped = JSON.parse(saved);
        } catch {
          localMapped = [];
        }
      }
      setTenants(localMapped);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTenant = async (tenantId: string) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ status: 'active' })
        .eq('id', tenantId);
      
      if (error) throw error;
      toast({ title: "Muvaffaqiyatli", description: "Firma faollashtirildi!" });
      
      setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, status: 'active' } : t));
      if (selectedTenant && selectedTenant.id === tenantId) {
        setSelectedTenant(prev => ({ ...prev, status: 'active' }));
      }
    } catch (error: any) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    }
  };

  const handleRejectTenant = async (tenantId: string) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ status: 'rejected' })
        .eq('id', tenantId);
      
      if (error) throw error;
      toast({ title: "Muvaffaqiyatli", description: "Firma so'rovi rad etildi!" });
      
      setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, status: 'rejected' } : t));
      if (selectedTenant && selectedTenant.id === tenantId) {
        setSelectedTenant(prev => ({ ...prev, status: 'rejected' }));
      }
    } catch (error: any) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    }
  };

  const handleCreateTenant = async () => {
    if (!newTenant.name || !newTenant.subdomain) {
      toast({ title: "Xatolik", description: "Barcha maydonlarni to'ldiring", variant: "destructive" });
      return;
    }

    try {
      setIsCreating(true);
      const { data, error } = await supabase.from('tenants').insert([
        {
          name: newTenant.name,
          subdomain: newTenant.subdomain,
          vertical: newTenant.businessType,
          config: {
            business_type: newTenant.businessType,
            features: { accountant: false, mentor: false, api_access: false, unicoin: false }
          }
        } as any
      ]).select();

      if (error) throw error;

      toast({ title: "Muvaffaqiyatli", description: "Yangi firma muvaffaqiyatli yuklandi!" });
      setIsNewDialogOpen(false);
      setNewTenant({ name: '', subdomain: '', businessType: 'consulting' });
      fetchTenants();

    } catch (error: any) {
      // Offline fallback
      const mockNew = {
        id: 't-' + Date.now(),
        name: newTenant.name,
        domain: `${newTenant.subdomain}.unipath.me`,
        status: 'active',
        plan: 'Starter',
        students: 0,
        business_type: newTenant.businessType,
        features: { accountant: false, mentor: false, api_access: false, unicoin: false }
      };
      const updated = [mockNew, ...tenants];
      setTenants(updated);
      localStorage.setItem('unipath_tenants', JSON.stringify(updated));

      toast({ title: "Muvaffaqiyatli", description: "Yangi firma muvaffaqiyatli qo'shildi (Offline Rejim)!" });
      setIsNewDialogOpen(false);
      setNewTenant({ name: '', subdomain: '', businessType: 'consulting' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (!selectedTenant) return;
    if (deleteConfirmText !== selectedTenant.name) {
      toast({ title: "Xatolik", description: "Firma nomi noto'g'ri kiritildi", variant: "destructive" });
      return;
    }

    try {
      setIsDeleting(true);
      
      if (tenantId && tenantId.length > 10 && !tenantId.startsWith('t-')) {
        const { error } = await supabase.rpc('delete_tenant_cascade', {
          target_tenant_id: tenantId
        });

        if (error) throw error;
      }
      
      const updated = tenants.filter(t => t.id !== tenantId);
      setTenants(updated);
      localStorage.setItem('unipath_tenants', JSON.stringify(updated));

      toast({ title: "Muvaffaqiyatli", description: "Firma va unga tegishli barcha ma'lumotlar tizimdan butunlay o'chirildi!" });
      setIsDeleteOpen(false);
      setDeleteConfirmText("");
      setSelectedTenant(null);
    } catch (error: any) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleFeature = async (tenantId: string, feature: string) => {
    const tenantToUpdate = tenants.find(t => t.id === tenantId);
    if (!tenantToUpdate) return;
    
    const newFeatures = {
      ...tenantToUpdate.features,
      [feature]: !tenantToUpdate.features[feature]
    };

    const newTenants = tenants.map((t: any) => {
      if (t.id === tenantId) {
        return {
          ...t,
          features: newFeatures
        };
      }
      return t;
    });
    
    setTenants(newTenants);
    localStorage.setItem('unipath_tenants', JSON.stringify(newTenants));
    
    if (selectedTenant && selectedTenant.id === tenantId) {
      setSelectedTenant({
        ...selectedTenant,
        features: newFeatures
      });
    }

    if (tenantId && tenantId.length > 10 && !tenantId.startsWith('t-')) {
      try {
        const { data: existingTenant } = await supabase.from('tenants').select('config').eq('id', tenantId).single();
        const config = existingTenant?.config || {};
        
        const { error } = await supabase.from('tenants').update({
          config: {
            ...config,
            features: newFeatures
          }
        }).eq('id', tenantId);

        if (error) throw error;
        toast({ title: "Saqlandi", description: "Modul o'zgarishi saqlandi" });
      } catch (err: any) {
        console.error(err);
      }
    }
  };

  const handleUpdateBusinessType = async (tenantId: string, type: string) => {
    const newTenants = tenants.map((t: any) => {
      if (t.id === tenantId) {
        return {
          ...t,
          business_type: type
        };
      }
      return t;
    });
    
    setTenants(newTenants);
    localStorage.setItem('unipath_tenants', JSON.stringify(newTenants));
    
    if (selectedTenant && selectedTenant.id === tenantId) {
      setSelectedTenant({
        ...selectedTenant,
        business_type: type
      });
    }

    toast({ title: "Biznes Turi O'zgardi", description: `Firma tizimi ${type.toUpperCase()} rejimiga o'tkazildi.` });

    if (tenantId && tenantId.length > 10 && !tenantId.startsWith('t-')) {
      try {
        const { data: existingTenant } = await supabase.from('tenants').select('config').eq('id', tenantId).single();
        const config = existingTenant?.config || {};

        // Write to `vertical` enum column (primary source of truth) + config for legacy
        await supabase.from('tenants').update({
          vertical: type,
          config: {
            ...config,
            business_type: type,
            modules: {
              ...config.modules,
              consulting: type === 'consulting',
              academy: type === 'academy',
              hotel: type === 'hotel',
              tour: type === 'tour',
              restaurant: type === 'restaurant',
              clinic: type === 'clinic',
              gym: type === 'gym',
            }
          }
        } as any).eq('id', tenantId);
      } catch (err: any) {
        console.error(err);
      }
    }
  };

  // Upgraded custom settings handler for verticals
  const updateTenantConfig = (tenantId: string, key: string, value: any) => {
    const updated = {
      ...tenantConfigs,
      [tenantId]: {
        ...tenantConfigs[tenantId],
        [key]: value
      }
    };
    setTenantConfigs(updated);
    localStorage.setItem('unipath_tenant_configs', JSON.stringify(updated));
    toast({
      title: "Sozlama Saqlandi",
      description: `Firma parametri muvaffaqiyatli o'zgartirildi.`
    });
  };

  // 1-Click Database Seeding implementation
  const seedTourData = (tenantName: string) => {
    const mockTours = [
      {
        id: 't-seeded-1',
        title: 'Sehrli Registon & Samarqand Ziyorati',
        destinations: 'Samarqand',
        duration_days: 3,
        price: 1800000,
        currency: 'UZS',
        total_spots: 25,
        booked_spots: 12,
        guide_name: 'Diyorbek Karimov',
        itinerary: [
          { day: 1, title: 'Kutib olish', desc: 'Samarqand vokzalida kutib olish va mehmonxonaga joylashtirish.' },
          { day: 2, title: 'Tarixiy Obidalar', desc: 'Registon maydoni, Go\'ri Amir va Shoxi Zinda ziyoratlari.' },
          { day: 3, title: 'Siyob Bozori', desc: 'Siyob bozoridan esdalik sovg\'alar xarid qilish va qaytish.' }
        ]
      },
      {
        id: 't-seeded-2',
        title: 'Antaliya Ultra All-Inclusive Plyajlari',
        destinations: 'Turkiya, Antaliya',
        duration_days: 7,
        price: 12500000,
        currency: 'UZS',
        total_spots: 20,
        booked_spots: 18,
        guide_name: 'Alisher Fayzullayev',
        itinerary: [
          { day: 1, title: 'Charter reys va Transfer', desc: 'Antaliya aeroportida hashamatli transfer orqali mehmonxonaga yetib borish.' },
          { day: 2, title: 'O\'rta dengiz plyaji', desc: 'Dam olish va aqua-park o\'yinlari.' }
        ]
      }
    ];

    const mockBookings = [
      {
        id: 'b-seeded-1',
        tour_id: 't-seeded-1',
        tour_title: 'Sehrli Registon & Samarqand Ziyorati',
        customer_name: 'Rustamov Jamshid',
        customer_phone: '+998 90 990-11-22',
        spots_booked: 4,
        payment_status: 'paid',
        total_amount: 7200000,
        paid_amount: 7200000,
        insurance_included: true,
        booking_date: new Date().toISOString().split('T')[0]
      }
    ];

    localStorage.setItem('unipath_tour_packages', JSON.stringify(mockTours));
    localStorage.setItem('unipath_tour_bookings', JSON.stringify(mockBookings));
    
    toast({
      title: "Demo Turlar Seed qilindi!",
      description: `"${tenantName}" firmasi uchun 2 ta sayohat paketi va 1 ta bron muvaffaqiyatli saqlandi.`,
      className: "border-sky-400 bg-sky-950/20 text-white"
    });
  };

  const seedAcademyData = (tenantName: string) => {
    const mockGroups = [
      {
        id: 'g-seeded-1',
        name: 'NOVA IELTS Rocket (Ertablagi)',
        teacher_id: 't-1',
        teacher_name: 'Dostonbek Qodirov',
        schedule: [{ day: 'Seshanba-Payshanba-Shanba', time: '09:00', room: 'Room 303' }],
        created_at: new Date().toISOString()
      },
      {
        id: 'g-seeded-2',
        name: 'Web Design UI/UX (Kunduzgi)',
        teacher_id: 't-2',
        teacher_name: 'Jasurbek Raximov',
        schedule: [{ day: 'Dushanba-Chorshanba-Juma', time: '15:00', room: 'Lab 1' }],
        created_at: new Date().toISOString()
      }
    ];

    const mockStudents = [
      { id: 's-seeded-1', full_name: 'Nazarov Farrux', email: 'farrux@unipath.me', phone: '+998 97 770-00-11', novacoins: 320, debt_amount: 0 },
      { id: 's-seeded-2', full_name: 'Alimova Rayhon', email: 'rayhon@unipath.me', phone: '+998 90 333-44-55', novacoins: 750, debt_amount: 850000 }
    ];

    localStorage.setItem('unipath_academy_groups', JSON.stringify(mockGroups));
    localStorage.setItem('unipath_academy_students', JSON.stringify(mockStudents));

    toast({
      title: "Demo darsliklar seed qilindi!",
      description: `"${tenantName}" firmasi uchun 2 ta guruh va 2 ta o'quvchi (Loyalty ko'rsatkichlari bilan) muvaffaqiyatli seed qilindi.`,
      className: "border-emerald-400 bg-emerald-950/20 text-white"
    });
  };

  const getVerticalIcon = (type: string) => {
    const found = VERTICALS.find(v => v.id === type);
    return found ? found.icon : Building2;
  };

  const getVerticalColor = (type: string) => {
    const found = VERTICALS.find(v => v.id === type);
    return found ? found.color : 'text-primary';
  };

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.business_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || t.status === filterStatus;
    const matchesVertical = filterVertical === "all" || t.business_type === filterVertical;
    return matchesSearch && matchesStatus && matchesVertical;
  });

  // Insights counts
  const totalTourCompanies = tenants.filter(t => t.business_type === 'tour').length;
  const totalAcademies = tenants.filter(t => t.business_type === 'academy').length;
  const totalConsulting = tenants.filter(t => t.business_type === 'consulting').length;

  // ── Platform analytics (derived from already-fetched tenants) ──────────────
  const activeTenants = tenants.filter(t => t.status === 'active');
  const PLAN_PRICE: Record<string, number> = { Starter: 29, Pro: 79, Enterprise: 199 };
  const mrr = activeTenants.reduce((acc, t) => acc + (PLAN_PRICE[t.plan] || 0), 0);
  const arr = mrr * 12;
  const activeRate = tenants.length ? Math.round((activeTenants.length / tenants.length) * 100) : 0;
  const pendingCount = tenants.filter(t => t.status === 'pending').length;
  const otherCount = Math.max(tenants.length - totalConsulting - totalTourCompanies - totalAcademies, 0);
  const verticalDist = [
    { name: 'Konsalting', count: totalConsulting, color: '#d4af37' },
    { name: 'Tur', count: totalTourCompanies, color: '#38bdf8' },
    { name: 'Akademiya', count: totalAcademies, color: '#34d399' },
    { name: 'Boshqa', count: otherCount, color: '#a78bfa' },
  ];

  return (
    <div className="text-foreground animate-fade-in pb-16 relative">
      {/* Glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      <div className="space-y-8">

        {/* Real, honest system health — ishlaydi/ishlamaydi */}
        <SystemHealth />

        {/* Content Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">B2B SaaS Multi-Vertical Engine</h1>
            <p className="text-white/50 mt-1 text-sm">
              SaaS arxitekturasidagi barcha biznes sub-domenlari, turlari (Tour, Academy, Hotel, CRM) va to'lovlarini nazorat qilish paneli.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold gap-2 px-6 py-5 rounded-2xl shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                  <Plus className="w-5 h-5" />
                  Yangi B2B Firma Qo'shish
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-[#111111]/90 border border-white/5 text-white rounded-3xl backdrop-blur-xl">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-white">Yangi Multi-Tenant Firma</DialogTitle>
                  <DialogDescription className="text-white/50 text-xs">
                    Tizimda yangi mijoz oching va uning asosiy biznes yo'nalishini belgilang.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 text-xs">
                  <div className="space-y-1.5">
                    <Label className="text-white/80 font-bold">Firma nomi</Label>
                    <Input
                      value={newTenant.name}
                      onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                      placeholder="Masalan: UniTour Agency, NOVA IT"
                      className="bg-white/5 border-white/10 text-white rounded-xl h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white/80 font-bold">Subdomen manzili</Label>
                    <div className="relative">
                      <Input
                        value={newTenant.subdomain}
                        onChange={(e) => setNewTenant({ ...newTenant, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                        placeholder="unitour"
                        className="bg-white/5 border-white/10 text-white pr-24 rounded-xl h-11"
                      />
                      <span className="absolute right-3 top-3 text-[10px] text-white/40 font-bold">.unipath.me</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white/80 font-bold">Biznes turi (Vertical)</Label>
                    <select
                      className="w-full h-11 px-3 bg-[#171717] border border-white/10 rounded-xl text-white text-xs"
                      value={newTenant.businessType}
                      onChange={(e) => setNewTenant({ ...newTenant, businessType: e.target.value })}
                    >
                      {VERTICALS.map(v => (
                        <option key={v.id} value={v.id} className="bg-[#111111]">{v.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    onClick={handleCreateTenant} 
                    disabled={isCreating}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground w-full font-bold h-11 rounded-xl"
                  >
                    {isCreating ? "Yozilmoqda..." : "Kompaniyani Sozlash"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Bento Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#111111]/80 border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Building2 className="w-[100px] h-[100px] text-white" />
            </div>
            <div className="flex items-center gap-3 text-white/50 mb-2">
              <Building2 className="w-5 h-5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider">Jami Agentliklar</span>
            </div>
            <div className="text-3xl font-black text-primary">{tenants.length} ta</div>
          </div>

          <button
            onClick={() => setFilterVertical(filterVertical === 'tour' ? 'all' : 'tour')}
            className={`bg-[#111111]/80 border p-5 rounded-2xl relative overflow-hidden group text-left w-full transition-all ${filterVertical === 'tour' ? 'border-sky-400/40 ring-1 ring-sky-400/20' : 'border-white/5 hover:border-sky-400/20'}`}
          >
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Plane className="w-[100px] h-[100px] text-white" />
            </div>
            <div className="flex items-center gap-3 text-white/50 mb-2">
              <Plane className="w-5 h-5 text-sky-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Sayohat Kompaniyalari</span>
            </div>
            <div className="text-3xl font-black text-sky-400">{totalTourCompanies} ta</div>
            {filterVertical === 'tour' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-sky-400 animate-pulse" />}
          </button>

          <button
            onClick={() => setFilterVertical(filterVertical === 'academy' ? 'all' : 'academy')}
            className={`bg-[#111111]/80 border p-5 rounded-2xl relative overflow-hidden group text-left w-full transition-all ${filterVertical === 'academy' ? 'border-emerald-400/40 ring-1 ring-emerald-400/20' : 'border-white/5 hover:border-emerald-400/20'}`}
          >
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Users className="w-[100px] h-[100px] text-white" />
            </div>
            <div className="flex items-center gap-3 text-white/50 mb-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider">NOVA Akademiyalar</span>
            </div>
            <div className="text-3xl font-black text-emerald-400">{totalAcademies} ta</div>
            {filterVertical === 'academy' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
          </button>

          <div className="bg-[#111111]/80 border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <CreditCard className="w-[100px] h-[100px] text-white" />
            </div>
            <div className="flex items-center gap-3 text-white/50 mb-2">
              <CreditCard className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Oylik MRR</span>
            </div>
            <div className="text-3xl font-black text-amber-400">
              ${tenants.filter(t => t.status === 'active').reduce((acc, t) => {
                const prices: Record<string, number> = { 'Starter': 29, 'Pro': 79, 'Enterprise': 199 };
                return acc + (prices[t.plan] || 0);
              }, 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Platform Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#111111]/80 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-white">Vertikal bo'yicha taqsimot</h2>
              </div>
              <span className="text-[10px] text-white/40 font-semibold">{tenants.length} ta firma</span>
            </div>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={verticalDist} barSize={40}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.45)' }} axisLine={false} tickLine={false} />
                <YAxis hide allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12, color: '#fff' }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {verticalDist.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#111111]/80 border border-white/5 rounded-2xl p-6 flex flex-col">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-5">
              <CreditCard className="w-4 h-4 text-amber-400" /> Daromad & Holat
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50 flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Yillik (ARR)</span>
                <span className="text-sm font-black text-emerald-400">${arr.toLocaleString()}</span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-white/50 flex items-center gap-2"><Percent className="w-3.5 h-3.5 text-primary" /> Faollik darajasi</span>
                  <span className="text-sm font-black text-primary">{activeRate}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${activeRate}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50 flex items-center gap-2"><Hourglass className="w-3.5 h-3.5 text-amber-400" /> Tasdiq kutmoqda</span>
                <span className="text-sm font-black text-amber-400">{pendingCount} ta</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50 flex items-center gap-2"><Database className="w-3.5 h-3.5 text-sky-400" /> O'rtacha / firma</span>
                <span className="text-sm font-black text-sky-400">${activeTenants.length ? Math.round(mrr / activeTenants.length) : 0}/oy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid: List & Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Tenant List */}
          <div className="lg:col-span-5 bg-[#111111]/80 border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[680px]">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-lg font-bold text-white mb-4">Mijoz Sub-domenlar</h2>
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Izlash (Firma nomi, turi, subdomen)..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none text-white placeholder:text-white/30"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {['all', 'active', 'pending'].map((st) => (
                  <button
                    key={st}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 capitalize ${
                      filterStatus === st
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                    onClick={() => setFilterStatus(st)}
                  >
                    {st === 'all' ? 'Barchasi' : st === 'active' ? 'Faol' : 'Kutilmoqda'}
                  </button>
                ))}
              </div>
              {/* Vertical filter chips */}
              <div className="flex gap-1.5 flex-wrap mt-2">
                <button
                  onClick={() => setFilterVertical('all')}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${filterVertical === 'all' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40 hover:text-white/70'}`}
                >Hammasi</button>
                {VERTICALS.slice(0, 5).map(v => (
                  <button
                    key={v.id}
                    onClick={() => setFilterVertical(filterVertical === v.id ? 'all' : v.id)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${filterVertical === v.id ? `${v.color} bg-white/15` : 'bg-white/5 text-white/40 hover:text-white/70'}`}
                  >
                    {v.id === 'consulting' ? '🎓 Konsalting' : v.id === 'tour' ? '✈️ Tour' : v.id === 'academy' ? '📚 Academy' : v.id === 'hotel' ? '🏨 Hotel' : '🍽 Restoran'}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {filteredTenants.length === 0 ? (
                <div className="text-center py-12 text-white/30 text-xs">Firmalar topilmadi</div>
              ) : (
                filteredTenants.map((tenant) => {
                  const isSelected = selectedTenant?.id === tenant.id;
                  const Icon = getVerticalIcon(tenant.business_type);
                  const color = getVerticalColor(tenant.business_type);
                  return (
                     <div
                      key={tenant.id}
                      className={`p-4 rounded-xl hover:bg-white/5 transition-all duration-200 cursor-pointer group border ${
                        isSelected ? 'bg-primary/10 border-primary/20' : 'border-transparent bg-transparent'
                      }`}
                      onClick={() => setSelectedTenant(tenant)}
                    >
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <div className="flex gap-3">
                          <div className={`w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0 ${color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className={`font-bold text-sm transition-colors ${
                              isSelected ? 'text-primary' : 'text-white group-hover:text-primary'
                            }`}>
                              {tenant.name}
                            </h3>
                            <p className="text-[11px] text-white/40 font-mono mt-0.5">{tenant.domain}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase border ${
                            tenant.status === 'active' || tenant.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : tenant.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {tenant.status === 'active' || tenant.status === 'approved' ? 'Faol' : tenant.status === 'pending' ? 'Kutilmoqda' : 'Rad etilgan'}
                          </span>
                          {/* Quick Delete */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTenant(tenant);
                              setIsDeleteOpen(true);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/20 flex items-center justify-center text-rose-400 hover:text-rose-300"
                            title="O'chirish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 pl-12 text-[10px] text-white/45">
                        <span className="capitalize font-semibold text-primary">{tenant.business_type} vertical</span>
                        <span>·</span>
                        <span>{tenant.plan} plan</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Tenant Settings Panel / Dynamic Telemetry Command Center */}
          <div className="lg:col-span-7">
            {selectedTenant ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={selectedTenant.id}
              >
                <div className="bg-[#111111]/80 border border-white/5 rounded-2xl p-6 h-[680px] flex flex-col justify-between overflow-y-auto custom-scrollbar">
                  <div>
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-white/5 pb-6 mb-6">
                      <div className="flex gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 ${getVerticalColor(selectedTenant.business_type)}`}>
                          {(() => {
                            const Icon = getVerticalIcon(selectedTenant.business_type);
                            return <Icon className="w-6 h-6" />;
                          })()}
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-white">{selectedTenant.name}</h2>
                          <p className="text-xs text-white/50 mt-1">{selectedTenant.domain}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button 
                          className="flex-1 sm:flex-none text-xs font-bold rounded-xl bg-white/5 hover:bg-white/10 text-white" 
                          onClick={() => {
                            // Save enriched object so vertical detection always works
                            const bt = selectedTenant.business_type || 'consulting';
                            const impersonatePayload = {
                              ...selectedTenant,
                              // Ensure business_type is always at top level
                              business_type: bt,
                              // Merge config: preserve branding/settings, but override vertical fields
                              config: {
                                ...(selectedTenant.config || {}),
                                business_type: bt,
                                modules: {
                                  ...((selectedTenant.config as any)?.modules || {}),
                                  [bt]: true,
                                },
                              },
                            };
                            localStorage.setItem('active_tenant', JSON.stringify(impersonatePayload));
                            // Hard reload — forces AppContext to re-read localStorage so vertical routing is correct
                            let redirectPath = '/admin/dashboard';
                            if (bt === 'academy') redirectPath = '/admin';
                            else if (bt === 'tour') redirectPath = '/company';
                            
                            window.location.href = redirectPath;
                          }}
                        >
                          Tizimga Kirish (Impersonate)
                        </Button>

                        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              className="flex-1 sm:flex-none border border-rose-500/20 text-xs font-bold rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white"
                            >
                              <Trash2 className="w-4 h-4 mr-1.5" /> O'chirish
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px] bg-[#111111]/95 border border-rose-500/20 text-white rounded-3xl backdrop-blur-xl">
                            <DialogHeader>
                              <DialogTitle className="text-lg font-bold text-rose-400 flex items-center gap-2">
                                <Trash2 className="w-5 h-5" /> Firmani O'chirish
                              </DialogTitle>
                              <DialogDescription className="text-white/60 text-xs mt-2">
                                Ushbu amalni <strong>ortga qaytarib bo'lmaydi</strong>. Firmaning barcha ma'lumotlari butunlay o'chib ketadi.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4 text-xs">
                              <p className="text-white/80">
                                O'chirishni tasdiqlash uchun firma nomini aynan quyidagicha kiriting: 
                                <span className="block font-bold text-white bg-white/5 px-3 py-1.5 rounded-lg mt-2 text-center select-all">
                                  {selectedTenant.name}
                                </span>
                              </p>
                              <Input
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder="Firma nomini kiriting"
                                className="bg-white/5 border-white/10 text-white rounded-xl h-11"
                              />
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsDeleteOpen(false);
                                  setDeleteConfirmText("");
                                }}
                                className="border-white/10 text-xs font-semibold rounded-xl text-white"
                              >
                                Bekor qilish
                              </Button>
                              <Button
                                variant="destructive"
                                disabled={deleteConfirmText !== selectedTenant.name || isDeleting}
                                onClick={() => handleDeleteTenant(selectedTenant.id)}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs h-11 px-5"
                              >
                                {isDeleting ? "O'chirilmoqda..." : "Tasdiqlayman"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    {/* Pending Request Alert */}
                    {selectedTenant.status === 'pending' && (
                      <div className="mb-6 p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1">
                          <h4 className="font-bold text-amber-500 text-sm flex items-center gap-2">
                            <Hourglass className="w-4 h-4 animate-pulse" /> Kutilayotgan so'rov
                          </h4>
                          <p className="text-xs text-white/70">
                            Firma egasi: <strong className="text-white">{selectedTenant.owner_name || 'Noma\'lum'}</strong> ({selectedTenant.owner_email || 'Email yo\'q'})
                          </p>
                          {selectedTenant.owner_phone && (
                            <p className="text-[10px] text-white/50">Telefon: {selectedTenant.owner_phone}</p>
                          )}
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                          <Button 
                            onClick={() => handleRejectTenant(selectedTenant.id)}
                            variant="destructive" 
                            className="flex-1 md:flex-initial h-9 px-4 rounded-xl text-xs font-bold"
                          >
                            Rad etish
                          </Button>
                          <Button 
                            onClick={() => handleApproveTenant(selectedTenant.id)}
                            className="flex-1 md:flex-initial h-9 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs"
                          >
                            Tasdiqlash
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Tabs */}
                    <Tabs defaultValue="modules" className="w-full">
                      <TabsList className="bg-white/5 border border-white/5 w-full justify-start mb-6 rounded-xl p-1 gap-1">
                        <TabsTrigger 
                          value="modules" 
                          className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs font-bold"
                        >
                          Vertical & Modullar
                        </TabsTrigger>
                        <TabsTrigger 
                          value="billing" 
                          className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs font-bold"
                        >
                          Billing & Tarif
                        </TabsTrigger>
                        <TabsTrigger 
                          value="limits" 
                          className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs font-bold"
                        >
                          Limitlar
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="modules" className="space-y-6">
                        
                        {/* Section I: Main Business Vertical */}
                        <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] space-y-4">
                          <div>
                            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                              <LayoutGrid className="w-4 h-4 text-primary" /> I. Biznes Turi (Vertical Engine)
                            </h4>
                            <p className="text-[10px] text-white/50 mt-1">Super admin har qanday mijoz sub-domenini boshqa biznes rejimiga (Vertical engine) o'tkazishi mumkin.</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {VERTICALS.map(v => {
                              const isSelected = selectedTenant.business_type === v.id;
                              const VIcon = v.icon;
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => handleUpdateBusinessType(selectedTenant.id, v.id)}
                                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                                    isSelected 
                                      ? 'border-primary bg-primary/10 text-white font-bold' 
                                      : 'border-white/5 bg-white/[0.01] text-white/60 hover:border-white/10 hover:text-white'
                                  }`}
                                >
                                  <VIcon className={`w-4.5 h-4.5 shrink-0 ${isSelected ? 'text-primary' : 'text-white/40'}`} />
                                  <span>{v.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Section II: Sorted Vertical Specific Custom Controls */}
                        <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] space-y-4">
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                            <Settings className="w-4 h-4 text-sky-400" /> II. Vertical Maxsus Sozlamalari
                          </h4>

                          {selectedTenant.business_type === 'tour' && (
                            <div className="space-y-4 text-xs">
                              <div className="bg-white/[0.01] border border-white/5 p-3.5 rounded-xl space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-white/80 flex items-center gap-2">
                                    <Percent className="w-4 h-4 text-sky-400" /> Sayohat Komissiyasi (Markup %)
                                  </span>
                                  <span className="font-bold text-sky-400">{tenantConfigs[selectedTenant.id]?.commissionRate || 10}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="5"
                                  max="30"
                                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-sky-400"
                                  value={tenantConfigs[selectedTenant.id]?.commissionRate || 10}
                                  onChange={(e) => updateTenantConfig(selectedTenant.id, 'commissionRate', parseInt(e.target.value))}
                                />
                                <p className="text-[9px] text-white/40 leading-relaxed">Aviabiletlar va turoperatorlar takliflariga avtomatik qo'shiladigan o'rtacha ustama foiz.</p>
                              </div>

                              <div className="bg-white/[0.01] border border-white/5 p-3.5 rounded-xl flex items-center justify-between">
                                <div className="space-y-0.5 pr-4">
                                  <span className="font-semibold text-white/80 block">GDS Flight & Hotel API Integratsiyasi</span>
                                  <span className="text-[9px] text-white/40 leading-relaxed block">Amadeus, Sabre va Booking.com xalqaro integratsiyalarini faollashtirish.</span>
                                </div>
                                <Switch
                                  checked={tenantConfigs[selectedTenant.id]?.gdsEnabled || false}
                                  onCheckedChange={(checked) => updateTenantConfig(selectedTenant.id, 'gdsEnabled', checked)}
                                />
                              </div>
                            </div>
                          )}

                          {selectedTenant.business_type === 'academy' && (
                            <div className="space-y-4 text-xs">
                              <div className="bg-white/[0.01] border border-white/5 p-3.5 rounded-xl space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-white/80 flex items-center gap-2">
                                    <Coins className="w-4 h-4 text-emerald-400" /> NovaCoins Multiplikatori
                                  </span>
                                  <span className="font-bold text-emerald-400">{tenantConfigs[selectedTenant.id]?.coinMultiplier || 1.5}x rate</span>
                                </div>
                                <input
                                  type="range"
                                  min="10"
                                  max="50"
                                  step="5"
                                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                                  value={(tenantConfigs[selectedTenant.id]?.coinMultiplier || 1.5) * 10}
                                  onChange={(e) => updateTenantConfig(selectedTenant.id, 'coinMultiplier', parseFloat(e.target.value) / 10)}
                                />
                                <p className="text-[9px] text-white/40 leading-relaxed">Har bir dars scan qilinganda va qatnashuvda beriladigan virtual tangalar koeffitsiyenti.</p>
                              </div>

                              <div className="bg-white/[0.01] border border-white/5 p-3.5 rounded-xl flex items-center justify-between">
                                <div className="space-y-0.5 pr-4">
                                  <span className="font-semibold text-white/80 flex items-center gap-1.5">
                                    <Smartphone className="w-4 h-4 text-emerald-400" /> SMS Debt Collection Gateway
                                  </span>
                                  <span className="text-[9px] text-white/40 leading-relaxed block">Qarzdorlik bo'yicha ogohlantirish yuborish provayderi.</span>
                                </div>
                                <select
                                  className="bg-[#171717] border border-white/10 rounded-lg text-white px-2.5 py-1.5 text-xs font-semibold"
                                  value={tenantConfigs[selectedTenant.id]?.smsProvider || "Eskiz SMS"}
                                  onChange={(e) => updateTenantConfig(selectedTenant.id, 'smsProvider', e.target.value)}
                                >
                                  <option value="Eskiz SMS">Eskiz SMS</option>
                                  <option value="PlayMobile">PlayMobile</option>
                                  <option value="Twilio Global">Twilio Global</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {selectedTenant.business_type === 'consulting' && (
                            <div className="space-y-4 text-xs">
                              <div className="bg-white/[0.01] border border-white/5 p-3.5 rounded-xl flex items-center justify-between">
                                <div className="space-y-0.5 pr-4">
                                  <span className="font-semibold text-white/80 block">Xalqaro Universitetlar Integratsiyasi (API Sync)</span>
                                  <span className="text-[9px] text-white/40 block">500+ Yevropa va AQSH oliy o'quv yurtlari ro'yxatini to'g'ridan-to'g'ri bog'lash.</span>
                                </div>
                                <Switch
                                  checked={tenantConfigs[selectedTenant.id]?.universitySync !== false}
                                  onCheckedChange={(checked) => updateTenantConfig(selectedTenant.id, 'universitySync', checked)}
                                />
                              </div>
                            </div>
                          )}

                          {selectedTenant.business_type === 'hotel' && (
                            <p className="text-[10px] text-white/40 py-2">Mehmonxona boshqaruv tizimi uchun global xonalar kategoriyalari sozlamalari faqat joriy sub-domen ma'muriyatida o'zgaradi.</p>
                          )}
                        </div>

                        {/* Section III: Global Platform Features */}
                        <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] space-y-4">
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                            <Users className="w-4 h-4 text-emerald-400" /> III. Platforma Qo'shimcha Modullari (Global Access)
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl border border-white/5 bg-[#171717]/20 flex flex-col justify-between h-28">
                              <div>
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-semibold text-xs flex items-center gap-2 text-white">
                                    <UserCheck className="w-4 h-4 text-primary" /> Mentor moduli
                                  </h4>
                                  <Switch 
                                    checked={selectedTenant.features.mentor} 
                                    onCheckedChange={() => toggleFeature(selectedTenant.id, 'mentor')}
                                  />
                                </div>
                                <p className="text-[9px] text-white/45 leading-relaxed">Talabalarni kutib olish, marshrut belgilash va viza operatsiyalari modullari.</p>
                              </div>
                            </div>

                            <div className="p-4 rounded-xl border border-white/5 bg-[#171717]/20 flex flex-col justify-between h-28">
                              <div>
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-semibold text-xs flex items-center gap-2 text-white">
                                    <CreditCard className="w-4 h-4 text-primary" /> Buxgalteriya moduli
                                  </h4>
                                  <Switch 
                                    checked={selectedTenant.features.accountant} 
                                    onCheckedChange={() => toggleFeature(selectedTenant.id, 'accountant')}
                                  />
                                </div>
                                <p className="text-[9px] text-white/45 leading-relaxed">Oylik tushumlar, o'quv markazi guruh to'lovlari yoki sayohat paket to'lov hisobotlari.</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Section IV: 1-Click Database Seeding */}
                        <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] space-y-4">
                          <div>
                            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                              <Database className="w-4 h-4 text-amber-400" /> IV. 1-Bosishda Demo Shablonlarni Yuklash (Template Seeding)
                            </h4>
                            <p className="text-[10px] text-white/50 mt-1">Yangidan ro'yxatdan o'tgan mijoz tizimini tekshirib ko'rishi uchun ushbu firmaning dashboard bazasiga tayyor ma'lumotlarni seed qiling.</p>
                          </div>

                          <div className="flex gap-2">
                            {selectedTenant.business_type === 'tour' && (
                              <Button
                                className="w-full bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold h-10 rounded-xl gap-1.5"
                                onClick={() => seedTourData(selectedTenant.name)}
                              >
                                <Database className="w-4 h-4" /> Sayohat Tizimi Demo Shablonlarini Yuklash
                              </Button>
                            )}

                            {selectedTenant.business_type === 'academy' && (
                              <Button
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold h-10 rounded-xl gap-1.5"
                                onClick={() => seedAcademyData(selectedTenant.name)}
                              >
                                <Database className="w-4 h-4" /> Akademiya CRM Demo Shablonlarini Yuklash
                              </Button>
                            )}

                            {selectedTenant.business_type !== 'tour' && selectedTenant.business_type !== 'academy' && (
                              <Button
                                className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold h-10 rounded-xl gap-1.5"
                                onClick={() => {
                                  toast({
                                    title: "Integratsiya",
                                    description: `Konsalting yo'nalishi uchun demo shablonlar tizimga avtomatlashtirilgan.`
                                  });
                                }}
                              >
                                <Database className="w-4 h-4" /> Standart Demo Shablonlarni yuklash
                              </Button>
                            )}
                          </div>
                        </div>

                      </TabsContent>
                      
                      <TabsContent value="billing" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {[
                            { plan: 'Starter', price: '$29', students: 50 },
                            { plan: 'Pro', price: '$79', students: 200 },
                            { plan: 'Enterprise', price: '$199', students: 'Cheksiz' }
                          ].map(p => {
                            const isCurrent = selectedTenant?.plan === p.plan;
                            return (
                              <div key={p.plan} className={`p-4 rounded-2xl border ${isCurrent ? 'border-primary/45 bg-primary/5' : 'border-white/5 bg-white/[0.01]'} relative text-xs`}>
                                {isCurrent && (
                                  <span className="absolute -top-2 right-3 bg-primary text-primary-foreground text-[8px] font-bold px-2 py-0.5 rounded-full uppercase">Joriy</span>
                                )}
                                <h4 className="font-bold text-white">{p.plan}</h4>
                                <p className="text-xl font-extrabold text-primary my-1.5">{p.price}<span className="text-[10px] text-white/40 font-normal">/oy</span></p>
                                <p className="text-[10px] text-white/40 mb-3">Sessiyalar: <span className="text-white font-semibold">{p.students}</span></p>
                                <Button 
                                  size="sm" 
                                  className={`w-full text-[9px] h-7 rounded-xl ${isCurrent ? 'bg-primary text-primary-foreground' : 'bg-white/5 border border-white/10 text-white'}`}
                                  onClick={async () => {
                                    setTenants(prev => prev.map(t => t.id === selectedTenant.id ? { ...t, plan: p.plan } : t));
                                    setSelectedTenant(prev => ({ ...prev, plan: p.plan }));
                                    
                                    if (selectedTenant.id && selectedTenant.id.length > 10 && !selectedTenant.id.startsWith('t-')) {
                                      try {
                                        await supabase.from('tenants').update({ plan: p.plan }).eq('id', selectedTenant.id);
                                      } catch (err: any) {
                                        console.error(err);
                                      }
                                    }
                                  }}
                                >
                                  {isCurrent ? 'Faol' : "Tarifni o'zgartirish"}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="limits" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                            <h4 className="font-bold text-white">Sessiyalar Limiti</h4>
                            <p className="text-[10px] text-white/40 mb-3">Maksimal faol talabalar / sayyohlar soni</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-black text-primary">{selectedTenant?.plan === 'Enterprise' ? '∞' : selectedTenant?.plan === 'Pro' ? 200 : 50}</span>
                              <span className="text-white/40">ta faol joy</span>
                            </div>
                          </div>
                          <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                            <h4 className="font-bold text-white">Disk Xotirasi</h4>
                            <p className="text-[10px] text-white/40 mb-3">Hujjatlar va sayohat rejalari uchun joy</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-black text-secondary">{selectedTenant?.plan === 'Enterprise' ? '100' : selectedTenant?.plan === 'Pro' ? '20' : '5'}</span>
                              <span className="text-white/40">GB</span>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#111111]/80 border border-white/5 rounded-2xl p-6 h-[680px] flex flex-col gap-6"
              >
                {/* Header */}
                <div className="border-b border-white/5 pb-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Hourglass className="w-5 h-5 text-amber-400" /> Kutilayotgan So'rovlar
                    </h3>
                    <Badge className={`text-[9px] uppercase tracking-widest font-black border ${
                      tenants.filter(t => t.status === 'pending').length > 0
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {tenants.filter(t => t.status === 'pending').length} ta kutilmoqda
                    </Badge>
                  </div>
                  <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                    Yangi ro'yxatdan o'tgan firmalar sizning tasdiqlashingizni kutmoqda. Firma tanlash uchun chap paneldan bosing.
                  </p>
                </div>

                {/* Pending approvals list */}
                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                  {tenants.filter(t => t.status === 'pending').length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-white/30">
                      <CheckCircle2 className="w-14 h-14 text-emerald-500/25" />
                      <p className="text-sm font-semibold text-white/40">Barcha so'rovlar ko'rib chiqilgan</p>
                      <p className="text-xs text-white/25">Hozircha yangi ro'yxatdan o'tishlar yo'q</p>
                    </div>
                  ) : (
                    tenants.filter(t => t.status === 'pending').map((tenant) => {
                      const Icon = getVerticalIcon(tenant.business_type);
                      const color = getVerticalColor(tenant.business_type);
                      return (
                        <div key={tenant.id} className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/[0.03] space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex gap-3">
                              <div className={`w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0 ${color}`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-bold text-sm text-white">{tenant.name}</p>
                                <p className="text-[11px] text-white/40 font-mono">{tenant.domain}</p>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase border bg-amber-500/10 text-amber-400 border-amber-500/20 shrink-0">
                              Kutilmoqda
                            </span>
                          </div>
                          {(tenant.owner_name || tenant.owner_email) && (
                            <div className="pl-12 text-[10px] text-white/50 space-y-0.5">
                              {tenant.owner_name && (
                                <p>Egasi: <span className="text-white font-semibold">{tenant.owner_name}</span></p>
                              )}
                              {tenant.owner_email && (
                                <p>Email: <span className="text-white/70">{tenant.owner_email}</span></p>
                              )}
                              {tenant.owner_phone && (
                                <p>Tel: <span className="text-white/70">{tenant.owner_phone}</span></p>
                              )}
                            </div>
                          )}
                          <div className="flex gap-2 pl-12">
                            <Button
                              size="sm"
                              onClick={() => handleRejectTenant(tenant.id)}
                              className="flex-1 h-8 rounded-xl text-[10px] font-bold bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 text-rose-400 hover:text-white transition-all"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Rad etish
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApproveTenant(tenant.id)}
                              className="flex-1 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px]"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Tasdiqlash
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-white/5 pt-4 text-center">
                  <p className="text-[10px] text-white/30">
                    ← Firmani batafsil sozlash uchun chap paneldan tanlang
                  </p>
                </div>
              </motion.div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
