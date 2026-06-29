import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import jsPDF from 'jspdf';
import { Modal } from './restaurant/TablesMap';

import { 
  Bed, 
  Plus, 
  Calendar, 
  Clock, 
  UserCheck, 
  DollarSign, 
  ShieldAlert, 
  Grid, 
  Phone,
  CheckCircle,
  HelpCircle,
  X,
  Brush,
  Wrench,
  Receipt,
  User
} from 'lucide-react';

interface HotelRoom {
  id: string;
  room_number: string;
  type: 'single' | 'double' | 'suite' | 'deluxe';
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance';
  price_per_night: number;
  floor: number;
}

interface Booking {
  id: string;
  room_id: string;
  guest_name: string;
  guest_phone: string;
  guest_email?: string;
  check_in: string;
  check_out: string;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  total_amount: number;
  paid_amount: number;
  payment_method?: string;
  note?: string;
  created_at?: string;
}

const db = supabase as any;

export default function AdminHotel() {
  const { activeTenant } = useApp();
  const { toast } = useToast();
  const tid = activeTenant?.id;

  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  // Tabs
  const [activeTab, setActiveTab] = useState('overview');

  // Modals & Forms
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomType, setNewRoomType] = useState<'single' | 'double' | 'suite' | 'deluxe'>('single');
  const [newRoomPrice, setNewRoomPrice] = useState('250000');
  const [newRoomFloor, setNewRoomFloor] = useState('1');

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<HotelRoom | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkOutDate, setCheckOutDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0] // Tomorrow
  );
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [bookingNote, setBookingNote] = useState('');

  // Gantt Calendar Settings
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-indexed

  // RevPAR kalkulyatori uchun foydalanuvchi kiritmalari
  const [customTotalRooms, setCustomTotalRooms] = useState('20');
  const [customOccupancy, setCustomOccupancy] = useState('75');
  const [customAdr, setCustomAdr] = useState('350000');

  const loadHotelData = async () => {
    if (!tid) { setLoading(false); return; }
    try {
      setLoading(true);
      // Fetch rooms
      const { data: roomsData, error: roomsError } = await db
        .from('hotel_rooms')
        .select('*')
        .eq('tenant_id', tid)
        .order('room_number', { ascending: true });

      if (roomsError) throw roomsError;
      setRooms(roomsData || []);

      // Fetch bookings
      const { data: bookingsData } = await db
        .from('hotel_bookings')
        .select('*')
        .eq('tenant_id', tid)
        .order('created_at', { ascending: false });

      setBookings(bookingsData || []);
    } catch (err: any) {
      console.error('Error fetching hotel data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotelData();
  }, [tid]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber.trim() || !tid) return;

    try {
      const price = parseFloat(newRoomPrice);
      const floorNum = parseInt(newRoomFloor) || 1;
      
      const { data, error } = await db
        .from('hotel_rooms')
        .insert({
          tenant_id: tid,
          room_number: newRoomNumber,
          type: newRoomType,
          price_per_night: price,
          floor: floorNum,
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
    if (!selectedRoom || !tid) return;

    try {
      const dayDiff = Math.max(
        1,
        Math.ceil(
          (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)
        )
      );
      const totalAmount = dayDiff * selectedRoom.price_per_night;

      const { data: booking, error: bookingError } = await db
        .from('hotel_bookings')
        .insert({
          tenant_id: tid,
          room_id: selectedRoom.id,
          guest_name: guestName,
          guest_phone: guestPhone,
          check_in: checkInDate,
          check_out: checkOutDate,
          status: 'checked_in',
          total_amount: totalAmount,
          paid_amount: totalAmount, // Paid full in this simple form
          payment_method: paymentMethod,
          note: bookingNote
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Update room status to occupied
      await db
        .from('hotel_rooms')
        .update({ status: 'occupied' })
        .eq('id', selectedRoom.id);

      toast({
        title: 'Xona band qilindi (Check-in)!',
        description: `Mehmon ${guestName} № ${selectedRoom.room_number} xonasiga muvaffaqiyatli joylashtirildi.`
      });

      // Reload
      await loadHotelData();
      setIsBookingModalOpen(false);
      setGuestName('');
      setGuestPhone('');
      setBookingNote('');
    } catch (err: any) {
      toast({
        title: 'Xatolik',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const handleCheckOut = async (bookingId: string, roomId: string) => {
    if (!confirm("Mehmonga chiqish (Check-out) hisobini yopmoqchimisiz?")) return;
    try {
      await db.from('hotel_bookings').update({ status: 'checked_out' }).eq('id', bookingId);
      await db.from('hotel_rooms').update({ status: 'cleaning' }).eq('id', roomId);
      
      toast({
        title: 'Check-out yakunlandi!',
        description: 'Xona tozalash (cleaning) holatiga o\'tkazildi.'
      });
      await loadHotelData();
    } catch (err: any) {
      toast({ title: 'Xatolik', description: err.message, variant: 'destructive' });
    }
  };

  const handleSetRoomStatus = async (roomId: string, status: HotelRoom['status']) => {
    try {
      await db.from('hotel_rooms').update({ status }).eq('id', roomId);
      toast({ title: 'Xona statusi o\'zgardi', description: `Status: ${status}` });
      await loadHotelData();
    } catch (err: any) {
      toast({ title: 'Xatolik', description: err.message, variant: 'destructive' });
    }
  };

  const downloadReceipt = (b: Booking, roomNum: string) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('MEHMONXONA KVITANSIYASI', 105, 40, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Kvitansiya ID: ${b.id.slice(0,8).toUpperCase()}`, 20, 60);
    doc.text(`Mehmon ismi: ${b.guest_name}`, 20, 70);
    doc.text(`Telefon: ${b.guest_phone}`, 20, 80);
    doc.text(`Xona raqami: № ${roomNum}`, 20, 90);
    doc.text(`Kirish sana: ${b.check_in}`, 20, 100);
    doc.text(`Chiqish sana: ${b.check_out}`, 20, 110);
    doc.text(`To'lov turi: ${b.payment_method || 'Naqd'}`, 20, 120);
    
    doc.setFontSize(14);
    doc.text(`Jami Summa: ${b.total_amount.toLocaleString()} so'm`, 20, 140);
    
    doc.save(`kvitansiya-${b.guest_name.replace(/\s+/g, '-')}.pdf`);
  };

  // Gantt Helper Calculations
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const daysCount = getDaysInMonth(currentYear, currentMonth);
  const daysArray = Array.from({ length: daysCount }, (_, i) => i + 1);

  const getMonthName = (m: number) => {
    const names = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Ilyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
    return names[m];
  };

  const getBookingForDate = (roomId: string, day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return bookings.find(b => {
      if (b.room_id !== roomId) return false;
      if (b.status === 'cancelled') return false;
      const chIn = new Date(b.check_in).getTime();
      const chOut = new Date(b.check_out).getTime();
      const cur = new Date(dateStr).getTime();
      return cur >= chIn && cur <= chOut;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mr-2" />
        <span className="text-muted-foreground text-sm font-medium">Mehmonxona yuklanmoqda...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bed className="w-7 h-7 text-primary" /> Mehmonxona & Motel Boshqaruvi
          </h1>
          <p className="text-muted-foreground text-sm">Xonalar bandligi, check-in/check-out ro'yxatlari va interaktiv Gantt kalendari.</p>
        </div>
        <Button onClick={() => setIsRoomModalOpen(true)} className="gap-2 rounded-xl">
          <Plus className="w-5 h-5" /> Yangi Xona Qo'shish
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-fit rounded-xl bg-muted p-1">
          <TabsTrigger value="overview" className="rounded-lg gap-2 text-xs font-semibold">
            <Grid className="w-4 h-4" /> Xonalar xaritasi
          </TabsTrigger>
          <TabsTrigger value="calendar" className="rounded-lg gap-2 text-xs font-semibold">
            <Calendar className="w-4 h-4" /> Gantt Kalendar
          </TabsTrigger>
          <TabsTrigger value="bookings" className="rounded-lg gap-2 text-xs font-semibold">
            <Clock className="w-4 h-4" /> Rezervatsiyalar ro'yxati
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg gap-2 text-xs font-semibold">
            <Receipt className="w-4 h-4" /> Tahlil & RevPAR
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Room Seating Map */}
        <TabsContent value="overview">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {rooms.map(room => {
              const activeBooking = bookings.find(b => b.room_id === room.id && b.status === 'checked_in');
              
              let statusColor = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
              if (room.status === 'occupied') statusColor = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
              if (room.status === 'cleaning') statusColor = 'bg-sky-500/10 text-sky-500 border-sky-500/20';
              if (room.status === 'maintenance') statusColor = 'bg-amber-500/10 text-amber-500 border-amber-500/20';

              return (
                <div
                  key={room.id}
                  onClick={() => {
                    if (room.status === 'available') {
                      setSelectedRoom(room);
                      setIsBookingModalOpen(true);
                    }
                  }}
                  className={`p-4 border rounded-2xl text-center relative transition-all duration-200 cursor-pointer ${
                    room.status === 'available' ? 'hover:scale-[1.03] hover:shadow-lg' : ''
                  } ${statusColor}`}
                >
                  <div className="text-lg font-bold">№ {room.room_number}</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider opacity-80 mt-0.5">{room.type}</div>
                  <p className="text-xs font-semibold mt-2">{room.price_per_night.toLocaleString()} so'm</p>

                  <div className="mt-3 flex justify-center gap-1.5">
                    {room.status === 'occupied' && activeBooking && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCheckOut(activeBooking.id, room.id);
                        }} 
                        className="text-[10px] px-2 py-0.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                      >
                        Chiqish
                      </button>
                    )}
                    {room.status === 'cleaning' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetRoomStatus(room.id, 'available');
                        }}
                        className="text-[10px] px-2 py-0.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-0.5"
                      >
                        <Brush className="w-3 h-3" /> Tayyor
                      </button>
                    )}
                    {room.status === 'available' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetRoomStatus(room.id, 'maintenance');
                        }}
                        className="text-[10px] px-2 py-0.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-0.5"
                      >
                        <Wrench className="w-3 h-3" /> Remont
                      </button>
                    )}
                    {room.status === 'maintenance' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetRoomStatus(room.id, 'available');
                        }}
                        className="text-[10px] px-2 py-0.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                      >
                        Tugatildi
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab 2: Gantt Calendar Timeline View */}
        <TabsContent value="calendar">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row justify-between items-center pb-4">
              <div>
                <CardTitle className="text-base">Gantt Vizual Bandlik Kalendari</CardTitle>
                <CardDescription>Xonalarning kunlar bo'yicha bandlik rejasi.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    if (currentMonth === 0) {
                      setCurrentMonth(11);
                      setCurrentYear(currentYear - 1);
                    } else {
                      setCurrentMonth(currentMonth - 1);
                    }
                  }}
                >
                  ◄
                </Button>
                <span className="text-sm font-bold min-w-[100px] text-center">
                  {getMonthName(currentMonth)} {currentYear}
                </span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    if (currentMonth === 11) {
                      setCurrentMonth(0);
                      setCurrentYear(currentYear + 1);
                    } else {
                      setCurrentMonth(currentMonth + 1);
                    }
                  }}
                >
                  ►
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="p-2 border border-border text-left font-bold w-20">Xona</th>
                    {daysArray.map(day => (
                      <th key={day} className="p-2 border border-border text-center w-8 font-semibold">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rooms.map(room => (
                    <tr key={room.id} className="hover:bg-muted/10">
                      <td className="p-2 border border-border font-bold">№ {room.room_number}</td>
                      {daysArray.map(day => {
                        const b = getBookingForDate(room.id, day);
                        const isCheckInDay = b && new Date(b.check_in).getDate() === day;
                        
                        return (
                          <td 
                            key={day} 
                            className={`border border-border p-1 text-center relative h-10 ${
                              b 
                                ? b.status === 'checked_in' 
                                  ? 'bg-rose-500/20 text-rose-500' 
                                  : 'bg-emerald-500/20 text-emerald-500'
                                : ''
                            }`}
                            title={b ? `${b.guest_name} (${b.guest_phone})` : 'Bo\'sh xona'}
                          >
                            {isCheckInDay && (
                              <span className="absolute inset-x-0 top-1 text-[9px] font-bold truncate px-1">
                                {b.guest_name.split(' ')[0]}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Booking reservations history list */}
        <TabsContent value="bookings">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Mijozlar bandlik tarixi</CardTitle>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Rezervatsiyalar mavjud emas.</p>
              ) : (
                <div className="space-y-4 divide-y divide-border">
                  {bookings.map((b, idx) => {
                    const roomNum = rooms.find(r => r.id === b.room_id)?.room_number || '—';
                    return (
                      <div key={b.id} className={`pt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${idx === 0 ? 'pt-0' : ''}`}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">Xona № {roomNum} — {b.guest_name}</span>
                            <span className={`text-[9px] px-2 py-0.5 font-bold uppercase rounded border ${
                              b.status === 'checked_in' 
                                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                                : b.status === 'checked_out'
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {b.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Tel: {b.guest_phone} | Kirish: {b.check_in} — Chiqish: {b.check_out}
                          </p>
                          {b.note && <p className="text-[11px] text-amber-500 italic">Izoh: {b.note}</p>}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground">Summa</p>
                            <p className="font-bold text-primary text-sm">{b.total_amount.toLocaleString()} UZS</p>
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => downloadReceipt(b, roomNum)}
                            className="rounded-lg text-xs gap-1"
                          >
                            <Receipt className="w-3.5 h-3.5" /> PDF
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Analytics & RevPAR */}
        <TabsContent value="analytics">
          {(() => {
            const totalRoomsCount = rooms.length;
            const occupiedRoomsCount = rooms.filter(r => r.status === 'occupied').length;
            const cleaningRoomsCount = rooms.filter(r => r.status === 'cleaning').length;
            const maintenanceRoomsCount = rooms.filter(r => r.status === 'maintenance').length;
            const occupancyRate = totalRoomsCount > 0 ? (occupiedRoomsCount / totalRoomsCount) * 100 : 0;

            const confirmedBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'checked_out');
            const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.total_amount, 0);

            // ADR: Average Daily Rate = Room Revenue / Rooms Sold
            const adr = occupiedRoomsCount > 0 ? (totalRevenue / occupiedRoomsCount) : 0;
            // RevPAR: Revenue Per Available Room = Room Revenue / Total Available Rooms
            const revPar = totalRoomsCount > 0 ? (totalRevenue / totalRoomsCount) : 0;

            // Interactive RevPAR Calculator values
            const parsedTotalRooms = Number(customTotalRooms) || 0;
            const parsedOccupancy = Number(customOccupancy) || 0;
            const parsedAdr = Number(customAdr) || 0;
            const computedRevPar = parsedAdr * (parsedOccupancy / 100);
            const computedMonthlyRevenue = computedRevPar * parsedTotalRooms * 30;

            return (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-primary" /> Bandlik Tahlili & RevPAR (Daromad ko'rsatkichi)
                  </h3>
                  <p className="text-sm text-muted-foreground">Mehmonxona xonalarining samaradorligi va moliyaviy o'sish prognozlarini hisoblash.</p>
                </div>

                {/* KPI Cards */}
                <div className="grid md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-5 space-y-1">
                      <span className="text-xs text-muted-foreground font-medium">Xonalar bandligi (Occupancy)</span>
                      <p className="text-xl font-bold text-foreground">{occupancyRate.toFixed(1)}%</p>
                      <span className="text-[10px] text-muted-foreground block">
                        Jami: {totalRoomsCount} | Band: {occupiedRoomsCount} ta xona
                      </span>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-5 space-y-1">
                      <span className="text-xs text-muted-foreground font-medium">ADR (Average Daily Rate)</span>
                      <p className="text-xl font-bold text-foreground text-primary">{adr.toLocaleString()} UZS</p>
                      <span className="text-[10px] text-muted-foreground block">Band qilingan xonalar o'rtacha narxi</span>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-5 space-y-1">
                      <span className="text-xs text-muted-foreground font-medium">RevPAR (Samaradorlik ko'rsatkichi)</span>
                      <p className="text-xl font-bold text-foreground text-emerald-500">{revPar.toLocaleString()} UZS</p>
                      <span className="text-[10px] text-muted-foreground block">Har bir mavjud xonaga to'g'ri keladigan tushum</span>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-5 space-y-1">
                      <span className="text-xs text-muted-foreground font-medium">Joriy oylik jami tushum</span>
                      <p className="text-xl font-bold text-foreground text-emerald-500">{totalRevenue.toLocaleString()} UZS</p>
                      <span className="text-[10px] text-muted-foreground block">Faol va tasdiqlangan rezervatsiyalar</span>
                    </CardContent>
                  </Card>
                </div>

                {/* Two Column Layout: Calculator & Recommendations */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* RevPAR Calculator */}
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="text-base">RevPAR & Oylik Daromad Simulyatori</CardTitle>
                      <CardDescription>O'z mehmonxonangiz parametrlari orqali kutilayotgan oylik aylanmani hisoblang.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Jami xonalar</Label>
                          <Input
                            type="number"
                            value={customTotalRooms}
                            onChange={e => setCustomTotalRooms(e.target.value)}
                            className="rounded-xl h-9 text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Bandlik foizi (%)</Label>
                          <Input
                            type="number"
                            max="100"
                            value={customOccupancy}
                            onChange={e => setCustomOccupancy(e.target.value)}
                            className="rounded-xl h-9 text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">ADR (sutka narxi)</Label>
                          <Input
                            type="number"
                            value={customAdr}
                            onChange={e => setCustomAdr(e.target.value)}
                            className="rounded-xl h-9 text-xs"
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Kalkulyator bo'yicha RevPAR:</span>
                          <span className="font-bold text-foreground">{computedRevPar.toLocaleString()} UZS</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Kutilayotgan oylik daromad (30 kun):</span>
                          <span className="text-lg font-extrabold text-emerald-500">{computedMonthlyRevenue.toLocaleString()} UZS</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Room status distribution & Housekeeping checklist */}
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="text-base">Tozalash & Xizmat ko'rsatish holati</CardTitle>
                      <CardDescription>Xonalarning gigiyenik holati va tozalov ishlarining taqsimoti.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 border rounded-xl bg-muted/20 space-y-1 text-center">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">Tozalanayotgan xonalar</span>
                          <p className="text-lg font-bold text-sky-500">{cleaningRoomsCount} ta xona</p>
                        </div>
                        <div className="p-3 border rounded-xl bg-muted/20 space-y-1 text-center">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">Remontdagi xonalar</span>
                          <p className="text-lg font-bold text-amber-500">{maintenanceRoomsCount} ta xona</p>
                        </div>
                      </div>

                      <div className="p-4 border border-border/80 rounded-xl bg-muted/10 space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Tizim Tahlili va Maslahat</h4>
                        {occupancyRate > 85 ? (
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            🔥 <strong>Bandlik darajasi juda yuqori ({occupancyRate.toFixed(1)}%)!</strong> 
                            Xonalarga bo'lgan talab juda katta. Mavsumiy narxlarni (ADR) 10-15% ga oshirishni tavsiya qilamiz.
                          </p>
                        ) : occupancyRate < 40 ? (
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            📉 <strong>Bandlik darajasi past ({occupancyRate.toFixed(1)}%).</strong> 
                            Mijozlarni jalb qilish uchun maxsus chegirmalar yoki sayyohlik paketlari integratsiyasidan foydalaning.
                          </p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            ✓ <strong>Bandlik darajasi barqaror me'yorda ({occupancyRate.toFixed(1)}%).</strong> 
                            Tozalov va texnik xizmat ko'rsatish ishlarini o'z vaqtida bajarib, mijozlar reytingini yuqori ushlab turing.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })()}
        </TabsContent>
      </Tabs>

      {/* Add room modal */}
      {isRoomModalOpen && (
        <Modal onClose={() => setIsRoomModalOpen(false)} title="Yangi Xona Qo'shish">
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Xona Raqami</Label>
              <Input 
                value={newRoomNumber} 
                onChange={e => setNewRoomNumber(e.target.value)} 
                placeholder="masalan: 101" 
                required 
                className="rounded-xl" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Xona Turi</Label>
                <select 
                  value={newRoomType} 
                  onChange={e => setNewRoomType(e.target.value as any)}
                  className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm"
                >
                  <option value="single">Single (1 kishilik)</option>
                  <option value="double">Double (2 kishilik)</option>
                  <option value="suite">Suite (Lyuks)</option>
                  <option value="deluxe">Deluxe (Premium)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Qavat</Label>
                <Input 
                  type="number" 
                  value={newRoomFloor} 
                  onChange={e => setNewRoomFloor(e.target.value)} 
                  className="rounded-xl" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Bir kechalik narxi (UZS)</Label>
              <Input 
                type="number" 
                value={newRoomPrice} 
                onChange={e => setNewRoomPrice(e.target.value)} 
                required 
                className="rounded-xl" 
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsRoomModalOpen(false)} className="rounded-xl">Bekor qilish</Button>
              <Button type="submit" className="rounded-xl font-bold">Saqlash</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Booking check-in modal */}
      {isBookingModalOpen && selectedRoom && (
        <Modal onClose={() => setIsBookingModalOpen(false)} title={`Mehmon joylashtirish — Xona № ${selectedRoom.room_number}`}>
          <form onSubmit={handleBookRoom} className="space-y-4">
            <div className="p-3 border rounded-xl bg-muted/20 space-y-1 text-xs">
              <div className="flex justify-between"><span>Turi:</span><span className="font-semibold uppercase">{selectedRoom.type}</span></div>
              <div className="flex justify-between"><span>Kunlik narx:</span><span className="font-semibold">{selectedRoom.price_per_night.toLocaleString()} UZS</span></div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Mehmon ismi va familiyasi</Label>
              <Input 
                value={guestName} 
                onChange={e => setGuestName(e.target.value)} 
                placeholder="masalan: Alisher Navoiy" 
                required 
                className="rounded-xl" 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Telefon raqami</Label>
              <Input 
                value={guestPhone} 
                onChange={e => setGuestPhone(e.target.value)} 
                placeholder="masalan: +998 90 123 45 67" 
                required 
                className="rounded-xl" 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Kirish sanasi</Label>
                <Input 
                  type="date" 
                  value={checkInDate} 
                  onChange={e => setCheckInDate(e.target.value)} 
                  required 
                  className="rounded-xl" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Chiqish sanasi</Label>
                <Input 
                  type="date" 
                  value={checkOutDate} 
                  onChange={e => setCheckOutDate(e.target.value)} 
                  required 
                  className="rounded-xl" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">To'lov turi</Label>
              <select 
                value={paymentMethod} 
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm"
              >
                <option value="cash">Naqd (Cash)</option>
                <option value="card">Plastik karta (Card)</option>
                <option value="click">Click</option>
                <option value="payme">Payme</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Izoh (ixtiyoriy)</Label>
              <Input 
                value={bookingNote} 
                onChange={e => setBookingNote(e.target.value)} 
                placeholder="masalan: Qora choy so'radi" 
                className="rounded-xl" 
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsBookingModalOpen(false)} className="rounded-xl">Bekor qilish</Button>
              <Button type="submit" className="rounded-xl font-bold">Ro'yxatdan o'tkazish (Check-in)</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
