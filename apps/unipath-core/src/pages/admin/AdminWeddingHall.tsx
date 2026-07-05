import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Gem, LayoutDashboard, CalendarDays, BookOpen, Wallet, Building2, BarChart3, Loader2 } from 'lucide-react';
import { IconBadge } from '@/components/ui/icon-badge';
import { useWedding } from './wedding/useWedding';
import WeddingOverview from './wedding/WeddingOverview';
import EventCalendar from './wedding/EventCalendar';
import Bookings from './wedding/Bookings';
import Payments from './wedding/Payments';
import HallsPackages from './wedding/HallsPackages';
import WeddingReports from './wedding/WeddingReports';

const TABS = [
  { key: 'overview', label: 'Boshqaruv', icon: LayoutDashboard },
  { key: 'calendar', label: 'Kalendar', icon: CalendarDays },
  { key: 'bookings', label: 'Buyurtmalar', icon: BookOpen },
  { key: 'payments', label: "To'lovlar", icon: Wallet },
  { key: 'halls', label: 'Zallar & Paketlar', icon: Building2 },
  { key: 'reports', label: 'Hisobot', icon: BarChart3 },
];

export default function AdminWeddingHall() {
  const w = useWedding();
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs = TABS.map(t => t.key);
  const urlTab = searchParams.get('tab');
  const [tab, setTabState] = useState(urlTab && validTabs.includes(urlTab) ? urlTab : 'overview');

  const setTab = (v: string) => {
    setTabState(v);
    setSearchParams(prev => { prev.set('tab', v); return prev; }, { replace: true });
  };

  const pendingCount = w.bookings.filter(b => b.status === 'pending').length;

  if (w.loading) {
    return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <IconBadge icon={<Gem />} tone="pink" size="lg" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">To'yxona & Marosimlar Saroyi Boshqaruvi</h1>
          <p className="text-sm text-muted-foreground">Zallar bandligi kalendari, buyurtmalar, bo'lib-bo'lib to'lovlar va hisobotlar — barchasi bir joyda.</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full h-auto flex-wrap justify-start gap-1 bg-muted/50 p-1">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <TabsTrigger key={t.key} value={t.key} className="gap-1.5 data-[state=active]:shadow-sm relative">
                <Icon className="w-4 h-4" /> {t.label}
                {t.key === 'bookings' && pendingCount > 0 && (
                  <span className="ml-1 text-[10px] bg-pink-600 text-white rounded-full px-1.5 py-0.5 leading-none">{pendingCount}</span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="overview" className="mt-5"><WeddingOverview w={w} goTo={setTab} /></TabsContent>
        <TabsContent value="calendar" className="mt-5"><EventCalendar w={w} /></TabsContent>
        <TabsContent value="bookings" className="mt-5"><Bookings w={w} /></TabsContent>
        <TabsContent value="payments" className="mt-5"><Payments w={w} /></TabsContent>
        <TabsContent value="halls" className="mt-5"><HallsPackages w={w} /></TabsContent>
        <TabsContent value="reports" className="mt-5"><WeddingReports /></TabsContent>
      </Tabs>
    </div>
  );
}
