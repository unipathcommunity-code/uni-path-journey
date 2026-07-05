import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { UtensilsCrossed, LayoutDashboard, Tag, Receipt, ChefHat, Wallet, Grid3x3, BarChart3, DollarSign, Loader2 } from 'lucide-react';
import { IconBadge } from '@/components/ui/icon-badge';
import { useRestaurant } from './restaurant/useRestaurant';
import { RestaurantTable } from './restaurant/types';
import RestaurantOverview from './restaurant/RestaurantOverview';
import MenuManager from './restaurant/MenuManager';
import PosOrder from './restaurant/PosOrder';
import KitchenDisplay from './restaurant/KitchenDisplay';
import Cashier from './restaurant/Cashier';
import TablesMap from './restaurant/TablesMap';
import RestaurantReports from './restaurant/RestaurantReports';
import CostCalculator from './restaurant/CostCalculator';

const TABS = [
  { key: 'overview', label: 'Boshqaruv', icon: LayoutDashboard },
  { key: 'pos', label: 'Buyurtma', icon: Receipt },
  { key: 'kds', label: 'Oshxona', icon: ChefHat },
  { key: 'cashier', label: 'Kassa', icon: Wallet },
  { key: 'menu', label: 'Menyu', icon: Tag },
  { key: 'tables', label: 'Stollar', icon: Grid3x3 },
  { key: 'cost', label: 'Tannarx', icon: DollarSign },
  { key: 'reports', label: 'Hisobot', icon: BarChart3 },
];

export default function AdminRestaurant() {
  const r = useRestaurant();
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs = TABS.map(t => t.key);
  const urlTab = searchParams.get('tab');
  const [tab, setTabState] = useState(urlTab && validTabs.includes(urlTab) ? urlTab : 'overview');
  const [posTable, setPosTable] = useState<RestaurantTable | null>(null);

  const setTab = (v: string) => {
    setTabState(v);
    setSearchParams(prev => { prev.set('tab', v); return prev; }, { replace: true });
  };

  const takeOrder = (t: RestaurantTable) => { setPosTable(t); setTab('pos'); };
  const openPosBlank = () => { setPosTable(null); setTab('pos'); };

  const activeCount = r.orders.filter(o => ['new', 'kitchen', 'served'].includes(o.status)).length;

  if (r.loading) {
    return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <IconBadge icon={<UtensilsCrossed />} tone="orange" size="lg" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Restoran & Kafe boshqaruvi</h1>
          <p className="text-sm text-muted-foreground">Menyu, stollar, POS, oshxona ekrani, kassa va tannarx tahlili — barchasi bir joyda.</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full h-auto flex-wrap justify-start gap-1 bg-muted/50 p-1">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <TabsTrigger key={t.key} value={t.key} className="gap-1.5 data-[state=active]:shadow-sm relative">
                <Icon className="w-4 h-4" /> {t.label}
                {t.key === 'kds' && activeCount > 0 && (
                  <span className="ml-1 text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 leading-none">{activeCount}</span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="overview" className="mt-5"><RestaurantOverview r={r} goTo={(t) => { if (t === 'pos') openPosBlank(); else setTab(t); }} /></TabsContent>
        <TabsContent value="pos" className="mt-5"><PosOrder r={r} presetTable={posTable} onDone={() => setTab('kds')} /></TabsContent>
        <TabsContent value="kds" className="mt-5"><KitchenDisplay r={r} /></TabsContent>
        <TabsContent value="cashier" className="mt-5"><Cashier r={r} /></TabsContent>
        <TabsContent value="menu" className="mt-5"><MenuManager r={r} /></TabsContent>
        <TabsContent value="tables" className="mt-5"><TablesMap r={r} onTakeOrder={takeOrder} /></TabsContent>
        <TabsContent value="cost" className="mt-5"><CostCalculator r={r} /></TabsContent>
        <TabsContent value="reports" className="mt-5"><RestaurantReports /></TabsContent>
      </Tabs>
    </div>
  );
}
