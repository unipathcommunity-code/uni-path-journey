/**
 * TenantPublicPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Universal public-facing page for EVERY registered business on unipath.me
 *
 * How it works:
 *  • Visitor opens  mytour.unipath.me  or  myschool.unipath.me
 *  • TenantRouter resolves the tenant and sets activeTenant in AppContext
 *  • App.tsx renders this page instead of the main SaaS landing
 *  • The page detects the vertical (tour | academy | consulting | hotel | ...)
 *  • It fetches public data from Supabase and renders a beautiful page
 *  • Visitor can: view services/tours/courses, submit a contact form (→ leads),
 *                 click "Kirish" to go to the login page
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import {
  Plane, GraduationCap, Building2, Bed, Utensils, Dumbbell,
  Phone, Mail, MapPin, Clock, Star, Users, ChevronRight,
  CheckCircle2, ArrowRight, MessageCircle, Globe, Shield,
  Calendar, Stethoscope, Car, Leaf, Baby, BookOpen,
  ShoppingBag, Trophy, LogIn, Menu, X, Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PublicMenuOrder from '@/components/restaurant/PublicMenuOrder';
import PublicHallBooking from '@/components/wedding/PublicHallBooking';
import PublicHotelBooking from '@/components/hotel/PublicHotelBooking';
import PublicGymBooking from '@/components/gym/PublicGymBooking';

// ─── Vertical config ──────────────────────────────────────────────────────────
const VERTICAL_META: Record<string, {
  icon: any;
  color: string;
  gradient: string;
  heroTitle: string;
  heroSub: string;
  ctaLabel: string;
  sections: string[];
}> = {
  tour: {
    icon: Plane,
    color: '#0ea5e9',
    gradient: 'from-sky-950 via-slate-900 to-slate-950',
    heroTitle: 'Unutilmas sayohatlar boshlanadi',
    heroSub: 'Professional xizmat, qulay narxlar, ishonchli hamkor.',
    ctaLabel: 'Bron qilish',
    sections: ['tours', 'why', 'contact'],
  },
  academy: {
    icon: GraduationCap,
    color: '#10b981',
    gradient: 'from-emerald-950 via-slate-900 to-slate-950',
    heroTitle: "Bilim — eng yaxshi sarmoya",
    heroSub: "Professional o'qituvchilar, zamonaviy dasturlar, kafolatlangan natija.",
    ctaLabel: "Ro'yxatdan o'tish",
    sections: ['courses', 'why', 'contact'],
  },
  consulting: {
    icon: Building2,
    color: '#8b5cf6',
    gradient: 'from-violet-950 via-slate-900 to-slate-950',
    heroTitle: "Xorijda ta'lim — biz bilan oson",
    heroSub: "10+ yillik tajriba, 500+ muvaffaqiyatli talaba, ishonchli hamkor.",
    ctaLabel: 'Bepul maslahat',
    sections: ['services', 'why', 'contact'],
  },
  hotel: {
    icon: Bed,
    color: '#f59e0b',
    gradient: 'from-amber-950 via-slate-900 to-slate-950',
    heroTitle: "Hashamatli qo'nish, unutilmas dam",
    heroSub: 'Zamonaviy xonalar, yuqori darajadagi xizmat, qulay joylashuv.',
    ctaLabel: 'Xona band qilish',
    sections: ['rooms', 'why', 'contact'],
  },
  restaurant: {
    icon: Utensils,
    color: '#ef4444',
    gradient: 'from-red-950 via-slate-900 to-slate-950',
    heroTitle: 'Milliy va xalqaro taomlar',
    heroSub: 'Yangi mahsulotlar, professional oshpazlar, qulay muhit.',
    ctaLabel: 'Stol bron qilish',
    sections: ['menu', 'why', 'contact'],
  },
  clinic: {
    icon: Stethoscope,
    color: '#06b6d4',
    gradient: 'from-cyan-950 via-slate-900 to-slate-950',
    heroTitle: "Sog'liqingiz — bizning asosiy maqsad",
    heroSub: 'Tajribali shifokorlar, zamonaviy uskunalar, tez xizmat.',
    ctaLabel: 'Navbat olish',
    sections: ['services', 'why', 'contact'],
  },
  gym: {
    icon: Dumbbell,
    color: '#f97316',
    gradient: 'from-orange-950 via-slate-900 to-slate-950',
    heroTitle: "Sog'lom tana, kuchli ruh",
    heroSub: 'Zamonaviy jihozlar, professional trenerlar, 24/7 ochiq.',
    ctaLabel: 'Sinov darsi',
    sections: ['services', 'why', 'contact'],
  },
  auto_service: {
    icon: Car,
    color: '#64748b',
    gradient: 'from-slate-950 via-slate-900 to-gray-950',
    heroTitle: "Mashinangiz — bizning g'amxo'rligimizda",
    heroSub: "Tez, sifatli va ishonchli avto ta'mirlash xizmatlari.",
    ctaLabel: 'Yozilish',
    sections: ['services', 'why', 'contact'],
  },
  kindergarten: {
    icon: Baby,
    color: '#ec4899',
    gradient: 'from-pink-950 via-slate-900 to-slate-950',
    heroTitle: "Farzandingiz uchun eng yaxshisi",
    heroSub: "Mehribon tarbiyachilar, xavfsiz muhit, rivojlantiruvchi dasturlar.",
    ctaLabel: "Ro'yxatdan o'tish",
    sections: ['services', 'why', 'contact'],
  },
  library: {
    icon: BookOpen,
    color: '#854d0e',
    gradient: 'from-yellow-950 via-slate-900 to-slate-950',
    heroTitle: 'Bilimlar xazinasi',
    heroSub: "Ming-minglab kitoblar, qulay o'qish joylari, raqamli resurslar.",
    ctaLabel: "A'zo bo'lish",
    sections: ['services', 'why', 'contact'],
  },
  wholesale: {
    icon: ShoppingBag,
    color: '#0891b2',
    gradient: 'from-cyan-950 via-slate-900 to-slate-950',
    heroTitle: "Ulgurji savdo — eng yaxshi narxlar",
    heroSub: 'Katta hajmlar, tez yetkazib berish, ishonchli sheriklik.',
    ctaLabel: "Narx so'rash",
    sections: ['services', 'why', 'contact'],
  },
  stadium: {
    icon: Trophy,
    color: '#16a34a',
    gradient: 'from-green-950 via-slate-900 to-slate-950',
    heroTitle: "Sport — hayot tarzi",
    heroSub: "Professional maydon, zamonaviy sharoitlar, barcha sport turlari.",
    ctaLabel: "Joy bron qilish",
    sections: ['services', 'why', 'contact'],
  },
  wedding_hall: {
    icon: Building2,
    color: '#ec4899',
    gradient: 'from-pink-950 via-fuchsia-950 to-slate-950',
    heroTitle: "Unutilmas to'y — hashamatli zalda",
    heroSub: "Keng zallar, milliy taomlar, professional xizmat — tantanangiz biz bilan.",
    ctaLabel: 'Zal band qilish',
    sections: ['halls', 'why', 'contact'],
  },
  manufacturing: {
    icon: Building2,
    color: '#f59e0b',
    gradient: 'from-stone-950 via-slate-900 to-slate-950',
    heroTitle: 'Sifatli ishlab chiqarish',
    heroSub: "Zamonaviy uskunalar, sifat nazorati, o'z vaqtida yetkazib berish.",
    ctaLabel: "Buyurtma so'rash",
    sections: ['services', 'why', 'contact'],
  },
  parking: {
    icon: Car,
    color: '#3b82f6',
    gradient: 'from-blue-950 via-slate-900 to-slate-950',
    heroTitle: 'Xavfsiz va qulay avtoturargoh',
    heroSub: '24/7 qo\'riqlash, videokuzatuv, qulay joylashuv.',
    ctaLabel: 'Joy band qilish',
    sections: ['services', 'why', 'contact'],
  },
  cosmetics: {
    icon: ShoppingBag,
    color: '#d946ef',
    gradient: 'from-fuchsia-950 via-slate-900 to-slate-950',
    heroTitle: "Go'zallik — bizning san'atimiz",
    heroSub: 'Professional ustalar, sifatli mahsulotlar, zamonaviy uslublar.',
    ctaLabel: 'Yozilish',
    sections: ['services', 'why', 'contact'],
  },
  pharmacy: {
    icon: Stethoscope,
    color: '#22c55e',
    gradient: 'from-green-950 via-emerald-950 to-slate-950',
    heroTitle: "Sog'liq uchun ishonchli hamkor",
    heroSub: 'Sertifikatlangan dorilar, hamyonbop narxlar, tez xizmat.',
    ctaLabel: "Bog'lanish",
    sections: ['services', 'why', 'contact'],
  },
  car_showroom: {
    icon: Car,
    color: '#ef4444',
    gradient: 'from-red-950 via-slate-900 to-slate-950',
    heroTitle: "Orzuingizdagi avtomobil shu yerda",
    heroSub: 'Keng tanlov, rasmiy kafolat, qulay to\'lov shartlari.',
    ctaLabel: 'Test-drayv',
    sections: ['services', 'why', 'contact'],
  },
};

// Fallback for unknown verticals
const DEFAULT_META = {
  icon: Building2,
  color: '#6366f1',
  gradient: 'from-indigo-950 via-slate-900 to-slate-950',
  heroTitle: 'Xizmatlarimiz',
  heroSub: 'Professional va sifatli xizmat.',
  ctaLabel: "Bog'lanish",
  sections: ['services', 'why', 'contact'],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatPrice = (n: number, currency = 'UZS') =>
  `${n.toLocaleString('uz-UZ')} ${currency}`;

// ─── Component ───────────────────────────────────────────────────────────────
export default function TenantPublicPage() {
  const { activeTenant } = useApp();
  const navigate = useNavigate();

  const vertical = (activeTenant?.business_type || 'consulting') as string;
  const meta = VERTICAL_META[vertical] || DEFAULT_META;
  const Icon = meta.icon;

  // Branding
  const brandColor = activeTenant?.config?.branding?.theme_color || meta.color;
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

  // ── Fetch public data based on vertical ─────────────────────────────────
  useEffect(() => {
    if (!activeTenant?.id) { setLoadingItems(false); return; }

    const tid = activeTenant.id;

    const fetchers: Record<string, () => Promise<any[]>> = {
      tour: async () => {
        const { data } = await (supabase as any)
          .from('tour_packages')
          .select('id, name, destination, duration_days, price, max_slots, description')
          .eq('tenant_id', tid)
          .limit(6);
        return data || [];
      },
      academy: async () => {
        const { data } = await (supabase as any)
          .from('academy_groups')
          .select('id, name, subject_id, schedule, created_at')
          .eq('organization_id', tid)
          .limit(6);
        return data || [];
      },
      consulting: async () => {
        // For consulting, show featured universities/programs
        const { data } = await (supabase as any)
          .from('universities')
          .select('id, name, country, programs')
          .limit(6);
        return data || [];
      },
    };

    // Verticals with a dedicated booking/order widget fetch their own data —
    // and unknown verticals must NEVER fall back to consulting content
    // (universities on a gym site was exactly that bug).
    const noop = async () => [] as any[];
    const fetch = fetchers[vertical] || noop;
    fetch()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoadingItems(false));
  }, [activeTenant, vertical]);

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
        const vertical = activeTenant?.business_type || 'biznes';
        const msg = [
          `📩 <b>Yangi murojaat!</b>`,
          ``,
          `👤 <b>Ism:</b> ${form.name}`,
          `📞 <b>Telefon:</b> ${form.phone}`,
          form.note ? `💬 <b>Izoh:</b> ${form.note}` : null,
          ``,
          `🏢 <b>Biznes:</b> ${tenantName}`,
          `🌐 <b>Manba:</b> ${vertical} public sahifa`,
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

  // ── Render item cards based on vertical ─────────────────────────────────
  const renderCard = (item: any, idx: number) => {
    if (vertical === 'tour') {
      return (
        <div key={item.id || idx}
          className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all group">
          <div className="h-36 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${brandColor}22, ${brandColor}44)` }}>
            <Plane className="w-10 h-10 opacity-60" style={{ color: brandColor }} />
          </div>
          <div className="p-4 space-y-2">
            <h3 className="font-bold text-white text-sm leading-tight">{item.name}</h3>
            <p className="text-xs text-white/50 flex items-center gap-1">
              <MapPin className="w-3 h-3" />{item.destination}
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-white/40 flex items-center gap-1">
                <Calendar className="w-3 h-3" />{item.duration_days} kun
              </span>
              <span className="text-sm font-black" style={{ color: brandColor }}>
                {formatPrice(item.price)}
              </span>
            </div>
            <div className="text-[10px] text-white/30 flex items-center gap-1">
              <Users className="w-3 h-3" />{item.max_slots || 20} kishi sig'imli
            </div>
            {/* Share buttons */}
            <div className="flex items-center gap-2 pt-1">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`✈️ ${item.name}\n📍 ${item.destination} · ${item.duration_days} kun\n💰 ${formatPrice(item.price)}\n\n🌐 ${tenantName}: ${window.location.href}`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-all"
                onClick={e => e.stopPropagation()}
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.556 4.121 1.529 5.851L0 24l6.335-1.517A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-4.964-1.345l-.356-.213-3.763.9.966-3.667-.233-.376A9.818 9.818 0 1121.818 12 9.829 9.829 0 0112 21.818z"/></svg>
                WhatsApp
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`✈️ ${item.name} — ${item.destination} · ${formatPrice(item.price)}`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg bg-[#229ED9]/15 text-[#229ED9] hover:bg-[#229ED9]/25 transition-all"
                onClick={e => e.stopPropagation()}
              >
                <Send className="w-3 h-3" />
                Telegram
              </a>
            </div>
          </div>
        </div>
      );
    }

    if (vertical === 'academy') {
      return (
        <div key={item.id || idx}
          className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            style={{ background: `${brandColor}22` }}>
            <GraduationCap className="w-5 h-5" style={{ color: brandColor }} />
          </div>
          <h3 className="font-bold text-white text-sm mb-1">{item.name}</h3>
          <p className="text-xs text-white/50">
            {Array.isArray(item.schedule) && item.schedule[0]
              ? `${item.schedule[0].day} · ${item.schedule[0].time}`
              : 'Jadval belgilanmoqda'}
          </p>
        </div>
      );
    }

    if (vertical === 'consulting') {
      return (
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
    }

    // Generic card for other verticals
    return (
      <div key={item.id || idx}
        className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
          style={{ background: `${brandColor}22` }}>
          <Icon className="w-5 h-5" style={{ color: brandColor }} />
        </div>
        <h3 className="font-bold text-white text-sm">{item.name || item.title || `Xizmat ${idx + 1}`}</h3>
        {item.price && (
          <p className="text-xs mt-1 font-bold" style={{ color: brandColor }}>
            {formatPrice(item.price)}
          </p>
        )}
      </div>
    );
  };

  // ── Why-choose-us points (generic but smart) ─────────────────────────────
  const whyPoints = {
    tour: ['Professional gidlar', 'Barcha transferlar kiradi', "Viza yordam ko'rsatiladi", "Sug'urta majburiy"],
    academy: ["Tajribali o'qituvchilar", 'Kichik guruhlar (max 12)', 'Sertifikat beriladi', '24/7 maslahat'],
    consulting: ['10+ yil tajriba', '500+ muvaffaqiyatli talaba', 'Bepul dastlabki maslahat', 'Hujjatlar bilan yordam'],
    hotel: ['24/7 resepshn', 'Tekin Wi-Fi', 'Breakfast kiradi', 'Transfer xizmati'],
    restaurant: ['Yangi mahsulotlar', 'Tezkor yetkazib berish', 'Vegetarian menyu', 'Stol bron imkoni'],
    clinic: ['Tajribali shifokorlar', 'Zamonaviy uskunalar', 'Natijalar tez', 'Online navbat'],
    gym: ['24/7 ochiq', 'Professional trenerlar', 'Har xil jihozlar', 'Oziq-ovqat maslahati'],
  }[vertical] || ['Professional xizmat', 'Qulay narxlar', 'Tez va ishonchli', 'Mijoz mamnuniyati'];

  // ── Compact mock items when DB is empty ─────────────────────────────────
  const MOCK_ITEMS: Record<string, any[]> = {
    tour: [
      { id: 'm1', name: 'Turkiya, Antaliya (7 kun)', destination: 'Antaliya', duration_days: 7, price: 12500000, max_slots: 20 },
      { id: 'm2', name: 'Samarqand Tarixi (3 kun)', destination: 'Samarqand', duration_days: 3, price: 1800000, max_slots: 25 },
      { id: 'm3', name: 'Dubai Oltin Saroy (5 kun)', destination: 'Dubai, BAA', duration_days: 5, price: 22000000, max_slots: 15 },
    ],
    academy: [
      { id: 'm1', name: 'IELTS Academic', schedule: [{ day: 'Du-Chor-Ju', time: '09:00' }] },
      { id: 'm2', name: 'Python Dasturlash', schedule: [{ day: 'Se-Pay-Sha', time: '15:00' }] },
      { id: 'm3', name: 'Ingliz tili (A1-C1)', schedule: [{ day: 'Har kuni', time: '18:00' }] },
    ],
    consulting: [
      { id: 'm1', name: 'Germaniya universitetlari', country: 'Germaniya' },
      { id: 'm2', name: 'Polsha davlat universitetlari', country: 'Polsha' },
      { id: 'm3', name: 'Rossiya texnik universitetlari', country: 'Rossiya' },
    ],
    clinic: [
      { id: 'm1', name: 'Terapevt qabuli' },
      { id: 'm2', name: 'UZI tekshiruvi' },
      { id: 'm3', name: 'Laboratoriya tahlillari' },
    ],
    auto_service: [
      { id: 'm1', name: 'Moy almashtirish' },
      { id: 'm2', name: 'Diagnostika (kompyuter)' },
      { id: 'm3', name: "Hodovoy ta'miri" },
    ],
    kindergarten: [
      { id: 'm1', name: 'Kichik guruh (3-4 yosh)' },
      { id: 'm2', name: "O'rta guruh (4-5 yosh)" },
      { id: 'm3', name: 'Maktabga tayyorlov (6-7 yosh)' },
    ],
    library: [
      { id: 'm1', name: "Badiiy adabiyot bo'limi" },
      { id: 'm2', name: 'Ilmiy va darsliklar' },
      { id: 'm3', name: "Bolalar adabiyoti" },
    ],
    wholesale: [
      { id: 'm1', name: 'Oziq-ovqat mahsulotlari (ulgurji)' },
      { id: 'm2', name: 'Qurilish mollari (ulgurji)' },
      { id: 'm3', name: 'Maishiy texnika (ulgurji)' },
    ],
    stadium: [
      { id: 'm1', name: 'Futbol maydoni (soatbay)' },
      { id: 'm2', name: 'Mini-futbol zali' },
      { id: 'm3', name: 'Tennis korti' },
    ],
    cosmetics: [
      { id: 'm1', name: 'Soch turmagi & bo\'yash' },
      { id: 'm2', name: 'Yuz parvarishi (uz-care)' },
      { id: 'm3', name: 'Manikyur & pedikyur' },
    ],
    pharmacy: [
      { id: 'm1', name: 'Retseptli dorilar' },
      { id: 'm2', name: 'Vitaminlar va BAD' },
      { id: 'm3', name: 'Tibbiy buyumlar' },
    ],
    manufacturing: [
      { id: 'm1', name: 'Buyurtma asosida ishlab chiqarish' },
      { id: 'm2', name: 'Ulgurji yetkazib berish' },
      { id: 'm3', name: 'Sifat sertifikatlari' },
    ],
    parking: [
      { id: 'm1', name: 'Soatbay to\'xtash joyi' },
      { id: 'm2', name: 'Oylik abonement' },
      { id: 'm3', name: 'VIP yopiq joy' },
    ],
    car_showroom: [
      { id: 'm1', name: 'Yangi avtomobillar' },
      { id: 'm2', name: 'Test-drayv xizmati' },
      { id: 'm3', name: 'Trade-in almashtirish' },
    ],
  };
  const displayItems = items.length > 0 ? items : (MOCK_ITEMS[vertical] || []);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen bg-gradient-to-br ${meta.gradient} text-white font-sans`}>

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
            {vertical === 'tour' && <a href="#tours" className="hover:text-white transition">Turlar</a>}
            {vertical === 'academy' && <a href="#courses" className="hover:text-white transition">Kurslar</a>}
            {vertical !== 'tour' && vertical !== 'academy' && <a href="#services" className="hover:text-white transition">Xizmatlar</a>}
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
            {meta.heroTitle}
          </h1>
          <p className="text-lg text-white/60 max-w-xl mx-auto">{meta.heroSub}</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              size="lg"
              className="font-bold text-base px-8 py-6 rounded-2xl gap-2"
              style={{ background: brandColor }}
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {meta.ctaLabel} <ArrowRight className="w-5 h-5" />
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

      {/* ── ITEMS (Tours / Courses / Services) ──────────────────────────────── */}
      <section id={vertical === 'tour' ? 'tours' : vertical === 'academy' ? 'courses' : 'services'}
        className="max-w-6xl mx-auto px-4 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-black mb-2">
            {vertical === 'tour' ? '✈️ Sayohat Paketlarimiz'
              : vertical === 'academy' ? '📚 Kurs & Dasturlar'
              : vertical === 'consulting' ? "🎓 Yo'nalishlar"
              : vertical === 'hotel' ? '🛏 Xonalar & Onlayn bron'
              : vertical === 'restaurant' ? '🍽 Menyu & Onlayn buyurtma'
              : vertical === 'wedding_hall' ? '💍 Zallar & Onlayn bron'
              : vertical === 'gym' ? '🏋️ Dars jadvali & Onlayn yozilish'
              : '⭐ Xizmatlarimiz'}
          </h2>
          <p className="text-white/50 text-sm">
            {vertical === 'restaurant'
              ? 'Menyudan tanlang va olib ketish yoki yetkazib berishga buyurtma bering'
              : vertical === 'wedding_hall'
                ? 'Sanani tanlang va tantanangiz uchun zalni onlayn bron qiling'
                : vertical === 'hotel'
                  ? 'Sanalarni tanlang va xonani onlayn bron qiling'
                  : vertical === 'gym'
                    ? "Dars jadvalidan mashg'ulot tanlang va onlayn yoziling"
                    : displayItems.length === 0 && !loadingItems
                      ? "Tez orada qo'shiladi..."
                      : `${displayItems.length} ta taklif mavjud`}
          </p>
        </div>

        {vertical === 'restaurant' && activeTenant?.id ? (
          <PublicMenuOrder
            tenantId={activeTenant.id}
            tenantName={tenantName}
            brandColor={brandColor}
            branding={activeTenant?.config?.branding}
          />
        ) : vertical === 'wedding_hall' && activeTenant?.id ? (
          <PublicHallBooking
            tenantId={activeTenant.id}
            tenantName={tenantName}
            brandColor={brandColor}
            branding={activeTenant?.config?.branding}
          />
        ) : vertical === 'hotel' && activeTenant?.id ? (
          <PublicHotelBooking
            tenantId={activeTenant.id}
            tenantName={tenantName}
            brandColor={brandColor}
            branding={activeTenant?.config?.branding}
          />
        ) : vertical === 'gym' && activeTenant?.id ? (
          <PublicGymBooking
            tenantId={activeTenant.id}
            tenantName={tenantName}
            brandColor={brandColor}
            branding={activeTenant?.config?.branding}
          />
        ) : loadingItems ? (
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
            {whyPoints.map((point, i) => (
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
                  placeholder="Masalan: Turkiyaga 2 kishi, avg boshida..."
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
                    {meta.ctaLabel} — Bepul maslahat
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
