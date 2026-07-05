import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, CalendarDays, Wallet, Dumbbell, QrCode } from 'lucide-react';
import { GymApi } from './useGym';
import { fmtUZS, todayISO, subStatusClass, SUB_STATUS_LABEL, CHECKIN_METHOD_LABEL, WEEKDAY_SHORT } from './types';

export default function GymOverview({ g, goTo }: { g: GymApi; goTo: (tab: string) => void }) {
  const today = todayISO();
  const todayWeekday = new Date().getDay();

  const activeSubs = g.subscriptions.filter(s => s.status === 'active' && (!s.end_date || s.end_date >= today));
  const activeMemberIds = new Set(activeSubs.map(s => s.member_id).filter(Boolean));
  const todaysClasses = g.classes.filter(c => c.is_active && c.weekday === todayWeekday);

  // Monthly revenue: active subscriptions that started this month, by plan price
  const monthKey = today.slice(0, 7);
  const monthlyRevenue = g.subscriptions
    .filter(s => s.status !== 'cancelled' && (s.start_date || '').slice(0, 7) === monthKey)
    .reduce((sum, s) => sum + Number(s.plan_price || 0), 0);

  const stats = [
    { label: "Faol a'zolar", value: `${activeMemberIds.size} ta`, sub: `jami ${g.members.length} a'zo`, icon: <Users className="w-6 h-6" />, accent: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Bugungi check-inlar', value: `${g.todayCheckins.length} ta`, sub: 'zalga kirishlar', icon: <UserCheck className="w-6 h-6" />, accent: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: "Bugungi mashg'ulotlar", value: `${todaysClasses.length} ta`, sub: WEEKDAY_SHORT[todayWeekday] + ' kuni jadval', icon: <CalendarDays className="w-6 h-6" />, accent: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Oylik tushum', value: fmtUZS(monthlyRevenue), sub: 'shu oy sotilgan abonementlar', icon: <Wallet className="w-6 h-6" />, accent: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <Card key={s.label}><CardContent className="p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.bg} ${s.accent}`}>{s.icon}</div>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-xl font-bold mt-0.5 ${s.accent}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Dumbbell className="w-4 h-4 text-amber-500" /> Bugungi mashg'ulotlar</CardTitle>
            <Button size="sm" variant="outline" className="rounded-lg" onClick={() => goTo('schedule')}>Jadval</Button>
          </CardHeader>
          <CardContent>
            {todaysClasses.length === 0 ? <p className="text-center text-muted-foreground py-8 text-sm">Bugun mashg'ulotlar rejalashtirilmagan.</p> : (
              <div className="divide-y divide-border">
                {todaysClasses.slice(0, 6).map(c => {
                  const booked = g.bookedCount(c.id, today);
                  return (
                    <div key={c.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{c.start_time} · {c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.trainer_name || 'Trener belgilanmagan'}{c.room ? ` · ${c.room}` : ''}</p>
                      </div>
                      <span className={`text-xs font-bold shrink-0 px-2 py-1 rounded-lg border ${booked >= c.capacity ? 'text-rose-500 bg-rose-500/10 border-rose-500/20' : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'}`}>
                        {booked}/{c.capacity}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><UserCheck className="w-4 h-4 text-emerald-500" /> Bugungi check-inlar</CardTitle>
            <Button size="sm" variant="outline" className="rounded-lg" onClick={() => goTo('checkin')}><QrCode className="w-3.5 h-3.5 mr-1" /> Check-in</Button>
          </CardHeader>
          <CardContent>
            {g.todayCheckins.length === 0 ? <p className="text-center text-muted-foreground py-8 text-sm">Bugun hali hech kim kirmagan.</p> : (
              <div className="divide-y divide-border">
                {g.todayCheckins.slice(0, 6).map(c => (
                  <div key={c.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{c.member_name || '—'}</p>
                      <p className="text-xs text-muted-foreground">{CHECKIN_METHOD_LABEL[c.method] || c.method}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(c.checked_in_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">So'nggi abonementlar</CardTitle></CardHeader>
        <CardContent>
          {g.subscriptions.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">Hali abonementlar sotilmagan. "A'zolar" bo'limidan abonement biriktiring.</p>
          ) : (
            <div className="divide-y divide-border">
              {g.subscriptions.slice(0, 6).map(s => (
                <div key={s.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{s.member_name || '—'}</p>
                    <p className="text-xs text-muted-foreground">{s.plan_name || '—'} · {s.start_date} → {s.end_date || '∞'}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-lg border shrink-0 ${subStatusClass(s.status)}`}>
                    {SUB_STATUS_LABEL[s.status] || s.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => goTo('schedule')} className="rounded-xl gap-2"><CalendarDays className="w-4 h-4" /> Mashg'ulotlar jadvali</Button>
        <Button variant="outline" onClick={() => goTo('members')} className="rounded-xl">A'zolar</Button>
        <Button variant="outline" onClick={() => goTo('checkin')} className="rounded-xl">Check-in</Button>
        <Button variant="outline" onClick={() => goTo('reports')} className="rounded-xl">Hisobot</Button>
      </div>
    </div>
  );
}
