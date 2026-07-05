import { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { IconBadge, IconTone } from '@/components/ui/icon-badge';
import {
  Dumbbell, Bed, UtensilsCrossed, Gem, HeartPulse, Scissors, Car, Trophy,
  Baby, BookOpen, Store, Wrench, Building2, LogOut, User, Phone, Mail,
  CalendarCheck, ClipboardList, ArrowRight, Sparkles,
} from 'lucide-react';

// Per-vertical member/customer experience (label + actions). Keeps end-users out
// of the study-abroad student portal, which only fits academy/consulting/tour.
const META: Record<string, { icon: any; tone: IconTone; roleLabel: string; title: string; sub: string; actions: { label: string; icon: any }[] }> = {
  gym:          { icon: Dumbbell,       tone: 'purple',  roleLabel: "A'zo",   title: 'Fitnes a\'zolik paneli', sub: 'Abonement, dars jadvali va tashriflaringiz.', actions: [{ label: 'Darsga yozilish', icon: CalendarCheck }, { label: 'Mening abonementim', icon: ClipboardList }] },
  hotel:        { icon: Bed,            tone: 'sky',     roleLabel: 'Mehmon', title: 'Mehmon kabineti',        sub: 'Bronlaringiz va joylashuv ma\'lumotlari.',   actions: [{ label: 'Yangi bron', icon: CalendarCheck }, { label: 'Mening bronlarim', icon: ClipboardList }] },
  restaurant:   { icon: UtensilsCrossed,tone: 'orange',  roleLabel: 'Mijoz',  title: 'Mijoz kabineti',         sub: 'Buyurtmalaringiz va sevimli taomlar.',        actions: [{ label: 'Menyu & buyurtma', icon: CalendarCheck }, { label: 'Buyurtmalarim', icon: ClipboardList }] },
  wedding_hall: { icon: Gem,            tone: 'pink',    roleLabel: 'Mijoz',  title: 'Tantana kabineti',       sub: 'To\'y/marosim buyurtmangiz holati.',          actions: [{ label: 'Zal bron so\'rovi', icon: CalendarCheck }, { label: 'Buyurtmam', icon: ClipboardList }] },
  clinic:       { icon: HeartPulse,     tone: 'rose',    roleLabel: 'Bemor',  title: 'Bemor kabineti',         sub: 'Qabullaringiz va tibbiy ma\'lumot.',          actions: [{ label: 'Qabulga yozilish', icon: CalendarCheck }, { label: 'Tashriflarim', icon: ClipboardList }] },
  cosmetics:    { icon: Scissors,       tone: 'pink',    roleLabel: 'Mijoz',  title: 'Mijoz kabineti',         sub: 'Xizmatlar va tashriflaringiz.',               actions: [{ label: 'Xizmatga yozilish', icon: CalendarCheck }, { label: 'Tashriflarim', icon: ClipboardList }] },
  auto_service: { icon: Wrench,         tone: 'amber',   roleLabel: 'Mijoz',  title: 'Mijoz kabineti',         sub: 'Avto-servis buyurtmalaringiz.',               actions: [{ label: 'Xizmat buyurtma', icon: CalendarCheck }, { label: 'Buyurtmalarim', icon: ClipboardList }] },
  car_showroom: { icon: Car,            tone: 'indigo',  roleLabel: 'Mijoz',  title: 'Mijoz kabineti',         sub: 'Avtomobil so\'rovlaringiz.',                  actions: [{ label: 'Avtomobillar', icon: CalendarCheck }, { label: 'So\'rovlarim', icon: ClipboardList }] },
  stadium:      { icon: Trophy,         tone: 'emerald', roleLabel: 'Mijoz',  title: 'Mijoz kabineti',         sub: 'Maydon bronlaringiz.',                        actions: [{ label: 'Maydon bron', icon: CalendarCheck }, { label: 'Bronlarim', icon: ClipboardList }] },
  kindergarten: { icon: Baby,           tone: 'amber',   roleLabel: 'Ota-ona',title: 'Ota-ona kabineti',       sub: 'Farzandingiz haqida ma\'lumot.',              actions: [{ label: 'Guruhga yozilish', icon: CalendarCheck }, { label: 'Ma\'lumot', icon: ClipboardList }] },
  library:      { icon: BookOpen,       tone: 'teal',    roleLabel: 'O\'quvchi',title: 'Kutubxona kabineti',   sub: 'Olgan kitoblaringiz.',                        actions: [{ label: 'Kitob qidirish', icon: CalendarCheck }, { label: 'Kitoblarim', icon: ClipboardList }] },
  wholesale:    { icon: Store,          tone: 'blue',    roleLabel: 'Mijoz',  title: 'Mijoz kabineti',         sub: 'Optom buyurtmalaringiz.',                     actions: [{ label: 'Katalog', icon: CalendarCheck }, { label: 'Buyurtmalarim', icon: ClipboardList }] },
};
const DEFAULT_META = { icon: Building2, tone: 'primary' as IconTone, roleLabel: 'Mijoz', title: 'Shaxsiy kabinet', sub: 'Hisobingiz va faoliyatingiz.', actions: [{ label: 'Xizmatlar', icon: CalendarCheck }, { label: 'Faoliyatim', icon: ClipboardList }] };

export default function MemberDashboard() {
  const { activeTenant } = useApp();
  const { user, signOut } = useAuth();

  const vertical = String((activeTenant as any)?.business_type || 'consulting').toLowerCase();
  const meta = META[vertical] || DEFAULT_META;
  const Icon = meta.icon;

  // "My businesses" — every tenant this account belongs to (tenant_memberships).
  const [myBusinesses, setMyBusinesses] = useState<{ id: string; name: string; subdomain: string; role: string }[]>([]);
  useEffect(() => {
    (async () => {
      if (!user?.id) return;
      try {
        const { data: mems } = await (supabase as any)
          .from('tenant_memberships')
          .select('tenant_id, role')
          .eq('user_id', user.id)
          .eq('status', 'active');
        if (!mems?.length) return;
        const ids = mems.map((m: any) => m.tenant_id);
        const { data: tenants } = await (supabase as any)
          .from('tenants')
          .select('id, name, subdomain')
          .in('id', ids);
        const roleMap = new Map(mems.map((m: any) => [m.tenant_id, m.role]));
        setMyBusinesses(((tenants || []) as any[]).map(t => ({
          id: t.id, name: t.name, subdomain: t.subdomain, role: String(roleMap.get(t.id) || 'member'),
        })));
      } catch (e) {
        console.warn('memberships fetch unavailable:', e);
      }
    })();
  }, [user?.id]);

  const tenantName = activeTenant?.name || 'UniPath';
  const logoUrl = activeTenant?.config?.branding?.logo_url;
  const fullName = (user?.user_metadata as any)?.full_name || user?.email?.split('@')[0] || 'Foydalanuvchi';

  const handleLogout = async () => {
    try { localStorage.removeItem('active_tenant'); await signOut(); } catch {}
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {logoUrl
              ? <img src={logoUrl} alt={tenantName} className="w-8 h-8 rounded-lg object-contain" />
              : <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">{tenantName.charAt(0)}</div>}
            <span className="font-semibold truncate">{tenantName}</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition">
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Chiqish</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Hero */}
        <div className="flex items-center gap-4">
          <IconBadge icon={<Icon />} tone={meta.tone} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Salom, {fullName}!</h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{meta.roleLabel}</span>
            </div>
            <p className="text-sm text-muted-foreground">{meta.title} · {meta.sub}</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-2 gap-3">
          {meta.actions.map((a, i) => {
            const AIcon = a.icon;
            return (
              <Card key={i}>
                <CardContent className="p-4 flex items-center gap-3">
                  <IconBadge icon={<AIcon />} tone={i === 0 ? meta.tone : 'slate'} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{a.label}</p>
                    <p className="text-xs text-muted-foreground">Tez orada</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/40" />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Profile card */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2 font-semibold"><User className="w-4 h-4 text-primary" /> Profilim</div>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /> {fullName}</div>
              <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /> {user?.email || '—'}</div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /> {(user?.user_metadata as any)?.phone || 'Kiritilmagan'}</div>
              <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground" /> {tenantName}</div>
            </div>
          </CardContent>
        </Card>

        {/* My businesses (one account, many businesses) */}
        {myBusinesses.length > 1 && (
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2 font-semibold"><Building2 className="w-4 h-4 text-primary" /> Mening bizneslarim</div>
              <div className="grid sm:grid-cols-2 gap-2">
                {myBusinesses.map(b => (
                  <a key={b.id} href={`https://${b.subdomain}.unipath.me`}
                    className={`flex items-center gap-3 p-3 border rounded-xl hover:border-primary/40 transition ${b.id === activeTenant?.id ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                      {b.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{b.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{b.subdomain}.unipath.me · {b.role}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info note */}
        <Card className="border-dashed">
          <CardContent className="p-5 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Bu sizning <b className="text-foreground">{tenantName}</b> kabinetingiz. Onlayn bron/buyurtma va boshqa xizmatlar shu yerda kengaytirilib boriladi.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
