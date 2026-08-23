import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  Globe, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  ShieldCheck, 
  AlertCircle,
  Scissors,
  Loader2,
  GraduationCap,
  Bed,
  Pill,
  UtensilsCrossed,
  Dumbbell,
  Factory,
  Car,
  Wrench,
  Music,
  Library,
  HeartPulse,
  Tag,
  ShoppingBag,
  MapPin,
  Clock,
  DollarSign,
  Heart,
  Baby,
  BookOpen,
  Trophy,
  Plane,
  Image as ImageIcon
} from 'lucide-react';
import { THEME_PRESETS, injectTheme } from '@/lib/themes';

import { PRICING_PLANS } from '@/core/constants/pricing';

const getConsultingPlans = () => {
  return [
    {
      id: 'Consulting Starter',
      name: 'Consulting Starter',
      price: '199 000',
      currency: 'UZS',
      desc: 'Kichik konsalting va viza markazlari uchun',
      features: ['100 ta arizachi limiti', '3 ta xodim boshqaruvi', 'Hujjatlarni avtomatlashtirish', 'E\'lonlar taxtasi', 'Standard CRM Pipeline']
    },
    {
      id: 'Consulting Pro',
      name: 'Consulting Pro',
      price: '499 000',
      currency: 'UZS',
      popular: true,
      desc: 'Professional konsalting agentliklari uchun',
      features: ['500 ta arizachi limiti', '15 ta xodim boshqaruvi', 'Chet el universitetlari API sinxronizatsiyasi', 'Buxgalteriya va to\'lovlar nazorati', 'Telegram Bot va bildirishnomalar']
    },
    {
      id: 'Consulting Premium',
      name: 'Consulting Premium',
      price: '1 199 000',
      currency: 'UZS',
      desc: 'Yirik konsalting tarmoqlari va agentliklari uchun',
      features: ['1500 ta arizachi limiti', '40 ta xodim boshqaruvi', 'Hamkor xalqaro universitetlar portali', 'Mentor va kutib olish modullari', 'Custom branding va rang sxemalari']
    },
    {
      id: 'Office Enterprise',
      name: 'Office Enterprise',
      price: '2 499 000',
      currency: 'UZS',
      desc: 'Transmilliy va yirik korporativ tarmoqlar uchun',
      features: ['Cheksiz arizachilar', 'Cheksiz xodimlar boshqaruvi', 'Custom Domain ulanishi', 'VIP 24/7 bag\'ishlangan yordam', 'SLA kafolati va yuqori xavfsizlik']
    }
  ];
};

