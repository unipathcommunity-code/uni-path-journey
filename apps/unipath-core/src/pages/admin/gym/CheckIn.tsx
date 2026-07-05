import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserCheck, Search, Check, Clock } from 'lucide-react';
import { GymApi } from './useGym';
import { subStatusClass, CHECKIN_METHOD_LABEL, todayISO } from './types';

export default function CheckIn({ g }: { g: GymApi }) {
  const [q, setQ] = useState('');
  const today = todayISO();
  const query = q.trim().toLowerCase();
  const matches = query
    ? g.members.filter(m => m.full_name.toLowerCase().includes(query) || (m.phone || '').includes(query))
    : g.members.slice(0, 8);

  const checkedInIds = new Set(g.todayCheckins.map(c => c.member_id));

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {/* Search + check in */}
      <div className="lg:col-span-2 space-y-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><UserCheck className="w-5 h-5 text-primary" /> Check-in</h2>
          <p className="text-sm text-muted-foreground">A'zoni toping (ism/telefon) yoki QR-kartasini skanlab kirishini belgilang.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="A'zo ismi yoki telefon..." className="pl-9 h-11 rounded-xl" />
        </div>

        <div className="space-y-2">
          {matches.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">A'zo topilmadi.</CardContent></Card>
          ) : matches.map(m => {
            const sub = g.activeSubOf(m.id);
            const done = checkedInIds.has(m.id);
            return (
              <div key={m.id} className="flex items-center gap-3 p-3 border border-border rounded-xl bg-card">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                  {m.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{m.full_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {sub ? (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${subStatusClass(sub.status)}`}>
                        {sub.plan_name || 'Abonement'}{sub.remaining_classes != null ? ` · ${sub.remaining_classes} dars` : ''}
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-500 font-semibold">Abonement yo'q</span>
                    )}
                  </div>
                </div>
                {done ? (
                  <span className="text-xs text-emerald-500 font-bold flex items-center gap-1"><Check className="w-4 h-4" /> Kirdi</span>
                ) : (
                  <Button size="sm" className="rounded-lg" onClick={() => g.checkInMember(m.id, 'manual')}>Check-in</Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's check-ins */}
      <Card className="h-fit">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Bugungi kirishlar</CardTitle>
          <span className="text-xs font-bold text-primary">{g.todayCheckins.length}</span>
        </CardHeader>
        <CardContent>
          {g.todayCheckins.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Bugun hali kirish yo'q.</p>
          ) : (
            <div className="space-y-2 max-h-[360px] overflow-y-auto">
              {g.todayCheckins.map(c => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{c.member_name || '—'}</span>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {new Date(c.checked_in_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} · {CHECKIN_METHOD_LABEL[c.method]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
