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
  Hourglass,
  Clock,
  Trash2,
  Database,
  Settings,
  Wrench,
  Globe,
  Send,
  Loader2,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

// Only one vertical is served by this platform.
const VERTICALS = [
  { id: 'consulting', name: 'Konsalting (Consulting)', icon: Building2, color: 'text-blue-400' },
];

const CONSULTING_MODULES = [
  { id: 'applications_pipeline', label: 'Arizalar voronkasi', desc: 'Mijozlar hujjatlari va arizalar holati pipelinei' },
  { id: 'document_control', label: 'Hujjatlar nazorati', desc: 'Hujjatlarni yuklash, tekshirish va tasdiqlash' },
  { id: 'universities_api', label: 'Universitetlar API', desc: "Xalqaro universitetlar ma'lumotlar bazasi" },
  { id: 'telegram_bot', label: 'Telegram bot', desc: 'Abituriyent xabarnomalari va bot integratsiyasi' },
  { id: 'arrival_tracking', label: 'Kutib olish va transfer', desc: 'Xorijda talabalarni transfer va joylashuvini kuzatish' },
  { id: 'visa_service', label: 'Viza xizmati', desc: 'Viza va konsullik hujjatlarini tayyorlash yordamchisi' },
  { id: 'payments', label: "To'lovlar", desc: "Konsalting to'lovlari va kvitansiyalar" },
  { id: 'crm', label: 'CRM', desc: 'Mijozlar va abituriyentlar oqimi' },
  { id: 'website_builder', label: 'Veb-sayt', desc: 'Konsalting sayti va ariza yuborish' },
  { id: 'analytics', label: 'Keng analitika', desc: 'Ariza va arizachilar konversiyasi tahlili' }
];

