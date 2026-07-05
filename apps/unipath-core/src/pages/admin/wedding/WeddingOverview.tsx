import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';
import { IconBadge, IconTone } from '@/components/ui/icon-badge';
import { Calendar, Users, DollarSign, CheckCircle, Gem, ArrowRight, Building2 } from 'lucide-react';
import { WeddingApi } from './useWedding';
import { fmtUZS, outstanding, statusClass, STATUS_LABEL, EVENT_TYPE_LABEL, toDateStr } from './types';

export default function WeddingOverview({ w, goTo }: { w: WeddingApi; goTo: (tab: string) => void }) {
  const active = w.bookings.filter(b => b.status !== 'cancelled');
  const today = toDateStr(new Date());

  const upcoming = active
    .filter(b => b.event_date >= today && ['pending', 'confirmed'].includes(b.status))
    .sort((a, b) => a.event_date.localeCompare(b.event_date));
  const upcomingGuests = upcoming.reduce((s, b) => s + Number(b.guest_count || 0), 0);
  const completedRevenue = w.bookings
    .filter(b => b.status === 'completed')
    .reduce((s, b) => s + Number(b.total_price || 0), 0);
  const totalDebt = active.reduce((s, b) => s + outstanding(b), 0);
  const pendingCount = w.bookings.filter(b => b.status === 'pending').length;

  const stats: { title: string; value: string; sub: string; icon: ReactNode; tone: IconTone; color: string }[] = [
    { title: 'Jami buyurtmalar', value: `${w.bookings.length} ta`, sub: `${pendingCount} ta tasdiqlanishi kutilmoqda`, icon: <Calendar />, tone: 'pink', color: 'text-pink-500' },
    { title: 'Kelgusi mehmonlar', value: `${upcomingGuests.toLocaleString('ru-RU')} kishi`, sub: `${upcoming.length} ta kelgusi tantana`, icon: <Users />, tone: 'blue', color: 'text-blue-500' },
    { title: 'Tushum (yakunlangan)', value: fmtUZS(completedRevenue), sub: "Yakunlangan to'ylar tushumi", icon: <CheckCircle />, tone: 'emerald', color: 'text-emerald-500' },
    { title: 'Kutilayotgan qoldiq', value: fmtUZS(totalDebt), sub: "Tadbir kunigacha to'lanishi kerak", icon: <DollarSign />, tone: 'amber', color: 'text-amber-500' },
  ];

  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.title} className="bg-card border-border overflow-hidden">
            <CardContent className="p-5">
              <IconBadge icon={s.icon} tone={s.tone} size="md" className="mb-3" />
              <p className="text-xs text-muted-foreground">{s.title}</p>
              <div className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Upcoming events */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Gem className="w-4 h-4 text-pink-500" /> Yaqinlashayotgan tantanalar
              </CardTitle>
              <CardDescription>Eng yaqin sanalarda bo'ladigan marosimlar.</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs" onClick={() => goTo('calendar')}>
              Kalendar <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-2xl">
                Kelgusi tantanalar yo'q. Kalendar orqali yangi buyurtma qo'shing.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {upcoming.slice(0, 6).map(b => (
                  <div key={b.id} className="py-2.5 flex items-center gap-3">
                    <div className="w-12 text-center shrink-0">
                      <p className="text-lg font-bold leading-none text-pink-500">{b.event_date.slice(8, 10)}</p>
                      <p className="text-[10px] text-muted-foreground">{b.event_date.slice(0, 7)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{b.client_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {b.hall_name || '—'} · {EVENT_TYPE_LABEL[b.event_type] || b.event_type} · {b.guest_count} kishi
                      </p>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 font-bold uppercase rounded border shrink-0 ${statusClass(b.status)}`}>
                      {STATUS_LABEL[b.status] || b.status}
                    </span>
                    <span className="text-sm font-semibold w-32 text-right shrink-0 hidden sm:block">{fmtUZS(b.total_price)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Debtors */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Qarzdorlar</CardTitle>
              <CardDescription>To'liq to'lanmagan buyurtmalar.</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs" onClick={() => goTo('payments')}>
              To'lovlar <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {active.filter(b => outstanding(b) > 0).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Barcha hisob-kitoblar yopilgan.</p>
            ) : (
              <div className="space-y-2">
                {active.filter(b => outstanding(b) > 0)
                  .sort((a, b) => a.event_date.localeCompare(b.event_date))
                  .slice(0, 6)
                  .map(b => (
                    <div key={b.id} className="p-2.5 border rounded-xl bg-rose-500/5 border-rose-500/10 flex justify-between items-center text-xs">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{b.client_name}</p>
                        <p className="text-[10px] text-muted-foreground">{b.event_date} · {b.hall_name || '—'}</p>
                      </div>
                      <span className="font-bold text-rose-400 shrink-0 ml-2">{fmtUZS(outstanding(b))}</span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Empty state when no halls exist yet */}
      {w.halls.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center space-y-3">
            <Building2 className="w-8 h-8 mx-auto text-pink-500/50" />
            <p className="text-sm text-muted-foreground">
              Hali birorta zal qo'shilmagan. Avval zallaringizni kiriting — kalendar va onlayn bron ular asosida ishlaydi.
            </p>
            <Button onClick={() => goTo('halls')} className="rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold gap-2">
              Zal qo'shish <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
