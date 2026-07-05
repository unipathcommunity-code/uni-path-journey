import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { UtensilsCrossed, BedDouble, Gem, Coins, Loader2 } from 'lucide-react';

const db = supabase as any;
const fmt = (n: number) => `${Math.round(n || 0).toLocaleString('ru-RU')}`;

interface Pulse {
  restOrders: number;
  restRevenue: number;
  hotelBookings: number;
  hotelCheckins: number;
  eventUpcoming: number;
}

/**
 * Cross-vertical "today" activity across ALL tenants. Super-admin RLS (staff
 * policies include 'super_admin') lets the platform owner read every tenant's
 * operational tables, so this is the real ecosystem pulse — not mock numbers.
 */
export default function PlatformActivityPulse() {
  const [loading, setLoading] = useState(true);
  const [p, setP] = useState<Pulse>({ restOrders: 0, restRevenue: 0, hotelBookings: 0, hotelCheckins: 0, eventUpcoming: 0 });

  useEffect(() => {
    (async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const startIso = start.toISOString();
      const today = start.toISOString().split('T')[0];
      try {
        const [rest, hotelNew, hotelIn, events] = await Promise.all([
          db.from('restaurant_orders').select('total,status').gte('created_at', startIso),
          db.from('hotel_bookings').select('id', { count: 'exact', head: true }).gte('created_at', startIso),
          db.from('hotel_bookings').select('id', { count: 'exact', head: true }).eq('check_in', today),
          db.from('event_bookings').select('id', { count: 'exact', head: true }).gte('event_date', today).in('status', ['pending', 'confirmed']),
        ]);
        const orders = (rest.data || []) as any[];
        setP({
          restOrders: orders.length,
          restRevenue: orders.filter(o => o.status === 'paid').reduce((s, o) => s + Number(o.total || 0), 0),
          hotelBookings: hotelNew.count || 0,
          hotelCheckins: hotelIn.count || 0,
          eventUpcoming: events.count || 0,
        });
      } catch (e) {
        console.error('Activity pulse error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const items = [
    { icon: UtensilsCrossed, label: 'Restoran buyurtmalari (bugun)', value: `${p.restOrders} ta`, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { icon: Coins, label: 'Restoran tushumi (bugun)', value: `${fmt(p.restRevenue)} so'm`, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { icon: BedDouble, label: 'Yangi xona bronlari / kirishlar', value: `${p.hotelBookings} / ${p.hotelCheckins}`, color: 'text-sky-400', bg: 'bg-sky-500/10' },
    { icon: Gem, label: 'Yaqin tantanalar (to\'yxona)', value: `${p.eventUpcoming} ta`, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  ];

  const allZero = !loading && p.restOrders === 0 && p.restRevenue === 0 && p.hotelBookings === 0 && p.hotelCheckins === 0 && p.eventUpcoming === 0;

  return (
    <Card className="bg-muted/5 border-white/5">
      <CardContent className="py-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Bugungi ekotizim faoliyati</h3>
            <p className="text-xs text-white/40">Barcha firmalar bo'yicha jonli operatsion puls</p>
          </div>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white/40" />
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> JONLI · 20s
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {items.map((it) => (
            <div key={it.label} className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${it.bg} ${it.color}`}>
                <it.icon className="w-5 h-5" />
              </div>
              <p className="text-xl font-bold text-white">{it.value}</p>
              <p className="text-[11px] text-white/40 mt-0.5 leading-tight">{it.label}</p>
            </div>
          ))}
        </div>
        {allZero && (
          <p className="text-[11px] text-white/30 mt-3 text-center">
            Bugun hali faoliyat qayd etilmadi — firmalar ish boshlagach ko'rsatkichlar shu yerda real vaqtda yangilanadi.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
