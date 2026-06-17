import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  DollarSign, 
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface StadiumBooking {
  id: string;
  client_name: string;
  phone: string;
  booking_date: string;
  start_time: string;
  duration_hours: number;
  field_name: string;
  total_price: number;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export default function AdminStadium() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookings, setBookings] = useState<StadiumBooking[]>([
    {
      id: '1',
      client_name: 'Farhod Alimov',
      phone: '+998 90 123 45 67',
      booking_date: '2026-05-23',
      start_time: '18:00',
      duration_hours: 2,
      field_name: 'A-Stadion (Yopiq)',
      total_price: 300000,
      status: 'confirmed'
    },
    {
      id: '2',
      client_name: 'Bobur Karimov',
      phone: '+998 93 987 65 43',
      booking_date: '2026-05-23',
      start_time: '20:00',
      duration_hours: 1.5,
      field_name: 'B-Stadion (Ochiq)',
      total_price: 180000,
      status: 'pending'
    },
    {
      id: '3',
      client_name: 'Nodir Salimov',
      phone: '+998 94 333 22 11',
      booking_date: '2026-05-24',
      start_time: '16:00',
      duration_hours: 1,
      field_name: 'C-Mini Futbol',
      total_price: 100000,
      status: 'confirmed'
    }
  ]);

  const [newBooking, setNewBooking] = useState({
    client_name: '',
    phone: '',
    booking_date: new Date().toISOString().split('T')[0],
    start_time: '18:00',
    duration_hours: 2,
    field_name: 'A-Stadion (Yopiq)',
    total_price: 300000,
    status: 'pending' as StadiumBooking['status']
  });

  const handleAddBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.client_name || !newBooking.phone || !newBooking.booking_date) {
      toast({
        title: 'Xatolik',
        description: 'Iltimos, barcha maydonlarni kiriting!',
        variant: 'destructive'
      });
      return;
    }

    const booking: StadiumBooking = {
      id: Math.random().toString(36).substring(2, 9),
      ...newBooking,
      duration_hours: Number(newBooking.duration_hours),
      total_price: Number(newBooking.total_price)
    };

    setBookings([booking, ...bookings]);
    setIsModalOpen(false);
    setNewBooking({
      client_name: '',
      phone: '',
      booking_date: new Date().toISOString().split('T')[0],
      start_time: '18:00',
      duration_hours: 2,
      field_name: 'A-Stadion (Yopiq)',
      total_price: 300000,
      status: 'pending'
    });

    toast({
      title: 'Muvaffaqiyatli',
      description: 'Stadion bandligi muvaffaqiyatli ro\'yxatga olindi!'
    });
  };

  const handleDelete = (id: string) => {
    setBookings(bookings.filter(b => b.id !== id));
    toast({
      title: 'O\'chirildi',
      description: 'Stadion buyurtmasi ro\'yxatdan o\'chirildi.'
    });
  };

  const handleStatusChange = (id: string, status: StadiumBooking['status']) => {
    setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
    toast({
      title: 'Status yangilandi',
      description: `Buyurtma statusi "${status}" ga o'zgartirildi.`
    });
  };

  const filteredBookings = bookings.filter(b => 
    b.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.field_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.phone.includes(searchQuery)
  );

  const totalRevenue = bookings.reduce((sum, b) => b.status === 'confirmed' ? sum + b.total_price : sum, 0);

  return (
    <div className="p-6 space-y-6 animate-fade-in text-foreground">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="w-8 h-8 text-emerald-500 animate-pulse" />
            Stadion & Sport Maydonlari Bandlik Tizimi
          </h1>
          <p className="text-sm text-muted-foreground">
            Futbol, basketbol va boshqa sport maydonlari ijarasi, soatlar bo'yicha bandlik jadvali
          </p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 font-bold transition-all hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          Yangi Bandlik (Booking)
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Jami Bandliklar</CardTitle>
            <Calendar className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length} ta</div>
            <p className="text-[10px] text-muted-foreground mt-1">Hozirgacha ro'yxatga olinganlar</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Faol Soatlar (Bugun)</CardTitle>
            <Clock className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookings.reduce((sum, b) => b.booking_date === '2026-05-23' && b.status === 'confirmed' ? sum + b.duration_hours : sum, 0)} soat
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Bugungi o'yinlar davomiyligi</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Daromad (Confirmed)</CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} UZS</div>
            <p className="text-[10px] text-muted-foreground mt-1">Tasdiqlangan o'yinlar to'lovlari</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Kutilayotganlar</CardTitle>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">
              {bookings.filter(b => b.status === 'pending').length} ta
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Tasdiqlanish kutilayotgan buyurtmalar</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Mijoz ismi yoki stadion bo'yicha..."
              className="pl-9 bg-background/50 border-white/10 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Card className="glass-card border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-white/5">
                <tr>
                  <th className="px-6 py-4">Mijoz ismi va Telefon</th>
                  <th className="px-6 py-4">O'yin sanasi va soati</th>
                  <th className="px-6 py-4">Stadion</th>
                  <th className="px-6 py-4 text-center">Davomiyligi</th>
                  <th className="px-6 py-4">To'lov summasi</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">
                      Bandliklar topilmadi.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold">{b.client_name}</div>
                        <div className="text-xs text-muted-foreground">{b.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{b.booking_date} ({b.start_time})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{b.field_name}</td>
                      <td className="px-6 py-4 text-center font-medium">{b.duration_hours} soat</td>
                      <td className="px-6 py-4 font-semibold">{b.total_price.toLocaleString()} UZS</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          b.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          b.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {b.status === 'confirmed' ? 'Tasdiqlangan' : b.status === 'pending' ? 'Kutilmoqda' : 'Bekor qilingan'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {b.status === 'pending' && (
                            <Button 
                              onClick={() => handleStatusChange(b.id, 'confirmed')} 
                              size="sm" 
                              variant="outline" 
                              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 h-8 text-xs rounded-lg"
                            >
                              Tasdiqlash
                            </Button>
                          )}
                          <Button 
                            onClick={() => handleDelete(b.id)} 
                            size="sm" 
                            variant="ghost" 
                            className="text-red-400 hover:bg-red-500/10 h-8 p-2 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* New Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md glass-card border-white/10 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-emerald-400">
                <Plus className="w-6 h-6" />
                Yangi stadion ijarasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddBooking} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cust_name">Mijoz ismi *</Label>
                  <Input
                    id="cust_name"
                    required
                    placeholder="Masalan: Sardor Salimov"
                    className="bg-background/50 border-white/10 rounded-lg"
                    value={newBooking.client_name}
                    onChange={(e) => setNewBooking({ ...newBooking, client_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cust_phone">Telefon raqami *</Label>
                  <Input
                    id="cust_phone"
                    required
                    placeholder="+998 90 123 45 67"
                    className="bg-background/50 border-white/10 rounded-lg"
                    value={newBooking.phone}
                    onChange={(e) => setNewBooking({ ...newBooking, phone: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="game_date">O'yin sanasi *</Label>
                    <Input
                      id="game_date"
                      type="date"
                      required
                      className="bg-background/50 border-white/10 rounded-lg text-foreground"
                      value={newBooking.booking_date}
                      onChange={(e) => setNewBooking({ ...newBooking, booking_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="game_time">Boshlanish vaqti *</Label>
                    <Input
                      id="game_time"
                      placeholder="Masalan: 18:00"
                      required
                      className="bg-background/50 border-white/10 rounded-lg"
                      value={newBooking.start_time}
                      onChange={(e) => setNewBooking({ ...newBooking, start_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="game_duration">Davomiyligi (Soat)</Label>
                    <Input
                      id="game_duration"
                      type="number"
                      step={0.5}
                      className="bg-background/50 border-white/10 rounded-lg"
                      value={newBooking.duration_hours}
                      onChange={(e) => setNewBooking({ ...newBooking, duration_hours: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="game_field">Stadion zali</Label>
                    <select
                      id="game_field"
                      className="w-full bg-background border border-white/10 rounded-lg h-10 px-3 text-sm text-foreground focus:outline-none"
                      value={newBooking.field_name}
                      onChange={(e) => setNewBooking({ ...newBooking, field_name: e.target.value })}
                    >
                      <option value="A-Stadion (Yopiq)">A-Stadion (Yopiq) - 150,000 UZS/soat</option>
                      <option value="B-Stadion (Ochiq)">B-Stadion (Ochiq) - 120,000 UZS/soat</option>
                      <option value="C-Mini Futbol">C-Mini Futbol - 100,000 UZS/soat</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="game_price">To'lov summasi (UZS)</Label>
                  <Input
                    id="game_price"
                    type="number"
                    className="bg-background/50 border-white/10 rounded-lg"
                    value={newBooking.total_price}
                    onChange={(e) => setNewBooking({ ...newBooking, total_price: Number(e.target.value) })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                    Bekor qilish
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-6 font-bold">
                    Band qilish
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
