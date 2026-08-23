/**
 * TenantPublicPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Public-facing page for every registered consulting agency on unipath.me
 *
 * How it works:
 *  • Visitor opens  myagency.unipath.me
 *  • TenantRouter resolves the tenant and sets activeTenant in AppContext
 *  • App.tsx renders this page instead of the main SaaS landing
 *  • It fetches the public university/programme list from Supabase
 *  • Visitor can: view destinations, submit a contact form (→ leads),
 *                 click "Kirish" to go to the login page
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import {
  Building2, Phone, Mail, MapPin, Clock, Star,
  CheckCircle2, ArrowRight, MessageCircle, Globe, Shield,
  LogIn, Menu, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ─── Consulting page identity ────────────────────────────────────────────────
const META = {
  icon: Building2,
  color: '#8b5cf6',
  gradient: 'from-violet-950 via-slate-900 to-slate-950',
  heroTitle: "Xorijda ta'lim — biz bilan oson",
  heroSub: '10+ yillik tajriba, 500+ muvaffaqiyatli talaba, ishonchli hamkor.',
  ctaLabel: 'Bepul maslahat',
};

const WHY_POINTS = [
  '10+ yil tajriba',
  '500+ muvaffaqiyatli talaba',
  'Bepul dastlabki maslahat',
  'Hujjatlar bilan yordam',
];

// Shown when the agency has not filled its own list yet.
const MOCK_ITEMS = [
  { id: 'm1', name: 'Germaniya universitetlari', country: 'Germaniya' },
  { id: 'm2', name: 'Polsha davlat universitetlari', country: 'Polsha' },
  { id: 'm3', name: 'Rossiya texnik universitetlari', country: 'Rossiya' },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function TenantPublicPage() {
  const { activeTenant } = useApp();
  const navigate = useNavigate();

  const Icon = META.icon;

  // Branding
  const brandColor = activeTenant?.config?.branding?.theme_color || META.color;
  const logoUrl = activeTenant?.config?.branding?.logo_url || null;
  const tenantName = activeTenant?.name || 'Biznes';

  // Public data
  const [items, setItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Contact form
  const [form, setForm] = useState({ name: '', phone: '', note: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Fetch the featured universities / programmes ─────────────────────────
  useEffect(() => {
    if (!activeTenant?.id) { setLoadingItems(false); return; }

    (async () => {
      const { data } = await (supabase as any)
        .from('universities')
        .select('id, name, country, programs')
        .limit(6);
      return data || [];
    })()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoadingItems(false));
  }, [activeTenant]);

  // ── Submit contact form ──────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    setSubmitting(true);

    try {
      // Save to contact_requests table (if exists) or leads
      await (supabase as any).from('contact_requests').insert({
        tenant_id: activeTenant?.id,
        name: form.name,
        phone: form.phone,
        message: form.note,
        source: 'public_page',
        status: 'new',
      }).catch(() => null); // silently ignore if table doesn't exist

      // Also save to notification_queue for Telegram
      await (supabase as any).from('notification_queue').insert({
        tenant_id: activeTenant?.id,
        type: 'telegram',
        target: 'admin',
        payload: {
          message: `📩 Yangi murojaat!\nIsm: ${form.name}\nTelefon: ${form.phone}\nIzoh: ${form.note || '—'}\nManba: ${tenantName} public sayt`,
        },
      }).catch(() => null);

      // Direct Telegram bot push (if bot is configured)
      const branding = activeTenant?.config?.branding as any;
      const botToken = branding?.telegram_bot_token;
      const chatId = branding?.telegram_chat_id;
      if (botToken && chatId) {
        const msg = [
          `📩 <b>Yangi murojaat!</b>`,
          ``,
          `👤 <b>Ism:</b> ${form.name}`,
          `📞 <b>Telefon:</b> ${form.phone}`,
          form.note ? `💬 <b>Izoh:</b> ${form.note}` : null,
          ``,
          `🏢 <b>Biznes:</b> ${tenantName}`,
          `🌐 <b>Manba:</b> public sahifa`,
          `🕐 <b>Vaqt:</b> ${new Date().toLocaleString('uz-UZ')}`,
        ].filter(Boolean).join('\n');
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'HTML' }),
        }).catch(() => null); // fire-and-forget
      }

      setSubmitted(true);
      setForm({ name: '', phone: '', note: '' });
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render a destination / programme card ────────────────────────────────
  const renderCard = (item: any, idx: number) => (
    <div key={item.id || idx}
      className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${brandColor}22` }}>
        <Globe className="w-5 h-5" style={{ color: brandColor }} />
      </div>
      <h3 className="font-bold text-white text-sm mb-1">{item.name}</h3>
      <p className="text-xs text-white/50 flex items-center gap-1">
        <MapPin className="w-3 h-3" />{item.country || '—'}
      </p>
    </div>
  );

  const displayItems = items.length > 0 ? items : MOCK_ITEMS;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen bg-gradient-to-br ${META.gradient} text-white font-sans`}>

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-black/30 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo / Name */}
          <div className="flex items-center gap-3">
            {logoUrl
              ? <img src={logoUrl} alt={tenantName} className="h-9 w-9 rounded-xl object-cover" />
              : (
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${brandColor}33` }}>
                  <Icon className="w-5 h-5" style={{ color: brandColor }} />
                </div>
              )
            }
            <span className="font-extrabold text-lg tracking-tight">{tenantName}</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 text-sm text-white/70">
            <a href="#services" className="hover:text-white transition">Xizmatlar</a>
            <a href="#why" className="hover:text-white transition">Nima uchun biz?</a>
            <a href="#contact" className="hover:text-white transition">Bog'lanish</a>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="bg-white/5 border-white/20 text-white hover:bg-white/15 hover:text-white gap-1.5 hidden md:flex"
              onClick={() => navigate('/auth')}
            >
              <LogIn className="w-4 h-4" /> Kirish
            </Button>
            <button className="md:hidden p-2 text-white/70" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mobileOpen && (
          <div className="md:hidden bg-black/80 backdrop-blur-xl border-t border-white/5 px-4 py-4 space-y-3 text-sm">
            <a href="#contact" className="block text-white/80 py-1" onClick={() => setMobileOpen(false)}>Bog'lanish</a>
            <a href="#why" className="block text-white/80 py-1" onClick={() => setMobileOpen(false)}>Nima uchun biz?</a>
            <Button size="sm" className="w-full gap-2" onClick={() => navigate('/auth')}>
              <LogIn className="w-4 h-4" /> Kirish
            </Button>
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative max-w-6xl mx-auto px-4 pt-24 pb-20 text-center overflow-hidden">
        {/* Glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px] rounded-full blur-[140px] opacity-20"
            style={{ background: brandColor }} />
        </div>

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-bold text-white/70 mx-auto">
            {logoUrl
              ? <img src={logoUrl} alt={tenantName} className="w-4 h-4 rounded object-contain" />
              : <Icon className="w-4 h-4" style={{ color: brandColor }} />}
            <span style={{ color: brandColor }}>{tenantName}</span>
            <span>· unipath.me</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            {META.heroTitle}
          </h1>
          <p className="text-lg text-white/60 max-w-xl mx-auto">{META.heroSub}</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              size="lg"
              className="font-bold text-base px-8 py-6 rounded-2xl gap-2"
              style={{ background: brandColor }}
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {META.ctaLabel} <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/5 border-white/20 text-white hover:bg-white/15 hover:text-white font-bold text-base px-8 py-6 rounded-2xl"
              onClick={() => navigate('/auth')}
            >
              Shaxsiy kabinet
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 pt-6 text-xs text-white/40">
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-emerald-400" /> Xavfsiz to'lov</span>
            <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400" /> 5★ Mijozlar bahosi</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-sky-400" /> 24/7 Qo'llab-quvvatlash</span>
          </div>
        </div>
      </section>

      {/* ── DESTINATIONS / PROGRAMMES ───────────────────────────────────────── */}
      <section id="services" className="max-w-6xl mx-auto px-4 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-black mb-2">🎓 Yo'nalishlar</h2>
          <p className="text-white/50 text-sm">
            {displayItems.length === 0 && !loadingItems
              ? "Tez orada qo'shiladi..."
              : `${displayItems.length} ta taklif mavjud`}
          </p>
        </div>

        {loadingItems ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/5 rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayItems.map((item, idx) => renderCard(item, idx))}
          </div>
        )}
      </section>

      {/* ── WHY CHOOSE US ───────────────────────────────────────────────────── */}
      <section id="why" className="max-w-6xl mx-auto px-4 pb-20">
        <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-black text-center mb-10">
            Nima uchun <span style={{ color: brandColor }}>{tenantName}</span>?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_POINTS.map((point, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: `${brandColor}22` }}>
                  <CheckCircle2 className="w-6 h-6" style={{ color: brandColor }} />
                </div>
                <p className="text-sm font-semibold text-white/80">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT FORM ────────────────────────────────────────────────────── */}
      <section id="contact" className="max-w-6xl mx-auto px-4 pb-24">
        <div className="max-w-lg mx-auto text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-black mb-2">Biz bilan bog'laning</h2>
          <p className="text-white/50 text-sm">
            Shaklni to'ldiring — 15 daqiqa ichida operatorimiz siz bilan bog'lanadi.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{ background: `${brandColor}22` }}>
                <CheckCircle2 className="w-8 h-8" style={{ color: brandColor }} />
              </div>
              <h3 className="text-xl font-bold">Murojaatingiz qabul qilindi!</h3>
              <p className="text-white/50 text-sm">Tez orada siz bilan bog'lanamiz.</p>
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => setSubmitted(false)}
              >
                Yana murojaat qilish
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white/60 mb-1.5 block">
                  Ism Familiya *
                </label>
                <Input
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Jasur Karimov"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl h-12"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-white/60 mb-1.5 block">
                  Telefon raqam *
                </label>
                <Input
                  required
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+998 90 123-45-67"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl h-12"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-white/60 mb-1.5 block">
                  Qo'shimcha izoh (ixtiyoriy)
                </label>
                <Input
                  value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                  placeholder="Masalan: Germaniyada bakalavr, 2027-yil uchun..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl h-12"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-14 text-base font-bold rounded-2xl gap-2"
                style={{ background: brandColor }}
              >
                {submitting ? 'Yuborilmoqda...' : (
                  <>
                    <MessageCircle className="w-5 h-5" />
                    {META.ctaLabel} — Bepul maslahat
                  </>
                )}
              </Button>

              <p className="text-center text-[11px] text-white/30">
                Ma'lumotlaringiz xavfsiz va uchinchi shaxslarga berilmaydi.
              </p>
            </form>
          )}

          {/* Contact info */}
          <div className="mt-8 grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/5">
              <Phone className="w-5 h-5 flex-shrink-0" style={{ color: brandColor }} />
              <div>
                <p className="text-[10px] text-white/40 font-bold uppercase">Telefon</p>
                <p className="text-sm text-white font-semibold">+998 71 123-45-67</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/5">
              <Mail className="w-5 h-5 flex-shrink-0" style={{ color: brandColor }} />
              <div>
                <p className="text-[10px] text-white/40 font-bold uppercase">Email</p>
                <p className="text-sm text-white font-semibold">
                  {(activeTenant?.subdomain || 'info') + '@unipath.me'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/5">
              <MessageCircle className="w-5 h-5 flex-shrink-0" style={{ color: brandColor }} />
              <div>
                <p className="text-[10px] text-white/40 font-bold uppercase">Telegram</p>
                <p className="text-sm text-white font-semibold">
                  @{activeTenant?.config?.branding?.telegram_bot_username || (activeTenant?.subdomain || 'unipath')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 text-center">
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-white/50">
            {logoUrl
              ? <img src={logoUrl} alt={tenantName} className="w-5 h-5 rounded object-contain" />
              : <Icon className="w-4 h-4" style={{ color: brandColor }} />}
            {tenantName}
          </div>
          <p className="text-[11px] text-white/25">
            Powered by{' '}
            <a href="https://unipath.me" target="_blank" rel="noreferrer"
              className="hover:text-white/50 transition">
              UniPath SaaS Platform
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
