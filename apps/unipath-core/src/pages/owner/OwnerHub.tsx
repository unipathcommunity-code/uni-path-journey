import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Plus, ArrowRight, Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Logo } from '@/components/Logo';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  business_type: string;
  status: string;
  plan: string;
  config?: any;
}

export default function OwnerHub() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyTenants() {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('owner_email', user.email)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTenants(data);
      }
      setLoading(false);
    }

    fetchMyTenants();
  }, [user]);

  const handleSelectTenant = (tenant: Tenant) => {
    localStorage.setItem('active_tenant', JSON.stringify(tenant));
    // Hard navigation so TenantProvider re-resolves from scratch and honors the
    // owner's active_tenant (a plain SPA navigate would not re-run resolveTenant,
    // leaving the admin shell on the previous/empty tenant).
    window.location.href = '/admin';
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem('active_tenant');
      await Promise.race([
        signOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 1000))
      ]);
    } catch (e) {
      console.warn("Sign out failed or timed out:", e);
      if (typeof window !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
            localStorage.removeItem(key);
          }
        }
      }
    } finally {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-white">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-white/60">Bizneslaringiz yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-foreground selection:bg-primary/30 font-sans overflow-x-hidden relative flex flex-col">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[130px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[130px]" />
      </div>

      <header className="relative z-10 border-b border-white/5 bg-[#0A0A0A]/40 backdrop-blur-md">
        <div className="container mx-auto max-w-5xl flex items-center justify-between h-20 px-6">
          <div className="flex items-center gap-2">
            <Logo />
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-white/60 hover:text-white" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" /> Tizimdan chiqish
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 container mx-auto max-w-5xl py-12 px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Mening Bizneslarim</h1>
            <p className="text-white/60">Boshqarmoqchi bo'lgan biznesingizni tanlang yoki yangisini qo'shing.</p>
          </div>
          <Link to="/tizimlashtirish">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_0_20px_rgba(212,175,55,0.2)]">
              <Plus className="w-5 h-5 mr-2" /> Yangi biznes qo'shish
            </Button>
          </Link>
        </div>

        {tenants.length === 0 ? (
          <div className="text-center py-20 border border-white/5 rounded-3xl bg-[#111111]/50 backdrop-blur-sm">
            <Building2 className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Hali bizneslaringiz yo'q</h2>
            <p className="text-white/50 mb-6 max-w-md mx-auto">
              Siz hali hech qanday biznes qo'shmagansiz. UniPath platformasi orqali o'z biznesingizni onlayn boshqaring.
            </p>
            <Link to="/tizimlashtirish">
              <Button className="bg-primary text-primary-foreground">
                Hozir yaratish
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map(tenant => (
              <Card 
                key={tenant.id}
                onClick={() => handleSelectTenant(tenant)}
                className="group cursor-pointer bg-[#111111]/80 backdrop-blur-xl border-white/5 hover:border-primary/50 transition-all duration-300 p-6 flex flex-col justify-between hover:shadow-[0_0_30px_rgba(212,175,55,0.1)] rounded-[2rem] overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-colors text-white">
                      <Building2 className="w-6 h-6" />
                    </div>
                    {tenant.status === 'pending' ? (
                      <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-xs font-medium rounded-full border border-amber-500/20">
                        Jarayonda
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-medium rounded-full border border-emerald-500/20">
                        Faol
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors">
                    {tenant.name}
                  </h3>
                  <div className="text-white/40 text-sm mb-6 font-mono bg-black/20 inline-block px-2 py-0.5 rounded">
                    {tenant.subdomain}.unipath.me
                  </div>
                </div>

                <div className="relative z-10 pt-4 border-t border-white/5 flex items-center justify-between text-sm">
                  <div className="text-white/50 capitalize">
                    Modul: {tenant.config?.business_type || tenant.business_type || 'Boshqa'}
                  </div>
                  <div className="text-primary font-medium flex items-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                    Boshqarish <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
