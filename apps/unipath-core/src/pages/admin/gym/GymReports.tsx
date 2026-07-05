import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, LineChart } from 'recharts';
import { fmtUZS, toISODate } from './types';

const db = supabase as any;

export default function GymReports() {
  const { activeTenant } = useApp();
  const tid = activeTenant?.id;
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 29); return toISODate(d); });
  const [to, setTo] = useState(() => toISODate(new Date()));
  const [loading, setLoading] = useState(true);
  const [daily, setDaily] = useState<{ day: string; revenue: number; checkins: number }[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCheckins, setTotalCheckins] = useState(0);
  const [newSubs, setNewSubs] = useState(0);

  useEffect(() => {
    (async () => {
      if (!tid) { setLoading(false); return; }
      setLoading(true);
      try {
        const startISO = `${from}T00:00:00`;
        const endISO = `${to}T23:59:59`;
        const [subRes, planRes, checkRes] = await Promise.all([
          db.from('gym_subscriptions').select('plan_id,start_date,status').eq('tenant_id', tid).gte('start_date', from).lte('start_date', to),
          db.from('gym_plans').select('id,price').eq('tenant_id', tid),
          db.from('gym_checkins').select('checked_in_at').eq('tenant_id', tid).gte('checked_in_at', startISO).lte('checked_in_at', endISO),
        ]);
        const priceMap = new Map(((planRes.data || []) as any[]).map(p => [p.id, Number(p.price || 0)]));
        const subs = ((subRes.data || []) as any[]).filter(s => s.status !== 'cancelled');
        const checks = (checkRes.data || []) as any[];

        // buckets
        const map = new Map<string, { revenue: number; checkins: number }>();
        const start = new Date(from); const end = new Date(to);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) map.set(toISODate(d), { revenue: 0, checkins: 0 });
        subs.forEach(s => { const k = s.start_date; if (map.has(k)) map.get(k)!.revenue += priceMap.get(s.plan_id) || 0; });
        checks.forEach(c => { const k = toISODate(new Date(c.checked_in_at)); if (map.has(k)) map.get(k)!.checkins += 1; });

        setDaily(Array.from(map.entries()).map(([day, v]) => ({ day: day.slice(5), ...v })));
        setTotalRevenue(subs.reduce((s, x) => s + (priceMap.get(x.plan_id) || 0), 0));
        setTotalCheckins(checks.length);
        setNewSubs(subs.length);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [tid, from, to]);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3 flex-wrap">
        <div><Label className="text-xs">Dan</Label><Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="rounded-xl w-40" /></div>
        <div><Label className="text-xs">Gacha</Label><Input type="date" value={to} onChange={e => setTo(e.target.value)} className="rounded-xl w-40" /></div>
        <div className="ml-auto flex gap-4">
          <div className="text-right"><p className="text-xs text-muted-foreground">Abonement daromadi</p><p className="text-lg font-bold text-emerald-500">{fmtUZS(totalRevenue)}</p></div>
          <div className="text-right"><p className="text-xs text-muted-foreground">Kirishlar</p><p className="text-lg font-bold">{totalCheckins}</p></div>
          <div className="text-right"><p className="text-xs text-muted-foreground">Yangi abonement</p><p className="text-lg font-bold">{newSubs}</p></div>
        </div>
      </div>

      {loading ? <p className="text-muted-foreground py-8 text-center">Yuklanmoqda...</p> : (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Kunlik daromad (abonement)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={daily}>
                  <XAxis dataKey="day" fontSize={10} interval="preserveStartEnd" />
                  <YAxis fontSize={10} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => fmtUZS(Number(v))} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Kunlik davomat (check-in)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={daily}>
                  <XAxis dataKey="day" fontSize={10} interval="preserveStartEnd" />
                  <YAxis fontSize={10} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="checkins" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
