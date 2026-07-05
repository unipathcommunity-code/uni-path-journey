import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dumbbell, Clock, Users, Check, Loader2, Ticket } from 'lucide-react';

const db = supabase as any;
const fmt = (n: number) => `${Math.round(n || 0).toLocaleString('ru-RU')} so'm`;

const WD = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const WD_ORDER = [1, 2, 3, 4, 5, 6, 0];
const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const nextDateForWeekday = (wd: number) => { const now = new Date(); const diff = (wd - now.getDay() + 7) % 7; const d = new Date(); d.setDate(now.getDate() + diff); return toISO(d); };

interface Klass { id: string; name: string; trainer_name: string | null; capacity: number; weekday: number; start_time: string; room: string | null }
interface Plan { id: string; name: string; price: number; duration_days: number; class_limit: number | null }

/**
 * Public gym widget: browse the class schedule + membership passes, book a slot
 * online (source='gym'/online). Renders as a light self-contained card.
 */
export default function PublicGymBooking({
  tenantId, tenantName, brandColor = '#e11d48', branding,
}: { tenantId: string; tenantName?: string; brandColor?: string; branding?: any }) {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Klass[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<Klass | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      if (!tenantId) { setLoading(false); return; }
      try {
        const [c, p] = await Promise.all([
          db.from('gym_classes').select('*').eq('tenant_id', tenantId).eq('is_active', true).order('start_time'),
          db.from('gym_plans').select('*').eq('tenant_id', tenantId).eq('is_active', true).order('price'),
        ]);
        setClasses((c.data || []) as Klass[]);
        setPlans((p.data || []) as Plan[]);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [tenantId]);

  const submit = async () => {
    if (!selected || !name.trim() || !phone.trim()) return;
    setSubmitting(true);
    try {
      const date = nextDateForWeekday(selected.weekday);
      const { error } = await db.from('gym_class_bookings').insert({
        tenant_id: tenantId, class_id: selected.id, member_id: null,
        customer_name: name, customer_phone: phone, class_date: date, status: 'booked', source: 'online',
      });
      if (error) throw error;
      const text = `🏋️ <b>Yangi mashg'ulot yozuvi!</b>\n${selected.name} · ${WD[selected.weekday]} ${selected.start_time} (${date})\n👤 ${name} · ${phone}\n🏢 ${tenantName || ''}`;
      await db.from('notification_queue').insert({ tenant_id: tenantId, type: 'telegram', target: 'admin', payload: { message: text.replace(/<[^>]+>/g, '') } }).catch(() => null);
      const botToken = branding?.telegram_bot_token, chatId = branding?.telegram_chat_id;
      if (botToken && chatId) {
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
        }).catch(() => null);
      }
      setDone(true); setSelected(null); setName(''); setPhone('');
    } catch (e) { console.error(e); alert('Yozishda xatolik. Qayta urinib ko\'ring.'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex justify-center py-10 text-gray-400"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  if (done) return (
    <div className="bg-white rounded-2xl p-8 text-center text-gray-800 shadow-lg">
      <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3"><Check className="w-7 h-7" /></div>
      <h3 className="text-lg font-bold">Yozuvingiz qabul qilindi!</h3>
      <p className="text-sm text-gray-500 mt-1">Tez orada siz bilan bog'lanamiz.</p>
      <button onClick={() => setDone(false)} className="mt-4 text-sm font-semibold" style={{ color: brandColor }}>Yana yozilish</button>
    </div>
  );

  if (classes.length === 0) return (
    <div className="bg-white rounded-2xl p-8 text-center text-gray-500 shadow-lg">
      <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-40" /> Jadval hozircha tayyorlanmoqda.
    </div>
  );

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {/* Schedule */}
      <div className="md:col-span-2 bg-white rounded-2xl shadow-lg p-4 text-gray-800">
        <h3 className="font-bold mb-3 flex items-center gap-2"><Clock className="w-4 h-4" style={{ color: brandColor }} /> Dars jadvali</h3>
        <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
          {WD_ORDER.map(wd => {
            const dc = classes.filter(c => c.weekday === wd).sort((a, b) => a.start_time.localeCompare(b.start_time));
            if (!dc.length) return null;
            return (
              <div key={wd}>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">{WD[wd]}</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {dc.map(c => (
                    <button key={c.id} onClick={() => setSelected(c)}
                      className="text-left p-3 rounded-xl border transition"
                      style={selected?.id === c.id ? { borderColor: brandColor, background: `${brandColor}0f` } : { borderColor: '#eee' }}>
                      <p className="font-semibold text-sm">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.start_time}{c.trainer_name ? ` · ${c.trainer_name}` : ''}{c.room ? ` · ${c.room}` : ''}</p>
                      <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-1"><Users className="w-3 h-3" /> {c.capacity} joy</p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking + plans */}
      <div className="bg-gray-50 rounded-2xl shadow-lg p-4 space-y-3 text-gray-800">
        <h3 className="font-bold flex items-center gap-2"><Dumbbell className="w-4 h-4" style={{ color: brandColor }} /> Yozilish</h3>
        {selected ? (
          <div className="text-xs bg-white border border-gray-100 rounded-xl p-2.5">
            <b>{selected.name}</b> · {WD[selected.weekday]} {selected.start_time}
            <span className="block text-gray-400">{nextDateForWeekday(selected.weekday)}</span>
          </div>
        ) : <p className="text-xs text-gray-400">Jadvaldan mashg'ulot tanlang.</p>}
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Ismingiz" className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm" />
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefon" className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm" />
        <button onClick={submit} disabled={!selected || submitting || !name.trim() || !phone.trim()}
          className="w-full py-2.5 rounded-xl font-bold text-white disabled:opacity-50" style={{ background: brandColor }}>
          {submitting ? 'Yuborilmoqda...' : 'Yozilish'}
        </button>

        {plans.length > 0 && (
          <div className="pt-2 border-t border-gray-200">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1"><Ticket className="w-3 h-3" /> Abonementlar</p>
            <div className="space-y-1.5">
              {plans.map(p => (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <span>{p.name} <span className="text-gray-400">· {p.duration_days} kun</span></span>
                  <b style={{ color: brandColor }}>{fmt(p.price)}</b>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
