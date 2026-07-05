import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { fmtUZS, PAYMENT_LABEL, PaymentMethod, EVENT_TYPE_LABEL, EventType } from './types';

const db = supabase as any;
const COLORS = ['#ec4899', '#3b82f6', '#8b5cf6', '#f59e0b'];

export default function WeddingReports() {
  const { activeTenant } = useApp();
  const tid = activeTenant?.id;
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 5); d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [monthly, setMonthly] = useState<{ month: string; sum: number; count: number }[]>([]);
  const [byType, setByType] = useState<{ name: string; value: number }[]>([]);
  const [byMethod, setByMethod] = useState<{ name: string; value: number }[]>([]);
  const [totalContracts, setTotalContracts] = useState(0);
  const [totalCollected, setTotalCollected] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [guestCount, setGuestCount] = useState(0);

  useEffect(() => {
    (async () => {
      if (!tid) { setLoading(false); return; }
      setLoading(true);
      try {
        const start = new Date(from); start.setHours(0, 0, 0, 0);
        const end = new Date(to); end.setHours(23, 59, 59, 999);

        const [bookRes, payRes] = await Promise.all([
          db.from('event_bookings').select('*')
            .eq('tenant_id', tid).neq('status', 'cancelled')
            .gte('event_date', from).lte('event_date', to),
          db.from('event_payments').select('*')
            .eq('tenant_id', tid)
            .gte('paid_at', start.toISOString()).lte('paid_at', end.toISOString()),
        ]);
        const bks = (bookRes.data || []) as any[];
        const pays = (payRes.data || []) as any[];

        // monthly buckets (contract value + booking count, by event_date)
        const map = new Map<string, { sum: number; count: number }>();
        for (let d = new Date(start.getFullYear(), start.getMonth(), 1); d <= end; d.setMonth(d.getMonth() + 1)) {
          map.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, { sum: 0, count: 0 });
        }
        bks.forEach(b => {
          const key = String(b.event_date).slice(0, 7);
          const cur = map.get(key) || { sum: 0, count: 0 };
          cur.sum += Number(b.total_price || 0);
          cur.count += 1;
          map.set(key, cur);
        });
        setMonthly(Array.from(map.entries()).map(([month, v]) => ({ month, ...v })));

        // by event type (contract value)
        const types = (['wedding', 'birthday', 'corporate', 'other'] as EventType[])
          .map(t => ({
            name: EVENT_TYPE_LABEL[t],
            value: bks.filter(b => b.event_type === t).reduce((s, b) => s + Number(b.total_price || 0), 0),
          }))
          .filter(x => x.value > 0);
        setByType(types);

        // collected payments by method
        const methods = (['cash', 'card', 'click', 'payme'] as PaymentMethod[])
          .map(m => ({
            name: PAYMENT_LABEL[m],
            value: pays.filter(p => p.method === m).reduce((s, p) => s + Number(p.amount || 0), 0),
          }))
          .filter(x => x.value > 0);
        setByMethod(methods);

        setTotalContracts(bks.reduce((s, b) => s + Number(b.total_price || 0), 0));
        setTotalCollected(pays.reduce((s, p) => s + Number(p.amount || 0), 0));
        setBookingCount(bks.length);
        setGuestCount(bks.reduce((s, b) => s + Number(b.guest_count || 0), 0));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [tid, from, to]);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3 flex-wrap">
        <div><Label className="text-xs">Dan</Label><Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="rounded-xl w-40" /></div>
        <div><Label className="text-xs">Gacha</Label><Input type="date" value={to} onChange={e => setTo(e.target.value)} className="rounded-xl w-40" /></div>
        <div className="ml-auto flex gap-4 flex-wrap">
          <div className="text-right"><p className="text-xs text-muted-foreground">Shartnomalar summasi</p><p className="text-lg font-bold text-pink-500">{fmtUZS(totalContracts)}</p></div>
          <div className="text-right"><p className="text-xs text-muted-foreground">Yig'ilgan to'lovlar</p><p className="text-lg font-bold text-emerald-500">{fmtUZS(totalCollected)}</p></div>
          <div className="text-right"><p className="text-xs text-muted-foreground">Buyurtmalar</p><p className="text-lg font-bold">{bookingCount} ta</p></div>
          <div className="text-right"><p className="text-xs text-muted-foreground">Mehmonlar</p><p className="text-lg font-bold">{guestCount.toLocaleString('ru-RU')}</p></div>
        </div>
      </div>

      {loading ? <p className="text-muted-foreground py-8 text-center">Yuklanmoqda...</p> : (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Oylik tushum va buyurtmalar (tadbir sanasi bo'yicha)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthly}>
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis yAxisId="sum" fontSize={11} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                  <YAxis yAxisId="count" orientation="right" fontSize={11} allowDecimals={false} />
                  <Tooltip formatter={(v: any, n: any) => n === 'Buyurtmalar' ? `${v} ta` : fmtUZS(Number(v))} />
                  <Legend />
                  <Bar yAxisId="sum" dataKey="sum" name="Tushum" fill="#ec4899" radius={[6, 6, 0, 0]} />
                  <Bar yAxisId="count" dataKey="count" name="Buyurtmalar" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Tadbir turlari bo'yicha</CardTitle></CardHeader>
            <CardContent>
              {byType.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">Ma'lumot yo'q</p> : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={byType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e: any) => e.name}>
                      {byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => fmtUZS(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader><CardTitle className="text-base">Yig'ilgan to'lovlar — usullar bo'yicha</CardTitle></CardHeader>
            <CardContent>
              {byMethod.length === 0 ? <p className="text-sm text-muted-foreground py-6 text-center">Ma'lumot yo'q</p> : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {byMethod.map((m, i) => (
                    <div key={m.name} className="p-3 border rounded-xl">
                      <p className="text-xs text-muted-foreground">{m.name}</p>
                      <p className="text-lg font-bold" style={{ color: COLORS[i % COLORS.length] }}>{fmtUZS(m.value)}</p>
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
