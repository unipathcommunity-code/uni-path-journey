import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dumbbell, LayoutDashboard, CalendarDays, Users, UserCheck, ClipboardList, Ticket, BarChart3, Loader2 } from 'lucide-react';
import { IconBadge } from '@/components/ui/icon-badge';
import { useGym } from './gym/useGym';
import GymOverview from './gym/GymOverview';
import Schedule from './gym/Schedule';
import Members from './gym/Members';
import CheckIn from './gym/CheckIn';
import Bookings from './gym/Bookings';
import Plans from './gym/Plans';
import GymReports from './gym/GymReports';

const TABS = [
  { key: 'overview', label: 'Boshqaruv', icon: LayoutDashboard },
  { key: 'schedule', label: 'Jadval', icon: CalendarDays },
  { key: 'members', label: "A'zolar", icon: Users },
  { key: 'checkin', label: 'Check-in', icon: UserCheck },
  { key: 'bookings', label: 'Yozilishlar', icon: ClipboardList },
  { key: 'plans', label: 'Abonement', icon: Ticket },
  { key: 'reports', label: 'Hisobot', icon: BarChart3 },
];

export default function AdminGym() {
  const g = useGym();
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs = TABS.map(t => t.key);
  const urlTab = searchParams.get('tab');
  const [tab, setTabState] = useState(urlTab && validTabs.includes(urlTab) ? urlTab : 'overview');

  const setTab = (v: string) => {
    setTabState(v);
    setSearchParams(prev => { prev.set('tab', v); return prev; }, { replace: true });
  };

  const todayCheckins = g.todayCheckins.length;

  if (g.loading) {
    return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <IconBadge icon={<Dumbbell />} tone="purple" size="lg" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sport zali boshqaruvi</h1>
          <p className="text-sm text-muted-foreground">A'zolar, abonement, dars jadvali, QR check-in va hisobotlar — bir joyda.</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full h-auto flex-wrap justify-start gap-1 bg-muted/50 p-1">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <TabsTrigger key={t.key} value={t.key} className="gap-1.5 data-[state=active]:shadow-sm relative">
                <Icon className="w-4 h-4" /> {t.label}
                {t.key === 'checkin' && todayCheckins > 0 && (
                  <span className="ml-1 text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 leading-none">{todayCheckins}</span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="overview" className="mt-5"><GymOverview g={g} goTo={setTab} /></TabsContent>
        <TabsContent value="schedule" className="mt-5"><Schedule g={g} /></TabsContent>
        <TabsContent value="members" className="mt-5"><Members g={g} /></TabsContent>
        <TabsContent value="checkin" className="mt-5"><CheckIn g={g} /></TabsContent>
        <TabsContent value="bookings" className="mt-5"><Bookings g={g} /></TabsContent>
        <TabsContent value="plans" className="mt-5"><Plans g={g} /></TabsContent>
        <TabsContent value="reports" className="mt-5"><GymReports /></TabsContent>
      </Tabs>
    </div>
  );
}
