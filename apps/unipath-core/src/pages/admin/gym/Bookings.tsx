import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, Check, X, Globe } from 'lucide-react';
import { GymApi } from './useGym';
import { cbookingStatusClass, CBOOKING_STATUS_LABEL, todayISO } from './types';

export default function Bookings({ g }: { g: GymApi }) {
  const [filter, setFilter] = useState<'all' | 'today' | 'booked'>('all');
  const today = todayISO();

  const list = g.bookings.filter(b => {
    if (filter === 'today') return b.class_date === today;
    if (filter === 'booked') return b.status === 'booked';
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><ClipboardList className="w-5 h-5 text-primary" /> Yozilishlar</h2>
          <p className="text-sm text-muted-foreground">Mashg'ulotlarga yozilgan a'zolar va mehmonlar.</p>
        </div>
        <div className="flex gap-1">
          {([['all', 'Barchasi'], ['today', 'Bugun'], ['booked', 'Kutilmoqda']] as const).map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${filter === k ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Yozilishlar yo'q.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {list.map(b => (
              <div key={b.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">{b.member_name || b.customer_name || 'Mehmon'}</p>
                    {b.source === 'online' && <span title="Onlayn" className="text-sky-500"><Globe className="w-3.5 h-3.5" /></span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{b.class_name || "Mashg'ulot"} · {b.class_date}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${cbookingStatusClass(b.status)}`}>
                    {CBOOKING_STATUS_LABEL[b.status]}
                  </span>
                  {b.status === 'booked' && (
                    <>
                      <Button size="sm" className="h-8 rounded-lg text-xs gap-1" onClick={() => g.markAttended(b.id)}><Check className="w-3.5 h-3.5" /> Keldi</Button>
                      <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs text-rose-500" onClick={() => g.cancelBooking(b.id)}><X className="w-3.5 h-3.5" /></Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
