import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Gem, Check, Users, Loader2, CalendarDays, AlertTriangle } from 'lucide-react';

const db = supabase as any;
const fmt = (n: number) => `${Math.round(n || 0).toLocaleString('ru-RU')} so'm`;

interface Hall { id: string; name: string; capacity: number; base_price: number; description: string | null; image_url: string | null }
interface Pkg { id: string; name: string; price_per_guest: number; description: string | null }

const EVENT_TYPES = [
  { value: 'wedding', label: "To'y" },
  { value: 'birthday', label: "Tug'ilgan kun" },
  { value: 'corporate', label: 'Korporativ' },
  { value: 'other', label: 'Boshqa' },
] as const;

/**
 * Self-contained hall booking widget used on the tenant public page.
 * Client picks a hall + date + guest count and sends a booking request
 * (source=online, status=pending). Renders as a light card so it looks
 * clean on any background.
 */
export default function PublicHallBooking({
  tenantId, tenantName, brandColor = '#db2777', branding,
}: {
  tenantId: string;
  tenantName?: string;
  brandColor?: string;
  branding?: any;
}) {
  const [loading, setLoading] = useState(true);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [hallId, setHallId] = useState('');
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [date, setDate] = useState('');
  const [eventType, setEventType] = useState<string>('wedding');
  const [packageId, setPackageId] = useState('');
  const [guests, setGuests] = useState('200');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      if (!tenantId) { setLoading(false); return; }
      try {
        const [h, p] = await Promise.all([
          db.from('event_halls').select('*').eq('tenant_id', tenantId).eq('is_active', true).order('created_at'),
          db.from('event_packages').select('*').eq('tenant_id', tenantId).eq('is_active', true).order('created_at'),
        ]);
        const hh = (h.data || []) as Hall[];
        setHalls(hh); setPackages((p.data || []) as Pkg[]);
        setHallId(hh[0]?.id || '');
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [tenantId]);

  // Fetch already-booked dates for the chosen hall (via SECURITY DEFINER RPC —
  // anon cannot read event_bookings directly).
  useEffect(() => {
    (async () => {
      if (!hallId) { setBookedDates([]); return; }
      try {
        const { data } = await db.rpc('get_hall_booked_dates', { p_hall_id: hallId });
        setBookedDates(((data || []) as any[]).map(d => String(d)));
      } catch { setBookedDates([]); }
    })();
  }, [hallId]);

  const hall = halls.find(h => h.id === hallId);
  const pkg = packages.find(p => p.id === packageId);
  const guestNum = parseInt(guests) || 0;
  const estimate = Number(hall?.base_price || 0) + Number(pkg?.price_per_guest || 0) * guestNum;
  const dateBusy = !!date && bookedDates.includes(date);
  const today = new Date().toISOString().split('T')[0];

  const submit = async () => {
    if (!hallId || !date || !name.trim() || !phone.trim() || dateBusy) return;
    setSubmitting(true);
    try {
      const { error } = await db.from('event_bookings').insert({
        tenant_id: tenantId,
        hall_id: hallId,
        package_id: packageId || null,
        client_name: name.trim(),
        phone: phone.trim(),
        event_date: date,
        event_type: eventType,
        guest_count: guestNum,
        total_price: estimate,
        advance_payment: 0,
        paid_amount: 0,
        status: 'pending',
        source: 'online',
      });
      if (error) throw error;

      // Notify tenant (queue + direct telegram)
      const typeLabel = EVENT_TYPES.find(t => t.value === eventType)?.label || eventType;
      const text = `💍 <b>Yangi bron so'rovi!</b>\n🏛 Zal: ${hall?.name || '—'}\n📅 Sana: ${date}\n🎉 Tadbir: ${typeLabel}\n👥 ${guestNum} mehmon\n👤 ${name} · ${phone}\n\n💰 <b>Taxminiy narx:</b> ${fmt(estimate)}\n🏢 ${tenantName || ''}`;
      await db.from('notification_queue').insert({
        tenant_id: tenantId, type: 'telegram', target: 'admin', payload: { message: text.replace(/<[^>]+>/g, '') },
      }).catch(() => null);
      const botToken = branding?.telegram_bot_token, chatId = branding?.telegram_chat_id;
      if (botToken && chatId) {
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
        }).catch(() => null);
      }
      setDone(true);
    } catch (e) { console.error(e); alert('So\'rov yuborishda xatolik. Qayta urinib ko\'ring.'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex justify-center py-10 text-gray-400"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  if (done) return (
    <div className="bg-white rounded-2xl p-8 text-center text-gray-800 shadow-lg">
      <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3"><Check className="w-7 h-7" /></div>
      <h3 className="text-lg font-bold">So'rovingiz qabul qilindi!</h3>
      <p className="text-sm text-gray-500 mt-1">Tez orada siz bilan bog'lanib, sanani tasdiqlaymiz.</p>
      <button onClick={() => { setDone(false); setDate(''); }} className="mt-4 text-sm font-semibold" style={{ color: brandColor }}>Yana so'rov yuborish</button>
    </div>
  );

  if (halls.length === 0) return (
    <div className="bg-white rounded-2xl p-8 text-center text-gray-500 shadow-lg">
      <Gem className="w-8 h-8 mx-auto mb-2 opacity-40" />
      Zallar ro'yxati hozircha tayyorlanmoqda.
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden text-gray-800 grid md:grid-cols-3">
      {/* Halls */}
      <div className="md:col-span-2 p-4 space-y-3">
        <div className="flex items-center gap-2 font-semibold"><Gem className="w-4 h-4" style={{ color: brandColor }} /> Zalni tanlang</div>
        <div className="grid sm:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
          {halls.map(h => (
            <button key={h.id} onClick={() => setHallId(h.id)}
              className="text-left border rounded-xl overflow-hidden transition hover:shadow-sm"
              style={hallId === h.id ? { borderColor: brandColor, boxShadow: `0 0 0 1px ${brandColor}` } : { borderColor: '#e5e7eb' }}>
              {h.image_url
                ? <img src={h.image_url} alt={h.name} className="w-full h-24 object-cover" />
                : <div className="w-full h-24 bg-gray-100 flex items-center justify-center"><Gem className="w-6 h-6 text-gray-300" /></div>}
              <div className="p-2.5">
                <p className="font-semibold text-sm truncate">{h.name}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1"><Users className="w-3 h-3" /> {h.capacity} kishilik</p>
                {h.description && <p className="text-xs text-gray-400 truncate">{h.description}</p>}
                <p className="text-sm font-bold mt-0.5" style={{ color: brandColor }}>{fmt(h.base_price)}</p>
              </div>
            </button>
          ))}
        </div>
        {bookedDates.length > 0 && (
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            Band sanalar: {bookedDates.slice(0, 8).join(', ')}{bookedDates.length > 8 ? ` va yana ${bookedDates.length - 8} ta` : ''}
          </p>
        )}
      </div>

      {/* Booking form */}
      <div className="bg-gray-50 p-4 space-y-3 border-t md:border-t-0 md:border-l border-gray-100">
        <div className="flex items-center gap-2 font-semibold"><CalendarDays className="w-4 h-4" /> Bron so'rovi</div>

        <div className="space-y-2">
          <input type="date" min={today} value={date} onChange={e => setDate(e.target.value)}
            className="w-full h-9 px-3 rounded-lg border text-sm"
            style={dateBusy ? { borderColor: '#f43f5e', color: '#f43f5e' } : { borderColor: '#e5e7eb' }} />
          {dateBusy && (
            <p className="text-xs font-semibold text-rose-500 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Bu sana band! Boshqa sana tanlang.
            </p>
          )}

          <div className="grid grid-cols-2 gap-1">
            {EVENT_TYPES.map(t => (
              <button key={t.value} onClick={() => setEventType(t.value)}
                className="text-xs py-1.5 rounded-lg border"
                style={eventType === t.value ? { background: brandColor, color: '#fff', borderColor: brandColor } : { borderColor: '#e5e7eb' }}>
                {t.label}
              </button>
            ))}
          </div>

          {packages.length > 0 && (
            <select value={packageId} onChange={e => setPackageId(e.target.value)}
              className="w-full h-9 px-2 rounded-lg border border-gray-200 text-sm bg-white">
              <option value="">Paketsiz</option>
              {packages.map(p => (
                <option key={p.id} value={p.id}>{p.name} — {fmt(p.price_per_guest)}/kishi</option>
              ))}
            </select>
          )}

          <input type="number" min="1" value={guests} onChange={e => setGuests(e.target.value)}
            placeholder="Mehmonlar soni" className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm" />
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Ismingiz" className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm" />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefon" className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm" />
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <span className="text-sm text-gray-500">Taxminiy narx</span>
          <span className="text-lg font-bold" style={{ color: brandColor }}>{fmt(estimate)}</span>
        </div>
        <button onClick={submit}
          disabled={submitting || !hallId || !date || dateBusy || !name.trim() || !phone.trim()}
          className="w-full py-2.5 rounded-xl font-bold text-white disabled:opacity-50 transition" style={{ background: brandColor }}>
          {submitting ? 'Yuborilmoqda...' : "Bron so'rovini yuborish"}
        </button>
        <p className="text-[10px] text-gray-400 text-center">So'rov yuborilgach, administrator siz bilan bog'lanib sanani tasdiqlaydi.</p>
      </div>
    </div>
  );
}
