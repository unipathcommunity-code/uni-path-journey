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
  Wrench,
  Pill,
  Factory,
  Car,
  Heart,
  Baby,
  BookOpen,
  Scissors,
  Trophy,
  Edit,
  Trash,
  Globe,
  Loader2,
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
import { supabase } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

// Business vertical config
const VERTICALS = [
  { id: 'consulting', name: 'Konsalting (Consulting)', icon: Building2, color: 'text-blue-400' },
  { id: 'tour', name: 'Turistik Kompaniya (Tour)', icon: Plane, color: 'text-sky-400' },
  { id: 'academy', name: 'Akademiya (NOVA)', icon: GraduationCap, color: 'text-emerald-400' },
  { id: 'hotel', name: 'Mehmonxona (Hotel)', icon: Bed, color: 'text-purple-400' },
  { id: 'restaurant', name: 'Restoran (Restaurant)', icon: ClipboardList, color: 'text-amber-400' },
  { id: 'pharmacy', name: 'Dorixona (Pharmacy)', icon: Pill, color: 'text-blue-400' },
  { id: 'gym', name: 'Sport Zali (Gym)', icon: TrendingUp, color: 'text-amber-400' },
  { id: 'manufacturing', name: 'Ishlab Chiqarish (Manufacturing)', icon: Factory, color: 'text-blue-400' },
  { id: 'auto_service', name: 'Avtoservis (Auto)', icon: Wrench, color: 'text-amber-400' },
  { id: 'clinic', name: 'Klinika (Clinic)', icon: UserCheck, color: 'text-rose-400' },
  { id: 'parking', name: 'Avtoturargoh (Parking)', icon: Car, color: 'text-blue-400' },
  { id: 'wedding_hall', name: 'To\'yxona (Wedding Hall)', icon: Heart, color: 'text-rose-400' },
  { id: 'kindergarten', name: 'Bog\'cha (Kindergarten)', icon: Baby, color: 'text-emerald-400' },
  { id: 'library', name: 'Kutubxona (Library)', icon: BookOpen, color: 'text-purple-400' },
  { id: 'cosmetics', name: 'Kosmetika (Cosmetics)', icon: Scissors, color: 'text-rose-400' },
  { id: 'stadium', name: 'Stadion (Stadium)', icon: Trophy, color: 'text-emerald-400' },
  { id: 'car_showroom', name: 'Avtosalon (Car Dealership)', icon: Car, color: 'text-blue-400' }
];

const VERTICAL_DEFAULT_THEME: Record<string, string> = {
  consulting:    'blue',
  tour:          'blue',
  academy:       'emerald',
  hotel:         'purple',
  restaurant:    'amber',
  clinic:        'rose',
  gym:           'amber',
  manufacturing: 'blue',
  parking:       'blue',
  auto_service:  'amber',
  wholesale:     'blue',
  wedding_hall:  'rose',
  kindergarten:  'emerald',
  library:       'purple',
  stadium:       'emerald',
  cosmetics:     'rose',
  pharmacy:      'blue',
  car_showroom:  'blue',
};

const ACADEMY_MODULES = [
  { id: 'qr_attendance', label: 'QR davomat', desc: 'Sinfxonaga kirish uchun tezkor QR skaner' },
  { id: 'telegram_bot', label: 'Telegram bot', desc: 'Avtomatik Telegram xabarnomalar integratsiyasi' },
  { id: 'ai_tutor', label: 'Yordamchi (24/7)', desc: 'Sun\'iy intellektga asoslangan 24/7 assistent' },
  { id: 'live_classes', label: 'Jonli darslar', desc: 'Onlayn video darslar moduli' },
  { id: 'nova_store', label: 'Nova-Store', desc: 'NovaCoins loyallik do\'koni' },
  { id: 'ai_presentation', label: 'Taqdimot generator', desc: 'AI yordamida tezkor taqdimotlar tayyorlash' },
  { id: 'crm', label: 'CRM', desc: 'Mijozlar oqimi va pipeline boshqaruvi' },
  { id: 'website_builder', label: 'Veb-sayt', desc: 'Brendlangan jamoat veb-sayti' },
  { id: 'payments', label: 'To\'lovlar', desc: 'Kvitansiyalar, invoice va to\'lov hisobotlari' },
  { id: 'homework', label: 'Uy vazifalar', desc: 'Uyga berilgan topshiriqlar nazorati' },
  { id: 'parent_mirror', label: 'Ota-ona oynasi', desc: 'Ota-onalar uchun alohida kuzatuv oynasi' },
  { id: 'biometric', label: 'Biometrik', desc: 'FaceID va biometrik tekshiruvlar' },
  { id: 'ai_lesson_planner', label: 'Dars rejalashtirish', desc: 'AI yordamida darslar rejasini tuzish' },
  { id: 'analytics', label: 'Keng analitika', desc: 'Kengaytirilgan chuqur moliya va ko\'rsatkichlar' }
];

const TOUR_MODULES = [
  { id: 'tour_catalog', label: 'Turlar katalogi', desc: 'Sayohat paketlari va ekskursiyalar katalogi' },
  { id: 'tour_bookings', label: 'Sayohatlarni bronlash', desc: 'Buyurtmalar va mijozlar bronlash tizimi' },
  { id: 'visa_tracker', label: 'Viza kuzatuvchisi', desc: 'Mijozlar viza jarayonlarini bosqichma-bosqich kuzatish' },
  { id: 'pdf_invoices', label: 'PDF Invoyslar', desc: 'Kvitansiya va sayohat shartnomalarini PDF yuklash' },
  { id: 'telegram_bot', label: 'Telegram bot', desc: 'Sayohat xabarlari va integratsiyasi' },
  { id: 'payments', label: 'To\'lovlar', desc: 'Sayohat to\'lovlari va hisob-kitoblari' },
  { id: 'crm', label: 'CRM / Moliya', desc: 'Mijozlar oqimi va sotuv voronkasi' },
  { id: 'website_builder', label: 'Veb-sayt', desc: 'Agentlik uchun ochiq veb-sayt va tur qidiruvi' },
  { id: 'multi_branch', label: 'Ko\'p filialli tizim', desc: 'Filiallar o\'rtasida turoperatorlarni boshqarish' },
  { id: 'analytics', label: 'Keng analitika', desc: 'Daromadlar va buyurtmalar tahlili' }
];

