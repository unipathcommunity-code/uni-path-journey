import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  MapPin, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  DollarSign
} from 'lucide-react';

interface ParkingSession {
  id: string;
  plate_number: string;
  slot_name: string;
  zone: string;
  status: 'active' | 'completed';
  started_at: string;
  amount_due: number;
}

export default function AdminParking() {
  const { activeTenant } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Forms
  const [isParkingModalOpen, setIsParkingModalOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    plate_number: '',
    slot_name: 'A-12',
    zone: 'Zone A',
    status: 'active' as ParkingSession['status'],
    started_at: new Date().toISOString()
  });

  useEffect(() => {
    async function fetchData() {
      if (!activeTenant) { setLoading(false); return; }
      try {
        setLoading(true);
        const mockSessions: ParkingSession[] = [
          { id: '1', plate_number: '01 A 777 AA', slot_name: 'A-05', zone: 'Zone A', status: 'active', started_at: new Date(Date.now() - 3600000 * 2).toISOString(), amount_due: 15000 },
          { id: '2', plate_number: '01 X 100 XX', slot_name: 'B-14', zone: 'Zone B', status: 'active', started_at: new Date(Date.now() - 3600000 * 4).toISOString(), amount_due: 30000 },
          { id: '3', plate_number: '10 Y 999 YY', slot_name: 'C-02', zone: 'Zone C', status: 'completed', started_at: new Date(Date.now() - 3600000 * 8).toISOString(), amount_due: 50000 }
        ];
        setSessions(mockSessions);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [activeTenant]);

  const handleStartParking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSession.plate_number) {
      toast({ title: 'Xatolik', description: 'Avtomobil davlat raqamini kiriting!', variant: 'destructive' });
      return;
    }

    const session: ParkingSession = {
      id: Math.random().toString(36).substring(2, 9),
      plate_number: newSession.plate_number.toUpperCase(),
      slot_name: newSession.slot_name,
      zone: newSession.zone,
      status: newSession.status,
      started_at: newSession.started_at,
      amount_due: 5000 // initial base fee
    };

    setSessions([session, ...sessions]);
    setIsParkingModalOpen(false);
    setNewSession({
      plate_number: '',
      slot_name: 'A-12',
      zone: 'Zone A',
      status: 'active',
      started_at: new Date().toISOString()
    });

    toast({
      title: "Muvaffaqiyatli",
      description: "Avtoturargoh sessiyasi faollashtirildi!"
    });
  };

  const filteredSessions = sessions.filter(s => 
    s.plate_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.slot_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in text-foreground">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Car className="w-8 h-8 text-blue-500" />
            Smart Avtoturargoh Boshqaruvi
          </h1>
          <p className="text-sm text-muted-foreground">
            Avtoturargoh joylari, kelgan-ketgan avtomobillar va to'lovlarni boshqarish
          </p>
        </div>
        <Button 
          onClick={() => setIsParkingModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2 font-bold"
        >
          <Plus className="w-5 h-5" />
          Mashina Qo'shish (Entry)
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Joriy band joylar</CardTitle>
            <Car className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter(s => s.status === 'active').length} / 120
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Hozirda band qilingan joylar soni</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Bo'sh Joylar</CardTitle>
            <MapPin className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {120 - sessions.filter(s => s.status === 'active').length} ta
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Zaxiradagi bo'sh joylar soni</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Bugungi Kelishlar</CardTitle>
            <Clock className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48 ta mashina</div>
            <p className="text-[10px] text-muted-foreground mt-1">Kunlik umumiy aylanma</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Kunlik Tushum</CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">420,000 UZS</div>
            <p className="text-[10px] text-muted-foreground mt-1">Haqiqiy olingan to'lovlar</p>
          </CardContent>
        </Card>
      </div>

      {/* Parking Grid */}
      <Card className="glass-card border-white/5">
        <CardHeader className="pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-lg font-bold">Joriy Sessiyalar (Kelgan mashinalar)</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Turargohda turgan yoki yaqinda ketgan avtotransport vositalari</CardDescription>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Davlat raqami yoki joyni qidirish..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 border-white/10 rounded-xl"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-foreground/80">
              <thead className="text-xs uppercase bg-white/5 text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3">Davlat Raqami</th>
                  <th className="px-4 py-3">Joy (Slot)</th>
                  <th className="px-4 py-3">Zona</th>
                  <th className="px-4 py-3">Kirish Vaqti</th>
                  <th className="px-4 py-3">Hisoblangan to'lov</th>
                  <th className="px-4 py-3">Holat</th>
                  <th className="px-4 py-3 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredSessions.map(s => (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4.5 font-bold tracking-wider">{s.plate_number}</td>
                    <td className="px-4 py-4.5 font-medium text-blue-400">{s.slot_name}</td>
                    <td className="px-4 py-4.5">{s.zone}</td>
                    <td className="px-4 py-4.5">{new Date(s.started_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td className="px-4 py-4.5">{s.amount_due.toLocaleString()} UZS</td>
                    <td className="px-4 py-4.5">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                        s.status === 'active' 
                          ? 'bg-blue-500/10 text-blue-400' 
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {s.status === 'active' ? 'Faol' : 'Tugallangan'}
                      </span>
                    </td>
                    <td className="px-4 py-4.5 text-right">
                      {s.status === 'active' && (
                        <Button 
                          onClick={() => {
                            setSessions(prev => prev.map(item => item.id === s.id ? { ...item, status: 'completed' as const } : item));
                            toast({ title: 'Muvaffaqiyatli', description: `Mashina chiqishi va to'lov tasdiqlandi: ${s.amount_due} UZS` });
                          }}
                          variant="outline" 
                          size="sm" 
                          className="border-white/10 hover:bg-emerald-500 hover:text-white transition-all text-xs rounded-lg"
                        >
                          Chiqish (Checkout)
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Parking Modal */}
      {isParkingModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-lg font-bold text-foreground">Yangi Avtomobil Kirishi (Check-in)</h3>
            <form onSubmit={handleStartParking} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="plate" className="text-xs font-semibold text-muted-foreground">Davlat Raqami</Label>
                <Input 
                  id="plate"
                  placeholder="Masalan: 01 A 777 AA"
                  value={newSession.plate_number}
                  onChange={(e) => setNewSession({ ...newSession, plate_number: e.target.value })}
                  className="bg-background/50 border-white/10 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="zone" className="text-xs font-semibold text-muted-foreground">Turargoh Zonasi</Label>
                  <select 
                    id="zone"
                    value={newSession.zone}
                    onChange={(e) => setNewSession({ ...newSession, zone: e.target.value })}
                    className="w-full bg-background/50 border border-white/10 rounded-xl p-2.5 text-sm text-foreground outline-none"
                  >
                    <option value="Zone A">Zona A (V.I.P)</option>
                    <option value="Zone B">Zona B (Standart)</option>
                    <option value="Zone C">Zona C (Xodimlar)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="slot" className="text-xs font-semibold text-muted-foreground">Slot (Joy raqami)</Label>
                  <Input 
                    id="slot"
                    placeholder="Masalan: A-12"
                    value={newSession.slot_name}
                    onChange={(e) => setNewSession({ ...newSession, slot_name: e.target.value })}
                    className="bg-background/50 border-white/10 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsParkingModalOpen(false)}
                  className="rounded-xl"
                >
                  Bekor qilish
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                >
                  Faollashtirish
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
