import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Car, 
  Plus, 
  Search, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Gauge, 
  UserCheck, 
  User, 
  Sparkles, 
  ChevronRight,
  Calculator,
  Percent,
  CheckCircle,
  Clock,
  XCircle,
  Building
} from 'lucide-react';

interface CarItem {
  id: string;
  brand: string;
  model: string;
  color: string;
  year: number;
  price: number;
  engine: 'Electro' | 'Hybrid' | 'Petrol' | string;
  battery_capacity?: string;
  range_km?: number;
  status: 'available' | 'reserved' | 'sold';
  image?: string;
}

interface TestDrive {
  id: string;
  car_id: string;
  car_name: string;
  customer_name: string;
  customer_phone: string;
  status: 'pending' | 'completed' | 'cancelled';
  date: string;
  time: string;
}

interface DealItem {
  id: string;
  customer_name: string;
  customer_phone: string;
  car_model: string;
  stage: 'interest' | 'finance_approval' | 'contract_pending' | 'delivered';
  deal_amount: number;
  down_payment: number;
  monthly_payment: number;
  duration_months: number;
}

export default function AdminCarShowroom() {
  const { activeTenant } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  
  // States
  const [cars, setCars] = useState<CarItem[]>([]);
  const [testDrives, setTestDrives] = useState<TestDrive[]>([]);
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State for adding new vehicle
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCar, setNewCar] = useState({
    brand: '',
    model: '',
    color: '',
    year: 2026,
    price: 350000000,
    engine: 'Electro',
    battery_capacity: '',
    range_km: 500,
    status: 'available' as const
  });

  // Interactive Calculator State
  const [calcCarPrice, setCalcCarPrice] = useState(360000000);
  const [calcDownPayment, setCalcDownPayment] = useState(120000000);
  const [calcMonths, setCalcMonths] = useState(36);
  const [calcApr, setCalcApr] = useState(18); // Default APR

  useEffect(() => {
    if (!activeTenant) { setLoading(false); return; }
    
    // Load config base APR if defined by super admin
    const savedConfigs = localStorage.getItem('unipath_tenant_configs');
    if (savedConfigs) {
      try {
        const configs = JSON.parse(savedConfigs);
        const tenantConfig = configs[activeTenant.id];
        if (tenantConfig?.baseApr) {
          setCalcApr(tenantConfig.baseApr);
        }
      } catch (e) {
        console.warn("Failed to load tenant base APR:", e);
      }
    }

    setLoading(true);
    
    // Load from localStorage or seed fallback mocks
    const savedCars = localStorage.getItem('unipath_showroom_cars');
    const savedTestDrives = localStorage.getItem('unipath_showroom_testdrives');
    const savedDeals = localStorage.getItem('unipath_showroom_deals');

    if (savedCars) {
      setCars(JSON.parse(savedCars));
    } else {
      const defaultCars: CarItem[] = [
        { id: 'c-1', brand: 'BYD', model: 'Song Plus EV Champion', color: 'Oq (Pearl White)', year: 2026, price: 360000000, engine: 'Electro', battery_capacity: '71.7 kWh', range_km: 505, status: 'available' },
        { id: 'c-2', brand: 'Chevrolet', model: 'Tahoe Premier', color: 'Qora (Black Metallic)', year: 2025, price: 1150000000, engine: 'Petrol', status: 'reserved' },
        { id: 'c-3', brand: 'Tesla', model: 'Model Y Long Range', color: 'Kulrang (Midnight Silver)', year: 2026, price: 520000000, engine: 'Electro', status: 'sold' }
      ];
      setCars(defaultCars);
      localStorage.setItem('unipath_showroom_cars', JSON.stringify(defaultCars));
    }

    if (savedTestDrives) {
      setTestDrives(JSON.parse(savedTestDrives));
    } else {
      const defaultTestDrives: TestDrive[] = [
        { id: 'td-1', car_id: 'c-1', car_name: 'BYD Song Plus EV Champion', customer_name: 'Axmedov Bobur', customer_phone: '+998 90 123-45-67', status: 'pending', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], time: '11:00' },
        { id: 'td-2', car_id: 'c-2', car_name: 'Chevrolet Tahoe Premier', customer_name: 'Usmanov Sherzod', customer_phone: '+998 97 999-88-77', status: 'completed', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], time: '15:30' }
      ];
      setTestDrives(defaultTestDrives);
      localStorage.setItem('unipath_showroom_testdrives', JSON.stringify(defaultTestDrives));
    }

    if (savedDeals) {
      setDeals(JSON.parse(savedDeals));
    } else {
      const defaultDeals: DealItem[] = [
        { id: 'd-1', customer_name: 'Samatov Sardor', customer_phone: '+998 94 444-55-66', car_model: 'BYD Song Plus EV Champion', stage: 'finance_approval', deal_amount: 360000000, down_payment: 100000000, monthly_payment: 9800000, duration_months: 36 }
      ];
      setDeals(defaultDeals);
      localStorage.setItem('unipath_showroom_deals', JSON.stringify(defaultDeals));
    }

    setLoading(false);
  }, [activeTenant]);

  const handleAddCar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCar.brand || !newCar.model || !newCar.color || !newCar.price) {
      toast({ title: 'Xatolik', description: 'Barcha majdonlarni to\'ldiring', variant: 'destructive' });
      return;
    }

    const created: CarItem = {
      id: 'c-' + Date.now(),
      brand: newCar.brand,
      model: newCar.model,
      color: newCar.color,
      year: Number(newCar.year),
      price: Number(newCar.price),
      engine: newCar.engine,
      battery_capacity: newCar.battery_capacity || undefined,
      range_km: newCar.range_km ? Number(newCar.range_km) : undefined,
      status: newCar.status
    };

    const updated = [created, ...cars];
    setCars(updated);
    localStorage.setItem('unipath_showroom_cars', JSON.stringify(updated));
    setIsAddModalOpen(false);
    
    // Reset form
    setNewCar({
      brand: '',
      model: '',
      color: '',
      year: 2026,
      price: 350000000,
      engine: 'Electro',
      battery_capacity: '',
      range_km: 500,
      status: 'available'
    });

    toast({ title: 'Muvaffaqiyatli', description: `Yangi avtomobil katalogga qo'shildi: ${created.brand} ${created.model}` });
  };

  const updateCarStatus = (carId: string, status: 'available' | 'reserved' | 'sold') => {
    const updated = cars.map(c => c.id === carId ? { ...c, status } : c);
    setCars(updated);
    localStorage.setItem('unipath_showroom_cars', JSON.stringify(updated));
    toast({ title: 'Muvaffaqiyatli', description: 'Avtomobil statusi yangilandi' });
  };

  const deleteCar = (carId: string) => {
    const updated = cars.filter(c => c.id !== carId);
    setCars(updated);
    localStorage.setItem('unipath_showroom_cars', JSON.stringify(updated));
    toast({ title: "O'chirildi", description: 'Avtomobil katalogdan olib tashlandi' });
  };

  // Leasing calculations
  const loanAmount = Math.max(0, calcCarPrice - calcDownPayment);
  const monthlyRate = (calcApr / 100) / 12;
  const calculatedMonthlyPayment = loanAmount > 0 
    ? Math.round((loanAmount * monthlyRate * Math.pow(1 + monthlyRate, calcMonths)) / (Math.pow(1 + monthlyRate, calcMonths) - 1))
    : 0;

  const filteredCars = cars.filter(c => 
    c.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.color.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-8 animate-fade-in text-foreground pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]">
              <Car className="w-6 h-6" />
            </div>
            Avtosalon Boshqaruv Tizimi (Showroom Engine)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Avtomobillar zaxirasi, test-drayvlar navbati, kredit/lizing hisoblagichi va sotuvlar CRM tizimi.
          </p>
        </div>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2 font-bold shadow-[0_0_15px_rgba(37,99,235,0.2)] px-5 py-5"
        >
          <Plus className="w-5 h-5" />
          Yangi Avtomobil Qo'shish
        </Button>
      </div>

      {/* Bento Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#111111]/80 border-white/5 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Car className="w-[100px] h-[100px] text-white" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-white/50 uppercase tracking-wider">Jami Avtomobillar</CardTitle>
            <Car className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">{cars.length} ta</div>
            <p className="text-[10px] text-white/40 mt-1">Sotuvda: {cars.filter(c => c.status === 'available').length} ta faol</p>
          </CardContent>
        </Card>

        <Card className="bg-[#111111]/80 border-white/5 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Calendar className="w-[100px] h-[100px] text-white" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-white/50 uppercase tracking-wider">Test-drayvlar</CardTitle>
            <Calendar className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">{testDrives.filter(t => t.status === 'pending').length} ta</div>
            <p className="text-[10px] text-white/40 mt-1">Kutilayotgan navbatlar soni</p>
          </CardContent>
        </Card>

        <Card className="bg-[#111111]/80 border-white/5 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <UserCheck className="w-[100px] h-[100px] text-white" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-white/50 uppercase tracking-wider">Faol Shartnomalar</CardTitle>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">{deals.length} ta</div>
            <p className="text-[10px] text-white/40 mt-1">Pipeline-dagi joriy xaridorlar</p>
          </CardContent>
        </Card>

        <Card className="bg-[#111111]/80 border-white/5 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign className="w-[100px] h-[100px] text-white" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-white/50 uppercase tracking-wider">Taxminiy Savdo Tushumi</CardTitle>
            <DollarSign className="w-4 h-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">
              {(deals.reduce((acc, curr) => acc + curr.deal_amount, 0) + cars.filter(c => c.status === 'sold').reduce((acc, curr) => acc + curr.price, 0)).toLocaleString()} UZS
            </div>
            <p className="text-[10px] text-white/40 mt-1">Sotilgan va faol bitimlar summasi</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Car Catalog Table (Left/Main panel) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-[#111111]/80 border-white/5">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                  Avtomobillar Zaxirasi
                </CardTitle>
                <CardDescription>Mavjud va buyurtma qilingan transport vositalari ro'yxati</CardDescription>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
                <Input 
                  type="text" 
                  placeholder="Model yoki rang bo'yicha qidiruv..." 
                  className="bg-white/5 border-white/10 text-white pl-10 pr-4 rounded-xl text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-white/50 text-xs uppercase font-bold">
                      <th className="py-3 px-4">Avtomobil</th>
                      <th className="py-3 px-4">Yili / Dvigatel</th>
                      <th className="py-3 px-4">Rangi</th>
                      <th className="py-3 px-4">Narxi</th>
                      <th className="py-3 px-4">Holat</th>
                      <th className="py-3 px-4 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-white/80">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-white/40">Yuklanmoqda...</td>
                      </tr>
                    ) : filteredCars.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-white/40">Avtomobillar topilmadi</td>
                      </tr>
                    ) : (
                      filteredCars.map((car) => (
                        <tr key={car.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                              <Car className="w-4 h-4" />
                            </div>
                            <div>
                              <span>{car.brand} {car.model}</span>
                              {car.battery_capacity && (
                                <span className="block text-[10px] text-white/40 font-normal">{car.battery_capacity} · {car.range_km} km</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold">{car.year}</span>
                            <span className="block text-[10px] text-white/45">{car.engine}</span>
                          </td>
                          <td className="py-3.5 px-4 text-white/60">{car.color}</td>
                          <td className="py-3.5 px-4 font-bold text-white">
                            {car.price.toLocaleString()} UZS
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                              car.status === 'available' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
                                : car.status === 'reserved'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                                : 'bg-white/5 text-white/40 border-white/10'
                            }`}>
                              {car.status === 'available' ? 'Sotuvda' : car.status === 'reserved' ? 'Band qilingan' : 'Sotilgan'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <select
                                className="bg-[#171717] border border-white/10 rounded-lg text-[10px] text-white font-semibold py-1 px-2"
                                value={car.status}
                                onChange={(e) => updateCarStatus(car.id, e.target.value as any)}
                              >
                                <option value="available">Sotuvda</option>
                                <option value="reserved">Band qilish</option>
                                <option value="sold">Sotildi</option>
                              </select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteCar(car.id)}
                                className="h-7 w-7 text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 p-0 rounded-lg"
                                title="Katalogdan o'chirish"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Test Drive appointments */}
          <Card className="bg-[#111111]/80 border-white/5">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                Test-Drive Navbatlari
              </CardTitle>
              <CardDescription>Mijozlar buyurtma qilgan sinov darslari va vaqtlari</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testDrives.length === 0 ? (
                  <p className="text-xs text-white/30 text-center py-6">Kutilayotgan test-drayvlar yo'q</p>
                ) : (
                  testDrives.map((td) => (
                    <div key={td.id} className="p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
                      <div className="flex gap-3 items-start">
                        <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                          <Gauge className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white">{td.car_name}</p>
                          <p className="text-xs text-white/50 mt-0.5">Mijoz: <span className="text-white">{td.customer_name}</span> ({td.customer_phone})</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-left sm:text-right text-xs">
                          <p className="font-semibold text-white">{td.date}</p>
                          <p className="text-white/40 mt-0.5">{td.time}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {td.status === 'pending' ? (
                            <>
                              <Button 
                                size="sm"
                                onClick={() => {
                                  setTestDrives(prev => prev.map(item => item.id === td.id ? { ...item, status: 'completed' as const } : item));
                                  toast({ title: 'Muvaffaqiyatli', description: 'Test-drive bajarildi deb belgilandi' });
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-7 rounded-lg text-[10px] px-2.5"
                              >
                                Yakunlash
                              </Button>
                              <Button 
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setTestDrives(prev => prev.map(item => item.id === td.id ? { ...item, status: 'cancelled' as const } : item));
                                  toast({ title: 'Bekor qilindi', description: 'Test-drive bekor qilindi' });
                                }}
                                className="text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 h-7 rounded-lg text-[10px] px-2.5"
                              >
                                Bekor qilish
                              </Button>
                            </>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                              td.status === 'completed' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {td.status === 'completed' ? 'Bajarildi' : 'Bekor qilingan'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leasing calculator & Deals pipeline (Right panel) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Interactive Calculator */}
          <Card className="bg-[#111111]/80 border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[150px] h-[150px] rounded-full bg-blue-500/5 blur-[50px] pointer-events-none" />
            <CardHeader>
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-500" />
                Lizing & Kredit Hisoblagich
              </CardTitle>
              <CardDescription>Boshlang'ich foiz: {calcApr}% APR (Super admin sozlamasi)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 text-xs text-white/80">
              
              <div className="space-y-2">
                <div className="flex justify-between font-semibold">
                  <span>Avtomobil Narxi</span>
                  <span className="text-white font-bold">{calcCarPrice.toLocaleString()} UZS</span>
                </div>
                <input 
                  type="range"
                  min="100000000"
                  max="1500000000"
                  step="50000000"
                  value={calcCarPrice}
                  onChange={(e) => setCalcCarPrice(Number(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-semibold">
                  <span>Boshlang'ich To'lov</span>
                  <span className="text-white font-bold">{calcDownPayment.toLocaleString()} UZS ({Math.round((calcDownPayment/calcCarPrice)*100)}%)</span>
                </div>
                <input 
                  type="range"
                  min={Math.round(calcCarPrice * 0.15)}
                  max={Math.round(calcCarPrice * 0.8)}
                  step="10000000"
                  value={calcDownPayment}
                  onChange={(e) => setCalcDownPayment(Number(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-semibold">
                  <span>Muddati (Oy)</span>
                  <span className="text-white font-bold">{calcMonths} oy</span>
                </div>
                <div className="flex gap-2">
                  {[12, 24, 36, 48].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCalcMonths(m)}
                      className={`flex-1 py-1.5 rounded-lg border text-center transition-all ${
                        calcMonths === m 
                          ? 'border-blue-500 bg-blue-500/10 text-white font-bold' 
                          : 'border-white/5 bg-white/[0.01] hover:border-white/10'
                      }`}
                    >
                      {m} oy
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-2.5">
                <div className="flex justify-between text-white/50 text-[10px] font-bold uppercase tracking-wider">
                  <span>Qarz miqdori</span>
                  <span>Oylik to'lov</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-white/60 font-semibold">{loanAmount.toLocaleString()} UZS</span>
                  <span className="text-lg font-black text-white">{calculatedMonthlyPayment.toLocaleString()} UZS</span>
                </div>
                <Button 
                  onClick={() => {
                    toast({
                      title: "Lizing hisob-kitobi saqlandi",
                      description: `Oylik to'lov: ${calculatedMonthlyPayment.toLocaleString()} UZS. Shartnoma yuklanishga tayyor.`
                    });
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 rounded-lg mt-1"
                >
                  Shartnoma Loyihasini Yaratish
                </Button>
              </div>

            </CardContent>
          </Card>

          {/* CRM pipeline leads */}
          <Card className="bg-[#111111]/80 border-white/5">
            <CardHeader>
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Sotuv CRM Voronkasi
              </CardTitle>
              <CardDescription>Faol mijozlar va bitimlar oqimi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deals.map((deal) => (
                  <div key={deal.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-white text-xs">{deal.customer_name}</p>
                        <p className="text-[10px] text-white/40 mt-0.5">{deal.customer_phone}</p>
                      </div>
                      <span className="font-bold text-white text-xs">{deal.deal_amount.toLocaleString()} UZS</span>
                    </div>
                    
                    <div className="text-[10px] text-white/60 bg-white/5 p-2 rounded-lg flex justify-between">
                      <span>Model: <strong>{deal.car_model}</strong></span>
                      <span>{deal.duration_months} oy / Lizing</span>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[9px] text-white/40 font-semibold uppercase">
                        <span>Bosqich</span>
                        <span className="text-emerald-400">
                          {deal.stage === 'interest' ? 'Qiziqish bildirdi' : 
                           deal.stage === 'finance_approval' ? 'Kredit tasdiqlanmoqda' : 
                           deal.stage === 'contract_pending' ? 'Hujjatlar kutilmoqda' : 'Avtomobil topshirildi'}
                        </span>
                      </div>
                      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all" style={{ 
                          width: deal.stage === 'interest' ? '25%' : 
                                 deal.stage === 'finance_approval' ? '50%' : 
                                 deal.stage === 'contract_pending' ? '75%' : '100%' 
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
        </div>

      </div>

      {/* Add Car Modal dialog */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#121212] border border-white/10 rounded-3xl w-full max-w-md p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Yangi Avtomobil Qo'shish</h3>
              <p className="text-xs text-muted-foreground">Katalogda namoyish etiladigan avtomobil ma'lumotlari</p>
            </div>
            <form onSubmit={handleAddCar} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-white/80 font-bold">Brend (Brand)</Label>
                  <Input 
                    value={newCar.brand}
                    onChange={(e) => setNewCar({...newCar, brand: e.target.value})}
                    placeholder="Masalan: BYD, Chevrolet"
                    className="bg-white/5 border-white/10 text-white rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/80 font-bold">Model</Label>
                  <Input 
                    value={newCar.model}
                    onChange={(e) => setNewCar({...newCar, model: e.target.value})}
                    placeholder="Masalan: Song Plus, Tahoe"
                    className="bg-white/5 border-white/10 text-white rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-white/80 font-bold">Rangi (Color)</Label>
                  <Input 
                    value={newCar.color}
                    onChange={(e) => setNewCar({...newCar, color: e.target.value})}
                    placeholder="Pearl White"
                    className="bg-white/5 border-white/10 text-white rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/80 font-bold">Ishlab chiqarilgan yili</Label>
                  <Input 
                    type="number"
                    value={newCar.year}
                    onChange={(e) => setNewCar({...newCar, year: Number(e.target.value)})}
                    className="bg-white/5 border-white/10 text-white rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/80 font-bold">Narxi (UZS)</Label>
                <Input 
                  type="number"
                  value={newCar.price}
                  onChange={(e) => setNewCar({...newCar, price: Number(e.target.value)})}
                  className="bg-white/5 border-white/10 text-white rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/80 font-bold">Dvigatel turi</Label>
                <select
                  value={newCar.engine}
                  onChange={(e) => setNewCar({...newCar, engine: e.target.value})}
                  className="w-full h-10 px-3 bg-[#171717] border border-white/10 rounded-xl text-white"
                >
                  <option value="Electro">Electro (Elektr)</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Petrol">Petrol (Benzin)</option>
                </select>
              </div>

              {newCar.engine === 'Electro' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-white/80 font-bold">Batareya quvvati</Label>
                    <Input 
                      value={newCar.battery_capacity}
                      onChange={(e) => setNewCar({...newCar, battery_capacity: e.target.value})}
                      placeholder="71.7 kWh"
                      className="bg-white/5 border-white/10 text-white rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white/80 font-bold">Masofa (Range km)</Label>
                    <Input 
                      type="number"
                      value={newCar.range_km}
                      onChange={(e) => setNewCar({...newCar, range_km: Number(e.target.value)})}
                      className="bg-white/5 border-white/10 text-white rounded-xl"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl h-10 px-4 text-white/70"
                >
                  Bekor qilish
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-10 px-5"
                >
                  Saqlash
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
