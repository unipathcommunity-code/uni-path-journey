import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays, Plus } from 'lucide-react';
import { WeddingApi } from './useWedding';
import BookingForm from './BookingForm';
import { EventBooking, statusClass, STATUS_LABEL, toDateStr } from './types';

const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
const WEEKDAYS = ['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Ya'];

export default function EventCalendar({ w }: { w: WeddingApi }) {
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [hallFilter, setHallFilter] = useState('all');
  const [formDate, setFormDate] = useState<string | null>(null);

  const todayStr = toDateStr(new Date());
  const activeHalls = w.halls.filter(h => h.is_active);

  // Bookings grouped by date (cancelled excluded), filtered by hall
  const byDate = useMemo(() => {
    const map = new Map<string, EventBooking[]>();
    w.bookings
      .filter(b => b.status !== 'cancelled')
      .filter(b => hallFilter === 'all' || b.hall_id === hallFilter)
      .forEach(b => {
        const list = map.get(b.event_date) || [];
        list.push(b);
        map.set(b.event_date, list);
      });
    return map;
  }, [w.bookings, hallFilter]);

  const shiftMonth = (d: number) => setMonth(prev => {
    const next = new Date(prev);
    next.setMonth(next.getMonth() + d);
    return next;
  });

  // Monday-first grid
  const firstWeekday = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      toDateStr(new Date(month.getFullYear(), month.getMonth(), i + 1))),
  ];

  // With a specific hall selected, a date with any pending/confirmed booking is fully busy.
  const isBusy = (date: string) =>
    hallFilter !== 'all' &&
    (byDate.get(date) || []).some(b => ['pending', 'confirmed'].includes(b.status));

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="rounded-xl h-9 w-9" onClick={() => shiftMonth(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-bold min-w-[160px] text-center flex items-center justify-center gap-2">
            <CalendarDays className="w-5 h-5 text-pink-500" />
            {MONTHS[month.getMonth()]} {month.getFullYear()}
          </h2>
          <Button variant="outline" size="icon" className="rounded-xl h-9 w-9" onClick={() => shiftMonth(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <select value={hallFilter} onChange={e => setHallFilter(e.target.value)}
            className="h-9 px-3 bg-background border border-border rounded-xl text-sm">
            <option value="all">Barcha zallar</option>
            {activeHalls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <Button onClick={() => setFormDate(todayStr)}
            className="rounded-xl gap-2 font-bold bg-pink-600 hover:bg-pink-700 text-white">
            <Plus className="w-4 h-4" /> Yangi buyurtma
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Kutilmoqda</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Tasdiqlangan</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Yakunlangan</span>
        <span>Bo'sh kunga bosing — darrov buyurtma qo'shasiz.</span>
      </div>

      {/* Calendar grid */}
      <Card className="bg-card border-border">
        <CardContent className="p-2 sm:p-4">
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-bold uppercase text-muted-foreground py-1.5">{d}</div>
            ))}
            {cells.map((date, i) => {
              if (!date) return <div key={`e-${i}`} className="min-h-[72px] sm:min-h-[92px]" />;
              const dayBookings = byDate.get(date) || [];
              const busy = isBusy(date);
              const isToday = date === todayStr;
              const isPast = date < todayStr;
              return (
                <button
                  key={date}
                  onClick={() => !busy && setFormDate(date)}
                  disabled={busy}
                  title={busy ? 'Bu sana band' : "Buyurtma qo'shish"}
                  className={`min-h-[72px] sm:min-h-[92px] p-1 sm:p-1.5 rounded-xl border text-left flex flex-col gap-1 transition
                    ${busy
                      ? 'bg-rose-500/10 border-rose-500/30 cursor-not-allowed'
                      : 'hover:border-pink-500/50 hover:bg-pink-500/5'}
                    ${isToday ? 'ring-2 ring-pink-500/60 border-pink-500/40' : 'border-border'}
                    ${isPast && !busy ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isToday ? 'text-pink-500' : ''}`}>{Number(date.slice(8, 10))}</span>
                    {busy && <span className="text-[8px] font-bold uppercase text-rose-500">Band</span>}
                  </div>
                  <div className="space-y-0.5 overflow-hidden">
                    {dayBookings.slice(0, 2).map(b => (
                      <div key={b.id}
                        className={`text-[9px] leading-tight px-1 py-0.5 rounded border truncate font-semibold ${statusClass(b.status)}`}
                        title={`${b.client_name} — ${b.hall_name || ''} (${STATUS_LABEL[b.status]})`}>
                        {b.client_name}{hallFilter === 'all' && b.hall_name ? ` · ${b.hall_name}` : ''}
                      </div>
                    ))}
                    {dayBookings.length > 2 && (
                      <div className="text-[9px] text-muted-foreground px-1">+{dayBookings.length - 2} ta</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {formDate && (
        <BookingForm
          w={w}
          presetDate={formDate}
          presetHallId={hallFilter !== 'all' ? hallFilter : undefined}
          onClose={() => setFormDate(null)}
        />
      )}
    </div>
  );
}