const CONSULTING_MODULES = [
  { id: 'applications_pipeline', label: 'Arizalar voronkasi', desc: 'Mijozlar hujjatlari va arizalar holati pipelinei' },
  { id: 'document_control', label: 'Hujjatlar nazorati', desc: 'Hujjatlarni yuklash, tekshirish va tasdiqlash' },
  { id: 'universities_api', label: 'Universitetlar API', desc: 'Xalqaro universitetlar ma\'lumotlar bazasi' },
  { id: 'telegram_bot', label: 'Telegram bot', desc: 'Abituriyent xabarnomalari va bot integratsiyasi' },
  { id: 'arrival_tracking', label: 'Kutib olish va transfer', desc: 'Xorijda talabalarni transfer va joylashuvini kuzatish' },
  { id: 'visa_service', label: 'Viza xizmati', desc: 'Viza va konsullik hujjatlarini tayyorlash yordamchisi' },
  { id: 'payments', label: 'To\'lovlar', desc: 'Konsalting to\'lovlari va kvitansiyalar' },
  { id: 'crm', label: 'CRM', desc: 'Mijozlar va abituriyentlar oqimi' },
  { id: 'website_builder', label: 'Veb-sayt', desc: 'Konsalting sayti va ariza yuborish' },
  { id: 'analytics', label: 'Keng analitika', desc: 'Ariza va arizachilar konversiyasi tahlili' }
];

const DEFAULT_MODULES = [
  { id: 'telegram_bot', label: 'Telegram bot', desc: 'Telegram bot integratsiyasi' },
  { id: 'payments', label: 'To\'lovlar', desc: 'To\'lovlar va hisob-kitoblar' },
  { id: 'crm', label: 'CRM', desc: 'Mijozlar oqimi boshqaruvi' },
  { id: 'website_builder', label: 'Veb-sayt', desc: 'Tashqi veb-sayt sahifalari' },
  { id: 'analytics', label: 'Keng analitika', desc: 'Kengaytirilgan hisobotlar' }
];

const CAR_SHOWROOM_MODULES = [
  { id: 'car_inventory', label: 'Avtomobillar zaxirasi', desc: 'Sotuvdagi, buyurtmadagi va sotilgan avtomobillar katalogi' },
  { id: 'test_drives', label: 'Test-drayvlar', desc: 'Mijozlar test-drayv darslari va taqvimi' },
  { id: 'leasing_credit', label: 'Lizing va Kredit', desc: 'Kalkulyator va mijozlar to\'lov jadvallari' },
  { id: 'crm', label: 'Savdo CRM', desc: 'Mijozlar qiziqish bosqichlari (leads) va voronkasi' },
  { id: 'pdf_invoices', label: 'Shartnomalar & Invoys', desc: 'Kredit va oldi-sotdi shartnomalarini PDF yuklash' },
  { id: 'telegram_bot', label: 'Telegram bot', desc: 'Mijozlar buyurtmalari va bot integratsiyasi' },
  { id: 'payments', label: 'To\'lovlar', desc: 'Lizing shartnomasi bo\'yicha oylik to\'lovlar nazorati' },
  { id: 'website_builder', label: 'Veb-sayt', desc: 'Showroom ommaviy avto-katalog sayti' },
  { id: 'service_sync', label: 'Avtoservis integratsiyasi', desc: 'Sotilgan avtomobillar texnik tarixi bilan bog\'lanish' },
  { id: 'analytics', label: 'Keng analitika', desc: 'Savdo hajmi, mashhurlar markalar va moliya tahlili' }
];

