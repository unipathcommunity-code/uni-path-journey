import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Minus, ShoppingCart, Check, UtensilsCrossed, Loader2 } from 'lucide-react';

const db = supabase as any;
const fmt = (n: number) => `${Math.round(n || 0).toLocaleString('ru-RU')} so'm`;

interface Cat { id: string; name: string; sort_order: number }
interface Item { id: string; category_id: string | null; name: string; description: string | null; price: number; image_url: string | null }
interface Line { id: string; name: string; price: number; qty: number }

/**
 * Self-contained ordering widget used both on the tenant public page (source=online,
 * takeaway/delivery) and on the QR menu page (source=qr, dine_in at a table).
 * Renders as a light card so it looks clean on any background.
 */
export default function PublicMenuOrder({
  tenantId, tenantName, brandColor = '#6d28d9', branding, table,
}: {
  tenantId: string;
  tenantName?: string;
  brandColor?: string;
  branding?: any;
  table?: { id: string; table_number: string } | null;
}) {
  const [loading, setLoading] = useState(true);
  const [cats, setCats] = useState<Cat[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [activeCat, setActiveCat] = useState('');
  const [cart, setCart] = useState<Line[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [orderType, setOrderType] = useState<'takeaway' | 'delivery'>('takeaway');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      if (!tenantId) { setLoading(false); return; }
      try {
        const [c, i] = await Promise.all([
          db.from('restaurant_menu_categories').select('*').eq('tenant_id', tenantId).eq('is_active', true).order('sort_order'),
          db.from('restaurant_menu_items').select('*').eq('tenant_id', tenantId).eq('is_active', true).eq('is_available', true).order('sort_order'),
        ]);
        const cc = (c.data || []) as Cat[];
        setCats(cc); setItems((i.data || []) as Item[]);
        setActiveCat(cc[0]?.id || '');
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [tenantId]);

  const add = (it: Item) => setCart(p => {
    const ex = p.find(l => l.id === it.id);
    return ex ? p.map(l => l.id === it.id ? { ...l, qty: l.qty + 1 } : l) : [...p, { id: it.id, name: it.name, price: it.price, qty: 1 }];
  });
  const chg = (id: string, d: number) => setCart(p => p.flatMap(l => l.id === id ? (l.qty + d <= 0 ? [] : [{ ...l, qty: l.qty + d }]) : [l]));

  const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0);

  const submit = async () => {
    if (cart.length === 0) return;
    if (!table && (!name.trim() || !phone.trim())) return;
    setSubmitting(true);
    try {
      const { data: order, error } = await db.from('restaurant_orders').insert({
        tenant_id: tenantId,
        table_id: table?.id || null,
        order_type: table ? 'dine_in' : orderType,
        status: 'new',
        source: table ? 'qr' : 'online',
        customer_name: name || null,
        customer_phone: phone || null,
        subtotal, service_fee: 0, discount: 0, total: subtotal,
        note: address ? `Manzil: ${address}` : null,
      }).select().single();
      if (error) throw error;

      await db.from('restaurant_order_items').insert(cart.map(l => ({
        tenant_id: tenantId, order_id: order.id, menu_item_id: l.id,
        name: l.name, qty: l.qty, price: l.price, modifiers: [], status: 'new',
      })));

      // Notify tenant (queue + direct telegram)
      const lines = cart.map(l => `• ${l.name} x${l.qty}`).join('\n');
      const where = table ? `Stol № ${table.table_number}` : orderType === 'delivery' ? `Yetkazib berish${address ? ' — ' + address : ''}` : 'Olib ketish';
      const text = `🍽 <b>Yangi buyurtma!</b>\n${where}\n👤 ${name || '—'} ${phone ? '· ' + phone : ''}\n\n${lines}\n\n💰 <b>Jami:</b> ${fmt(subtotal)}\n🏢 ${tenantName || ''}`;
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
      setDone(true); setCart([]);
    } catch (e) { console.error(e); alert('Buyurtma yuborishda xatolik. Qayta urinib ko\'ring.'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex justify-center py-10 text-gray-400"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  if (done) return (
    <div className="bg-white rounded-2xl p-8 text-center text-gray-800 shadow-lg">
      <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3"><Check className="w-7 h-7" /></div>
      <h3 className="text-lg font-bold">Buyurtmangiz qabul qilindi!</h3>
      <p className="text-sm text-gray-500 mt-1">Tez orada siz bilan bog'lanamiz.</p>
      <button onClick={() => setDone(false)} className="mt-4 text-sm font-semibold" style={{ color: brandColor }}>Yana buyurtma berish</button>
    </div>
  );

  if (cats.length === 0 || items.length === 0) return (
    <div className="bg-white rounded-2xl p-8 text-center text-gray-500 shadow-lg">
      <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-40" />
      Menyu hozircha tayyorlanmoqda.
    </div>
  );

  const shown = items.filter(i => !activeCat || i.category_id === activeCat);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden text-gray-800 grid md:grid-cols-3">
      {/* Menu */}
      <div className="md:col-span-2 p-4 space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {cats.map(c => (
            <button key={c.id} onClick={() => setActiveCat(c.id)}
              className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition"
              style={activeCat === c.id ? { background: brandColor, color: '#fff', borderColor: brandColor } : { borderColor: '#e5e7eb' }}>
              {c.name}
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
          {shown.map(it => (
            <button key={it.id} onClick={() => add(it)}
              className="flex gap-3 items-center text-left p-2.5 border border-gray-100 rounded-xl hover:border-gray-300 hover:shadow-sm transition">
              {it.image_url
                ? <img src={it.image_url} alt={it.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                : <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center shrink-0"><UtensilsCrossed className="w-5 h-5 text-gray-300" /></div>}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">{it.name}</p>
                {it.description && <p className="text-xs text-gray-400 truncate">{it.description}</p>}
                <p className="text-sm font-bold mt-0.5" style={{ color: brandColor }}>{fmt(it.price)}</p>
              </div>
              <Plus className="w-4 h-4 text-gray-400 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Cart */}
      <div className="bg-gray-50 p-4 space-y-3 border-t md:border-t-0 md:border-l border-gray-100">
        <div className="flex items-center gap-2 font-semibold"><ShoppingCart className="w-4 h-4" /> Savatcha {table && <span className="text-xs text-gray-400">· Stol № {table.table_number}</span>}</div>

        <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
          {cart.length === 0 ? <p className="text-xs text-gray-400 text-center py-6 border border-dashed border-gray-200 rounded-lg">Taom tanlang</p>
            : cart.map(l => (
              <div key={l.id} className="flex items-center gap-2 text-sm">
                <span className="flex-1 min-w-0 truncate">{l.name}</span>
                <button onClick={() => chg(l.id, -1)} className="p-1 rounded bg-gray-200"><Minus className="w-3 h-3" /></button>
                <span className="w-5 text-center text-xs font-semibold">{l.qty}</span>
                <button onClick={() => chg(l.id, +1)} className="p-1 rounded bg-gray-200"><Plus className="w-3 h-3" /></button>
              </div>
            ))}
        </div>

        {!table && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-1">
              {(['takeaway', 'delivery'] as const).map(t => (
                <button key={t} onClick={() => setOrderType(t)}
                  className="text-xs py-1.5 rounded-lg border"
                  style={orderType === t ? { background: brandColor, color: '#fff', borderColor: brandColor } : { borderColor: '#e5e7eb' }}>
                  {t === 'takeaway' ? 'Olib ketish' : 'Yetkazib berish'}
                </button>
              ))}
            </div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ismingiz" className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm" />
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefon" className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm" />
            {orderType === 'delivery' && <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Manzil" className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm" />}
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <span className="text-sm text-gray-500">Jami</span>
          <span className="text-lg font-bold" style={{ color: brandColor }}>{fmt(subtotal)}</span>
        </div>
        <button onClick={submit} disabled={cart.length === 0 || submitting || (!table && (!name.trim() || !phone.trim()))}
          className="w-full py-2.5 rounded-xl font-bold text-white disabled:opacity-50 transition" style={{ background: brandColor }}>
          {submitting ? 'Yuborilmoqda...' : 'Buyurtma berish'}
        </button>
      </div>
    </div>
  );
}
