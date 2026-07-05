import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { fmtUZS, PAYMENT_LABEL, PaymentMethod } from './types';

const db = supabase as any;
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

export default function RestaurantReports() {
  const { activeTenant } = useApp();
  const tid = activeTenant?.id;
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString().split('T')[0]; });
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [daily, setDaily] = useState<{ day: string; sum: number }[]>([]);
  const [byMethod, setByMethod] = useState<{ name: string; value: number }[]>([]);
  const [topDishes, setTopDishes] = useState<{ name: string; qty: number; sum: number }[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    (async () => {
      if (!tid) { setLoading(false); return; }
      setLoading(true);
      try {
        const start = new Date(from); start.setHours(0, 0, 0, 0);
        const end = new Date(to); end.setHours(23, 59, 59, 999);
        const { data: orders } = await db.from('restaurant_orders').select('*')
          .eq('tenant_id', tid).eq('status', 'paid')
          .gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
        const ords = (orders || []) as any[];

        // daily buckets
        const map = new Map<string, number>();
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          map.set(d.toISOString().split('T')[0], 0);
        }
        ords.forEach(o => {
          const key = new Date(o.created_at).toISOString().split('T')[0];
          map.set(key, (map.get(key) || 0) + Number(o.total || 0));
        });
        setDaily(Array.from(map.entries()).map(([day, sum]) => ({ day: day.slice(5), sum })));

        const methods = (['cash', 'card', 'click', 'payme'] as PaymentMethod[])
          .map(m => ({ name: PAYMENT_LABEL[m], value: ords.filter(o => o.payment_method === m).reduce((s, o) => s + Number(o.total || 0), 0) }))
          .filter(x => x.value > 0);
        setByMethod(methods);
        setTotalRevenue(ords.reduce((s, o) => s + Number(o.total || 0), 0));
        setOrderCount(ords.length);

        // top dishes from order items
        if (ords.length) {
          const { data: oi } = await db.from('restaurant_order_items').select('name, qty, price')
            .in('order_id', ords.map(o => o.id));
          const dmap = new Map<string, { qty: number; sum: number }>();
          ((oi || []) as any[]).forEach(it => {
            const cur = dmap.get(it.name) || { qty: 0, sum: 0 };
            cur.qty += Number(it.qty || 0); cur.sum += Number(it.price || 0) * Number(it.qty || 0);
            dmap.set(it.name, cur);
          });
          setTopDishes(Array.from(dmap.entries()).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.qty - a.qty).slice(0, 8));
        } else setTopDishes([]);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [tid, from, to]);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3 flex-wrap">
        <div><Label className="text-xs">Dan</Label><Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="rounded-xl w-40" /></div>
        <div><Label className="text-xs">Gacha</Label><Input type="date" value={to} onChange={e => setTo(e.target.value)} className="rounded-xl w-40" /></div>
        <div className="ml-auto flex gap-3">
          <div className="text-right"><p className="text-xs text-muted-foreground">Umumiy tushum</p><p className="text-lg font-bold text-emerald-500">{fmtUZS(totalRevenue)}</p></div>
          <div className="text-right"><p className="text-xs text-muted-foreground">Cheklar</p><p className="text-lg font-bold">{orderCount} ta</p></div>
        </div>
      </div>

      {loading ? <p className="text-muted-foreground py-8 text-center">Yuklanmoqda...</p> : (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Kunlik tushum</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={daily}>
                  <XAxis dataKey="day" fontSize={11} />
                  <YAxis fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => fmtUZS(Number(v))} />
                  <Bar dataKey="sum" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">To'lov usullari</CardTitle></CardHeader>
            <CardContent>
              {byMethod.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">Ma'lumot yo'q</p> : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={byMethod} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e: any) => e.name}>
                      {byMethod.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => fmtUZS(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader><CardTitle className="text-base">Eng ko'p sotilgan taomlar</CardTitle></CardHeader>
            <CardContent>
              {topDishes.length === 0 ? <p className="text-sm text-muted-foreground py-6 text-center">Ma'lumot yo'q</p> : (
                <div className="divide-y divide-border">
                  {topDishes.map((d, i) => (
                    <div key={d.name} className="py-2.5 flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <span className="flex-1 font-medium text-sm">{d.name}</span>
                      <span className="text-sm text-muted-foreground">{d.qty} porsiya</span>
                      <span className="text-sm font-semibold w-32 text-right">{fmtUZS(d.sum)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