const getModulesForVertical = (vertical: string) => {
  const v = String(vertical || 'consulting').toLowerCase().trim();
  if (v === 'academy' || v === 'nova' || v === 'edu') return ACADEMY_MODULES;
  if (v === 'tour' || v === 'unitour' || v === 'tour_farm' || v === 'travel') return TOUR_MODULES;
  if (v === 'car_showroom' || v === 'showroom') return CAR_SHOWROOM_MODULES;
  if (v === 'consulting') return CONSULTING_MODULES;
  return DEFAULT_MODULES;
};



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
  const [newTenant, setNewTenant] = useState({
    name: '',
    subdomain: '',
    businessType: 'consulting',
    plan: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerPassword: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isModulesDialogOpen, setIsModulesDialogOpen] = useState(false);
  const [modulesForm, setModulesForm] = useState<Record<string, boolean>>({});

  // Dynamic Pricing Plan states
  const [globalPlans, setGlobalPlans] = useState<any[]>([]);
  const [loadingGlobalPlans, setLoadingGlobalPlans] = useState(false);
  const [selectedVerticalFilter, setSelectedVerticalFilter] = useState<string>("academy");
  const [dialogPlans, setDialogPlans] = useState<any[]>([]);
  const [loadingDialogPlans, setLoadingDialogPlans] = useState(false);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [newFeatureText, setNewFeatureText] = useState("");
  const [planForm, setPlanForm] = useState({
    vertical: 'consulting',
    name: '',
    price: '',
    currency: 'UZS',
    description: '',
    features: [] as string[],
    popular: false
  });
  
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

  const fetchGlobalPlans = async () => {
    setLoadingGlobalPlans(true);
    try {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setGlobalPlans(data || []);
    } catch (err: any) {
      console.error("Error fetching pricing plans:", err);
    } finally {
      setLoadingGlobalPlans(false);
    }
  };

  useEffect(() => {
    fetchTenants();
    fetchGlobalPlans();
  }, []);

  // Fetch plans for dialog based on selected businessType
  useEffect(() => {
    if (!isNewDialogOpen) return;
    
    async function loadDialogPlans() {
      setLoadingDialogPlans(true);
      try {
        const { data, error } = await supabase
          .from('pricing_plans')
          .select('*')
          .eq('vertical', newTenant.businessType);
        
        if (error) throw error;
        if (data && data.length > 0) {
          setDialogPlans(data);
          const popularPlan = data.find(p => p.popular) || data[0];
          setNewTenant(prev => ({ ...prev, plan: popularPlan.name }));
        } else {
          setDialogPlans([]);
          setNewTenant(prev => ({ ...prev, plan: '' }));
        }
      } catch (err) {
        console.error("Error loading dialog plans:", err);
        setDialogPlans([]);
      } finally {
        setLoadingDialogPlans(false);
      }
    }
    
    loadDialogPlans();
  }, [newTenant.businessType, isNewDialogOpen]);


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
        .update({ status: 'approved' })
        .eq('id', tenantId);
      
      if (error) throw error;
      toast({ title: "Muvaffaqiyatli", description: "Firma faollashtirildi!" });
      
      setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, status: 'approved' } : t));
      if (selectedTenant && selectedTenant.id === tenantId) {
        setSelectedTenant(prev => ({ ...prev, status: 'approved' }));
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
    if (!newTenant.name || !newTenant.subdomain || !newTenant.ownerName || !newTenant.ownerEmail || !newTenant.ownerPassword || !newTenant.plan) {
      toast({ title: "Xatolik", description: "Barcha maydonlarni to'ldiring (nom, subdomen, egasi ismi, email, parol, tarif)", variant: "destructive" });
      return;
    }

    try {
      setIsCreating(true);

      // 1. Insert Tenant Row in Database
      const { data: tenant, error: tenantError } = await supabase.from('tenants').insert([
        {
          name: newTenant.name,
          subdomain: newTenant.subdomain.toLowerCase(),
          status: 'approved', // Superadmin creations are automatically active/approved
          plan: newTenant.plan,
          owner_name: newTenant.ownerName,
          owner_email: newTenant.ownerEmail,
          owner_phone: newTenant.ownerPhone || null,
          vertical: newTenant.businessType,
          config: {
            business_type: newTenant.businessType,
            branding: {
              theme_color: VERTICAL_DEFAULT_THEME[newTenant.businessType] || 'blue',
              currency: 'UZS',
              timezone: 'Asia/Tashkent'
            },
            modules: {
              consulting:    newTenant.businessType === 'consulting',
              tour:          newTenant.businessType === 'tour',
              academy:       newTenant.businessType === 'academy',
              hotel:         newTenant.businessType === 'hotel',
              restaurant:    newTenant.businessType === 'restaurant',
              pharmacy:      newTenant.businessType === 'pharmacy',
              gym:           newTenant.businessType === 'gym',
              manufacturing: newTenant.businessType === 'manufacturing',
              auto_service:  newTenant.businessType === 'auto_service',
              clinic:        newTenant.businessType === 'clinic',
              parking:       newTenant.businessType === 'parking',
              wedding_hall:  newTenant.businessType === 'wedding_hall',
              kindergarten:  newTenant.businessType === 'kindergarten',
              library:       newTenant.businessType === 'library',
              cosmetics:     newTenant.businessType === 'cosmetics',
              stadium:       newTenant.businessType === 'stadium',
              car_showroom:  newTenant.businessType === 'car_showroom',
              ai_camera:     !newTenant.plan.toLowerCase().includes('starter'),
              billing:       true
            }
          }
        } as any
      ]).select().single();

      if (tenantError) throw tenantError;

      // 2. Create Owner User in Supabase Auth via a non-persistent client
      const tempSupabase = createClient(
        import.meta.env.VITE_SUPABASE_URL || "https://bpokyebvwhigpjrembcg.supabase.co",
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwb2t5ZWJ2d2hpZ3BqcmVtYmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODgwNjEsImV4cCI6MjA5MzE2NDA2MX0.1Bn_0WxXccpzutvIh2gPqdVagZhAC7xiekbZzwxpCvU",
        {
          auth: {
            persistSession: false
          }
        }
      );

      const { data: signUpData, error: signUpError } = await tempSupabase.auth.signUp({
        email: newTenant.ownerEmail,
        password: newTenant.ownerPassword,
        options: {
          data: {
            full_name: newTenant.ownerName,
            tenant_id: tenant.id,
            role: 'owner'
          }
        }
      });

      if (signUpError) {
        // Cleanup created tenant on auth registration failure
        await supabase.from('tenants').delete().eq('id', tenant.id);
        throw signUpError;
      }

      // 3. Update the created profile (let trigger run first)
      if (signUpData?.user?.id) {
        await new Promise(resolve => setTimeout(resolve, 800));
        const { error: profileError } = await supabase.from('profiles').update({
          role: 'owner',
          tenant_id: tenant.id,
          full_name: newTenant.ownerName,
          phone: newTenant.ownerPhone || null,
          email: newTenant.ownerEmail
        }).eq('user_id', signUpData.user.id);
        if (profileError) console.error("Profile update warning:", profileError.message);
      }

      // 4. Create default branch
      try {
        await supabase.from('branches').insert({
          tenant_id: tenant.id,
          name: 'Asosiy filial',
          address: 'O\'zbekiston',
          timezone: 'Asia/Tashkent',
          currency: 'UZS'
        });
      } catch (branchErr) {
        console.warn("Branch insertion skipped:", branchErr);
      }

      toast({ title: "Muvaffaqiyatli", description: `"${newTenant.name}" firmasi va uning egasi "${newTenant.ownerName}" muvaffaqiyatli yaratildi!` });
      setIsNewDialogOpen(false);
      setNewTenant({
        name: '',
        subdomain: '',
        businessType: 'consulting',
        plan: '',
        ownerName: '',
        ownerEmail: '',
        ownerPhone: '',
        ownerPassword: ''
      });
      fetchTenants();

    } catch (error: any) {
      toast({ title: "Xatolik", description: error.message || "Tizimda xatolik yuz berdi", variant: "destructive" });
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

  const handleSavePlan = async () => {
    if (!planForm.name || !planForm.price) {
      toast({ title: "Xatolik", description: "Nom va narxni kiriting", variant: "destructive" });
      return;
    }

    try {
      setIsSavingPlan(true);
      const payload = {
        vertical: planForm.vertical,
        name: planForm.name,
        price: planForm.price,
        currency: planForm.currency,
        description: planForm.description,
        features: planForm.features,
        popular: planForm.popular
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('pricing_plans')
          .update(payload)
          .eq('id', editingPlan.id);
        if (error) throw error;
        toast({ title: "Muvaffaqiyatli", description: "Tarif rejasi yangilandi!" });
      } else {
        const { error } = await supabase
          .from('pricing_plans')
          .insert(payload);
        if (error) throw error;
        toast({ title: "Muvaffaqiyatli", description: "Yangi tarif rejasi qo'shildi!" });
      }

      setIsPlanDialogOpen(false);
      fetchGlobalPlans();
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!window.confirm("Haqiqatan ham ushbu tarif rejasini o'chirmoqchisiz?")) return;
    try {
      const { error } = await supabase
        .from('pricing_plans')
        .delete()
        .eq('id', planId);
      if (error) throw error;
      toast({ title: "Muvaffaqiyatli", description: "Tarif rejasi o'chirildi!" });
      fetchGlobalPlans();
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    if (selectedTenant) {
      const activeModules = selectedTenant.config?.modules || {};
      const verticalModules = getModulesForVertical(selectedTenant.business_type || 'consulting');
      
      const initialForm: Record<string, boolean> = {};
      verticalModules.forEach(m => {
        initialForm[m.id] = !!activeModules[m.id];
      });
      setModulesForm(initialForm);
    }
  }, [selectedTenant]);

  const handleSaveModules = async () => {
    if (!selectedTenant) return;
    
    try {
      const tenantId = selectedTenant.id;
      const config = selectedTenant.config || {};
      
      const newModules = {
        ...(config.modules || {}),
        ...modulesForm
      };
      
      const updatedConfig = {
        ...config,
        modules: newModules
      };
      
      if (tenantId && tenantId.length > 10 && !tenantId.startsWith('t-')) {
        const { error } = await supabase
          .from('tenants')
          .update({ config: updatedConfig })
          .eq('id', tenantId);
          
        if (error) throw error;
      }
      
      setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, config: updatedConfig } : t));
      setSelectedTenant(prev => ({ ...prev, config: updatedConfig }));
      
      toast({
        title: "Muvaffaqiyatli saqlandi!",
        description: `"${selectedTenant.name}" firmasi modullari yangilandi.`,
      });
      
      setIsModulesDialogOpen(false);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Xatolik",
        description: err.message || "Modullarni saqlashda xato yuz berdi.",
        variant: "destructive"
      });
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
              car_showroom: type === 'car_showroom',
            }
          }
        } as any).eq('id', tenantId);
      } catch (err: any) {
        console.error(err);
      }
    }
  };

  // Upgraded custom settings handler for verticals - persisted to database
  const updateTenantConfig = async (tenantId: string, key: string, value: any) => {
    // 1. Get the current tenant to update
    const tenantToUpdate = tenants.find(t => t.id === tenantId);
    if (!tenantToUpdate) return;
    
    // 2. Prepare the updated config object
    const currentConfig = tenantToUpdate.config || {};
    const currentSettings = currentConfig.settings || {};
    const updatedSettings = {
      ...currentSettings,
      [key]: value
    };
    const updatedConfig = {
      ...currentConfig,
      settings: updatedSettings
    };
    
    // 3. Update local states
    const newTenants = tenants.map((t: any) => {
      if (t.id === tenantId) {
        return {
          ...t,
          config: updatedConfig
        };
      }
      return t;
    });
    setTenants(newTenants);
    
    if (selectedTenant && selectedTenant.id === tenantId) {
      setSelectedTenant({
        ...selectedTenant,
        config: updatedConfig
      });
    }

    localStorage.setItem('unipath_tenants', JSON.stringify(newTenants));
    
    // Maintain offline tenantConfigs backward compatibility
    const updatedLocalConfigs = {
      ...tenantConfigs,
      [tenantId]: {
        ...tenantConfigs[tenantId],
        [key]: value
      }
    };
    setTenantConfigs(updatedLocalConfigs);
    localStorage.setItem('unipath_tenant_configs', JSON.stringify(updatedLocalConfigs));

    // 4. Persist to Supabase Database
    if (tenantId && tenantId.length > 10 && !tenantId.startsWith('t-')) {
      try {
        const { error } = await supabase
          .from('tenants')
          .update({ config: updatedConfig })
          .eq('id', tenantId);

        if (error) throw error;
        toast({
          title: "Sozlama Saqlandi",
          description: `Firma parametri ma'lumotlar bazasida saqlandi.`
        });
      } catch (err: any) {
        console.error("Error saving tenant config:", err);
        toast({
          title: "Saqlashda Xatolik",
          description: err.message || "Tizim sozlamasini saqlashda xato yuz berdi.",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Sozlama Saqlandi (Offline)",
        description: `Firma parametri offline saqlandi.`
      });
    }
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

  const seedCarShowroomData = (tenantName: string) => {
    const mockCars = [
      {
        id: 'c-seeded-1',
        brand: 'BYD',
        model: 'Song Plus EV Champion',
        color: 'Oq (Pearl White)',
        year: 2026,
        price: 360000000,
        engine: 'Electro',
        battery_capacity: '71.7 kWh',
        range_km: 505,
        status: 'available',
        image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=600'
      },
      {
        id: 'c-seeded-2',
        brand: 'Chevrolet',
        model: 'Tahoe Premier',
        color: 'Qora (Black Metallic)',
        year: 2025,
        price: 1150000000,
        engine: 'Petrol',
        status: 'reserved',
        image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600'
      },
      {
        id: 'c-seeded-3',
        brand: 'Tesla',
        model: 'Model Y Long Range',
        color: 'Kulrang (Midnight Silver)',
        year: 2026,
        price: 520000000,
        engine: 'Electro',
        status: 'sold',
        image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=600'
      }
    ];

    const mockTestDrives = [
      {
        id: 'td-seeded-1',
        car_id: 'c-seeded-1',
        car_name: 'BYD Song Plus EV Champion',
        customer_name: 'Axmedov Bobur',
        customer_phone: '+998 90 123-45-67',
        status: 'pending',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        time: '11:00'
      },
      {
        id: 'td-seeded-2',
        car_id: 'c-seeded-2',
        car_name: 'Chevrolet Tahoe Premier',
        customer_name: 'Usmanov Sherzod',
        customer_phone: '+998 97 999-88-77',
        status: 'completed',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        time: '15:30'
      }
    ];

    const mockDeals = [
      {
        id: 'd-seeded-1',
        customer_name: 'Samatov Sardor',
        customer_phone: '+998 94 444-55-66',
        car_model: 'BYD Song Plus EV Champion',
        stage: 'finance_approval',
        deal_amount: 360000000,
        down_payment: 100000000,
        monthly_payment: 9800000,
        duration_months: 36
      }
    ];

    localStorage.setItem('unipath_showroom_cars', JSON.stringify(mockCars));
    localStorage.setItem('unipath_showroom_testdrives', JSON.stringify(mockTestDrives));
    localStorage.setItem('unipath_showroom_deals', JSON.stringify(mockDeals));

    toast({
      title: "Avtosalon shablonlari seed qilindi!",
      description: `"${tenantName}" firmasi uchun 3 ta avtomobil, 2 ta test-drive va 1 ta faol kredit shartnomasi muvaffaqiyatli yuklandi.`,
      className: "border-blue-400 bg-blue-950/20 text-white"
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

  return (
    <div className="text-foreground animate-fade-in pb-16 relative">
      {/* Glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      <div className="space-y-8">
        
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
              <DialogContent className="sm:max-w-[650px] bg-[#111111]/95 border border-white/5 text-white rounded-[2rem] backdrop-blur-xl p-6">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-white">Yangi Multi-Tenant B2B Kompaniya</DialogTitle>
                  <DialogDescription className="text-white/50 text-xs">
                    Tizimda yangi mijoz oching, uning tarifini, biznes yo'nalishini va egasini (owner) yarating.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid md:grid-cols-2 gap-6 py-4 text-xs">
                  {/* Left Column: Business Info */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-primary text-xs border-b border-white/5 pb-1 uppercase tracking-wider">Biznes Ma'lumotlari</h3>
                    
                    <div className="space-y-1.5">
                      <Label className="text-white/80 font-bold">Firma nomi</Label>
                      <Input
                        value={newTenant.name}
                        onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                        placeholder="Masalan: UniTour Agency, NOVA IT"
                        className="bg-white/5 border-white/10 text-white rounded-xl h-11 text-xs"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label className="text-white/80 font-bold">Subdomen manzili</Label>
                      <div className="relative">
                        <Input
                          value={newTenant.subdomain}
                          onChange={(e) => setNewTenant({ ...newTenant, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                          placeholder="unitour"
                          className="bg-white/5 border-white/10 text-white pr-24 rounded-xl h-11 text-xs font-mono"
                        />
                        <span className="absolute right-3 top-3 text-[10px] text-white/40 font-bold font-sans">.unipath.me</span>
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

                    <div className="space-y-1.5">
                      <Label className="text-white/80 font-bold">Tarif rejasi</Label>
                      {loadingDialogPlans ? (
                        <div className="h-11 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl">
                          <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        </div>
                      ) : (
                        <select
                          className="w-full h-11 px-3 bg-[#171717] border border-white/10 rounded-xl text-white text-xs"
                          value={newTenant.plan}
                          onChange={(e) => setNewTenant({ ...newTenant, plan: e.target.value })}
                        >
                          {dialogPlans.length === 0 ? (
                            <option value="">Tariflar topilmadi</option>
                          ) : (
                            dialogPlans.map(p => (
                              <option key={p.id || p.name} value={p.name} className="bg-[#111111]">
                                {p.name} ({p.price} {p.currency})
                              </option>
                            ))
                          )}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Owner Info */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-sky-400 text-xs border-b border-white/5 pb-1 uppercase tracking-wider">Firma Egasi (Owner)</h3>
                    
                    <div className="space-y-1.5">
                      <Label className="text-white/80 font-bold">Ismi va Familiyasi</Label>
                      <Input
                        value={newTenant.ownerName}
                        onChange={(e) => setNewTenant({ ...newTenant, ownerName: e.target.value })}
                        placeholder="Masalan: Diyorbek Karimov"
                        className="bg-white/5 border-white/10 text-white rounded-xl h-11 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-white/80 font-bold">E-mail manzili</Label>
                      <Input
                        type="email"
                        value={newTenant.ownerEmail}
                        onChange={(e) => setNewTenant({ ...newTenant, ownerEmail: e.target.value })}
                        placeholder="owner@domain.com"
                        className="bg-white/5 border-white/10 text-white rounded-xl h-11 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-white/80 font-bold">Telefon raqami</Label>
                      <Input
                        value={newTenant.ownerPhone}
                        onChange={(e) => setNewTenant({ ...newTenant, ownerPhone: e.target.value })}
                        placeholder="+998 90 123-45-67"
                        className="bg-white/5 border-white/10 text-white rounded-xl h-11 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-white/80 font-bold">Tizim paroli</Label>
                      <Input
                        type="password"
                        value={newTenant.ownerPassword}
                        onChange={(e) => setNewTenant({ ...newTenant, ownerPassword: e.target.value })}
                        placeholder="••••••••"
                        className="bg-white/5 border-white/10 text-white rounded-xl h-11 text-xs"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter className="mt-4 gap-2 border-t border-white/5 pt-4">
                  <Button 
                    variant="outline"
                    onClick={() => setIsNewDialogOpen(false)}
                    className="border-white/10 text-xs font-semibold rounded-xl text-white bg-white/5 hover:bg-white/10 h-11 flex-1 md:flex-initial"
                  >
                    Bekor qilish
                  </Button>
                  <Button 
                    onClick={handleCreateTenant} 
                    disabled={isCreating}
                    className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold h-11 px-8 rounded-xl flex-1 md:flex-initial shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                  >
                    {isCreating ? "Yozilmoqda..." : "Kompaniya va Egasini Yaratish"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="tenants" className="w-full space-y-6">
          <TabsList className="bg-white/5 border border-white/5 justify-start rounded-xl p-1 gap-1 w-fit">
            <TabsTrigger value="tenants" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs font-bold px-4 py-2">
              Kompaniyalar Boshqaruvi
            </TabsTrigger>
            <TabsTrigger value="pricing" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs font-bold px-4 py-2">
              Global Tariflar va Rejalar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tenants" className="space-y-6">
            {/* Bento Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
                  ${tenants.filter(t => t.status === 'active' || t.status === 'approved').reduce((acc, t) => {
                    const prices: Record<string, number> = { 'Starter': 29, 'Pro': 79, 'Enterprise': 199 };
                    return acc + (prices[t.plan] || 0);
                  }, 0).toLocaleString()}
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
                          <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                            <Button 
                              className="flex-1 sm:flex-none text-xs font-bold rounded-xl bg-white/5 hover:bg-white/10 text-white" 
                              onClick={() => {
                                const bt = selectedTenant.business_type || 'consulting';
                                const impersonatePayload = {
                                  ...selectedTenant,
                                  business_type: bt,
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
                                window.location.href = '/admin';
                              }}
                            >
                              Tizimga Kirish (Impersonate)
                            </Button>

                            <Button 
                              className="flex-1 sm:flex-none text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5" 
                              onClick={() => setIsModulesDialogOpen(true)}
                            >
                              <Settings className="w-4 h-4" /> Modullarni sozlash
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

                            <Dialog open={isModulesDialogOpen} onOpenChange={setIsModulesDialogOpen}>
                              <DialogContent className="max-w-xl bg-[#0D0D11]/98 border border-[#1E1E28] text-white rounded-[2.2rem] p-7 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                                <DialogHeader className="mb-4">
                                  <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                                    <div className="w-12 h-12 rounded-xl bg-purple-600/80 border border-purple-500/30 flex items-center justify-center text-white font-extrabold text-sm uppercase shadow-[0_0_20px_rgba(147,51,234,0.3)] shrink-0">
                                      {selectedTenant.name.slice(0, 2)}
                                    </div>
                                    <div>
                                      <DialogTitle className="text-xl font-bold text-white tracking-tight">{selectedTenant.name}</DialogTitle>
                                      <DialogDescription className="text-white/45 text-xs font-mono mt-0.5">
                                        /{selectedTenant.subdomain} · {selectedTenant.business_type}
                                      </DialogDescription>
                                    </div>
                                  </div>
                                </DialogHeader>

                                {(() => {
                                  const verticalModules = getModulesForVertical(selectedTenant.business_type || 'consulting');
                                  const midIndex = Math.ceil(verticalModules.length / 2);
                                  const leftColumnModules = verticalModules.slice(0, midIndex);
                                  const rightColumnModules = verticalModules.slice(midIndex);

                                  return (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-2">
                                      {/* Left Column */}
                                      <div className="space-y-4">
                                        {leftColumnModules.map((item) => (
                                          <div key={item.id} className="flex items-center justify-between p-3.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-xl transition-all duration-200">
                                            <div className="space-y-0.5 pr-2">
                                              <Label htmlFor={item.id} className="text-white/80 font-bold text-xs cursor-pointer">{item.label}</Label>
                                              <p className="text-[10px] text-white/40 leading-normal">{item.desc}</p>
                                            </div>
                                            <Switch
                                              id={item.id}
                                              checked={!!modulesForm[item.id]}
                                              onCheckedChange={(checked) => setModulesForm(prev => ({ ...prev, [item.id]: checked }))}
                                              className="data-[state=checked]:bg-emerald-500"
                                            />
                                          </div>
                                        ))}
                                      </div>

                                      {/* Right Column */}
                                      <div className="space-y-4">
                                        {rightColumnModules.map((item) => (
                                          <div key={item.id} className="flex items-center justify-between p-3.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-xl transition-all duration-200">
                                            <div className="space-y-0.5 pr-2">
                                              <Label htmlFor={item.id} className="text-white/80 font-bold text-xs cursor-pointer">{item.label}</Label>
                                              <p className="text-[10px] text-white/40 leading-normal">{item.desc}</p>
                                            </div>
                                            <Switch
                                              id={item.id}
                                              checked={!!modulesForm[item.id]}
                                              onCheckedChange={(checked) => setModulesForm(prev => ({ ...prev, [item.id]: checked }))}
                                              className="data-[state=checked]:bg-emerald-500"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })()}

                                <DialogFooter className="mt-8 gap-3 border-t border-white/5 pt-4">
                                  <Button
                                    variant="outline"
                                    onClick={() => setIsModulesDialogOpen(false)}
                                    className="border-white/10 text-xs font-semibold rounded-xl text-white/70 hover:text-white bg-white/5 hover:bg-white/10 h-11 px-6 flex-1 md:flex-initial"
                                  >
                                    Bekor qilish
                                  </Button>
                                  <Button
                                    onClick={handleSaveModules}
                                    className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-xl text-xs h-11 px-8 shadow-[0_0_15px_rgba(37,99,235,0.3)] flex-1 md:flex-initial"
                                  >
                                    Saqlash
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
                                      <span className="font-bold text-sky-400">{(selectedTenant.config?.settings as any)?.commissionRate ?? tenantConfigs[selectedTenant.id]?.commissionRate ?? 10}%</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="5"
                                      max="30"
                                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-sky-400"
                                      value={(selectedTenant.config?.settings as any)?.commissionRate ?? tenantConfigs[selectedTenant.id]?.commissionRate ?? 10}
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
                                      checked={(selectedTenant.config?.settings as any)?.gdsEnabled ?? tenantConfigs[selectedTenant.id]?.gdsEnabled ?? false}
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
                                      <span className="font-bold text-emerald-400">{(selectedTenant.config?.settings as any)?.coinMultiplier ?? tenantConfigs[selectedTenant.id]?.coinMultiplier ?? 1.5}x rate</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="10"
                                      max="50"
                                      step="5"
                                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                                      value={((selectedTenant.config?.settings as any)?.coinMultiplier ?? tenantConfigs[selectedTenant.id]?.coinMultiplier ?? 1.5) * 10}
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
                                      value={(selectedTenant.config?.settings as any)?.smsProvider ?? tenantConfigs[selectedTenant.id]?.smsProvider ?? "Eskiz SMS"}
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
                                      checked={(selectedTenant.config?.settings as any)?.universitySync ?? tenantConfigs[selectedTenant.id]?.universitySync ?? true}
                                      onCheckedChange={(checked) => updateTenantConfig(selectedTenant.id, 'universitySync', checked)}
                                    />
                                  </div>
                                </div>
                              )}

                              {selectedTenant.business_type === 'hotel' && (
                                <p className="text-[10px] text-white/40 py-2">Mehmonxona boshqaruv tizimi uchun global xonalar kategoriyalari sozlamalari faqat joriy sub-domen ma'muriyatida o'zgaradi.</p>
                              )}

                              {selectedTenant.business_type === 'car_showroom' && (
                                <div className="space-y-4 text-xs">
                                  <div className="bg-white/[0.01] border border-white/5 p-3.5 rounded-xl space-y-3">
                                    <div className="flex justify-between items-center">
                                      <span className="font-semibold text-white/80 flex items-center gap-2">
                                        <Percent className="w-4 h-4 text-blue-400" /> Kredit Yillik Foizi (Base APR)
                                      </span>
                                      <span className="font-bold text-blue-400">{(selectedTenant.config?.settings as any)?.baseApr ?? tenantConfigs[selectedTenant.id]?.baseApr ?? 18}% APR</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="10"
                                      max="36"
                                      step="1"
                                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-400"
                                      value={(selectedTenant.config?.settings as any)?.baseApr ?? tenantConfigs[selectedTenant.id]?.baseApr ?? 18}
                                      onChange={(e) => updateTenantConfig(selectedTenant.id, 'baseApr', parseInt(e.target.value))}
                                    />
                                    <p className="text-[9px] text-white/40 leading-relaxed">Mijozlar lizing/kredit hisoblagichida foydalaniladigan boshlang'ich yillik foiz stavkasi Stavka.</p>
                                  </div>

                                  <div className="bg-white/[0.01] border border-white/5 p-3.5 rounded-xl flex items-center justify-between">
                                    <div className="space-y-0.5 pr-4">
                                      <span className="font-semibold text-white/80 block">Test-drive Kunlik Limiti</span>
                                      <span className="text-[9px] text-white/40 leading-relaxed block">Kunlik maksimal test-drive buyurtmalari soni.</span>
                                    </div>
                                    <select
                                      className="bg-[#171717] border border-white/10 rounded-lg text-white px-2.5 py-1.5 text-xs font-semibold"
                                      value={(selectedTenant.config?.settings as any)?.testDriveLimit ?? tenantConfigs[selectedTenant.id]?.testDriveLimit ?? 15}
                                      onChange={(e) => updateTenantConfig(selectedTenant.id, 'testDriveLimit', parseInt(e.target.value))}
                                    >
                                      <option value="5">5 ta bandlik</option>
                                      <option value="10">10 ta bandlik</option>
                                      <option value="15">15 ta bandlik</option>
                                      <option value="30">30 ta bandlik</option>
                                    </select>
                                  </div>
                                </div>
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

                                {selectedTenant.business_type === 'car_showroom' && (
                                  <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-10 rounded-xl gap-1.5"
                                    onClick={() => seedCarShowroomData(selectedTenant.name)}
                                  >
                                    <Database className="w-4 h-4" /> Avtosalon Boshqaruvi Demo Shablonlarini Yuklash
                                  </Button>
                                )}

                                {selectedTenant.business_type !== 'tour' && selectedTenant.business_type !== 'academy' && selectedTenant.business_type !== 'car_showroom' && (
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
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6">
            <div className="bg-[#111111]/80 border border-white/5 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Global Tarif Rejalari</h2>
                  <p className="text-white/50 text-xs mt-1">
                    Barcha biznes yo'nalishlari (verticals) bo'yicha dynamic tarif rejalarini boshqaring.
                  </p>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <select
                    className="h-10 px-3 bg-[#171717] border border-white/10 rounded-xl text-white text-xs"
                    value={selectedVerticalFilter}
                    onChange={(e) => setSelectedVerticalFilter(e.target.value)}
                  >
                    {VERTICALS.map(v => (
                      <option key={v.id} value={v.id} className="bg-[#111111]">{v.name}</option>
                    ))}
                  </select>

                  <Button
                    onClick={() => {
                      setEditingPlan(null);
                      setPlanForm({
                        vertical: selectedVerticalFilter,
                        name: '',
                        price: '',
                        currency: 'UZS',
                        description: '',
                        features: [],
                        popular: false
                      });
                      setIsPlanDialogOpen(true);
                    }}
                    className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold gap-1.5 h-10 px-4 rounded-xl text-xs"
                  >
                    <Plus className="w-4 h-4" /> Yangi Tarif Qo'shish
                  </Button>
                </div>
              </div>

              {loadingGlobalPlans ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {globalPlans.filter(p => p.vertical === selectedVerticalFilter).length === 0 ? (
                    <div className="col-span-full text-center py-16 text-white/30 text-xs">
                      Ushbu biznes turi uchun tariflar topilmadi. Yangi tarif qo'shing.
                    </div>
                  ) : (
                    globalPlans.filter(p => p.vertical === selectedVerticalFilter).map((plan) => (
                      <div
                        key={plan.id}
                        className={`relative border p-6 rounded-[2rem] flex flex-col justify-between hover:bg-[#151515] transition-all ${
                          plan.popular ? 'border-primary/45 bg-primary/5' : 'border-white/5 bg-white/[0.01]'
                        }`}
                      >
                        {plan.popular && (
                          <span className="absolute -top-3 right-6 bg-primary text-primary-foreground text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Mashhur
                          </span>
                        )}
                        
                        <div className="space-y-4">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h3 className="font-extrabold text-white text-lg">{plan.name}</h3>
                              <p className="text-white/50 text-xs mt-1 min-h-[32px]">{plan.description}</p>
                            </div>
                            <Badge className="bg-white/5 border border-white/10 text-white/70 capitalize text-[9px]">
                              {plan.vertical}
                            </Badge>
                          </div>

                          <div className="py-2">
                            <span className="text-3xl font-black text-white">{plan.price}</span>
                            <span className="text-white/40 text-xs ml-1 font-semibold">{plan.currency}/oy</span>
                          </div>

                          <div className="border-t border-white/5 pt-4 space-y-2">
                            {Array.isArray(plan.features) && plan.features.map((feat: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2 text-xs">
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <span className="text-white/70 leading-normal">{feat}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-6 flex gap-2 border-t border-white/5 pt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingPlan(plan);
                              setPlanForm({
                                vertical: plan.vertical,
                                name: plan.name,
                                price: plan.price,
                                currency: plan.currency || 'UZS',
                                description: plan.description || '',
                                features: Array.isArray(plan.features) ? plan.features : [],
                                popular: !!plan.popular
                              });
                              setIsPlanDialogOpen(true);
                            }}
                            className="flex-1 h-9 rounded-xl text-xs font-bold bg-white/5 border-white/10 text-white/80 hover:text-white"
                          >
                            <Edit className="w-3.5 h-3.5 mr-1.5" /> Tahrirlash
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeletePlan(plan.id)}
                            className="flex-1 h-9 rounded-xl text-xs font-bold border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white"
                          >
                            <Trash className="w-3.5 h-3.5 mr-1.5" /> O'chirish
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Global Dialog for Adding/Editing Pricing Plans */}
        <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
          <DialogContent className="sm:max-w-[480px] bg-[#111111]/95 border border-white/5 text-white rounded-[2rem] backdrop-blur-xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-white">
                {editingPlan ? "Tarif Rejasini Tahrirlash" : "Yangi Tarif Rejasi Qo'shish"}
              </DialogTitle>
              <DialogDescription className="text-white/50 text-xs">
                Tarif rejasining narxi, nomi va imkoniyatlari ro'yxatini belgilang.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-white/80 font-bold">Biznes turi (Vertical)</Label>
                  <select
                    className="w-full h-10 px-3 bg-[#171717] border border-white/10 rounded-xl text-white text-xs"
                    value={planForm.vertical}
                    onChange={(e) => setPlanForm({ ...planForm, vertical: e.target.value })}
                    disabled={!!editingPlan}
                  >
                    {VERTICALS.map(v => (
                      <option key={v.id} value={v.id} className="bg-[#111111]">{v.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white/80 font-bold">Reja nomi (Plan Name)</Label>
                  <Input
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    placeholder="Masalan: Center Pro, Pro"
                    className="bg-white/5 border-white/10 text-white rounded-xl h-10 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-white/80 font-bold">Narxi (Price)</Label>
                  <Input
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                    placeholder="Masalan: 499 000"
                    className="bg-white/5 border-white/10 text-white rounded-xl h-10 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white/80 font-bold">Valyuta (Currency)</Label>
                  <select
                    className="w-full h-10 px-3 bg-[#171717] border border-white/10 rounded-xl text-white text-xs"
                    value={planForm.currency}
                    onChange={(e) => setPlanForm({ ...planForm, currency: e.target.value })}
                  >
                    <option value="UZS" className="bg-[#111111]">UZS</option>
                    <option value="USD" className="bg-[#111111]">USD</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/80 font-bold">Tavsif (Description)</Label>
                <Input
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  placeholder="Masalan: Rivojlanayotgan markazlar uchun to'liq boshqaruv"
                  className="bg-white/5 border-white/10 text-white rounded-xl h-10 text-xs"
                />
              </div>

              {/* Feature list management */}
              <div className="space-y-2">
                <Label className="text-white/80 font-bold">Tarif imkoniyatlari / Modullar</Label>
                <div className="flex gap-2">
                  <Input
                    value={newFeatureText}
                    onChange={(e) => setNewFeatureText(e.target.value)}
                    placeholder="Yangi imkoniyat yozing (masalan: 100 ta o'quvchi)"
                    className="bg-white/5 border-white/10 text-white rounded-xl h-10 text-xs flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newFeatureText.trim()) {
                          setPlanForm(prev => ({
                            ...prev,
                            features: [...prev.features, newFeatureText.trim()]
                          }));
                          setNewFeatureText("");
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (newFeatureText.trim()) {
                        setPlanForm(prev => ({
                          ...prev,
                          features: [...prev.features, newFeatureText.trim()]
                        }));
                        setNewFeatureText("");
                      }
                    }}
                    className="bg-sky-500 hover:bg-sky-600 text-white h-10 rounded-xl px-3 font-bold"
                  >
                    Qo'shish
                  </Button>
                </div>

                <div className="max-h-36 overflow-y-auto border border-white/5 bg-[#171717]/30 p-2.5 rounded-xl space-y-1.5 custom-scrollbar">
                  {planForm.features.length === 0 ? (
                    <p className="text-[10px] text-white/30 text-center py-4 font-sans">Hozircha hech qanday imkoniyat qo'shilmagan.</p>
                  ) : (
                    planForm.features.map((feat, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white/5 px-2.5 py-1.5 rounded-lg text-[10px] font-sans">
                        <span className="text-white/80 truncate pr-2">{feat}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setPlanForm(prev => ({
                              ...prev,
                              features: prev.features.filter((_, i) => i !== idx)
                            }));
                          }}
                          className="text-rose-400 hover:text-rose-300 font-bold"
                        >
                          O'chirish
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                <div className="space-y-0.5">
                  <Label className="text-white/80 font-bold">Mashhur (Popular) tarif</Label>
                  <p className="text-[9px] text-white/40">Ushbu tarif onboardingda ko'rinarli va belgilangan holda ochiladi.</p>
                </div>
                <Switch
                  checked={planForm.popular}
                  onCheckedChange={(checked) => setPlanForm(prev => ({ ...prev, popular: checked }))}
                />
              </div>
            </div>

            <DialogFooter className="mt-4 gap-2 border-t border-white/5 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsPlanDialogOpen(false)}
                className="border-white/10 text-xs font-semibold rounded-xl text-white bg-white/5 hover:bg-white/10 h-10 flex-1 md:flex-initial"
              >
                Bekor qilish
              </Button>
              <Button
                onClick={handleSavePlan}
                disabled={isSavingPlan}
                className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold h-10 px-6 rounded-xl flex-1 md:flex-initial"
              >
                {isSavingPlan ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
