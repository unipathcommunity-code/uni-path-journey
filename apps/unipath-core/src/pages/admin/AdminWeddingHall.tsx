import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Modal } from './restaurant/TablesMap';

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
  AlertCircle,
  X,
  FileText,
  MapPin,
  Move,
  User
} from 'lucide-react';

interface EventBooking {
  id: string;
  client_name: string;
  client_phone: string;
  event_date: string;
  hall_name: string;
  guest_count: number;
  total_price: number;
  paid_deposit: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  menu_package: string;
  timeline_events_json?: any[];
  notes?: string;
}

interface SeatingTable {
  id: string;
  type: 'round' | 'rectangular' | 'stage';
  x: number;
  y: number;
  label: string;
  capacity: number;
  guests: string[];
}

const db = supabase as any;

export default function AdminWeddingHall() {
  const { activeTenant } = useApp();
  const { toast } = useToast();
  const tid = activeTenant?.id;

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<EventBooking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Tabs
  const [activeTab, setActiveTab] = useState('overview');

  // Booking Modal & Forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBooking, setNewBooking] = useState({
    client_name: '',
    client_phone: '',
    event_date: new Date().toISOString().split('T')[0],
    hall_name: 'Versal Zali',
    guest_count: '250',
    total_price: '35000000',
    paid_deposit: '10000000',
    menu_package: 'gold',
    notes: ''
  });

  // Seating Planner States
  const [selectedBooking, setSelectedBooking] = useState<EventBooking | null>(null);
  const [seatingTables, setSeatingTables] = useState<SeatingTable[]>([]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  
  // Selected table edit states
  const [tableLabel, setTableLabel] = useState('');
  const [tableCapacity, setTableCapacity] = useState(10);
  const [guestInput, setGuestInput] = useState('');

  // Event Timeline States
  const [timelineEvents, setTimelineEvents] = useState<Array<{ id: string; time: string; title: string; desc: string }>>([]);
  const [newTime, setNewTime] = useState('18:00');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');

  // Hamkorlar (Vendors) va Xarajatlar statelari
  const [vendors, setVendors] = useState<Array<{ id: string; name: string; category: string; price: number; paid: number }>>([
    { id: '1', name: 'Ziyo Catering', category: 'Katering (Taomlar)', price: 12000000, paid: 5000000 },
    { id: '2', name: 'Elegant Decor', category: 'Zallarni bezatish', price: 6000000, paid: 3000000 },
    { id: '3', name: 'DJ & Light Show', category: 'Musiqa va Chiroq', price: 2500000, paid: 2500000 },
  ]);
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorCategory, setNewVendorCategory] = useState('Katering');
  const [newVendorPrice, setNewVendorPrice] = useState('');
  const [newVendorPaid, setNewVendorPaid] = useState('');

  const loadData = async () => {
    if (!tid) { setLoading(false); return; }
    try {
      setLoading(false);
      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await db
        .from('wedding_hall_bookings')
        .select('*')
        .eq('tenant_id', tid)
        .order('event_date', { ascending: true });

      if (bookingsError) throw bookingsError;
      setBookings(bookingsData || []);

      if (bookingsData && bookingsData.length > 0 && !selectedBooking) {
        setSelectedBooking(bookingsData[0]);
      }
    } catch (err: any) {
      console.error('Error fetching wedding hall data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tid]);

  // Load seating planner when selected booking changes
  useEffect(() => {
    if (!selectedBooking) return;
    (async () => {
      const { data } = await db
        .from('wedding_hall_seating')
        .select('table_layout_json')
        .eq('booking_id', selectedBooking.id)
        .maybeSingle();

      if (data?.table_layout_json) {
        setSeatingTables(data.table_layout_json as SeatingTable[]);
      } else {
        setSeatingTables([]);
      }

      setTimelineEvents(selectedBooking.timeline_events_json || []);
    })();
  }, [selectedBooking]);

  const handleAddBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.client_name || !newBooking.event_date || !newBooking.client_phone || !tid) {
      toast({
        title: 'Xatolik',
        description: 'Iltimos, barcha majburiy maydonlarni to\'ldiring!',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { data, error } = await db
        .from('wedding_hall_bookings')
        .insert({
          tenant_id: tid,
          client_name: newBooking.client_name,
          client_phone: newBooking.client_phone,
          event_date: newBooking.event_date,
          hall_name: newBooking.hall_name,
          guest_count: parseInt(newBooking.guest_count) || 200,
          total_price: parseFloat(newBooking.total_price) || 0,
          paid_deposit: parseFloat(newBooking.paid_deposit) || 0,
          menu_package: newBooking.menu_package,
          notes: newBooking.notes,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Muvaffaqiyatli',
        description: 'Yangi to\'y/marosim buyurtmasi muvaffaqiyatli qo\'shildi!'
      });

      setBookings([...bookings, data]);
      setSelectedBooking(data);
      setIsModalOpen(false);
      
      setNewBooking({
        client_name: '',
        client_phone: '',
        event_date: new Date().toISOString().split('T')[0],
        hall_name: 'Versal Zali',
        guest_count: '250',
        total_price: '35000000',
        paid_deposit: '10000000',
        menu_package: 'gold',
        notes: ''
      });
    } catch (err: any) {
      toast({ title: 'Xatolik', description: err.message, variant: 'destructive' });
    }
  };

  const handleStatusChange = async (id: string, status: EventBooking['status']) => {
    try {
      await db.from('wedding_hall_bookings').update({ status }).eq('id', id);
      setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
      if (selectedBooking?.id === id) {
        setSelectedBooking({ ...selectedBooking, status });
      }
      toast({
        title: 'Status yangilandi',
        description: `Buyurtma statusi "${status}" ga o'zgartirildi.`
      });
    } catch (err: any) {
      toast({ title: 'Xatolik', description: err.message, variant: 'destructive' });
    }
  };

  // Seating Layout Actions
  const handleAddTable = (type: SeatingTable['type']) => {
    const newTable: SeatingTable = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      x: 150 + Math.random() * 100,
      y: 150 + Math.random() * 100,
      label: type === 'stage' ? 'Saxna' : `Stol № ${seatingTables.length + 1}`,
      capacity: type === 'stage' ? 0 : 10,
      guests: []
    };
    const updated = [...seatingTables, newTable];
    setSeatingTables(updated);
    saveSeatingLayout(updated);
  };

  const saveSeatingLayout = async (layout: SeatingTable[]) => {
    if (!selectedBooking) return;
    try {
      // Check if seating entry exists
      const { data } = await db
        .from('wedding_hall_seating')
        .select('id')
        .eq('booking_id', selectedBooking.id)
        .maybeSingle();

      if (data?.id) {
        await db.from('wedding_hall_seating').update({ table_layout_json: layout }).eq('id', data.id);
      } else {
        await db.from('wedding_hall_seating').insert({
          tenant_id: tid,
          booking_id: selectedBooking.id,
          table_layout_json: layout
        });
      }
    } catch (err: any) {
      console.error('Seating save error:', err);
    }
  };

  const handleCanvasClick = () => {
    setSelectedTableId(null);
  };

  const handleTableClick = (e: React.MouseEvent, table: SeatingTable) => {
    e.stopPropagation();
    setSelectedTableId(table.id);
    setTableLabel(table.label);
    setTableCapacity(table.capacity);
  };

  const handleTableDrag = (e: React.MouseEvent, id: string) => {
    if (activeDragId !== id) return;
    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left - 25; // center offset
    const y = e.clientY - rect.top - 25;

    const updated = seatingTables.map(t => t.id === id ? { ...t, x, y } : t);
    setSeatingTables(updated);
  };

  const handleSaveTableEdits = () => {
    if (!selectedTableId) return;
    const updated = seatingTables.map(t => t.id === selectedTableId ? { ...t, label: tableLabel, capacity: tableCapacity } : t);
    setSeatingTables(updated);
    saveSeatingLayout(updated);
    toast({ title: 'Saqlandi', description: 'Stol parametrlari yangilandi.' });
  };

  const handleAddGuest = () => {
    if (!selectedTableId || !guestInput.trim()) return;
    const updated = seatingTables.map(t => {
      if (t.id === selectedTableId) {
        if (t.guests.length >= t.capacity && t.capacity > 0) {
          toast({ title: 'Stol to\'la', description: 'Sig\'imdan ko\'p mehmon qo\'shib bo\'lmaydi.', variant: 'destructive' });
          return t;
        }
        return { ...t, guests: [...t.guests, guestInput.trim()] };
      }
      return t;
    });
    setSeatingTables(updated);
    saveSeatingLayout(updated);
    setGuestInput('');
  };

  // Event Timeline Actions
  const handleAddTimelineEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !selectedBooking) return;

    const newEv = {
      id: Math.random().toString(36).substring(2, 9),
      time: newTime,
      title: newEventTitle.trim(),
      desc: newEventDesc.trim()
    };

    const updatedEvents = [...timelineEvents, newEv].sort((a, b) => a.time.localeCompare(b.time));
    setTimelineEvents(updatedEvents);

    // Save to Supabase
    await db
      .from('wedding_hall_bookings')
      .update({ timeline_events_json: updatedEvents })
      .eq('id', selectedBooking.id);

    setNewEventTitle('');
    newEventDesc && setNewEventDesc('');
    toast({ title: 'Qo\'shildi', description: 'Dastur voqeasi qo\'shildi.' });
  };

  const handleDeleteTimelineEvent = async (id: string) => {
    if (!selectedBooking) return;
    const updated = timelineEvents.filter(ev => ev.id !== id);
    setTimelineEvents(updated);
    await db
      .from('wedding_hall_bookings')
      .update({ timeline_events_json: updated })
      .eq('id', selectedBooking.id);
  };

  // Stats calculation
  const totalRevenue = bookings.reduce((sum, b) => b.status === 'completed' ? sum + b.total_price : sum, 0);
  const totalDeposit = bookings.reduce((sum, b) => b.status !== 'cancelled' ? sum + b.paid_deposit : sum, 0);
  const totalRemaining = bookings.reduce((sum, b) => b.status !== 'cancelled' ? sum + (b.total_price - b.paid_deposit) : sum, 0);

  const filteredBookings = bookings.filter(b => 
    b.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.hall_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.client_phone.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mr-2" />
        <span className="text-muted-foreground text-sm font-medium">To'yxona boshqaruvi yuklanmoqda...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Gem className="w-7 h-7 text-pink-500" />
            To'yxona & Marosimlar Saroyi Boshqaruvi
          </h1>
          <p className="text-sm text-muted-foreground">
            Tantanalar zali bandligi, mijozlar buyurtmalari va moliyaviy hisob-kitoblar.
          </p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-pink-600 hover:bg-pink-700 text-white rounded-xl gap-2 font-bold"
        >
          <Plus className="w-5 h-5" /> Yangi Buyurtma Qo'shish
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Jami buyurtmalar</CardTitle>
            <Calendar className="w-4 h-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length} ta</div>
            <p className="text-[10px] text-muted-foreground mt-1">Tizimdagi jami tantanalar</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Olingan zakalat (Deposit)</CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{totalDeposit.toLocaleString()} UZS</div>
            <p className="text-[10px] text-muted-foreground mt-1">Kassa jami zakalat pullari</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Kutilayotgan qoldiq</CardTitle>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{totalRemaining.toLocaleString()} UZS</div>
            <p className="text-[10px] text-muted-foreground mt-1">Tadbir kuni to'lanishi kerak</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Tushum (Completed)</CardTitle>
            <CheckCircle className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} UZS</div>
            <p className="text-[10px] text-muted-foreground mt-1">Yakunlangan to'ylar tushumi</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-fit rounded-xl bg-muted p-1">
          <TabsTrigger value="overview" className="rounded-lg gap-2 text-xs font-semibold">
            <Calendar className="w-4 h-4" /> Buyurtmalar ro'yxati
          </TabsTrigger>
          <TabsTrigger value="seating" className="rounded-lg gap-2 text-xs font-semibold" disabled={!selectedBooking}>
            <Users className="w-4 h-4" /> Mehmonlar Joylashtirish
          </TabsTrigger>
          <TabsTrigger value="timeline" className="rounded-lg gap-2 text-xs font-semibold" disabled={!selectedBooking}>
            <Clock className="w-4 h-4" /> Dastur rejasi (Timeline)
          </TabsTrigger>
          <TabsTrigger value="vendors" className="rounded-lg gap-2 text-xs font-semibold" disabled={!selectedBooking}>
            <DollarSign className="w-4 h-4" /> Hamkorlar & Xarajatlar
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Bookings List */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Mijozlar buyurtma daftari</CardTitle>
                <CardDescription>Barcha to'ylar, marosimlar va to'lovlar jadvali.</CardDescription>
              </div>
              <div className="relative w-60">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Mijoz ismi..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-xs rounded-xl"
                />
              </div>
            </CardHeader>
            <CardContent>
              {filteredBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Buyurtmalar topilmadi.</p>
              ) : (
                <div className="space-y-4 divide-y divide-border">
                  {filteredBookings.map((b, idx) => (
                    <div 
                      key={b.id} 
                      onClick={() => setSelectedBooking(b)}
                      className={`pt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer hover:bg-muted/10 p-2 rounded-xl transition ${
                        selectedBooking?.id === b.id ? 'bg-primary/5 border border-primary/20' : ''
                      } ${idx === 0 ? 'pt-0' : ''}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{b.client_name}</span>
                          <span className="text-[10px] text-pink-500 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20 font-semibold">
                            {b.hall_name}
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 font-bold uppercase rounded border ${
                            b.status === 'confirmed' 
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : b.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {b.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Sana: {b.event_date} | Tel: {b.client_phone} | {b.guest_count} kishi | Paket: <span className="uppercase">{b.menu_package}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground">To'landi / Jami</p>
                          <p className="font-bold text-sm text-primary">
                            {b.paid_deposit.toLocaleString()} / {b.total_price.toLocaleString()} UZS
                          </p>
                          {/* Payment progress */}
                          <div className="w-32 bg-muted h-1.5 rounded-full mt-1 overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full rounded-full" 
                              style={{ width: `${Math.min(100, (b.paid_deposit / b.total_price) * 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex gap-1.5">
                          {b.status === 'pending' && (
                            <Button 
                              size="sm" 
                              className="text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700"
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(b.id, 'confirmed'); }}
                            >
                              Tasdiqlash
                            </Button>
                          )}
                          {b.status === 'confirmed' && (
                            <Button 
                              size="sm" 
                              className="text-xs rounded-lg"
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(b.id, 'completed'); }}
                            >
                              Yakunlash
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Seating Planner Floor Canvas */}
        <TabsContent value="seating">
          {selectedBooking && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Floor Planner Canvas */}
              <div className="lg:col-span-2 space-y-3">
                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-base">Mijoz: {selectedBooking.client_name} — Joylashtirish xaritasi</CardTitle>
                      <CardDescription>Zal elementlarini qo'shing va sichqoncha yordamida harakatlantiring.</CardDescription>
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="sm" onClick={() => handleAddTable('round')} variant="outline" className="text-xs rounded-lg">Round Table</Button>
                      <Button size="sm" onClick={() => handleAddTable('rectangular')} variant="outline" className="text-xs rounded-lg">Rect Table</Button>
                      <Button size="sm" onClick={() => handleAddTable('stage')} variant="outline" className="text-xs rounded-lg">Saxna</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="relative border border-border/80 h-[480px] bg-muted/10 rounded-2xl overflow-hidden" onClick={handleCanvasClick}>
                    {seatingTables.map(t => {
                      const isSelected = selectedTableId === t.id;
                      
                      let tableCls = 'border-border bg-card';
                      if (t.type === 'stage') tableCls = 'bg-pink-600/20 text-pink-400 border-pink-500/40 rounded-xl';
                      else if (t.type === 'round') tableCls = 'rounded-full border-dashed';
                      else tableCls = 'rounded-md';

                      return (
                        <div
                          key={t.id}
                          style={{ left: `${t.x}px`, top: `${t.y}px` }}
                          onMouseDown={() => setActiveDragId(t.id)}
                          onMouseUp={() => {
                            setActiveDragId(null);
                            saveSeatingLayout(seatingTables);
                          }}
                          onMouseMove={(e) => handleTableDrag(e, t.id)}
                          onClick={(e) => handleTableClick(e, t)}
                          className={`absolute w-16 h-16 border flex flex-col items-center justify-center cursor-move text-[10px] text-center select-none p-1 transition-shadow hover:shadow-lg ${tableCls} ${
                            isSelected ? 'ring-2 ring-primary border-primary bg-primary/5' : ''
                          }`}
                        >
                          <Move className="w-3.5 h-3.5 absolute top-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground" />
                          <span className="font-bold leading-tight">{t.label}</span>
                          {t.type !== 'stage' && (
                            <span className="text-[8px] text-muted-foreground mt-1">
                              {t.guests.length}/{t.capacity}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>

              {/* Guest Assignments Sidebar */}
              <div className="space-y-4">
                {selectedTableId ? (() => {
                  const table = seatingTables.find(t => t.id === selectedTableId);
                  if (!table) return null;
                  return (
                    <Card className="bg-card border-border">
                      <CardHeader className="pb-3 border-b border-border">
                        <CardTitle className="text-sm font-bold">Stol parametrlari: {table.label}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Nomi/Raqami</Label>
                          <Input value={tableLabel} onChange={e => setTableLabel(e.target.value)} className="h-9 rounded-lg" />
                        </div>
                        {table.type !== 'stage' && (
                          <>
                            <div className="space-y-2">
                              <Label className="text-xs">Sig'imi (kishi)</Label>
                              <Input type="number" value={tableCapacity} onChange={e => setTableCapacity(parseInt(e.target.value) || 0)} className="h-9 rounded-lg" />
                            </div>
                            <Button onClick={handleSaveTableEdits} className="w-full text-xs rounded-xl" variant="secondary">Yangilash</Button>

                            <div className="space-y-2 pt-2 border-t border-border">
                              <Label className="text-xs">Mehmon qo'shish</Label>
                              <div className="flex gap-2">
                                <Input 
                                  value={guestInput} 
                                  onChange={e => setGuestInput(e.target.value)} 
                                  placeholder="Mehmon ismi..." 
                                  className="h-9 rounded-lg" 
                                />
                                <Button onClick={handleAddGuest} className="h-9 text-xs rounded-lg">Qo'shish</Button>
                              </div>
                            </div>

                            <div className="space-y-2 max-h-[150px] overflow-y-auto pt-2">
                              <Label className="text-xs">Joylashgan mehmonlar</Label>
                              {table.guests.length === 0 ? (
                                <p className="text-[10px] text-muted-foreground py-2 italic text-center">Mehmon yo'q.</p>
                              ) : (
                                <div className="space-y-1">
                                  {table.guests.map((g, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs p-1.5 border rounded-lg bg-muted/20">
                                      <span>{g}</span>
                                      <button 
                                        type="button" 
                                        onClick={() => {
                                          const updated = seatingTables.map(t => t.id === selectedTableId ? { ...t, guests: t.guests.filter((_, idx) => idx !== i) } : t);
                                          setSeatingTables(updated);
                                          saveSeatingLayout(updated);
                                        }} 
                                        className="text-rose-500"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                        <Button 
                          onClick={() => {
                            const updated = seatingTables.filter(t => t.id !== selectedTableId);
                            setSeatingTables(updated);
                            saveSeatingLayout(updated);
                            setSelectedTableId(null);
                          }} 
                          className="w-full text-xs rounded-xl border border-rose-500/20" 
                          variant="destructive"
                        >
                          Elementni o'chirish
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })() : (
                  <Card className="bg-card border border-border/80 border-dashed">
                    <CardContent className="py-12 text-center text-muted-foreground text-xs">
                      Sozlash va mehmonlarni qo'shish uchun xaritadagi istalgan stol ustiga bosing.
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Program timeline schedule builder */}
        <TabsContent value="timeline">
          {selectedBooking && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Event Program Flow */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-base">Mijoz: {selectedBooking.client_name} — Dastur Timeline</CardTitle>
                    <CardDescription>To'y/marosim boshlanishidan tugaguncha bo'lgan dastur rejasi va vaqtlari.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {timelineEvents.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-6 text-center border border-dashed rounded-2xl">Hali dastur rejasi tuzilmadi.</p>
                    ) : (
                      <div className="relative pl-6 border-l-2 border-primary/20 space-y-4">
                        {timelineEvents.map(ev => (
                          <div key={ev.id} className="relative">
                            <span className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-bold">
                                  {ev.time}
                                </span>
                                <h4 className="font-bold text-sm text-foreground mt-1.5">{ev.title}</h4>
                                {ev.desc && <p className="text-xs text-muted-foreground mt-1">{ev.desc}</p>}
                              </div>
                              <button 
                                onClick={() => handleDeleteTimelineEvent(ev.id)}
                                className="text-rose-500 hover:bg-rose-500/10 p-1 rounded-md"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Add event form sidebar */}
              <div className="space-y-4">
                <Card className="bg-card border-border">
                  <CardHeader className="pb-3 border-b border-border">
                    <CardTitle className="text-sm font-bold">Voqea qo'shish</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <form onSubmit={handleAddTimelineEvent} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Tadbir vaqti</Label>
                        <Input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} required className="h-9 rounded-lg" />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Voqea nomi</Label>
                        <Input value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} placeholder="masalan: Birinchi raqs" required className="h-9 rounded-lg" />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Tavsif / Izoh (ixtiyoriy)</Label>
                        <Input value={newEventDesc} onChange={e => setNewEventDesc(e.target.value)} placeholder="masalan: Chiroqlar o'chiriladi" className="h-9 rounded-lg" />
                      </div>

                      <Button type="submit" className="w-full text-xs rounded-xl font-bold bg-pink-600 hover:bg-pink-700">Rejaga kiritish</Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab 4: Vendors & Event Budget Manager */}
        <TabsContent value="vendors">
          {selectedBooking && (() => {
            const totalVendorCost = vendors.reduce((sum, v) => sum + v.price, 0);
            const totalVendorPaid = vendors.reduce((sum, v) => sum + v.paid, 0);
            const totalVendorRemaining = totalVendorCost - totalVendorPaid;
            const netProfit = selectedBooking.total_price - totalVendorCost;
            const netProfitPercent = selectedBooking.total_price > 0 ? (netProfit / selectedBooking.total_price) * 100 : 0;

            const handleAddVendorLocal = (e: React.FormEvent) => {
              e.preventDefault();
              if (!newVendorName || !newVendorPrice) return;
              setVendors(prev => [
                ...prev,
                {
                  id: Math.random().toString(),
                  name: newVendorName,
                  category: newVendorCategory,
                  price: Number(newVendorPrice),
                  paid: Number(newVendorPaid) || 0
                }
              ]);
              setNewVendorName('');
              setNewVendorPrice('');
              setNewVendorPaid('');
            };

            return (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-pink-500" /> Jamoa, Hamkorlar va Tadbir Byudjeti boshqaruvi
                  </h3>
                  <p className="text-sm text-muted-foreground">Tashqi hamkorlar (katering, dekor, musiqa) bilan hisob-kitoblar va marosim rentabelligi.</p>
                </div>

                {/* Financial Summary */}
                <div className="grid md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-5 space-y-1">
                      <span className="text-xs text-muted-foreground font-medium">Tadbir jami byudjeti</span>
                      <p className="text-xl font-bold text-foreground">{selectedBooking.total_price.toLocaleString()} UZS</p>
                      <span className="text-[10px] text-muted-foreground block">Buyurtmachi to'laydigan summa</span>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-5 space-y-1">
                      <span className="text-xs text-muted-foreground font-medium">Jami hamkorlar harajati</span>
                      <p className="text-xl font-bold text-rose-500">{totalVendorCost.toLocaleString()} UZS</p>
                      <span className="text-[10px] text-muted-foreground block">Tashqi xizmatlar umumiy summasi</span>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-5 space-y-1">
                      <span className="text-xs text-muted-foreground font-medium">To'langan harajatlar</span>
                      <p className="text-xl font-bold text-emerald-500">{totalVendorPaid.toLocaleString()} UZS</p>
                      <span className="text-[10px] text-muted-foreground block">Avans va to'liq yopilgan cheklar</span>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-5 space-y-1">
                      <span className="text-xs text-muted-foreground font-medium">To'yxona sof foydasi</span>
                      <p className="text-xl font-bold text-emerald-500">{netProfit.toLocaleString()} UZS</p>
                      <span className="text-[10px] text-muted-foreground block">Rentabellik: {netProfitPercent.toFixed(1)}%</span>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Left Column: Partners list & form */}
                  <div className="lg:col-span-2 space-y-4">
                    <Card className="border-border">
                      <CardHeader>
                        <CardTitle className="text-base">Hamkorlar (Vendors) va pudratchilar ro'yxati</CardTitle>
                        <CardDescription>Ushbu marosimga biriktirilgan barcha mustaqil hamkorlar to'lov holati.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                            <thead>
                              <tr className="border-b border-border/60 text-muted-foreground text-xs font-semibold uppercase">
                                <th className="py-2">Hamkor nomi</th>
                                <th className="py-2">Soha (Kategoriya)</th>
                                <th className="py-2 text-right">Shartnoma summasi</th>
                                <th className="py-2 text-right">To'landi</th>
                                <th className="py-2 text-right">Qoldiq</th>
                                <th className="py-2 text-right w-12">O'chirish</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                              {vendors.map(v => (
                                <tr key={v.id} className="hover:bg-muted/10">
                                  <td className="py-2.5 font-medium">{v.name}</td>
                                  <td className="py-2.5 text-xs text-muted-foreground">{v.category}</td>
                                  <td className="py-2.5 text-right">{v.price.toLocaleString()} UZS</td>
                                  <td className="py-2.5 text-right text-emerald-500">{v.paid.toLocaleString()} UZS</td>
                                  <td className="py-2.5 text-right font-semibold text-rose-400">
                                    {(v.price - v.paid).toLocaleString()} UZS
                                  </td>
                                  <td className="py-2.5 text-right">
                                    <button
                                      type="button"
                                      onClick={() => setVendors(prev => prev.filter(item => item.id !== v.id))}
                                      className="text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg transition-all"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Add Partner Form */}
                        <form onSubmit={handleAddVendorLocal} className="pt-3 border-t border-border/40 grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Pudratchi nomi</Label>
                            <Input
                              placeholder="masalan: Ziyo Catering"
                              value={newVendorName}
                              onChange={e => setNewVendorName(e.target.value)}
                              className="h-8 rounded-lg text-xs"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Kategoriya</Label>
                            <select
                              value={newVendorCategory}
                              onChange={e => setNewVendorCategory(e.target.value)}
                              className="w-full h-8 rounded-lg text-xs bg-background border border-input px-2"
                            >
                              <option value="Katering (Taomlar)">Katering (Taomlar)</option>
                              <option value="Zallarni bezatish">Zallarni bezatish</option>
                              <option value="Musiqa va Chiroq">Musiqa va Chiroq</option>
                              <option value="Foto & Video">Foto & Video</option>
                              <option value="Boshqa xizmatlar">Boshqa xizmatlar</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Shartnoma / To'lov</Label>
                            <div className="flex gap-1.5">
                              <Input
                                type="number"
                                placeholder="Jami narxi"
                                value={newVendorPrice}
                                onChange={e => setNewVendorPrice(e.target.value)}
                                className="h-8 rounded-lg text-xs w-1/2"
                                required
                              />
                              <Input
                                type="number"
                                placeholder="To'langan qism"
                                value={newVendorPaid}
                                onChange={e => setNewVendorPaid(e.target.value)}
                                className="h-8 rounded-lg text-xs w-1/2"
                              />
                            </div>
                          </div>
                          <div className="flex items-end">
                            <Button type="submit" size="sm" className="w-full h-8 rounded-lg text-xs font-semibold bg-pink-600 hover:bg-pink-700 text-white">
                              Qo'shish
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column: Active alerts & Checklist */}
                  <div className="space-y-4">
                    <Card className="border-border">
                      <CardHeader>
                        <CardTitle className="text-base">Tadbir kuni to'lovlar jadvali</CardTitle>
                        <CardDescription>Tadbir yakunida zudlik bilan to'lanishi lozim bo'lgan qoldiq pullar ro'yxati.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-3 border rounded-xl bg-muted/20 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">Jami to'lanishi lozim bo'lgan qoldiq</span>
                          <p className="text-lg font-bold text-rose-500">{totalVendorRemaining.toLocaleString()} UZS</p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-primary">To'lov eslatmalari</h4>
                          {vendors.filter(v => v.price > v.paid).length === 0 ? (
                            <p className="text-xs text-muted-foreground">Barcha hamkorlar bilan to'liq hisob-kitob qilingan.</p>
                          ) : (
                            <div className="space-y-2">
                              {vendors
                                .filter(v => v.price > v.paid)
                                .map(v => (
                                  <div key={v.id} className="p-2.5 border rounded-lg bg-rose-500/5 border-rose-500/10 flex justify-between items-center text-xs">
                                    <div>
                                      <p className="font-semibold text-foreground">{v.name}</p>
                                      <p className="text-[10px] text-muted-foreground">{v.category}</p>
                                    </div>
                                    <span className="font-bold text-rose-400">
                                      {(v.price - v.paid).toLocaleString()} UZS
                                    </span>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            );
          })()}
        </TabsContent>
      </Tabs>

      {/* Booking Form Modal */}
      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)} title="Yangi Buyurtma Qo'shish">
          <form onSubmit={handleAddBooking} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Mijoz Ismi va Familiyasi</Label>
              <Input 
                value={newBooking.client_name} 
                onChange={e => setNewBooking({ ...newBooking, client_name: e.target.value })} 
                placeholder="masalan: Azizbek Karimov" 
                required 
                className="rounded-xl" 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Telefon raqami</Label>
                <Input 
                  value={newBooking.client_phone} 
                  onChange={e => setNewBooking({ ...newBooking, client_phone: e.target.value })} 
                  placeholder="masalan: +998 90 999 88 77" 
                  required 
                  className="rounded-xl" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tadbir sanasi</Label>
                <Input 
                  type="date" 
                  value={newBooking.event_date} 
                  onChange={e => setNewBooking({ ...newBooking, event_date: e.target.value })} 
                  required 
                  className="rounded-xl" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Zal Nomi</Label>
                <select 
                  value={newBooking.hall_name} 
                  onChange={e => setNewBooking({ ...newBooking, hall_name: e.target.value })}
                  className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm"
                >
                  <option value="Versal Zali">Versal Zali</option>
                  <option value="Oltin Saroy">Oltin Saroy</option>
                  <option value="Chinnigullar Zali">Chinnigullar Zali</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Paket turi</Label>
                <select 
                  value={newBooking.menu_package} 
                  onChange={e => setNewBooking({ ...newBooking, menu_package: e.target.value })}
                  className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm"
                >
                  <option value="standard">Standard (Kumush)</option>
                  <option value="gold">Gold (Oltin)</option>
                  <option value="platinum">Platinum (Platina)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Jami Summa (so'm)</Label>
                <Input 
                  type="number" 
                  value={newBooking.total_price} 
                  onChange={e => setNewBooking({ ...newBooking, total_price: e.target.value })} 
                  required 
                  className="rounded-xl" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Zakalat deposit (so'm)</Label>
                <Input 
                  type="number" 
                  value={newBooking.paid_deposit} 
                  onChange={e => setNewBooking({ ...newBooking, paid_deposit: e.target.value })} 
                  required 
                  className="rounded-xl" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Mehmonlar soni</Label>
              <Input 
                type="number" 
                value={newBooking.guest_count} 
                onChange={e => setNewBooking({ ...newBooking, guest_count: e.target.value })} 
                required 
                className="rounded-xl" 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Izohlar / Menyu kelishuvi</Label>
              <Input 
                value={newBooking.notes} 
                onChange={e => setNewBooking({ ...newBooking, notes: e.target.value })} 
                placeholder="masalan: Go'shtli assorti oshirilsin" 
                className="rounded-xl" 
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl">Bekor qilish</Button>
              <Button type="submit" className="rounded-xl font-bold">Saqlash</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