export default function Systematize() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const [formData, setFormData] = useState({
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    companyName: '',
    subdomain: '',
    businessType: 'consulting',
    plan: 'Consulting Pro',
    branchName: 'Main Branch / Bosh Filial',
    branchAddress: 'Tashkent, Uzbekistan',
    timezone: 'Asia/Tashkent',
    currency: 'UZS',
    themeColor: 'emerald',
    logoUrl: ''
  });

  const handleLogoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 3 * 1024 * 1024) return;
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new window.Image();
          img.onload = () => {
            const scale = Math.min(1, 512 / Math.max(img.width, img.height));
            const w = Math.max(1, Math.round(img.width * scale));
            const h = Math.max(1, Math.round(img.height * scale));
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('canvas'));
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = () => reject(new Error('img'));
          img.src = reader.result as string;
        };
        reader.onerror = () => reject(new Error('file'));
        reader.readAsDataURL(file);
      });
      setFormData(prev => ({ ...prev, logoUrl: dataUrl }));
    } catch { /* ignore */ }
    e.target.value = '';
  };

  const [dbPlans, setDbPlans] = useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  useEffect(() => {
    async function loadPlans() {
      setIsLoadingPlans(true);
      try {
        const { data, error } = await (supabase as any)
          .from('pricing_plans')
          .select('*')
          .eq('vertical', 'consulting');
        
        let activePlans = [];
        if (error) throw error;
        if (data && data.length > 0) {
          activePlans = data.map((item: any) => ({
            id: item.name,
            name: item.name,
            price: item.price,
            currency: item.currency,
            desc: item.description,
            features: Array.isArray(item.features) ? item.features : [],
            popular: !!item.popular
          }));
          setDbPlans(activePlans);
        } else {
          activePlans = getConsultingPlans();
          setDbPlans(activePlans);
        }

        const planExists = activePlans.some(p => p.id === formData.plan);
        if (!planExists && activePlans.length > 0) {
          const popularPlan = activePlans.find(p => p.popular) || activePlans[0];
          setFormData(prev => ({ ...prev, plan: popularPlan.id }));
        }
      } catch (err) {
        const fallbackPlans = getConsultingPlans();
        setDbPlans(fallbackPlans);
        const planExists = fallbackPlans.some(p => p.id === formData.plan);
        if (!planExists && fallbackPlans.length > 0) {
          const popularPlan = fallbackPlans.find(p => p.popular) || fallbackPlans[0];
          setFormData(prev => ({ ...prev, plan: popularPlan.id }));
        }
      } finally {
        setIsLoadingPlans(false);
      }
    }
    loadPlans();
  }, []);

  // Check subdomain availability
  useEffect(() => {
    if (!formData.subdomain || formData.subdomain.length < 3) {
      setSubdomainStatus('idle');
      return;
    }

    const timer = setTimeout(async () => {
      setSubdomainStatus('checking');
      try {
        const { data, error } = await (supabase as any)
          .from('tenants')
          .select('id')
          .eq('subdomain', formData.subdomain.toLowerCase())
          .maybeSingle();

        if (error) throw error;
        setSubdomainStatus(data ? 'taken' : 'available');
      } catch (err) {
        console.error('Subdomain validation error:', err);
        setSubdomainStatus('idle');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.subdomain]);

  // Live apply theme during preview selection
  useEffect(() => {
    injectTheme(formData.themeColor);
  }, [formData.themeColor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (subdomainStatus === 'taken') {
      toast({
        title: 'Xatolik',
        description: 'Bu subdomen allaqachon band. Boshqa subdomen tanlang.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create the tenant first with status Pending to allow superadmin approval
      const { data: tenant, error: tenantError } = await (supabase as any)
        .from('tenants')
        .insert({
          name: formData.companyName,
          subdomain: formData.subdomain.toLowerCase(),
          status: 'pending',
          plan: formData.plan,
          owner_name: formData.ownerName,
          owner_email: formData.email,
          owner_phone: formData.phone,
          vertical: 'consulting',
          config: {
            business_type: 'consulting',
            branding: {
              theme_color: formData.themeColor,
              logo_url: formData.logoUrl || '',
              currency: formData.currency,
              timezone: formData.timezone
            },
            modules: {
              consulting:    true,
              ai_camera:     formData.plan !== 'Starter',
              billing:       true
            }
          }
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // 2. Register Owner User first (this creates the auth session)
      const { data: signUpData, error: signUpError } = await signUp(
        formData.email,
        formData.password,
        formData.ownerName,
        {
          tenant_id: tenant.id,
          role: 'owner'
        }
      );

      if (signUpError) throw signUpError;

      // 3. Insert the initial Branch AFTER signup so RLS sees authenticated user
      // Wait a moment for session to propagate
      await new Promise(resolve => setTimeout(resolve, 800));

      let branchId: string | null = null;
      try {
        const { data: branch, error: branchError } = await (supabase as any)
          .from('branches')
          .insert({
            tenant_id: tenant.id,
            name: formData.branchName || formData.companyName + ' - Asosiy filial',
            address: formData.branchAddress || '',
            timezone: formData.timezone,
            currency: formData.currency
          })
          .select()
          .single();

        if (!branchError && branch) {
          branchId = branch.id;
          // Update profile with branch_id
          if (signUpData?.user?.id) {
            await (supabase as any).from('profiles')
              .update({ branch_id: branchId })
              .eq('user_id', signUpData.user.id);
          }
        }
      } catch (branchErr) {
        // Branch creation failed but registration succeeded — branch can be created later
        console.warn('Branch creation skipped:', branchErr);
      }

      toast({
        title: 'Muvaffaqiyatli ro\'yxatdan o\'tildi!',
        description: 'Sizning so\'rovingiz muvaffaqiyatli yuborildi. Super admin tasdiqlashini kuting.'
      });

      // Navigate to pending approval screen after successful registration
      navigate('/pending-approval');

    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: 'Xatolik yuz berdi',
        description: error.message || 'Iltimos, qaytadan urinib ko\'ring',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-foreground selection:bg-primary/30 font-sans overflow-x-hidden relative flex flex-col justify-between">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[130px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[130px]" />
        <div className="absolute inset-0 noise-overlay opacity-[0.02] mix-blend-overlay" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-[#0A0A0A]/40 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between h-20 px-6">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link to="/auth" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Kirish
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-4xl">
          {/* Progress indicators */}
          <div className="flex items-center justify-between max-w-xl mx-auto mb-10">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${step >= 1 ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-white/5 text-white/40'}`}>
                1
              </div>
              <span className={`text-sm font-medium ${step >= 1 ? 'text-white' : 'text-white/40'}`}>Biznes</span>
            </div>
            <div className="flex-1 h-[2px] bg-white/5 mx-4" />
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${step >= 2 ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-white/5 text-white/40'}`}>
                2
              </div>
              <span className={`text-sm font-medium ${step >= 2 ? 'text-white' : 'text-white/40'}`}>Tariflar</span>
            </div>
            <div className="flex-1 h-[2px] bg-white/5 mx-4" />
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${step >= 3 ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-white/5 text-white/40'}`}>
                3
              </div>
              <span className={`text-sm font-medium ${step >= 3 ? 'text-white' : 'text-white/40'}`}>Sozlash</span>
            </div>
            <div className="flex-1 h-[2px] bg-white/5 mx-4" />
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${step >= 4 ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-white/5 text-white/40'}`}>
                4
              </div>
              <span className={`text-sm font-medium ${step >= 4 ? 'text-white' : 'text-white/40'}`}>Egalik</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">Agentligingizni ro‘yxatdan o‘tkazing</h1>
                  <p className="text-white/60 max-w-lg mx-auto">UniPath — xorijda ta’lim konsalting agentliklari uchun tizim.</p>
                </div>

                <div className="max-w-md mx-auto">
                  <div className="border border-primary bg-primary/5 p-6 rounded-2xl shadow-[0_0_25px_rgba(var(--primary),0.15)]">
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary text-primary-foreground">
                        <Building className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">Konsalting (Consulting)</h3>
                        <p className="text-white/50 text-xs mt-1 leading-relaxed">
                          Arizalar, hujjatlar va mijozlar oqimi boshqaruvi.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={() => setStep(2)}
                    className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-8 py-6 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                  >
                    Davom etish <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">Tarif rejangizni tanlang</h1>
                  <p className="text-white/60 max-w-lg mx-auto">Agentligingizga to'g'ri keladigan tarif rejasini tanlang.</p>
                </div>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  {isLoadingPlans ? (
                    <div className="col-span-full flex justify-center py-12">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                  ) : dbPlans.length === 0 ? (
                    <div className="col-span-full text-center text-white/40 text-sm py-12">Tariflar topilmadi</div>
                  ) : (
                    dbPlans.map((p) => {
                      const isSelected = formData.plan === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setFormData({ ...formData, plan: p.id })}
                          className={`relative cursor-pointer border p-6 rounded-[2rem] transition-all duration-300 flex flex-col justify-between hover:bg-[#151515] ${
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-[0_0_30px_rgba(var(--primary),0.15)] ring-1 ring-primary/20'
                              : 'border-white/5 bg-[#111111]/80 hover:border-white/10'
                          }`}
                        >
                          {p.popular && (
                            <span className="absolute -top-3 right-6 bg-primary text-primary-foreground text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                              Mashhur
                            </span>
                          )}
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-extrabold text-white text-lg">{p.name}</h3>
                              <p className="text-white/50 text-xs mt-1 leading-relaxed min-h-[32px]">{p.desc}</p>
                            </div>
                            
                            <div className="py-2">
                              <span className="text-3xl font-black text-white">{p.price}</span>
                              <span className="text-white/40 text-xs ml-1 font-semibold">{p.currency}/oy</span>
                            </div>

                            <div className="border-t border-white/5 pt-4 space-y-2">
                              {p.features.map((feat: string, idx: number) => (
                                <div key={idx} className="flex items-start gap-2 text-xs">
                                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                  <span className="text-white/70 leading-normal">{feat}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-6">
                            <Button
                              className={`w-full font-bold rounded-xl h-11 transition-all ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground hover:bg-primary/95'
                                  : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                              }`}
                            >
                              {isSelected ? "Tanlandi" : "Tanlash"}
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex justify-between items-center pt-4">
                  <Button 
                    onClick={() => setStep(1)}
                    variant="ghost"
                    className="text-white/60 hover:text-white hover:bg-white/5 rounded-full px-6 py-6"
                  >
                    <ArrowLeft className="mr-2 w-5 h-5" /> Orqaga
                  </Button>

                  <Button 
                    onClick={() => setStep(3)}
                    className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-8 py-6 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                  >
                    Davom etish <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="max-w-2xl mx-auto space-y-8"
              >
                <div className="text-center">
                  <h1 className="text-3xl font-bold mb-3 text-white">Tizim va Filial Sozlamalari</h1>
                  <p className="text-white/60">Tizimingiz qaysi nom hamda sozlamalarda joylashishini belgilang.</p>
                </div>

                <Card className="bg-[#111111]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 grid md:grid-cols-2 gap-6">
                  
                  {/* General */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-white/90 text-sm border-b border-white/5 pb-2">Kompaniya</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-white/80 font-medium text-xs">Kompaniya nomi</Label>
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input
                          id="companyName"
                          type="text"
                          placeholder="Masalan: Grand Hotel, Uni Academy"
                          className="pl-11 h-12 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50 text-sm"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subdomain" className="text-white/80 font-medium text-xs">Maxsus subdomen</Label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input
                          id="subdomain"
                          type="text"
                          placeholder="grand-hotel"
                          className="pl-11 pr-24 h-12 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50 font-mono text-sm"
                          value={formData.subdomain}
                          onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.replace(/[^a-zA-Z0-9-]/g, '') })}
                          required
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 font-mono font-medium text-xs">
                          .unipath.me
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 px-1 text-[10px]">
                        {subdomainStatus === 'checking' && (
                          <span className="text-white/40 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Tekshirilmoqda...
                          </span>
                        )}
                        {subdomainStatus === 'available' && (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Band emas va foydalanishga tayyor
                          </span>
                        )}
                        {subdomainStatus === 'taken' && (
                          <span className="text-rose-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Afsuski, bu subdomen band
                          </span>
                        )}
                        {subdomainStatus === 'idle' && (
                          <span className="text-white/30">Kamida 3 ta belgi kiriting</span>
                        )}
                      </div>
                    </div>

                    {/* Theme Preset Selection */}
                    <div className="space-y-2">
                      <Label className="text-white/80 font-medium text-xs">Brending (Mavzu rangi)</Label>
                      <div className="grid grid-cols-5 gap-2">
                        {THEME_PRESETS.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, themeColor: p.id })}
                            className={`h-10 rounded-xl border flex items-center justify-center transition-all ${
                              formData.themeColor === p.id ? 'border-white bg-white/10 scale-105' : 'border-white/5 bg-[#171717]'
                            }`}
                            title={p.nameUz}
                          >
                            <span
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: p.colorHex }}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Logo upload (optional) */}
                    <div className="space-y-2">
                      <Label className="text-white/80 font-medium text-xs">Logotip (ixtiyoriy)</Label>
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl border border-white/10 bg-[#171717] flex items-center justify-center overflow-hidden shrink-0">
                          {formData.logoUrl
                            ? <img src={formData.logoUrl} alt="logo" className="w-full h-full object-contain" />
                            : <span className="text-lg font-black text-white/40">{(formData.companyName || 'U').charAt(0).toUpperCase()}</span>}
                        </div>
                        <label>
                          <input type="file" accept="image/*" className="hidden" onChange={handleLogoPick} />
                          <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer border border-white/10 bg-[#171717] text-white/80 hover:bg-white/5 transition">
                            <ImageIcon className="w-4 h-4" /> {formData.logoUrl ? 'Almashtirish' : 'Logo yuklash'}
                          </span>
                        </label>
                        {formData.logoUrl && (
                          <button type="button" onClick={() => setFormData({ ...formData, logoUrl: '' })} className="text-rose-400 text-xs hover:underline">O'chirish</button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Branch & Localization */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-white/90 text-sm border-b border-white/5 pb-2">Bosh Filial (Bosh ofis)</h3>

                    <div className="space-y-2">
                      <Label htmlFor="branchName" className="text-white/80 font-medium text-xs">Filial nomi</Label>
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input
                          id="branchName"
                          type="text"
                          className="pl-11 h-12 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50 text-sm"
                          value={formData.branchName}
                          onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="branchAddress" className="text-white/80 font-medium text-xs">Manzil</Label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input
                          id="branchAddress"
                          type="text"
                          className="pl-11 h-12 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50 text-sm"
                          value={formData.branchAddress}
                          onChange={(e) => setFormData({ ...formData, branchAddress: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="timezone" className="text-white/80 font-medium text-xs">Vaqt hududi</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                          <select
                            id="timezone"
                            className="w-full pl-9 pr-3 h-12 bg-[#171717] border border-white/10 rounded-xl text-white focus:border-primary/50 text-xs appearance-none"
                            value={formData.timezone}
                            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                          >
                            <option value="Asia/Tashkent">Toshkent (GMT+5)</option>
                            <option value="Asia/Dubai">Dubay (GMT+4)</option>
                            <option value="Europe/London">London (GMT+0)</option>
                            <option value="America/New_York">Nyu York (GMT-5)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="currency" className="text-white/80 font-medium text-xs">Asosiy valyuta</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                          <select
                            id="currency"
                            className="w-full pl-9 pr-3 h-12 bg-[#171717] border border-white/10 rounded-xl text-white focus:border-primary/50 text-xs appearance-none"
                            value={formData.currency}
                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                          >
                            <option value="UZS">So‘m (UZS)</option>
                            <option value="USD">AQSH Dollari (USD)</option>
                            <option value="EUR">Yevro (EUR)</option>
                            <option value="RUB">Rubl (RUB)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="flex justify-between items-center pt-4">
                  <Button 
                    onClick={() => setStep(2)}
                    variant="ghost"
                    className="text-white/60 hover:text-white hover:bg-white/5 rounded-full px-6 py-6"
                  >
                    <ArrowLeft className="mr-2 w-5 h-5" /> Orqaga
                  </Button>
                  
                  <Button 
                    onClick={() => setStep(4)}
                    disabled={!formData.companyName || formData.subdomain.length < 3 || subdomainStatus !== 'available' || !formData.branchName}
                    className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-8 py-6 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.2)] disabled:opacity-40"
                  >
                    Davom etish <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="max-w-xl mx-auto space-y-8"
              >
                <div className="text-center">
                  <h1 className="text-3xl font-bold mb-3 text-white">Egalik va Login Sozlamalari</h1>
                  <p className="text-white/60">Tizim egasi (Super Admin huquqidagi admin) ma'lumotlarini to'ldiring.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <Card className="bg-[#111111]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="ownerName" className="text-white/80 font-medium">To'liq ism va familiyangiz</Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <Input
                          id="ownerName"
                          type="text"
                          placeholder="John Doe"
                          className="pl-12 h-14 bg-white/5 border-white/10 rounded-2xl text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                          value={formData.ownerName}
                          onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white/80 font-medium">Email manzilingiz (Login uchun)</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="example@mail.com"
                          className="pl-12 h-14 bg-white/5 border-white/10 rounded-2xl text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-white/80 font-medium">Telefon raqam</Label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+998 (90) 123-45-67"
                          className="pl-12 h-14 bg-white/5 border-white/10 rounded-2xl text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pass" className="text-white/80 font-medium">Parol yarating</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <Input
                          id="pass"
                          type="password"
                          placeholder="••••••••"
                          className="pl-12 h-14 bg-white/5 border-white/10 rounded-2xl text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </Card>

                  <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl text-sm">
                    <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-white/70 leading-relaxed">
                      "UNI" tizimi avtomatik tarzda to‘liq yig‘iladi va barcha tanlangan biznes modullari, filiallar va oylik billing boshqaruvi sozlanadi.
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <Button 
                      type="button"
                      onClick={() => setStep(3)}
                      variant="ghost"
                      className="text-white/60 hover:text-white hover:bg-white/5 rounded-full px-6 py-6"
                      disabled={isSubmitting}
                    >
                      <ArrowLeft className="mr-2 w-5 h-5" /> Orqaga
                    </Button>
                    
                    <Button 
                      type="submit"
                      disabled={isSubmitting || !formData.ownerName || !formData.email || !formData.phone || formData.password.length < 6}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-6 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.2)] disabled:opacity-40 flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" /> Yozilmoqda...
                        </>
                      ) : (
                        <>
                          Onboardingni Yakunlash <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-white/5">
        <div className="container mx-auto px-6 text-center text-sm text-white/40">
          © 2026 UniPath SaaS. Barcha huquqlar himoyalangan.
        </div>
      </footer>
    </div>
  );
}
