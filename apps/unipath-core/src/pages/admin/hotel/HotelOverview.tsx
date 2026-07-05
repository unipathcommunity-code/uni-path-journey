import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';
import { IconBadge, IconTone } from '@/components/ui/icon-badge';
import { BedDouble, LogIn, LogOut, Percent, Wallet, Brush, CalendarDays } from 'lucide-react';
import { HotelApi } from './useHotel';
import { fmtUZS, todayISO, ROOM_STATUS_LABEL, roomStatusClass } from './types';

export default function HotelOverview({ h, goTo }: { h: HotelApi; goTo: (tab: string) => void }) {
  const today = todayISO();

  const total = h.rooms.length;
  const occupied = h.rooms.filter(r => r.status === 'occupied').length;
  const available = h.rooms.filter(r => r.status === 'available').length;
  const cleaning = h.rooms.filter(r => r.status === 'cleaning').length;
  const occupancy = total > 0 ? (occupied / total) * 100 : 0;

  const arrivals = h.bookings.filter(b => b.check_in === today && ['pending', 'confirmed'].includes(b.status));
  const departures = h.bookings.filter(b => b.check_out === today && b.status === 'checked_in');
  const todayRevenue = h.bookings
    .filter(b => b.status !== 'cancelled' && b.created_at?.slice(0, 10) === today)
    .reduce((s, b) => s + Number(b.total_amount || 0), 0);

  const stats: { label: string; value: string; sub: string; icon: ReactNode; tone: IconTone; accent: string }[] = [
    { label: 'Bandlik darajasi', value: `${occupancy.toFixed(0)}%`, sub: `${occupied}/${total} xona band`, icon: <Percent />, tone: 'primary', accent: 'text-primary' },
    { label: "Bo'sh xonalar", value: `${available} ta`, sub: `${cleaning} ta tozalanmoqda`, icon: <BedDouble />, tone: 'emerald', accent: 'text-emerald-500' },
    { label: 'Bugun kirish / chiqish', value: `${arrivals.length} / ${departures.length}`, sub: 'check-in / check-out', icon: <LogIn />, tone: 'amber', accent: 'text-amber-500' },
    { label: 'Bugungi bronlar tushumi', value: fmtUZS(todayRevenue), sub: 'bugun yaratilgan bronlar', icon: <Wallet />, tone: 'teal', accent: 'text-teal-500' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <Card key={s.label} className="overflow-hidden"><CardContent className="p-5">
            <IconBadge icon={s.icon} tone={s.tone} size="md" className="mb-3" />
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-xl font-bold mt-0.5 ${s.accent}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><LogIn className="w-4 h-4 text-amber-500" /> Bugun kutilayotgan mehmonlar</CardTitle>
            <Button size="sm" variant="outline" className="rounded-lg" onClick={() => goTo('bookings')}>Barchasi</Button>
          </CardHeader>
          <CardContent>
            {arrivals.length === 0 ? <p className="text-center text-muted-foreground py-8 text-sm">Bugun kirish rejalashtirilmagan.</p> : (
              <div className="divide-y divide-border">
                {arrivals.slice(0, 6).map(b => (
                  <div key={b.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{b.guest_name || '—'}</p>
                      <p className="text-xs text-muted-foreground">{b.room_number ? `Xona № ${b.room_number}` : 'Xona biriktirilmagan'} · {b.nights} kecha</p>
                    </div>
                    <Button size="sm" className="rounded-lg shrink-0" onClick={() => h.checkIn(b.id, b.room_id)}>Check-in</Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><LogOut className="w-4 h-4 text-rose-500" /> Bugun chiqadigan mehmonlar</CardTitle>
            <Button size="sm" variant="outline" className="rounded-lg" onClick={() => goTo('housekeeping')}><Brush className="w-3.5 h-3.5 mr-1" /> Tozalash</Button>
          </CardHeader>
          <CardContent>
            {departures.length === 0 ? <p className="text-center text-muted-foreground py-8 text-sm">Bugun chiqish rejalashtirilmagan.</p> : (
              <div className="divide-y divide-border">
                {departures.slice(0, 6).map(b => (
                  <div key={b.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{b.guest_name || '—'}</p>
                      <p className="text-xs text-muted-foreground">{b.room_number ? `Xona № ${b.room_number}` : '—'} · {fmtUZS(b.total_amount)}</p>
                    </div>
                    <Button size="sm" variant="destructive" className="rounded-lg shrink-0" onClick={() => h.checkOut(b.id, b.room_id)}>Check-out</Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Xonalar holati</CardTitle></CardHeader>
        <CardContent>
          {h.rooms.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">Hali xonalar qo'shilmagan. "Xonalar" bo'limidan boshlang.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {h.rooms.map(r => (
                <div key={r.id} className={`px-3 py-1.5 rounded-xl border text-xs font-semibold ${roomStatusClass(r.status)}`}>
                  № {r.room_number} · {ROOM_STATUS_LABEL[r.status] || r.status}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => goTo('calendar')} className="rounded-xl gap-2"><CalendarDays className="w-4 h-4" /> Bandlik kalendari</Button>
        <Button variant="outline" onClick={() => goTo('rooms')} className="rounded-xl">Xonalar xaritasi</Button>
        <Button variant="outline" onClick={() => goTo('guests')} className="rounded-xl">Mehmonlar</Button>
        <Button variant="outline" onClick={() => goTo('reports')} className="rounded-xl">Hisobot</Button>
      </div>
    </div>
  );
}
