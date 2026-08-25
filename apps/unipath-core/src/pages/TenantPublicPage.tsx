/**
 * TenantPublicPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Premium public-facing landing page for consulting agencies on unipath.me
 *
 * Features:
 *  • Dynamic gradient based on tenant brandColor
 *  • 3D glass-morphism cards with hover effects
 *  • Scroll-reveal animations (IntersectionObserver)
 *  • Country → University filtering
 *  • Animated counters
 *  • Floating back-to-top & Telegram buttons
 *  • Fully responsive
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import {
  Building2, Phone, Mail, MapPin, Clock, Star,
  CheckCircle2, ArrowRight, MessageCircle, Globe, Shield,
  LogIn, Menu, X, ChevronUp, Search, GraduationCap,
  Users, Award, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AutoApplyModal } from '@/components/public/AutoApplyModal';

// ─── Default branding ────────────────────────────────────────────────────────
const META = {
  icon: Building2,
  color: '#8b5cf6',
  heroTitle: "Xorijda ta'lim — biz bilan oson",
  heroSub: '10+ yillik tajriba, 500+ muvaffaqiyatli talaba, ishonchli hamkor.',
  ctaLabel: 'Bepul maslahat',
};

const WHY_POINTS = [
  { icon: Award, text: '10+ yil tajriba', count: 10 },
  { icon: Users, text: '500+ muvaffaqiyatli talaba', count: 500 },
  { icon: Sparkles, text: 'Bepul dastlabki maslahat', count: 0 },
  { icon: GraduationCap, text: 'Hujjatlar bilan yordam', count: 0 },
];

// ─── Animated Counter Hook ───────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start || target <= 0) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

// ─── Scroll Reveal Hook ──────────────────────────────────────────────────────
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, isVisible };
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function TenantPublicPage() {
  const { activeTenant } = useApp();
  const navigate = useNavigate();
  const Icon = META.icon;

  // Branding
  const brandColor = activeTenant?.config?.branding?.theme_color || META.color;
  const logoUrl = activeTenant?.config?.branding?.logo_url || null;
  const tenantName = activeTenant?.name || 'Biznes';
  const tenantPhone = (activeTenant?.config?.branding as any)?.phone || '+998 71 123-45-67';
  const tenantEmail = (activeTenant?.config?.branding as any)?.email || `${activeTenant?.subdomain || 'info'}@unipath.me`;

  // Public data
  const [items, setItems] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [autoApplyTarget, setAutoApplyTarget] = useState<any>(null);

  // Filtering & Search
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Contact form
  const [form, setForm] = useState({ name: '', phone: '', note: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  // Back to top
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Scroll reveal refs
  const heroReveal = useScrollReveal();
  const countriesReveal = useScrollReveal();
  const uniReveal = useScrollReveal();
  const whyReveal = useScrollReveal();
  const contactReveal = useScrollReveal();

  // ── Fetch data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeTenant?.id) { setLoadingItems(false); return; }
    (async () => {
      const [{ data: unis }, { data: cntrs }] = await Promise.all([
        (supabase as any).from('universities').select('*').eq('is_active', true),
        (supabase as any).from('countries').select('*').eq('is_active', true).order('display_order', { ascending: true })
      ]);
      setCountries(cntrs || []);
      return unis || [];
    })()
      .then(setItems)
      .catch(() => { setItems([]); setCountries([]); })
      .finally(() => setLoadingItems(false));
  }, [activeTenant]);

  // ── Back to top listener ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // ── Submit contact form ────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    setSubmitError(false);
    setSubmitting(true);
    try {
      const { error: leadError } = await (supabase as any)
        .from('contact_requests')
        .insert({
          tenant_id: activeTenant?.id,
          full_name: form.name,
          phone: form.phone,
          message: form.note,
          source_page: `public:${activeTenant?.subdomain ?? 'unknown'}`,
          status: 'new',
        });
      if (leadError) throw leadError;

      await (supabase as any).from('notification_queue').insert({
        tenant_id: activeTenant?.id,
        type: 'telegram',
        target: 'admin',
        payload: {
          message: `📩 Yangi murojaat!\nIsm: ${form.name}\nTelefon: ${form.phone}\nIzoh: ${form.note || '—'}\nManba: ${tenantName} public sayt`,
        },
      }).catch(() => null);

      const branding = activeTenant?.config?.branding as any;
      const botToken = branding?.telegram_bot_token;
      const chatId = branding?.telegram_chat_id;
      if (botToken && chatId) {
        const msg = [
          `📩 <b>Yangi murojaat!</b>`, ``,
          `👤 <b>Ism:</b> ${form.name}`,
          `📞 <b>Telefon:</b> ${form.phone}`,
          form.note ? `💬 <b>Izoh:</b> ${form.note}` : null,
          ``, `🏢 <b>Biznes:</b> ${tenantName}`,
          `🌐 <b>Manba:</b> public sahifa`,
          `🕐 <b>Vaqt:</b> ${new Date().toLocaleString('uz-UZ')}`,
        ].filter(Boolean).join('\n');
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'HTML' }),
        }).catch(() => null);
      }
      setSubmitted(true);
      setForm({ name: '', phone: '', note: '' });
    } catch (err) {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Filtered items ─────────────────────────────────────────────────────────
  const displayItems = items.filter(item => {
    const matchesCountry = !selectedCountry || item.country === selectedCountry || item.country_id === selectedCountry;
    const matchesSearch = !searchQuery || item.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCountry && matchesSearch;
  });

  // ── Reveal animation class ─────────────────────────────────────────────────
  const revealClass = (isVisible: boolean, delay = 0) =>
    `transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`
    + (delay ? ` delay-[${delay}ms]` : '');

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen text-white font-sans relative overflow-hidden"
      style={{ background: `linear-gradient(160deg, #030712 0%, ${brandColor}08 30%, #030712 60%, ${brandColor}05 100%)` }}
    >
      {/* ── Ambient glow orbs ─────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-[200px] opacity-[0.07]"
          style={{ background: brandColor }}
        />
        <div
          className="absolute bottom-[-100px] right-[-200px] w-[500px] h-[500px] rounded-full blur-[150px] opacity-[0.05]"
          style={{ background: brandColor }}
        />
      </div>

      {/* ── NAV ───────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/[0.06]"
           style={{ background: 'rgba(3,7,18,0.8)' }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl
              ? <img src={logoUrl} alt={tenantName} className="h-9 w-9 rounded-xl object-cover ring-1 ring-white/10" />
              : (
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${brandColor}22`, boxShadow: `0 0 20px ${brandColor}22` }}>
                  <Icon className="w-5 h-5" style={{ color: brandColor }} />
                </div>
              )
            }
            <span className="font-extrabold text-lg tracking-tight">{tenantName}</span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm text-white/60">
            <a href="#countries" className="hover:text-white transition-colors">Davlatlar</a>
            <a href="#services" className="hover:text-white transition-colors">Universitetlar</a>
            <a href="#why" className="hover:text-white transition-colors">Nima uchun biz?</a>
            <a href="#contact" className="hover:text-white transition-colors">Bog'lanish</a>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="hidden md:flex gap-1.5 font-bold text-sm rounded-xl"
              style={{ background: brandColor, color: '#fff', boxShadow: `0 0 20px ${brandColor}33` }}
              onClick={() => navigate('/auth')}
            >
              <LogIn className="w-4 h-4" /> Kirish
            </Button>
            <button className="md:hidden p-2 text-white/70" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-white/[0.06] px-4 py-4 space-y-3 text-sm"
               style={{ background: 'rgba(3,7,18,0.95)' }}>
            <a href="#countries" className="block text-white/80 py-1" onClick={() => setMobileOpen(false)}>Davlatlar</a>
            <a href="#services" className="block text-white/80 py-1" onClick={() => setMobileOpen(false)}>Universitetlar</a>
            <a href="#why" className="block text-white/80 py-1" onClick={() => setMobileOpen(false)}>Nima uchun biz?</a>
            <a href="#contact" className="block text-white/80 py-1" onClick={() => setMobileOpen(false)}>Bog'lanish</a>
            <Button
              size="sm" className="w-full gap-2 rounded-xl font-bold"
              style={{ background: brandColor, color: '#fff' }}
              onClick={() => navigate('/auth')}
            >
              <LogIn className="w-4 h-4" /> Kirish
            </Button>
          </div>
        )}
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section ref={heroReveal.ref} className="relative max-w-6xl mx-auto px-4 pt-24 pb-20 text-center z-10">
        <div className={`space-y-6 ${heroReveal.isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.08] text-xs font-bold text-white/70 mx-auto"
            style={{ background: `${brandColor}0a` }}
          >
            {logoUrl
              ? <img src={logoUrl} alt={tenantName} className="w-4 h-4 rounded object-contain" />
              : <Icon className="w-4 h-4" style={{ color: brandColor }} />}
            <span style={{ color: brandColor }}>{tenantName}</span>
            <span className="text-white/40">· unipath.me</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1]">
            {META.heroTitle.split('—')[0]}
            <span style={{ color: brandColor }}> — </span>
            <br className="hidden sm:block" />
            {META.heroTitle.split('—')[1]}
          </h1>
          <p className="text-base md:text-lg text-white/50 max-w-xl mx-auto leading-relaxed">{META.heroSub}</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              size="lg"
              className="font-bold text-base px-8 py-6 rounded-2xl gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: brandColor, boxShadow: `0 4px 30px ${brandColor}44` }}
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {META.ctaLabel} <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="font-bold text-base px-8 py-6 rounded-2xl border-white/15 text-white/90 hover:bg-white/[0.06] hover:text-white transition-all"
              onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <GraduationCap className="w-5 h-5 mr-2" /> Universitetlar
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 pt-8 text-xs text-white/40">
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-emerald-400" /> Xavfsiz to'lov</span>
            <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400" /> 5★ Mijozlar bahosi</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-sky-400" /> 24/7 Qo'llab-quvvatlash</span>
          </div>
        </div>
      </section>

      {/* ── COUNTRIES ─────────────────────────────────────────────────────── */}
      <section id="countries" ref={countriesReveal.ref} className="max-w-6xl mx-auto px-4 pb-16 z-10 relative">
        <div className={`text-center mb-10 transition-all duration-700 ${countriesReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-2xl md:text-3xl font-black mb-2">🌍 Davlatlar</h2>
          <p className="text-white/40 text-sm">
            {countries.length === 0 && !loadingItems
              ? "Tez orada qo'shiladi..."
              : `Biz ishlaydigan ${countries.length} ta davlat`}
          </p>
        </div>

        {loadingItems ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-2xl h-32 animate-pulse" style={{ background: `${brandColor}08` }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* "Hammasi" filter button */}
            {countries.length > 0 && (
              <button
                onClick={() => setSelectedCountry(null)}
                className={`rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all duration-300 border cursor-pointer group
                  ${!selectedCountry
                    ? 'border-white/20 bg-white/[0.06] scale-[1.02]'
                    : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10'
                  }`}
                style={!selectedCountry ? { boxShadow: `0 0 25px ${brandColor}15` } : {}}
              >
                <span className="text-3xl mb-2">🌐</span>
                <h3 className="font-bold text-white text-sm">Hammasi</h3>
              </button>
            )}
            {countries.map((c, idx) => (
              <button
                key={c.id || idx}
                onClick={() => setSelectedCountry(selectedCountry === (c.name_uz || c.name) ? null : (c.name_uz || c.name))}
                className={`rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all duration-300 border cursor-pointer group
                  ${selectedCountry === (c.name_uz || c.name)
                    ? 'border-white/20 bg-white/[0.06] scale-[1.02]'
                    : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 hover:scale-[1.01]'
                  }`}
                style={selectedCountry === (c.name_uz || c.name) ? {
                  boxShadow: `0 0 25px ${brandColor}15`,
                  borderColor: `${brandColor}33`
                } : {}}
              >
                <span className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">{c.flag || '??'}</span>
                <h3 className="font-bold text-white text-sm">{c.name_uz || c.name}</h3>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── UNIVERSITIES ──────────────────────────────────────────────────── */}
      <section id="services" ref={uniReveal.ref} className="max-w-6xl mx-auto px-4 pb-20 z-10 relative">
        <div className={`text-center mb-8 transition-all duration-700 ${uniReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-2xl md:text-3xl font-black mb-2">🎓 Universitetlar</h2>
          <p className="text-white/40 text-sm">
            {displayItems.length === 0 && !loadingItems
              ? (selectedCountry ? `"${selectedCountry}" bo'yicha natija topilmadi` : "Tez orada qo'shiladi...")
              : `${displayItems.length} ta taklif mavjud`}
          </p>
        </div>

        {/* Search bar */}
        {items.length > 3 && (
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Universitetni qidirish..."
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all"
              />
            </div>
          </div>
        )}

        {loadingItems ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl h-52 animate-pulse" style={{ background: `${brandColor}08` }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayItems.map((item, idx) => (
              <div
                key={item.id || idx}
                className="group relative rounded-2xl p-5 flex flex-col h-full border border-white/[0.06] transition-all duration-500 hover:border-white/15 cursor-default"
                style={{
                  background: `linear-gradient(180deg, ${brandColor}06 0%, transparent 100%)`,
                  transitionDelay: `${idx * 50}ms`,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 40px ${brandColor}15`;
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                {/* Top accent line */}
                <div className="absolute top-0 left-6 right-6 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `linear-gradient(90deg, transparent, ${brandColor}66, transparent)` }} />

                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${brandColor}15` }}>
                  <Globe className="w-5 h-5" style={{ color: brandColor }} />
                </div>
                <h3 className="font-bold text-white text-[15px] mb-1.5 flex-1">{item.name}</h3>
                <p className="text-xs text-white/40 flex items-center gap-1.5 mb-5">
                  <MapPin className="w-3.5 h-3.5" />{item.country || '—'}
                </p>
                <Button
                  onClick={() => setAutoApplyTarget(item)}
                  className="w-full mt-auto rounded-xl font-bold text-sm py-5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ backgroundColor: brandColor, color: '#fff', boxShadow: `0 2px 15px ${brandColor}33` }}
                >
                  Hujjat topshirish
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Active filter indicator */}
        {selectedCountry && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setSelectedCountry(null)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] transition-all"
            >
              <X className="w-3 h-3" /> "{selectedCountry}" filtrini tozalash
            </button>
          </div>
        )}
      </section>

      {/* ── WHY CHOOSE US ─────────────────────────────────────────────────── */}
      <section id="why" ref={whyReveal.ref} className="max-w-6xl mx-auto px-4 pb-20 z-10 relative">
        <div
          className={`rounded-3xl p-8 md:p-12 border border-white/[0.06] transition-all duration-700 ${whyReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{ background: `linear-gradient(135deg, ${brandColor}08 0%, transparent 50%, ${brandColor}04 100%)` }}
        >
          <h2 className="text-2xl md:text-3xl font-black text-center mb-10">
            Nima uchun <span style={{ color: brandColor }}>{tenantName}</span>?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_POINTS.map((point, i) => {
              const Ic = point.icon;
              return (
                <div key={i} className="flex flex-col items-center text-center gap-3 group">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{ background: `${brandColor}15`, boxShadow: `0 0 20px ${brandColor}11` }}
                  >
                    <Ic className="w-6 h-6" style={{ color: brandColor }} />
                  </div>
                  <p className="text-sm font-semibold text-white/80">{point.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CONTACT FORM ──────────────────────────────────────────────────── */}
      <section id="contact" ref={contactReveal.ref} className="max-w-6xl mx-auto px-4 pb-24 z-10 relative">
        <div className={`max-w-lg mx-auto text-center mb-8 transition-all duration-700 ${contactReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-2xl md:text-3xl font-black mb-2">Biz bilan bog'laning</h2>
          <p className="text-white/40 text-sm">
            Shaklni to'ldiring — 15 daqiqa ichida operatorimiz siz bilan bog'lanadi.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          {submitted ? (
            <div className="text-center py-12 space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{ background: `${brandColor}22` }}>
                <CheckCircle2 className="w-8 h-8" style={{ color: brandColor }} />
              </div>
              <h3 className="text-xl font-bold">Murojaatingiz qabul qilindi!</h3>
              <p className="text-white/50 text-sm">Tez orada siz bilan bog'lanamiz.</p>
              <Button
                variant="outline"
                className="border-white/15 text-white hover:bg-white/[0.06] rounded-xl"
                onClick={() => setSubmitted(false)}
              >
                Yana murojaat qilish
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white/50 mb-1.5 block">Ism Familiya *</label>
                <Input
                  required value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Jasur Karimov"
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl h-12 focus:border-white/20"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-white/50 mb-1.5 block">Telefon raqam *</label>
                <Input
                  required value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+998 90 123-45-67"
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl h-12 focus:border-white/20"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-white/50 mb-1.5 block">Qo'shimcha izoh (ixtiyoriy)</label>
                <Input
                  value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                  placeholder="Masalan: Germaniyada bakalavr, 2027-yil uchun..."
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl h-12 focus:border-white/20"
                />
              </div>

              {submitError && (
                <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  Murojaatni yuborib bo'lmadi. Internet aloqasini tekshirib, qaytadan urinib ko'ring.
                </p>
              )}

              <Button
                type="submit" disabled={submitting}
                className="w-full h-14 text-base font-bold rounded-2xl gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: brandColor, boxShadow: `0 4px 30px ${brandColor}33` }}
              >
                {submitting ? 'Yuborilmoqda...' : (
                  <><MessageCircle className="w-5 h-5" /> {META.ctaLabel} — Bepul maslahat</>
                )}
              </Button>

              <p className="text-center text-[11px] text-white/25">
                Ma'lumotlaringiz xavfsiz va uchinchi shaxslarga berilmaydi.
              </p>
            </form>
          )}

          {/* Contact info */}
          <div className="mt-8 grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06]"
              style={{ background: `${brandColor}04` }}>
              <Phone className="w-5 h-5 flex-shrink-0" style={{ color: brandColor }} />
              <div>
                <p className="text-[10px] text-white/35 font-bold uppercase">Telefon</p>
                <p className="text-sm text-white font-semibold">{tenantPhone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06]"
              style={{ background: `${brandColor}04` }}>
              <Mail className="w-5 h-5 flex-shrink-0" style={{ color: brandColor }} />
              <div>
                <p className="text-[10px] text-white/35 font-bold uppercase">Email</p>
                <p className="text-sm text-white font-semibold">{tenantEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06]"
              style={{ background: `${brandColor}04` }}>
              <MessageCircle className="w-5 h-5 flex-shrink-0" style={{ color: brandColor }} />
              <div>
                <p className="text-[10px] text-white/35 font-bold uppercase">Telegram</p>
                <p className="text-sm text-white font-semibold">
                  @{activeTenant?.config?.branding?.telegram_bot_username || (activeTenant?.subdomain || 'unipath')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.04] py-8 text-center z-10 relative">
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-white/40">
            {logoUrl
              ? <img src={logoUrl} alt={tenantName} className="w-5 h-5 rounded object-contain" />
              : <Icon className="w-4 h-4" style={{ color: brandColor }} />}
            {tenantName}
          </div>
          <p className="text-[11px] text-white/20">
            Powered by{' '}
            <a href="https://unipath.me" target="_blank" rel="noreferrer"
              className="hover:text-white/40 transition">
              UniPath SaaS Platform
            </a>
          </p>
        </div>
      </footer>

      {/* ── BACK TO TOP ───────────────────────────────────────────────────── */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center border border-white/10 backdrop-blur-xl transition-all hover:scale-110 active:scale-95 animate-fade-in"
          style={{ background: `${brandColor}22`, boxShadow: `0 4px 20px ${brandColor}33` }}
        >
          <ChevronUp className="w-5 h-5 text-white" />
        </button>
      )}

      {/* ── AUTO APPLY MODAL ──────────────────────────────────────────────── */}
      <AutoApplyModal
        isOpen={!!autoApplyTarget}
        onClose={() => setAutoApplyTarget(null)}
        targetUniversity={autoApplyTarget}
        tenantId={activeTenant?.id}
        brandColor={brandColor}
      />
    </div>
  );
}
