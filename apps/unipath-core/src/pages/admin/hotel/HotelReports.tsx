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

export default function HotelReports() {
  const { activeTenant } = useApp();
  const tid = activeTenant?.id;
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 13); return d.toISOString().split('T')[0]; });
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [daily, setDaily] = useState<{ day: string; sum: number }[]>([]);
  const [byMethod, setByMethod] = useState<{ name: string; value: number }[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [soldNights, setSoldNights] = useState(0);
  const [occupancy, setOccupancy] = useState(0);

  useEffect(() => {
    (async () => {
      if (!tid) { setLoading(false); return; }
      setLoading(true);
      try {
        // Bookings whose stay overlaps the selected range (not cancelled)
        const [bookingRes, roomRes] = await Promise.all([
          db.from('hotel_bookings').select('*').eq('tenant_id', tid)
            .neq('status', 'cancelled')
            .lte('check_in', to).gte('check_out', from),
          db.from('hotel_rooms').select('id').eq('tenant_id', tid),
        ]);
        const bookings = (bookingRes.data || []) as any[];
        const roomCount = (roomRes.data || []).length;

        // daily revenue buckets: booking total spread over its nights within the range
        const map = new Map<string, number>();
        const start = new Date(from); const end = new Date(to);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          map.set(d.toISOString().split('T')[0], 0);
        }

        let nightsSold = 0;
        let revenue = 0;
        bookings.forEach(b => {
          const perNight = Number(b.price_per_night || 0) ||
            (Number(b.total_amount || 0) / Math.max(1, Number(b.nights || 1)));
          const ci = new Date(b.check_in); const co = new Date(b.check_out);
          for (let d = new Date(ci); d < co; d.setDate(d.getDate() + 1)) {
            const key = d.toISOString().split('T')[0];
            if (key >= from && key <= to) {
              map.set(key, (map.get(key) || 0) + perNight);
              nightsSold += 1;
              revenue += perNight;
            }
          }
        });

        setDaily(Array.from(map.entries()).map(([day, sum]) => ({ day: day.slice(5), sum: Math.round(sum) })));
        setSoldNights(nightsSold);
        setTotalRevenue(Math.round(revenue));
        setBookingCount(bookings.length);

        const daysInRange = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
        setOccupancy(roomCount > 0 ? (nightsSold / (roomCount * daysInRange)) * 100 : 0);

        const methods = (['cash', 'card', 'click', 'payme'] as PaymentMethod[])
          .map(m => ({ name: PAYMENT_LABEL[m], value: bookings.filter(b => b.payment_method === m).reduce((s, b) => s + Number(b.total_amount || 0), 0) }))
          .filter(x => x.value > 0);
        setByMethod(methods);
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
          <div className="text-right"><p className="text-xs text-muted-foreground">Umumiy tushum</p><p className="text-lg font-bold text-emerald-500">{fmtUZS(totalRevenue)}</p></div>
          <div className="text-right"><p className="text-xs text-muted-foreground">Bronlar</p><p className="text-lg font-bold">{bookingCount} ta</p></div>
          <div className="text-right"><p className="text-xs text-muted-foreground">Sotilgan kechalar</p><p className="text-lg font-bold">{soldNights}</p></div>
          <div className="text-right"><p className="text-xs text-muted-foreground">Bandlik</p><p className="text-lg font-bold text-primary">{occupancy.toFixed(1)}%</p></div>
        </div>
      </div>

      {loading ? <p className="text-muted-foreground py-8 text-center">Yuklanmoqda...</p> : (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Kunlik tushum (kechalar bo'yicha)</CardTitle></CardHeader>
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
        </div>
      )}
    </div>
  );
}
