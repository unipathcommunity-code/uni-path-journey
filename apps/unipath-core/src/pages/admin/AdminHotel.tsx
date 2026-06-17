import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Bed, 
  Plus, 
  Calendar, 
  Clock, 
  UserCheck, 
  DollarSign, 
  ShieldAlert, 
  Grid, 
  Star,
  Phone,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface HotelRoom {
  id: string;
  room_number: string;
  type: 'single' | 'double' | 'suite' | 'deluxe';
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance';
  price_per_night: number;
}

interface Booking {
  id: string;
  room_id: string;
  guest_name: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  total_amount: number;
  room?: HotelRoom;
}

export default function AdminHotel() {
  const { activeTenant } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Modals / Forms
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomType, setNewRoomType] = useState<'single' | 'double' | 'suite' | 'deluxe'>('single');
  const [newRoomPrice, setNewRoomPrice] = useState('150000');

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<HotelRoom | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkOutDate, setCheckOutDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0] // Tomorrow
  );

  useEffect(() => {
    async function fetchHotelData() {
      if (!activeTenant) return;
      try {
        setLoading(true);
        // Fetch rooms
        const { data: roomsData, error: roomsError } = await supabase
          .from('hotel_rooms')
          .select('*')
          .order('room_number', { ascending: true });

        if (roomsError) throw roomsError;
        setRooms(roomsData || []);

        // Fetch bookings
        const { data: bookingsData } = await supabase
          .from('hotel_bookings')
          .select('*')
          .order('created_at', { ascending: false });

        setBookings(bookingsData || []);
      } catch (err: any) {
        console.error('Error fetching hotel data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchHotelData();
  }, [activeTenant]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber.trim() || !activeTenant) return;

    try {
      const price = parseFloat(newRoomPrice);
      const { data, error } = await supabase
        .from('hotel_rooms')
        .insert({
          tenant_id: activeTenant.id,
          room_number: newRoomNumber,
          type: newRoomType,
          price_per_night: price,
          status: 'available'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Xona qo\'shildi!',
        description: `№ ${newRoomNumber} xonasi muvaffaqiyatli ro'yxatdan o'tdi.`
      });

      setRooms([...rooms, data]);
      setIsRoomModalOpen(false);
      setNewRoomNumber('');
    } catch (err: any) {
      toast({
        title: 'Xatolik',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const handleBookRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !activeTenant) return;

    try {
      const dayDiff = Math.max(
        1,
        Math.ceil(
          (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)
        )
      );
      const totalAmount = dayDiff * selectedRoom.price_per_night;

      const { data: booking, error: bookingError } = await supabase
        .from('hotel_bookings')
        .insert({
          tenant_id: activeTenant.id,
          room_id: selectedRoom.id,
          guest_name: guestName,
          guest_phone: guestPhone,
          check_in: checkInDate,
          check_out: checkOutDate,
          status: 'checked_in',
          total_amount: totalAmount
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Update room status to occupied
      await supabase
        .from('hotel_rooms')
        .update({ status: 'occupied' })
        .eq('id', selectedRoom.id);

      toast({
        title: 'Xona band qilindi (Check-in)!',
        description: `Mehmon ${guestName} № ${selectedRoom.room_number} xonasiga muvaffaqiyatli joylashtirildi.`
      });

      setRooms(rooms.map(r => r.id === selectedRoom.id ? { ...r, status: 'occupied' } : r));
      setBookings([booking, ...bookings]);
      setIsBookingModalOpen(false);
      setGuestName('');
      setGuestPhone('');
    } catch (err: any) {
      toast({
        title: 'Xatolik',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const handleCheckOut = async (bookingId: string, roomId: string) => {
    try {
      // 1. Update Booking Status
      await supabase
        .from('hotel_bookings')
        .update({ status: 'checked_out' })
        .eq('id', bookingId);

      // 2. Set Room Status to Cleaning (Miyoz chiqqandan so'ng tozalash holati)
      await supabase
        .from('hotel_rooms')
        .update({ status: 'cleaning' })
        .eq('id', roomId);

      toast({
        title: 'Check-out yakunlandi!',
        description: 'Xona tozalash (Cleaning) rejimiga o\'tkazildi.'
      });

      setRooms(rooms.map(r => r.id === roomId ? { ...r, status: 'cleaning' } : r));
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'checked_out' } : b));
    } catch (err: any) {
      toast({
        title: 'Xatolik',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const handleSetRoomStatus = async (roomId: string, status: 'available' | 'cleaning' | 'maintenance') => {
    try {
      await supabase
        .from('hotel_rooms')
        .update({ status })
        .eq('id', roomId);

      setRooms(rooms.map(r => r.id === roomId ? { ...r, status } : r));
      toast({
        title: 'Holat o\'zgardi',
        description: `Xona holati "${status}" ga o'zgartirildi.`
      });
    } catch (err: any) {
      toast({
        title: 'Xatolik',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'occupied':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'cleaning':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'maintenance':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Mehmonxona boshqaruvi yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bed className="w-7 h-7 text-primary" /> Mehmonxona va Xonalar Boshqaruvi
          </h1>
          <p className="text-muted-foreground text-sm">Xonalar bandligi, real vaqt rejimidagi tozalash va bron qilish operatsiyalari.</p>
        </div>
        <Button onClick={() => setIsRoomModalOpen(true)} className="gap-2 rounded-xl">
          <Plus className="w-5 h-5" /> Yangi Xona Qo'shish
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Barcha Xonalar</p>
              <p className="text-2xl font-bold text-foreground mt-1">{rooms.length} ta</p>
            </div>
            <Grid className="w-8 h-8 text-muted-foreground/30" />
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Bo'sh xonalar</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{rooms.filter(r => r.status === 'available').length} ta</p>
            </div>
            <CheckCircle className="w-8 h-8 text-emerald-500/20" />
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Band xonalar</p>
              <p className="text-2xl font-bold text-rose-400 mt-1">{rooms.filter(r => r.status === 'occupied').length} ta</p>
            </div>
            <Bed className="w-8 h-8 text-rose-500/20" />
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Tozalanishda</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{rooms.filter(r => r.status === 'cleaning').length} ta</p>
            </div>
            <Star className="w-7 h-7 text-amber-500/20" />
          </CardContent>
        </Card>
      </div>

      {/* Main Grid Rooms Visual Matrix */}
      <Card className="bg-card border border-border">
        <CardHeader>
          <CardTitle>Xonalar Matritsasi (Real-time Room Matrix)</CardTitle>
          <CardDescription>
            Mehmonxonadagi barcha xonalarning vizual holati. Xonani band qilish uchun ustiga bosing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => {
                  if (room.status === 'available') {
                    setSelectedRoom(room);
                    setIsBookingModalOpen(true);
                  }
                }}
                className={`p-4 rounded-2xl border text-center relative transition-all duration-200 cursor-pointer ${
                  room.status === 'available' ? 'hover:scale-[1.03] hover:shadow-lg' : ''
                } ${getStatusBadge(room.status)}`}
              >
                <div className="text-xl font-bold">№ {room.room_number}</div>
                <div className="text-[10px] uppercase font-bold tracking-wider opacity-80 mt-1">{room.type}</div>
                <div className="text-[11px] font-semibold mt-2">{room.price_per_night.toLocaleString()} UZS</div>
                
                {/* Overlay quick actions for status switching */}
                {room.status === 'cleaning' && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetRoomStatus(room.id, 'available');
                    }}
                    className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center rounded-2xl text-[10px] font-bold text-white transition-opacity"
                  >
                    Tozalash Yakunlandi
                  </button>
                )}

                {room.status === 'maintenance' && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetRoomStatus(room.id, 'available');
                    }}
                    className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center rounded-2xl text-[10px] font-bold text-white transition-opacity"
                  >
                    Ta'mirlash Tugadi
                  </button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bookings & Active checkins list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Bookings */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-lg">Joriy Joylashtirishlar va Bronlar</CardTitle>
              <CardDescription>Barcha ro'yxatdan o'tgan mehmonlar va check-in jurnali</CardDescription>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Hozircha hech qanday mehmon ro'yxatda yo'q.</div>
              ) : (
                <div className="divide-y divide-border">
                  {bookings.map((booking) => {
                    const room = rooms.find(r => r.id === booking.room_id);
                    return (
                      <div key={booking.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">{booking.guest_name}</span>
                            <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-semibold">
                              Room № {room?.room_number || 'N/A'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" /> {booking.guest_phone}
                          </p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-3">
                            <span>Check-in: <b className="text-foreground">{booking.check_in}</b></span>
                            <span>Check-out: <b className="text-foreground">{booking.check_out}</b></span>
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <div className="text-right sm:text-right shrink-0">
                            <p className="text-xs text-muted-foreground">Umumiy Summa</p>
                            <p className="font-bold text-primary text-sm">{booking.total_amount.toLocaleString()} UZS</p>
                          </div>
                          {booking.status === 'checked_in' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleCheckOut(booking.id, booking.room_id)}
                              className="rounded-lg text-xs"
                            >
                              Check-out
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Room configuration and status overview */}
        <div className="space-y-4">
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-lg">Tezkor Operatsiyalar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase">Xonani Xizmatga O'tkazish</h4>
                <div className="flex gap-2">
                  <select 
                    id="select-room-maint"
                    className="flex-1 h-9 px-3 bg-background border border-border rounded-lg text-xs"
                  >
                    <option value="">Xonani tanlang</option>
                    {rooms.filter(r => r.status === 'available').map(r => (
                      <option key={r.id} value={r.id}>№ {r.room_number}</option>
                    ))}
                  </select>
                  <Button 
                    size="sm"
                    className="text-xs rounded-lg"
                    onClick={() => {
                      const sel = document.getElementById('select-room-maint') as HTMLSelectElement;
                      if (sel.value) {
                        handleSetRoomStatus(sel.value, 'maintenance');
                        sel.value = '';
                      }
                    }}
                  >
                    Ta'mirga yuborish
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Room Modal */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm bg-card border border-border shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Yangi Xona Qo'shish</CardTitle>
              <CardDescription>Mehmonxona tizimiga yangi xonani kiriting.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="roomNum" className="text-xs">Xona raqami</Label>
                  <Input 
                    id="roomNum" 
                    placeholder="Masalan: 305" 
                    value={newRoomNumber} 
                    onChange={(e) => setNewRoomNumber(e.target.value)}
                    className="rounded-xl border border-border"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="roomType" className="text-xs">Xona Turi</Label>
                  <select
                    id="roomType"
                    className="w-full h-11 px-3 bg-background border border-border rounded-xl text-sm"
                    value={newRoomType}
                    onChange={(e) => setNewRoomType(e.target.value as any)}
                  >
                    <option value="single">Single (1 kishilik)</option>
                    <option value="double">Double (2 kishilik)</option>
                    <option value="suite">Suite (Premium)</option>
                    <option value="deluxe">Deluxe (Lyuks)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="roomPrice" className="text-xs">Bir kechalik narxi (UZS)</Label>
                  <Input 
                    id="roomPrice" 
                    type="number"
                    value={newRoomPrice} 
                    onChange={(e) => setNewRoomPrice(e.target.value)}
                    className="rounded-xl border border-border"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsRoomModalOpen(false)} className="rounded-xl">
                    Bekor qilish
                  </Button>
                  <Button type="submit" className="rounded-xl font-bold">
                    Xona yaratish
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Booking / Check-in Modal */}
      {isBookingModalOpen && selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-card border border-border shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Joylashtirish (Check-in) — Xona № {selectedRoom.room_number}</CardTitle>
              <CardDescription>Xona turi: {selectedRoom.type.toUpperCase()} · Narxi: {selectedRoom.price_per_night.toLocaleString()} UZS</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBookRoom} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="guestN" className="text-xs">Mehmonning to'liq ismi</Label>
                  <Input 
                    id="guestN" 
                    placeholder="Masalan: Hasan Toshmatov" 
                    value={guestName} 
                    onChange={(e) => setGuestName(e.target.value)}
                    className="rounded-xl border border-border"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="guestP" className="text-xs">Telefon raqami</Label>
                  <Input 
                    id="guestP" 
                    placeholder="+998 (90) 123-45-67" 
                    value={guestPhone} 
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="rounded-xl border border-border"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Check-in sana</Label>
                    <Input 
                      type="date"
                      value={checkInDate} 
                      onChange={(e) => setCheckInDate(e.target.value)}
                      className="rounded-xl border border-border"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Check-out sana</Label>
                    <Input 
                      type="date"
                      value={checkOutDate} 
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="rounded-xl border border-border"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsBookingModalOpen(false)} className="rounded-xl">
                    Bekor qilish
                  </Button>
                  <Button type="submit" className="rounded-xl font-bold">
                    Joylashtirish (Check-in)
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
