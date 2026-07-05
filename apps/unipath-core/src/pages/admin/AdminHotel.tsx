import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BedDouble, LayoutDashboard, CalendarDays, ClipboardList, Users, Brush, Grid3x3, Tag, BarChart3, Loader2 } from 'lucide-react';
import { IconBadge } from '@/components/ui/icon-badge';
import { useHotel } from './hotel/useHotel';
import HotelOverview from './hotel/HotelOverview';
import BookingCalendar from './hotel/BookingCalendar';
import Bookings from './hotel/Bookings';
import Guests from './hotel/Guests';
import Housekeeping from './hotel/Housekeeping';
import RoomsMatrix from './hotel/RoomsMatrix';
import RatePlans from './hotel/RatePlans';
import HotelReports from './hotel/HotelReports';

const TABS = [
  { key: 'overview', label: 'Boshqaruv', icon: LayoutDashboard },
  { key: 'calendar', label: 'Kalendar', icon: CalendarDays },
  { key: 'bookings', label: 'Bronlar', icon: ClipboardList },
  { key: 'guests', label: 'Mehmonlar', icon: Users },
  { key: 'housekeeping', label: 'Tozalash', icon: Brush },
  { key: 'rooms', label: 'Xonalar', icon: Grid3x3 },
  { key: 'rates', label: 'Narxlar', icon: Tag },
  { key: 'reports', label: 'Hisobot', icon: BarChart3 },
];

export default function AdminHotel() {
  const h = useHotel();
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs = TABS.map(t => t.key);
  const urlTab = searchParams.get('tab');
  const [tab, setTabState] = useState(urlTab && validTabs.includes(urlTab) ? urlTab : 'overview');

  const setTab = (v: string) => {
    setTabState(v);
    setSearchParams(prev => { prev.set('tab', v); return prev; }, { replace: true });
  };

  const pendingCount = h.bookings.filter(b => b.status === 'pending').length;

  if (h.loading) {
    return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <IconBadge icon={<BedDouble />} tone="sky" size="lg" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mehmonxona boshqaruvi</h1>
          <p className="text-sm text-muted-foreground">Bandlik kalendari, bronlar, mehmonlar, tozalash va mavsumiy narxlar — barchasi bir joyda.</p>
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
                  <span className="ml-1 text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 leading-none">{pendingCount}</span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="overview" className="mt-5"><HotelOverview h={h} goTo={setTab} /></TabsContent>
        <TabsContent value="calendar" className="mt-5"><BookingCalendar h={h} /></TabsContent>
        <TabsContent value="bookings" className="mt-5"><Bookings h={h} /></TabsContent>
        <TabsContent value="guests" className="mt-5"><Guests h={h} /></TabsContent>
        <TabsContent value="housekeeping" className="mt-5"><Housekeeping h={h} /></TabsContent>
        <TabsContent value="rooms" className="mt-5"><RoomsMatrix h={h} /></TabsContent>
        <TabsContent value="rates" className="mt-5"><RatePlans h={h} /></TabsContent>
        <TabsContent value="reports" className="mt-5"><HotelReports /></TabsContent>
      </Tabs>
    </div>
  );
}