// Gradient theme presets for per-tenant branding.
const THEME_PRESETS = [
  { id: 'aurora',       name: 'Aurora',       gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6ee7b7 100%)', primary: '262 83% 58%', accent: '160 70% 50%' },
  { id: 'nebula',       name: 'Nebula',       gradient: 'linear-gradient(135deg, #4c1d95 0%, #a855f7 55%, #ec4899 100%)', primary: '280 75% 60%', accent: '325 80% 60%' },
  { id: 'sunset_glow',  name: 'Sunset Glow',  gradient: 'linear-gradient(135deg, #f97316 0%, #ef4444 55%, #ec4899 100%)', primary: '20 90% 55%',  accent: '340 80% 60%' },
  { id: 'ocean_pulse',  name: 'Ocean Pulse',  gradient: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 55%, #06b6d4 100%)', primary: '210 90% 55%', accent: '190 85% 50%' },
  { id: 'cyber_mint',   name: 'Cyber Mint',   gradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 55%, #22d3ee 100%)', primary: '160 80% 42%', accent: '185 85% 50%' },
  { id: 'royal_gold',   name: 'Royal Gold',   gradient: 'linear-gradient(135deg, #b45309 0%, #d4af37 55%, #fde68a 100%)', primary: '43 74% 49%',  accent: '36 90% 55%' },
  { id: 'forest_deep',  name: 'Forest Deep',  gradient: 'linear-gradient(135deg, #14532d 0%, #16a34a 60%, #84cc16 100%)', primary: '150 60% 40%', accent: '90 60% 50%' },
  { id: 'cyberpunk',    name: 'Cyberpunk',    gradient: 'linear-gradient(135deg, #d946ef 0%, #7c3aed 50%, #06b6d4 100%)', primary: '315 90% 55%', accent: '185 100% 50%' },
  { id: 'minimal_mono', name: 'Minimal Mono', gradient: 'linear-gradient(135deg, #1f2937 0%, #6b7280 60%, #e5e7eb 100%)', primary: '220 10% 40%', accent: '220 12% 62%' },
];

const getModulesForVertical = (_vertical?: string) => CONSULTING_MODULES;

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

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

  // Telegram bot bind state
  const [isTgOpen, setIsTgOpen] = useState(false);
  const [tgForm, setTgForm] = useState({ token: '', username: '', chatId: '' });
  const [savingTg, setSavingTg] = useState(false);

  // Theme & branding customizer state (per-tenant, vertical-neutral)
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [themeForm, setThemeForm] = useState({ preset: '', name: '', primary: '', accent: '' });
  const [savingTheme, setSavingTheme] = useState(false);

  // Plans shown in the "new tenant" dialog (CRUD lives on the billing page)
  const [dialogPlans, setDialogPlans] = useState<any[]>([]);
  const [loadingDialogPlans, setLoadingDialogPlans] = useState(false);
  
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

  // Fetch plans for dialog based on selected businessType
  useEffect(() => {
    if (!isNewDialogOpen) return;
    
    async function loadDialogPlans() {
      setLoadingDialogPlans(true);
      try {
        const { data, error } = await supabase
          .from('pricing_plans')
          .select('*')
          .eq('vertical', 'consulting');
        
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
  }, [isNewDialogOpen]);


  const fetchTenants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('tenants').select('*').order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Real per-business user counts (bound accounts + memberships)
      const userCount: Record<string, number> = {};
      try {
        const [{ data: profs }, { data: mems }] = await Promise.all([
          supabase.from('profiles').select('tenant_id'),
          (supabase as any).from('tenant_memberships').select('tenant_id'),
        ]);
        for (const p of (profs || [])) if ((p as any).tenant_id) userCount[(p as any).tenant_id] = (userCount[(p as any).tenant_id] || 0) + 1;
        for (const m of (mems || [])) if (m.tenant_id) userCount[m.tenant_id] = (userCount[m.tenant_id] || 0) + 1;
      } catch (e) { /* stats are best-effort */ }

      const mapped = data?.map(t => ({
        id: t.id,
        name: t.name,
        subdomain: t.subdomain || null,
        custom_domain: t.custom_domain || null,
        domain: t.subdomain ? `${t.subdomain}.unipath.me` : (t.custom_domain || 'N/A'),
        status: t.status || 'pending',
        plan: t.plan || 'Starter',
        students: userCount[t.id] || 0,
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
          vertical: 'consulting',
          config: {
            business_type: 'consulting',
            branding: {
              theme_color: 'blue',
              currency: 'UZS',
              timezone: 'Asia/Tashkent'
            },
            modules: {
              consulting:    true,
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

  // Custom settings handler — persisted to database
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
  const getVerticalIcon = (type: string) => {
    const found = VERTICALS.find(v => v.id === type);
    return found ? found.icon : Building2;
  };

  const getVerticalColor = (type: string) => {
    const found = VERTICALS.find(v => v.id === type);
    return found ? found.color : 'text-primary';
  };

  // Impersonate the tenant, then land on a specific in-app target (settings, website builder…)
  const goAsTenant = (target: string) => {
    if (!selectedTenant) return;
    const bt = selectedTenant.business_type || 'consulting';
    const payload = {
      ...selectedTenant,
      business_type: bt,
      config: {
        ...(selectedTenant.config || {}),
        business_type: bt,
        modules: { ...((selectedTenant.config as any)?.modules || {}), [bt]: true },
      },
    };
    localStorage.setItem('active_tenant', JSON.stringify(payload));
    window.location.href = target;
  };

  const openTelegram = () => {
    const b = (selectedTenant?.config?.branding) || {};
    setTgForm({
      token: b.telegram_bot_token || '',
      username: b.telegram_bot_username || '',
      chatId: b.telegram_chat_id || '',
    });
    setIsTgOpen(true);
  };

  const saveTelegram = async () => {
    if (!selectedTenant) return;
    setSavingTg(true);
    try {
      const newConfig = {
        ...(selectedTenant.config || {}),
        branding: {
          ...((selectedTenant.config as any)?.branding || {}),
          telegram_bot_token: tgForm.token.trim(),
          telegram_bot_username: tgForm.username.trim().replace('@', ''),
          telegram_chat_id: tgForm.chatId.trim(),
        },
      };
      const { error } = await supabase.from('tenants').update({ config: newConfig }).eq('id', selectedTenant.id);
      if (error) throw error;
      setTenants(prev => prev.map(t => t.id === selectedTenant.id ? { ...t, config: newConfig } : t));
      setSelectedTenant((prev: any) => ({ ...prev, config: newConfig }));
      toast({ title: 'Saqlandi', description: 'Telegram bot sozlamalari yangilandi.' });
      setIsTgOpen(false);
    } catch (e: any) {
      toast({ title: 'Xatolik', description: e.message, variant: 'destructive' });
    } finally {
      setSavingTg(false);
    }
  };

  const openTheme = () => {
    const b = (selectedTenant?.config?.branding) || {};
    setThemeForm({
      preset: b.theme_preset || '',
      name: selectedTenant?.name || '',
      primary: b.primary_color || '',
      accent: b.accent_color || '',
    });
    setIsThemeOpen(true);
  };

  const applyThemePreset = (p: typeof THEME_PRESETS[number]) => {
    setThemeForm(prev => ({ ...prev, preset: p.id, primary: p.primary, accent: p.accent }));
  };

  const saveTheme = async () => {
    if (!selectedTenant) return;
    setSavingTheme(true);
    try {
      const newName = themeForm.name.trim() || selectedTenant.name;
      const newConfig = {
        ...(selectedTenant.config || {}),
        branding: {
          ...((selectedTenant.config as any)?.branding || {}),
          theme_preset: themeForm.preset,
          primary_color: themeForm.primary.trim(),
          accent_color: themeForm.accent.trim(),
        },
      };
      const { error } = await (supabase as any)
        .from('tenants')
        .update({ config: newConfig, name: newName })
        .eq('id', selectedTenant.id);
      if (error) throw error;
      setTenants(prev => prev.map(t => t.id === selectedTenant.id ? { ...t, name: newName, config: newConfig } : t));
      setSelectedTenant((prev: any) => ({ ...prev, name: newName, config: newConfig }));
      toast({ title: 'Saqlandi', description: 'Firma tema va brendingi yangilandi.' });
      setIsThemeOpen(false);
    } catch (e: any) {
      toast({ title: 'Xatolik', description: e.message, variant: 'destructive' });
    } finally {
      setSavingTheme(false);
    }
  };

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.business_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Insights counts
  const totalApproved = tenants.filter(t => t.status === 'approved').length;
  const totalPending = tenants.filter(t => t.status === 'pending').length;

  return (
    <div className="text-foreground animate-fade-in pb-16 relative">
      {/* Glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      <div className="space-y-8">
        
        {/* Content Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Firmalar boshqaruvi</h1>
            <p className="text-white/50 mt-1 text-sm">
              Platformadagi barcha konsalting agentliklari, ularning sub-domenlari, tariflari va holatini nazorat qiling.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold gap-2 px-6 py-5 rounded-2xl shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                  <Plus className="w-5 h-5" />
                  Yangi firma qo'shish
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[650px] bg-[#111111]/95 border border-white/5 text-white rounded-[2rem] backdrop-blur-xl p-6">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-white">Yangi konsalting agentligi</DialogTitle>
                  <DialogDescription className="text-white/50 text-xs">
                    Tizimda yangi agentlik oching, uning tarifini va egasini (owner) yarating.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid md:grid-cols-2 gap-6 py-4 text-xs">
                  {/* Left Column: Business Info */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-primary text-xs border-b border-white/5 pb-1 uppercase tracking-wider">Agentlik Ma'lumotlari</h3>
                    
                    <div className="space-y-1.5">
                      <Label className="text-white/80 font-bold">Agentlik nomi</Label>
                      <Input
                        value={newTenant.name}
                        onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                        placeholder="Masalan: Bright Future Education"
                        className="bg-white/5 border-white/10 text-white rounded-xl h-11 text-xs"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label className="text-white/80 font-bold">Subdomen manzili</Label>
                      <div className="relative">
                        <Input
                          value={newTenant.subdomain}
                          onChange={(e) => setNewTenant({ ...newTenant, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                          placeholder="brightfuture"
                          className="bg-white/5 border-white/10 text-white pr-24 rounded-xl h-11 text-xs font-mono"
                        />
                        <span className="absolute right-3 top-3 text-[10px] text-white/40 font-bold font-sans">.unipath.me</span>
                      </div>
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

        <div className="space-y-6">
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

              <div className="bg-[#111111]/80 border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <UserCheck className="w-[100px] h-[100px] text-white" />
                </div>
                <div className="flex items-center gap-3 text-white/50 mb-2">
                  <UserCheck className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Faol Agentliklar</span>
                </div>
                <div className="text-3xl font-black text-emerald-400">{totalApproved} ta</div>
              </div>

              <div className="bg-[#111111]/80 border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Clock className="w-[100px] h-[100px] text-white" />
                </div>
                <div className="flex items-center gap-3 text-white/50 mb-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Tasdiq Kutmoqda</span>
                </div>
                <div className="text-3xl font-black text-amber-400">{totalPending} ta</div>
              </div>

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
                              <Settings className="w-4 h-4" /> Modullar
                            </Button>

                            <Button
                              className="flex-1 sm:flex-none text-xs font-bold rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 gap-1.5"
                              onClick={openTelegram}
                            >
                              <Send className="w-4 h-4" /> Telegram bot
                            </Button>

                            <Button
                              className="flex-1 sm:flex-none text-xs font-bold rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 gap-1.5"
                              onClick={() => goAsTenant('/website-builder')}
                            >
                              <Globe className="w-4 h-4" /> Veb-sayt qurish
                            </Button>

                            <Button
                              className="flex-1 sm:flex-none text-xs font-bold rounded-xl bg-white/5 hover:bg-white/10 text-white/80 gap-1.5"
                              onClick={() => goAsTenant('/admin/settings')}
                            >
                              <Wrench className="w-4 h-4" /> Sozlamalar
                            </Button>

                            <Button
                              className="flex-1 sm:flex-none text-xs font-bold rounded-xl bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/20 gap-1.5"
                              onClick={openTheme}
                            >
                              <Palette className="w-4 h-4" /> Tema & Brending
                            </Button>

                            {/* Theme & branding customizer dialog */}
                            <Dialog open={isThemeOpen} onOpenChange={setIsThemeOpen}>
                              <DialogContent className="sm:max-w-[560px] bg-[#111111]/95 border border-white/5 text-white rounded-3xl backdrop-blur-xl">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                                    <Palette className="w-5 h-5 text-fuchsia-400" /> Tema & Brending
                                  </DialogTitle>
                                  <DialogDescription className="text-white/50 text-xs">
                                    {selectedTenant?.name} firmasi uchun tema preseti, nom va brend ranglarini sozlang. O'zgarishlar firmaning barcha sahifalariga tatbiq etiladi.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-2 text-xs max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                                  {/* Gradient presets */}
                                  <div className="space-y-2">
                                    <Label className="text-white/80 font-bold uppercase tracking-wider text-[10px]">Tema presetlari</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                      {THEME_PRESETS.map((p) => (
                                        <button
                                          key={p.id}
                                          type="button"
                                          onClick={() => applyThemePreset(p)}
                                          className={`rounded-xl overflow-hidden border-2 text-left transition-all ${
                                            themeForm.preset === p.id
                                              ? 'border-fuchsia-400 ring-2 ring-fuchsia-400/30'
                                              : 'border-white/10 hover:border-white/30'
                                          }`}
                                        >
                                          <div className="h-12 w-full" style={{ background: p.gradient }} />
                                          <div className="px-2 py-1.5 bg-white/[0.03] flex items-center justify-between gap-1">
                                            <span className="text-[10px] font-bold text-white/80 truncate">{p.name}</span>
                                            {themeForm.preset === p.id && <CheckCircle2 className="w-3 h-3 text-fuchsia-400 shrink-0" />}
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Firma nomi */}
                                  <div className="space-y-1.5">
                                    <Label className="text-white/80 font-bold">Agentlik nomi</Label>
                                    <Input
                                      value={themeForm.name}
                                      onChange={(e) => setThemeForm({ ...themeForm, name: e.target.value })}
                                      placeholder="Firma nomi"
                                      className="bg-white/5 border-white/10 text-white rounded-xl h-11"
                                    />
                                  </div>

                                  {/* HSL branding */}
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                      <Label className="text-white/80 font-bold flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-full border border-white/20 shrink-0" style={{ background: themeForm.primary ? `hsl(${themeForm.primary})` : 'transparent' }} />
                                        Primary HSL
                                      </Label>
                                      <Input
                                        value={themeForm.primary}
                                        onChange={(e) => setThemeForm({ ...themeForm, primary: e.target.value })}
                                        placeholder="262 83% 58%"
                                        className="bg-white/5 border-white/10 text-white rounded-xl h-11 font-mono"
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label className="text-white/80 font-bold flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-full border border-white/20 shrink-0" style={{ background: themeForm.accent ? `hsl(${themeForm.accent})` : 'transparent' }} />
                                        Accent HSL
                                      </Label>
                                      <Input
                                        value={themeForm.accent}
                                        onChange={(e) => setThemeForm({ ...themeForm, accent: e.target.value })}
                                        placeholder="180 70% 50%"
                                        className="bg-white/5 border-white/10 text-white rounded-xl h-11 font-mono"
                                      />
                                    </div>
                                  </div>
                                </div>
                                <DialogFooter className="gap-2">
                                  <Button variant="outline" onClick={() => setIsThemeOpen(false)} className="border-white/10 rounded-xl text-white/70 bg-white/5 hover:bg-white/10 h-11">Bekor</Button>
                                  <Button onClick={saveTheme} disabled={savingTheme} className="bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-bold rounded-xl h-11">
                                    {savingTheme ? 'Saqlanmoqda...' : 'Saqlash'}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            {/* Telegram bot bind dialog */}
                            <Dialog open={isTgOpen} onOpenChange={setIsTgOpen}>
                              <DialogContent className="sm:max-w-[480px] bg-[#111111]/95 border border-white/5 text-white rounded-3xl backdrop-blur-xl">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                                    <Send className="w-5 h-5 text-sky-400" /> Telegram bot ulash
                                  </DialogTitle>
                                  <DialogDescription className="text-white/50 text-xs">
                                    {selectedTenant?.name} uchun bot token, username va admin chat ID. Public sahifadan kelgan murojaat/buyurtmalar shu botga yuboriladi.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-3 py-2 text-xs">
                                  <div className="space-y-1.5">
                                    <Label className="text-white/80 font-bold">Bot Token</Label>
                                    <Input value={tgForm.token} onChange={(e) => setTgForm({ ...tgForm, token: e.target.value })} placeholder="123456:ABC-DEF..." className="bg-white/5 border-white/10 text-white rounded-xl h-11 font-mono" />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-white/80 font-bold">Bot Username</Label>
                                    <Input value={tgForm.username} onChange={(e) => setTgForm({ ...tgForm, username: e.target.value })} placeholder="mybiznes_bot" className="bg-white/5 border-white/10 text-white rounded-xl h-11" />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-white/80 font-bold">Admin Chat ID</Label>
                                    <Input value={tgForm.chatId} onChange={(e) => setTgForm({ ...tgForm, chatId: e.target.value })} placeholder="-1001234567890" className="bg-white/5 border-white/10 text-white rounded-xl h-11 font-mono" />
                                  </div>
                                </div>
                                <DialogFooter className="gap-2">
                                  <Button variant="outline" onClick={() => setIsTgOpen(false)} className="border-white/10 rounded-xl text-white/70 bg-white/5 hover:bg-white/10 h-11">Bekor</Button>
                                  <Button onClick={saveTelegram} disabled={savingTg} className="bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl h-11">
                                    {savingTg ? 'Saqlanmoqda...' : 'Saqlash'}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

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

                            {/* Section II: Consulting-specific controls */}
                            <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] space-y-4">
                              <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                                <Settings className="w-4 h-4 text-sky-400" /> II. Konsalting Sozlamalari
                              </h4>

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
                                    <p className="text-[9px] text-white/45 leading-relaxed">Oylik tushumlar va konsalting xizmat to'lovlari hisobotlari.</p>
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
                                {(
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
    </div>
  );
}
