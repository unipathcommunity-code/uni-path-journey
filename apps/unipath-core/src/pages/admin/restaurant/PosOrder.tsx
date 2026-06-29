import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Minus, Trash2, ShoppingCart, Send } from 'lucide-react';
import { RestaurantApi } from './useRestaurant';
import { MenuItem, MenuModifier, OrderType, RestaurantTable, fmtUZS, itemTotal, ORDER_TYPE_LABEL } from './types';

interface CartLine {
  key: string;
  menu_item_id: string | null;
  name: string;
  price: number;
  qty: number;
  modifiers: MenuModifier[];
}

export default function PosOrder({ r, presetTable, onDone }: { r: RestaurantApi; presetTable: RestaurantTable | null; onDone: () => void }) {
  const [orderType, setOrderType] = useState<OrderType>(presetTable ? 'dine_in' : 'takeaway');
  const [tableId, setTableId] = useState<string | null>(presetTable?.id || null);
  const [cust, setCust] = useState('');
  const [phone, setPhone] = useState('');
  const [activeCat, setActiveCat] = useState(r.categories[0]?.id || '');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState('');
  const [serviceFee, setServiceFee] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const available = r.items.filter(i => i.is_available && (!activeCat || i.category_id === activeCat));

  const addToCart = (it: MenuItem, modifiers: MenuModifier[] = []) => {
    const key = it.id + JSON.stringify(modifiers);
    setCart(prev => {
      const ex = prev.find(l => l.key === key);
      if (ex) return prev.map(l => l.key === key ? { ...l, qty: l.qty + 1 } : l);
      return [...prev, { key, menu_item_id: it.id, name: it.name, price: it.price, qty: 1, modifiers }];
    });
  };
  const changeQty = (key: string, d: number) =>
    setCart(prev => prev.flatMap(l => l.key === key ? (l.qty + d <= 0 ? [] : [{ ...l, qty: l.qty + d }]) : [l]));

  const subtotal = cart.reduce((s, l) => s + itemTotal(l), 0);
  const total = Math.max(0, subtotal + (Number(serviceFee) || 0) - (Number(discount) || 0));

  const submit = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    const id = await r.createOrder({
      table_id: orderType === 'dine_in' ? tableId : null,
      order_type: orderType,
      items: cart.map(l => ({ menu_item_id: l.menu_item_id, name: l.name, qty: l.qty, price: l.price, modifiers: l.modifiers })),
      customer_name: cust || undefined,
      customer_phone: phone || undefined,
      discount: Number(discount) || 0,
      service_fee: Number(serviceFee) || 0,
    });
    setSubmitting(false);
    if (id) { setCart([]); setDiscount(''); setServiceFee(''); onDone(); }
  };

  if (r.categories.length === 0 || r.items.length === 0) {
    return <Card><CardContent className="py-12 text-center text-muted-foreground">Avval "Menyu" bo'limida kategoriya va taomlar qo'shing.</CardContent></Card>;
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {/* Menu picker */}
      <div className="lg:col-span-2 space-y-3">
        <div className="flex flex-wrap gap-2">
          {r.categories.map(c => (
            <button key={c.id} onClick={() => setActiveCat(c.id)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition ${activeCat === c.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-muted'}`}>
              {c.name}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {available.map(it => (
            <button key={it.id} onClick={() => addToCart(it, it.modifiers?.length ? [] : [])}
              className="text-left p-3 border border-border rounded-xl hover:border-primary hover:shadow-sm transition bg-card">
              <p className="font-medium text-sm leading-tight">{it.name}</p>
              <p className="text-xs text-primary font-semibold mt-1">{fmtUZS(it.price)}</p>
              {it.modifiers?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {it.modifiers.map((m, i) => (
                    <span key={i} role="button"
                      onClick={(e) => { e.stopPropagation(); addToCart(it, [m]); }}
                      className="text-[10px] bg-muted hover:bg-primary/10 px-1.5 py-0.5 rounded">+{m.name}</span>
                  ))}
                </div>
              )}
            </button>
          ))}
          {available.length === 0 && <p className="text-sm text-muted-foreground col-span-full py-6 text-center">Bu kategoriyada mavjud taom yo'q.</p>}
        </div>
      </div>

      {/* Cart / check */}
      <Card className="lg:sticky lg:top-20 h-fit">
        <CardContent className="pt-5 space-y-3">
          <div className="flex items-center gap-2 font-semibold"><ShoppingCart className="w-4 h-4" /> Chek</div>

          <div className="grid grid-cols-3 gap-1">
            {(['dine_in', 'takeaway', 'delivery'] as OrderType[]).map(t => (
              <button key={t} onClick={() => setOrderType(t)}
                className={`text-xs py-1.5 rounded-lg border ${orderType === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}>
                {ORDER_TYPE_LABEL[t]}
              </button>
            ))}
          </div>

          {orderType === 'dine_in' ? (
            <select value={tableId || ''} onChange={e => setTableId(e.target.value || null)}
              className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm">
              <option value="">Stol tanlang...</option>
              {r.tables.map(t => <option key={t.id} value={t.id}>№ {t.table_number} ({t.capacity} kishi)</option>)}
            </select>
          ) : (
            <div className="space-y-2">
              <Input value={cust} onChange={e => setCust(e.target.value)} placeholder="Mijoz ismi" className="h-9 rounded-lg text-sm" />
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefon" className="h-9 rounded-lg text-sm" />
            </div>
          )}

          <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
            {cart.length === 0 ? <p className="text-xs text-muted-foreground text-center py-6 border border-dashed rounded-lg">Taom tanlang</p>
              : cart.map(l => (
                <div key={l.key} className="flex items-center gap-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{l.name}{l.modifiers.length ? ` (${l.modifiers.map(m => m.name).join(', ')})` : ''}</p>
                    <p className="text-[11px] text-muted-foreground">{fmtUZS(itemTotal(l))}</p>
                  </div>
                  <button onClick={() => changeQty(l.key, -1)} className="p-1 rounded bg-muted"><Minus className="w-3 h-3" /></button>
                  <span className="w-5 text-center text-xs font-semibold">{l.qty}</span>
                  <button onClick={() => changeQty(l.key, +1)} className="p-1 rounded bg-muted"><Plus className="w-3 h-3" /></button>
                  <button onClick={() => setCart(cart.filter(x => x.key !== l.key))} className="p-1 text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-[10px]">Chegirma</Label><Input type="number" value={discount} onChange={e => setDiscount(e.target.value)} className="h-8 rounded-lg text-xs" /></div>
            <div><Label className="text-[10px]">Xizmat haqi</Label><Input type="number" value={serviceFee} onChange={e => setServiceFee(e.target.value)} className="h-8 rounded-lg text-xs" /></div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">Jami</span>
            <span className="text-xl font-bold text-primary">{fmtUZS(total)}</span>
          </div>

          <Button onClick={submit} disabled={cart.length === 0 || submitting || (orderType === 'dine_in' && !tableId)} className="w-full rounded-xl font-bold gap-2">
            <Send className="w-4 h-4" /> Oshxonaga yuborish
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
