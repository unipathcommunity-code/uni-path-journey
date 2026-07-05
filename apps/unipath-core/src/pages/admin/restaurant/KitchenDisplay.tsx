import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChefHat, Clock, Check, RefreshCw } from 'lucide-react';
import { RestaurantApi } from './useRestaurant';
import { orderStatusClass, ORDER_STATUS_LABEL, ORDER_TYPE_LABEL, fmtUZS } from './types';

export default function KitchenDisplay({ r }: { r: RestaurantApi }) {
  const active = r.orders.filter(o => ['new', 'kitchen', 'served'].includes(o.status));

  const elapsed = (iso: string) => {
    const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    return min < 1 ? 'hozir' : `${min} daq`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><ChefHat className="w-5 h-5 text-primary" /> Oshxona ekrani (KDS)</h2>
          <p className="text-sm text-muted-foreground">Jonli buyurtmalar navbati. Har 20 soniyada yangilanadi.</p>
        </div>
        <Button variant="outline" size="sm" onClick={r.reload} className="gap-2 rounded-xl"><RefreshCw className="w-4 h-4" /> Yangilash</Button>
      </div>

      {active.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">Oshxonada faol buyurtma yo'q. 🎉</CardContent></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {active.map(o => (
            <Card key={o.id} className="overflow-hidden">
              <div className={`px-4 py-2 flex items-center justify-between border-b ${o.status === 'new' ? 'bg-amber-500/5' : o.status === 'kitchen' ? 'bg-blue-500/5' : 'bg-purple-500/5'}`}>
                <div className="font-bold text-sm">
                  {o.table_number ? `Stol № ${o.table_number}` : ORDER_TYPE_LABEL[o.order_type]}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${orderStatusClass(o.status)}`}>{ORDER_STATUS_LABEL[o.status]}</span>
              </div>
              <CardContent className="pt-3 space-y-2">
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground"><Clock className="w-3 h-3" /> {elapsed(o.created_at)} · {o.order_items.length} taom</div>
                <div className="space-y-1">
                  {o.order_items.map(it => (
                    <button key={it.id}
                      onClick={() => r.setItemStatus(it.id, it.status === 'ready' ? 'new' : 'ready')}
                      className={`w-full flex items-center justify-between text-sm px-2 py-1.5 rounded-lg border transition ${it.status === 'ready' ? 'bg-emerald-500/10 border-emerald-500/20 line-through text-muted-foreground' : 'border-border hover:bg-muted'}`}>
                      <span className="text-left">{it.qty}× {it.name}{it.modifiers?.length ? ` (${it.modifiers.map(m => m.name).join(', ')})` : ''}</span>
                      {it.status === 'ready' && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1.5 pt-1">
                  {o.status === 'new' && <Button size="sm" className="flex-1 rounded-lg text-xs" onClick={() => r.setOrderStatus(o.id, 'kitchen', o.table_id)}>Qabul qilish</Button>}
                  {o.status === 'kitchen' && <Button size="sm" className="flex-1 rounded-lg text-xs" onClick={() => r.setOrderStatus(o.id, 'served', o.table_id)}>Berildi</Button>}
                  {o.status === 'served' && <span className="flex-1 text-center text-xs text-muted-foreground py-1.5">Kassada to'lov kutilmoqda ({fmtUZS(o.total)})</span>}
                  <Button size="sm" variant="ghost" className="rounded-lg text-xs text-rose-500" onClick={() => { if (confirm('Buyurtma bekor qilinsinmi?')) r.setOrderStatus(o.id, 'cancelled', o.table_id); }}>Bekor</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
