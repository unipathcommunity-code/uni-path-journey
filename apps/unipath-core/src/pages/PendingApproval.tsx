import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, 
  RefreshCw, 
  LogOut, 
  Hourglass, 
  Building,
  CheckCircle,
  Mail,
  Phone,
  FileCheck
} from 'lucide-react';

export default function PendingApproval() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { tenantId, tenantStatus, role } = useUserRole();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tenantInfo, setTenantInfo] = useState<any>(null);

  useEffect(() => {
    async function getTenantDetails() {
      if (!tenantId) return;
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .maybeSingle();
      if (!error && data) {
        setTenantInfo(data);
      }
    }
    getTenantDetails();
  }, [tenantId]);

  // If approved, redirect to dashboard redirect page to go to correct admin route
  useEffect(() => {
    if (tenantStatus === 'active') {
      toast({
        title: 'Tabriklaymiz!',
        description: 'Tizimingiz faollashtirildi. CRM panelingizga yo\'naltirilmoqdasiz.',
      });
      navigate('/dashboard');
    }
  }, [tenantStatus, navigate, toast]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Reload page to re-trigger auth and role hooks to fetch latest status
    window.location.reload();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-foreground selection:bg-primary/30 font-sans overflow-hidden relative flex flex-col justify-between">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute inset-0 noise-overlay opacity-[0.02] mix-blend-overlay" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-[#0A0A0A]/40 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between h-20 px-6">
          <Logo />
          <Button 
            onClick={handleSignOut} 
            variant="ghost" 
            className="text-white/60 hover:text-white hover:bg-white/5 rounded-full"
          >
            <LogOut className="w-4 h-4 mr-2" /> Chiqish
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="bg-[#111111]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <CardHeader className="text-center pb-2 pt-10">
                <div className="mx-auto mb-6 w-20 h-20 bg-primary/10 rounded-[1.8rem] flex items-center justify-center border border-primary/20 shadow-[0_0_20px_rgba(212,175,55,0.1)] relative">
                  <Hourglass className="w-10 h-10 text-primary animate-pulse" />
                </div>
                <CardTitle className="text-3xl font-extrabold text-white tracking-tight">Kutish jarayoni</CardTitle>
                <CardDescription className="text-white/50 text-base max-w-md mx-auto mt-2 leading-relaxed">
                  Sizning so'rovingiz qabul qilindi. Super Admin tasdiqlashini kuting. Tez orada crm tizimingiz tayyor bo'ladi!
                </CardDescription>
              </CardHeader>
              
              <CardContent className="px-8 pb-10 space-y-6 pt-6">
                {tenantInfo && (
                  <div className="bg-white/5 rounded-[1.8rem] border border-white/5 p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <span className="text-white/40 text-sm">Kompaniya:</span>
                      <span className="text-white font-semibold flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-primary" /> {tenantInfo.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <span className="text-white/40 text-sm">Subdomen:</span>
                      <span className="text-primary font-mono font-medium">
                        {tenantInfo.subdomain}.unipath.me
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <span className="text-white/40 text-sm">Tarif reja:</span>
                      <span className="bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold">
                        {tenantInfo.plan || 'Starter'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white/40 text-sm">Holat:</span>
                      <span className="text-amber-400 font-bold flex items-center gap-1.5 text-sm">
                        <Hourglass className="w-4 h-4" /> Tasdiqlanishi kutilmoqda
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-14 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} /> Statusni tekshirish
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-white/5 text-center text-sm text-white/40">
        © 2026 UniPath SaaS. Barcha huquqlar himoyalangan.
      </footer>
    </div>
  );
}
