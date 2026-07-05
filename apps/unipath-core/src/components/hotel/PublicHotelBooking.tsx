import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BedDouble, Users, Check, Loader2, CalendarDays } from 'lucide-react';

const db = supabase as any;
const fmt = (n: number) => `${Math.round(n || 0).toLocaleString('ru-RU')} so'm`;

interface RoomType {
  id: string;
  name: string;
  base_price: number;
  capacity: number;
  amenities: string[];
  description: string | null;
}

const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (iso: string, days: number) => {
  const [y, m, d] = iso.split('-').map(Number);
  return toISO(new Date(y, m - 1, d + days));
};
const nightsBetween = (ci: string, co: string) => {
  const [y1, m1, d1] = ci.split('-').map(Number);
  const [y2, m2, d2] = co.split('-').map(Number);
  return Math.max(1, Math.round((new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / 86400000));
};

/**
 * Self-contained online booking widget for the tenant public page.
 * Guest picks dates + room type + contact info → hotel_bookings insert
 * (source='online', status='pending'). Renders as a light card so it looks
 * clean on any background.
 */
export default function PublicHotelBooking({
  tenantId, tenantName, brandColor = '#6d28d9', branding,
}: {
  tenantId: string;
  tenantName?: string;
  brandColor?: string;
  branding?: any;
}) {
  const [loading, setLoading] = useState(true);
  const [types, setTypes] = useState<RoomType[]>([]);
  const [selected, setSelected] = useState<RoomType | null>(null);
  const [checkIn, setCheckIn] = useState(() => toISO(new Date()));
  const [checkOut, setCheckOut] = useState(() => addDays(toISO(new Date()), 1));
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      if (!tenantId) { setLoading(false); return; }
      try {
        const { data } = await db.from('hotel_room_types').select('*')
          .eq('tenant_id', tenantId).eq('is_active', true).order('base_price');
        const list = ((data || []) as any[]).map(t => ({
          ...t,
          amenities: typeof t.amenities === 'string' ? safeParse(t.amenities) : (t.amenities || []),
        })) as RoomType[];
        setTypes(list);
        setSelected(list[0] || null);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [tenantId]);

  const nights = checkOut > checkIn ? nightsBetween(checkIn, checkOut) : 0;
  const pricePerNight = Number(selected?.base_price || 0);
  const total = nights * pricePerNight;
  const valid = !!selected && nights > 0 && name.trim() && phone.trim();

  const submit = async () => {
    if (!valid || !selected) return;
    setSubmitting(true);
    try {
      // Anon has INSERT-only access (no select) → insert without .select()
      const { error } = await db.from('hotel_bookings').insert({
        tenant_id: tenantId,
        room_id: null,
        room_type_id: selected.id,
        guest_name: name.trim(),
        guest_phone: phone.trim(),
        check_in: checkIn,
        check_out: checkOut,
        status: 'pending',
        source: 'online',
        nights,
        price_per_night: pricePerNight,
        total_amount: total,
        paid_amount: 0,
        note: `Xona turi: ${selected.name}`,
      });
      if (error) throw error;

      // Notify tenant (queue + direct telegram)
      const text = `🏨 <b>Yangi onlayn bron!</b>\n🛏 ${selected.name}\n📅 ${checkIn} → ${checkOut} (${nights} kecha)\n👤 ${name} · ${phone}\n\n💰 <b>Jami:</b> ${fmt(total)}\n🏢 ${tenantName || ''}`;
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
    } catch (e) { console.error(e); alert('Bron yuborishda xatolik. Qayta urinib ko\'ring.'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex justify-center py-10 text-gray-400"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  if (done) return (
    <div className="bg-white rounded-2xl p-8 text-center text-gray-800 shadow-lg">
      <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3"><Check className="w-7 h-7" /></div>
      <h3 className="text-lg font-bold">Bron so'rovingiz qabul qilindi!</h3>
      <p className="text-sm text-gray-500 mt-1">Tez orada siz bilan bog'lanib, bronni tasdiqlaymiz.</p>
      <button onClick={() => { setDone(false); setName(''); setPhone(''); }} className="mt-4 text-sm font-semibold" style={{ color: brandColor }}>Yana bron qilish</button>
    </div>
  );

  if (types.length === 0) return (
    <div className="bg-white rounded-2xl p-8 text-center text-gray-500 shadow-lg">
      <BedDouble className="w-8 h-8 mx-auto mb-2 opacity-40" />
      Xonalar haqida ma'lumot hozircha tayyorlanmoqda.
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden text-gray-800 grid md:grid-cols-3">
      {/* Room types */}
      <div className="md:col-span-2 p-4 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-sm mb-1"><BedDouble className="w-4 h-4" /> Xona turini tanlang</div>
        <div className="grid sm:grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
          {types.map(t => (
            <button key={t.id} onClick={() => setSelected(t)}
              className="text-left p-3 border rounded-xl transition hover:shadow-sm"
              style={selected?.id === t.id ? { borderColor: brandColor, boxShadow: `0 0 0 1px ${brandColor}` } : { borderColor: '#e5e7eb' }}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm truncate">{t.name}</p>
                {selected?.id === t.id && <Check className="w-4 h-4 shrink-0" style={{ color: brandColor }} />}
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Users className="w-3 h-3" /> {t.capacity} kishilik</p>
              {t.description && <p className="text-xs text-gray-400 truncate mt-0.5">{t.description}</p>}
              {t.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {t.amenities.slice(0, 4).map((a, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500">{a}</span>
                  ))}
                </div>
              )}
              <p className="text-sm font-bold mt-1.5" style={{ color: brandColor }}>{fmt(t.base_price)} <span className="text-[10px] font-normal text-gray-400">/ kecha</span></p>
            </button>
          ))}
        </div>
      </div>

      {/* Booking form */}
      <div className="bg-gray-50 p-4 space-y-3 border-t md:border-t-0 md:border-l border-gray-100">
        <div className="flex items-center gap-2 font-semibold"><CalendarDays className="w-4 h-4" /> Bron qilish</div>

        <div className="space-y-2">
          <div>
            <label className="text-[11px] text-gray-500 font-medium">Kirish sanasi</label>
            <input type="date" value={checkIn} min={toISO(new Date())}
              onChange={e => { setCheckIn(e.target.value); if (checkOut <= e.target.value) setCheckOut(addDays(e.target.value, 1)); }}
              className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm bg-white" />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 font-medium">Chiqish sanasi</label>
            <input type="date" value={checkOut} min={addDays(checkIn, 1)}
              onChange={e => setCheckOut(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm bg-white" />
          </div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Ismingiz" className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm" />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefon" className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm" />
        </div>

        <div className="pt-2 border-t border-gray-200 space-y-1 text-sm">
          <div className="flex justify-between text-gray-500 text-xs">
            <span>{selected?.name || '—'}</span>
            <span>{nights} kecha × {fmt(pricePerNight)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Jami</span>
            <span className="text-lg font-bold" style={{ color: brandColor }}>{fmt(total)}</span>
          </div>
        </div>

        <button onClick={submit} disabled={!valid || submitting}
          className="w-full py-2.5 rounded-xl font-bold text-white disabled:opacity-50 transition" style={{ background: brandColor }}>
          {submitting ? 'Yuborilmoqda...' : 'Bron qilish'}
        </button>
        <p className="text-[10px] text-gray-400 text-center">Bron so'rovi yuborilgach, administrator siz bilan bog'lanadi.</p>
      </div>
    </div>
  );
}

function safeParse(v: string) {
  try { return JSON.parse(v) || []; } catch { return []; }
}
