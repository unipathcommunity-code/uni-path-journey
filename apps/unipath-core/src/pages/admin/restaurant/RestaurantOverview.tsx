import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';
import { IconBadge, IconTone } from '@/components/ui/icon-badge';
import { Wallet, Receipt, Utensils, ChefHat, TrendingUp } from 'lucide-react';
import { RestaurantApi } from './useRestaurant';
import { fmtUZS, ORDER_TYPE_LABEL } from './types';

export default function RestaurantOverview({ r, goTo }: { r: RestaurantApi; goTo: (tab: string) => void }) {
  const paidToday = r.orders.filter(o => o.status === 'paid');
  const open = r.orders.filter(o => ['new', 'kitchen', 'served'].includes(o.status));
  const revenue = paidToday.reduce((s, o) => s + o.total, 0);
  const occupied = r.tables.filter(t => t.status === 'occupied').length;
  const avgCheck = paidToday.length ? revenue / paidToday.length : 0;

  // Top dishes today
  const dmap = new Map<string, number>();
  r.orders.forEach(o => o.order_items.forEach(it => dmap.set(it.name, (dmap.get(it.name) || 0) + it.qty)));
  const top = Array.from(dmap.entries()).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty).slice(0, 5);

  const stats: { label: string; value: string; icon: ReactNode; tone: IconTone; accent: string }[] = [
    { label: 'Bugungi tushum', value: fmtUZS(revenue), icon: <Wallet />, tone: 'emerald', accent: 'text-emerald-500' },
    { label: 'Ochiq cheklar', value: `${open.length} ta`, icon: <Receipt />, tone: 'amber', accent: 'text-amber-500' },
    { label: 'Band stollar', value: `${occupied}/${r.tables.length}`, icon: <Utensils />, tone: 'rose', accent: 'text-rose-500' },
    { label: "O'rtacha chek", value: fmtUZS(avgCheck), icon: <TrendingUp />, tone: 'primary', accent: 'text-primary' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <Card key={s.label} className="overflow-hidden"><CardContent className="p-5">
            <IconBadge icon={s.icon} tone={s.tone} size="md" className="mb-3" />
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-xl font-bold mt-0.5 ${s.accent}`}>{s.value}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Hozir oshxonada</CardTitle>
            <Button size="sm" variant="outline" className="rounded-lg" onClick={() => goTo('kds')}>KDS ni ochish</Button>
          </CardHeader>
          <CardContent>
            {open.length === 0 ? <p className="text-center text-muted-foreground py-8">Faol buyurtma yo'q.</p> : (
              <div className="divide-y divide-border">
                {open.slice(0, 6).map(o => (
                  <div key={o.id} className="py-2.5 flex items-center justify-between">
                    <div><p className="font-medium text-sm">{o.table_number ? `Stol № ${o.table_number}` : ORDER_TYPE_LABEL[o.order_type]}</p>
                      <p className="text-xs text-muted-foreground">{o.order_items.length} taom</p></div>
                    <span className="font-semibold text-primary">{fmtUZS(o.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2"><ChefHat className="w-4 h-4 text-primary" /><CardTitle className="text-base">Bugun mashhur</CardTitle></CardHeader>
          <CardContent>
            {top.length === 0 ? <p className="text-sm text-muted-foreground py-6 text-center">Ma'lumot yo'q</p> : (
              <div className="space-y-2">
                {top.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                    <span className="flex-1 truncate">{d.name}</span>
                    <span className="text-muted-foreground">{d.qty}×</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => goTo('pos')} className="rounded-xl gap-2"><Receipt className="w-4 h-4" /> Yangi buyurtma</Button>
        <Button variant="outline" onClick={() => goTo('menu')} className="rounded-xl">Menyu boshqaruvi</Button>
        <Button variant="outline" onClick={() => goTo('cashier')} className="rounded-xl">Kassa</Button>
        <Button variant="outline" onClick={() => goTo('tables')} className="rounded-xl">Stollar & QR</Button>
      </div>
    </div>
  );
}
