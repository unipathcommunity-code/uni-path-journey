import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Gem,
  Plus, 
  Search, 
  Calendar, 
  Users, 
  DollarSign, 
  Clock, 
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface EventBooking {
  id: string;
  client_name: string;
  phone: string;
  event_date: string;
  hall_name: string;
  guest_count: number;
  total_price: number;
  advance_payment: number;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
}

export default function AdminWeddingHall() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookings, setBookings] = useState<EventBooking[]>([
    {
      id: '1',
      client_name: 'Anvar Rahimov',
      phone: '+998 90 123 45 67',
      event_date: '2026-06-15',
      hall_name: 'Premium Zalda (Oltin)',
      guest_count: 350,
      total_price: 45000000,
      advance_payment: 15000000,
      status: 'confirmed'
    },
    {
      id: '2',
      client_name: 'Sardor Alimov',
      phone: '+998 93 987 65 43',
      event_date: '2026-06-22',
      hall_name: 'Versal Zali',
      guest_count: 280,
      total_price: 38000000,
      advance_payment: 10000000,
      status: 'pending'
    },
    {
      id: '3',
      client_name: 'Dilnoza Karimova',
      phone: '+998 94 333 22 11',
      event_date: '2026-05-18',
      hall_name: 'Chinnigullar Zali',
      guest_count: 400,
      total_price: 50000000,
      advance_payment: 50000000,
      status: 'completed'
    }
  ]);

  const [newBooking, setNewBooking] = useState({
    client_name: '',
    phone: '',
    event_date: '',
    hall_name: 'Premium Zalda (Oltin)',
    guest_count: 300,
    total_price: 35000000,
    advance_payment: 10000000,
    status: 'pending' as EventBooking['status']
  });

  const handleAddBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.client_name || !newBooking.event_date || !newBooking.phone) {
      toast({
        title: 'Xatolik',
        description: 'Iltimos, barcha majburiy maydonlarni to\'ldiring!',
        variant: 'destructive'
      });
      return;
    }

    const booking: EventBooking = {
      id: Math.random().toString(36).substring(2, 9),
      ...newBooking,
      guest_count: Number(newBooking.guest_count),
      total_price: Number(newBooking.total_price),
      advance_payment: Number(newBooking.advance_payment)
    };

    setBookings([booking, ...bookings]);
    setIsModalOpen(false);
    setNewBooking({
      client_name: '',
      phone: '',
      event_date: '',
      hall_name: 'Premium Zalda (Oltin)',
      guest_count: 300,
      total_price: 35000000,
      advance_payment: 10000000,
      status: 'pending'
    });

    toast({
      title: 'Muvaffaqiyatli',
      description: 'Yangi to\'y/marosim buyurtmasi muvaffaqiyatli qo\'shildi!'
    });
  };

  const handleDelete = (id: string) => {
    setBookings(bookings.filter(b => b.id !== id));
    toast({
      title: 'O\'chirildi',
      description: 'Buyurtma ro\'yxatdan o\'chirildi.'
    });
  };

  const handleStatusChange = (id: string, status: EventBooking['status']) => {
    setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
    toast({
      title: 'Status yangilandi',
      description: `Buyurtma statusi "${status}" ga o'zgartirildi.`
    });
  };

  const filteredBookings = bookings.filter(b => 
    b.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.hall_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.phone.includes(searchQuery)
  );

  const totalRevenue = bookings.reduce((sum, b) => b.status === 'completed' ? sum + b.total_price : sum, 0);
  const totalPending = bookings.reduce((sum, b) => b.status !== 'cancelled' ? sum + (b.total_price - b.advance_payment) : sum, 0);

  return (
    <div className="p-6 space-y-6 animate-fade-in text-foreground">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Gem className="w-7 h-7 text-pink-500" />
            To'yxona & Marosimlar Saroyi Boshqaruvi
          </h1>
          <p className="text-sm text-muted-foreground">
            Tantanalar zali bandligi, mijozlar buyurtmalari va moliyaviy hisob-kitoblar
          </p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-pink-600 hover:bg-pink-700 text-white rounded-xl gap-2 font-bold transition-all hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          Yangi Buyurtma Qo'shish
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Jami buyurtmalar</CardTitle>
            <Calendar className="w-4 h-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length} ta</div>
            <p className="text-[10px] text-muted-foreground mt-1">Tizimdagi jami tadbirlar</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Kutilayotgan Mehmonlar</CardTitle>
            <Users className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookings.reduce((sum, b) => b.status === 'confirmed' || b.status === 'pending' ? sum + b.guest_count : sum, 0)} nafar
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Yaqindagi tadbirlar bo'yicha</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Tushum (Completed)</CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} UZS</div>
            <p className="text-[10px] text-muted-foreground mt-1">Yakunlangan tadbirlardan daromad</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Kutilayotgan Qoldiq (Debts)</CardTitle>
            <Clock className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{totalPending.toLocaleString()} UZS</div>
            <p className="text-[10px] text-muted-foreground mt-1">Mijozlar tomonidan to'lanishi kerak</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Mijoz ismi yoki zal bo'yicha qidirish..."
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
                  <th className="px-6 py-4">Mijoz va Telefon</th>
                  <th className="px-6 py-4">Sana</th>
                  <th className="px-6 py-4">Zal nomi</th>
                  <th className="px-6 py-4 text-center">Mehmonlar</th>
                  <th className="px-6 py-4">Umumiy Summa</th>
                  <th className="px-6 py-4">Zakat (Advance)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-muted-foreground">
                      Buyurtmalar topilmadi.
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
                          <span>{b.event_date}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{b.hall_name}</td>
                      <td className="px-6 py-4 text-center font-medium">{b.guest_count}</td>
                      <td className="px-6 py-4 font-semibold">{b.total_price.toLocaleString()} UZS</td>
                      <td className="px-6 py-4 text-emerald-500 font-medium">
                        {b.advance_payment.toLocaleString()} UZS
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          b.status === 'confirmed' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          b.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          b.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {b.status === 'confirmed' && 'Tasdiqlangan'}
                          {b.status === 'pending' && 'Kutilmoqda'}
                          {b.status === 'completed' && 'Yakunlangan'}
                          {b.status === 'cancelled' && 'Bekor qilingan'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {b.status === 'pending' && (
                            <Button 
                              onClick={() => handleStatusChange(b.id, 'confirmed')} 
                              size="sm" 
                              variant="outline" 
                              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 h-8 text-xs rounded-lg"
                            >
                              Tasdiqlash
                            </Button>
                          )}
                          {b.status === 'confirmed' && (
                            <Button 
                              onClick={() => handleStatusChange(b.id, 'completed')} 
                              size="sm" 
                              variant="outline" 
                              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 h-8 text-xs rounded-lg"
                            >
                              Yakunlash
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
          <Card className="w-full max-w-lg glass-card border-white/10 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Gem className="w-5 h-5 text-pink-500" />
                Yangi buyurtma rasmiylashtirish
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddBooking} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Mijozning to'liq ismi *</Label>
                  <Input
                    id="client_name"
                    required
                    placeholder="Masalan: Sardor Alimov"
                    className="bg-background/50 border-white/10 rounded-lg"
                    value={newBooking.client_name}
                    onChange={(e) => setNewBooking({ ...newBooking, client_name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon raqami *</Label>
                    <Input
                      id="phone"
                      required
                      placeholder="+998 90 123 45 67"
                      className="bg-background/50 border-white/10 rounded-lg"
                      value={newBooking.phone}
                      onChange={(e) => setNewBooking({ ...newBooking, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event_date">Tadbir sanasi *</Label>
                    <Input
                      id="event_date"
                      type="date"
                      required
                      className="bg-background/50 border-white/10 rounded-lg text-foreground"
                      value={newBooking.event_date}
                      onChange={(e) => setNewBooking({ ...newBooking, event_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hall_name">Zal turi</Label>
                    <select
                      id="hall_name"
                      className="w-full bg-background border border-white/10 rounded-lg h-10 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      value={newBooking.hall_name}
                      onChange={(e) => setNewBooking({ ...newBooking, hall_name: e.target.value })}
                    >
                      <option value="Premium Zalda (Oltin)">Premium Zalda (Oltin)</option>
                      <option value="Versal Zali">Versal Zali</option>
                      <option value="Chinnigullar Zali">Chinnigullar Zali</option>
                      <option value="Yozgi Bog' Zali">Yozgi Bog' Zali</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guest_count">Mehmonlar soni</Label>
                    <Input
                      id="guest_count"
                      type="number"
                      className="bg-background/50 border-white/10 rounded-lg"
                      value={newBooking.guest_count}
                      onChange={(e) => setNewBooking({ ...newBooking, guest_count: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="total_price">Umumiy buyurtma summasi (UZS)</Label>
                    <Input
                      id="total_price"
                      type="number"
                      className="bg-background/50 border-white/10 rounded-lg"
                      value={newBooking.total_price}
                      onChange={(e) => setNewBooking({ ...newBooking, total_price: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="advance_payment">Zakat (Advance Payment)</Label>
                    <Input
                      id="advance_payment"
                      type="number"
                      className="bg-background/50 border-white/10 rounded-lg"
                      value={newBooking.advance_payment}
                      onChange={(e) => setNewBooking({ ...newBooking, advance_payment: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-lg"
                  >
                    Bekor qilish
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-pink-600 hover:bg-pink-700 text-white rounded-lg px-6 font-bold"
                  >
                    Buyurtmani saqlash
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
