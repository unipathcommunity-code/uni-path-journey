import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Plane,
  Plus,
  Calendar,
  Clock,
  UserCheck,
  DollarSign,
  Map as MapIcon,
  TrendingUp,
  MapPin,
  Users,
  Briefcase,
  CheckCircle2,
  Search,
  Download,
  FileText,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  BookOpen,
  Edit2,
  X,
  Receipt
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface TourPackage {
  id: string;
  title: string;
  destinations: string;
  duration_days: number;
  price: number;
  currency: string;
  total_spots: number;
  booked_spots: number;
  guide_name: string;
  /** ISO date string — jo'nab ketish sanasi */
  departure_date?: string;
  itinerary: Array<{ day: number; title: string; desc: string }>;
}

interface TourBooking {
  id: string;
  tour_id: string;
  tour_title?: string;
  customer_name: string;
  customer_phone: string;
  spots_booked: number;
  payment_status: 'paid' | 'partial' | 'unpaid';
  total_amount: number;
  paid_amount: number;
  insurance_included: boolean;
  booking_date: string;
}

interface TourLead {
  id: string;
  name: string;
  phone: string;
  destination: string;
  budget: string;
  status: 'new' | 'contacted' | 'demo' | 'won' | 'lost';
  note: string;
  created_at: string;
}

interface VisaRecord {
  id: string;
  customer_name: string;
  customer_phone: string;
  destination: string;
  tour_title: string;
  /** ISO date string yyyy-MM-dd */
  passport_expiry: string;
  /** ISO date string yyyy-MM-dd */
  visa_deadline: string;
  visa_status: 'not_started' | 'in_progress' | 'approved' | 'rejected';
  insurance: boolean;
  flight_ticket: boolean;
  hotel_voucher: boolean;
  note: string;
  created_at: string;
}

/** Generate and download a professional PDF invoice for a booking */
function generateInvoicePDF(booking: TourBooking, tenantName: string, subdomain: string | null) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const invoiceNo = `INV-${booking.id.slice(0, 8).toUpperCase()}`;
  const issueDate = new Date(booking.booking_date || new Date()).toLocaleDateString('uz-UZ');
  const currency = 'UZS';

  // ── Header background ──────────────────────────────────────────────────
  doc.setFillColor(16, 185, 129); // emerald
  doc.rect(0, 0, W, 42, 'F');

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(tenantName || 'UniPath', 14, 18);

  // Subdomain
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${subdomain || 'unipath'}.unipath.me  ·  Powered by UniPath`, 14, 26);

  // INVOICE label
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', W - 14, 18, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`№ ${invoiceNo}`, W - 14, 26, { align: 'right' });
  doc.text(`Sana: ${issueDate}`, W - 14, 32, { align: 'right' });

  // ── Client info ─────────────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Mijoz ma\'lumotlari', 14, 54);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Ism: ${booking.customer_name || '—'}`, 14, 61);
  doc.text(`Telefon: ${booking.customer_phone || '—'}`, 14, 68);

  // Status badge (right side)
  const statusColors: Record<string, [number,number,number]> = {
    paid: [16, 185, 129], partial: [245, 158, 11], unpaid: [239, 68, 68]
  };
  const statusLabels: Record<string, string> = { paid: "TO'LANDI", partial: "QISMAN", unpaid: "TO'LANMAGAN" };
  const [r, g, b] = statusColors[booking.payment_status] || [100,100,100];
  doc.setFillColor(r, g, b);
  doc.roundedRect(W - 55, 50, 40, 10, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(statusLabels[booking.payment_status] || booking.payment_status, W - 35, 56.5, { align: 'center' });

  // ── Divider ──────────────────────────────────────────────────────────────
  doc.setDrawColor(230, 230, 230);
  doc.line(14, 76, W - 14, 76);

  // ── Table header ─────────────────────────────────────────────────────────
  doc.setFillColor(245, 247, 250);
  doc.rect(14, 80, W - 28, 10, 'F');
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Xizmat', 18, 86.5);
  doc.text('Miqdor', 120, 86.5, { align: 'right' });
  doc.text('Narx (UZS)', 160, 86.5, { align: 'right' });
  doc.text('Jami (UZS)', W - 18, 86.5, { align: 'right' });

  // ── Table row ─────────────────────────────────────────────────────────────
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const tourTitle = booking.tour_title || 'Sayohat paketi';
  const pricePerPerson = booking.spots_booked > 0 ? Math.round(booking.total_amount / booking.spots_booked) : booking.total_amount;
  doc.text(tourTitle, 18, 100);
  doc.text(`${booking.spots_booked} kishi`, 120, 100, { align: 'right' });
  doc.text(pricePerPerson.toLocaleString(), 160, 100, { align: 'right' });
  doc.text(booking.total_amount.toLocaleString(), W - 18, 100, { align: 'right' });

  // Insurance row
  if (booking.insurance_included) {
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('Sug\'urta', 18, 110);
    doc.text('1', 120, 110, { align: 'right' });
    doc.text('Kiritilgan', 160, 110, { align: 'right' });
    doc.text('—', W - 18, 110, { align: 'right' });
  }

  // ── Summary box ──────────────────────────────────────────────────────────
  const summaryY = booking.insurance_included ? 124 : 114;
  doc.setDrawColor(230, 230, 230);
  doc.line(14, summaryY - 4, W - 14, summaryY - 4);

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.text('Jami summa:', W - 60, summaryY + 4);
  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${booking.total_amount.toLocaleString()} ${currency}`, W - 18, summaryY + 4, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text("To'langan summa:", W - 60, summaryY + 12);
  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  doc.text(`${booking.paid_amount.toLocaleString()} ${currency}`, W - 18, summaryY + 12, { align: 'right' });

  const debt = booking.total_amount - booking.paid_amount;
  if (debt > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Qoldiq qarzdorlik:', W - 60, summaryY + 20);
    doc.setTextColor(239, 68, 68);
    doc.setFont('helvetica', 'bold');
    doc.text(`${debt.toLocaleString()} ${currency}`, W - 18, summaryY + 20, { align: 'right' });
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.setFillColor(245, 247, 250);
  doc.rect(0, 267, W, 30, 'F');
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Ushbu hisob-faktura UniPath platformasi orqali yaratilgan.', W / 2, 276, { align: 'center' });
  doc.text(`${tenantName}  ·  ${subdomain || 'unipath'}.unipath.me`, W / 2, 283, { align: 'center' });
  doc.text(`Chiqarilgan: ${issueDate}  ·  ${invoiceNo}`, W / 2, 289, { align: 'center' });

  // Save
  doc.save(`${invoiceNo}_${(booking.customer_name || 'mijoz').replace(/\s+/g, '_')}.pdf`);
}

export default function AdminTour() {
  const { activeTenant } = useApp();
  const { toast } = useToast();
  const tid = activeTenant?.id;
  
  const [activeTab, setActiveTab] = useState<'insights' | 'tours' | 'bookings' | 'calendar' | 'planner' | 'leads' | 'visa'>('insights');
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth()); // 0-indexed
  const [loading, setLoading] = useState(false);
  const [tours, setTours] = useState<TourPackage[]>([]);
  const [bookings, setBookings] = useState<TourBooking[]>([]);

  // Leads (CRM)
  const [leads, setLeads] = useState<TourLead[]>(() => {
    const saved = localStorage.getItem(`unipath_tour_leads_${tid || 'default'}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', phone: '', destination: '', budget: '', note: '' });

  const LEAD_STAGES: { id: TourLead['status']; label: string; color: string }[] = [
    { id: 'new', label: 'Yangi', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
    { id: 'contacted', label: "Bog'lanildi", color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
    { id: 'demo', label: "Ko'rgazma", color: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
    { id: 'won', label: 'Yutildi ✓', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
    { id: 'lost', label: "Yo'qotildi", color: 'bg-rose-500/15 text-rose-400 border-rose-500/20' },
  ];

  const saveLeads = (updated: TourLead[]) => {
    setLeads(updated);
    localStorage.setItem(`unipath_tour_leads_${tid || 'default'}`, JSON.stringify(updated));
  };

  const handleAddLead = () => {
    if (!newLead.name.trim() || !newLead.phone.trim()) return;
    const lead: TourLead = {
      id: `lead-${Date.now()}`,
      name: newLead.name,
      phone: newLead.phone,
      destination: newLead.destination,
      budget: newLead.budget,
      note: newLead.note,
      status: 'new',
      created_at: new Date().toISOString().split('T')[0],
    };
    saveLeads([lead, ...leads]);
    setNewLead({ name: '', phone: '', destination: '', budget: '', note: '' });
    setIsLeadModalOpen(false);
    toast({ title: "Yangi lid qo'shildi!", description: `${lead.name} CRM ga saqlandi.` });
  };

  const handleLeadStageChange = (id: string, status: TourLead['status']) => {
    const updated = leads.map(l => l.id === id ? { ...l, status } : l);
    saveLeads(updated);
    toast({ title: "Bosqich yangilandi", description: `Lid holati o'zgartirildi.` });
  };

  const handleDeleteLead = (id: string) => {
    if (!confirm("Haqiqatan ham bu lidni o'chirmoqchimisiz?")) return;
    saveLeads(leads.filter(l => l.id !== id));
  };

  // ── VISA TRACKER ────────────────────────────────────────────────────────────
  const [visaRecords, setVisaRecords] = useState<VisaRecord[]>(() => {
    const saved = localStorage.getItem(`unipath_visa_records_${tid || 'default'}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [isVisaModalOpen, setIsVisaModalOpen] = useState(false);
  const [editingVisa, setEditingVisa] = useState<VisaRecord | null>(null);
  const [newVisa, setNewVisa] = useState({
    customer_name: '',
    customer_phone: '',
    destination: '',
    tour_title: '',
    passport_expiry: '',
    visa_deadline: '',
    visa_status: 'not_started' as VisaRecord['visa_status'],
    insurance: false,
    flight_ticket: false,
    hotel_voucher: false,
    note: '',
  });

  const saveVisaRecords = (updated: VisaRecord[]) => {
    setVisaRecords(updated);
    localStorage.setItem(`unipath_visa_records_${tid || 'default'}`, JSON.stringify(updated));
  };

  const handleSaveVisa = () => {
    if (!newVisa.customer_name.trim()) return;
    if (editingVisa) {
      saveVisaRecords(visaRecords.map(v => v.id === editingVisa.id ? { ...editingVisa, ...newVisa } : v));
      toast({ title: "Yangilandi", description: `${newVisa.customer_name} ma'lumotlari saqlandi.` });
    } else {
      const record: VisaRecord = {
        id: `visa-${Date.now()}`,
        ...newVisa,
        created_at: new Date().toISOString().split('T')[0],
      };
      saveVisaRecords([record, ...visaRecords]);
      toast({ title: "Viza yozuvi qo'shildi!", description: `${record.customer_name} uchun hujjat kuzatuvi boshlandi.` });
    }
    setIsVisaModalOpen(false);
    setEditingVisa(null);
    setNewVisa({ customer_name: '', customer_phone: '', destination: '', tour_title: '', passport_expiry: '', visa_deadline: '', visa_status: 'not_started', insurance: false, flight_ticket: false, hotel_voucher: false, note: '' });
  };

  const handleDeleteVisa = (id: string) => {
    if (!confirm("Bu yozuvni o'chirishni tasdiqlaysizmi?")) return;
    saveVisaRecords(visaRecords.filter(v => v.id !== id));
  };

  const openEditVisa = (record: VisaRecord) => {
    setEditingVisa(record);
    setNewVisa({
      customer_name: record.customer_name,
      customer_phone: record.customer_phone,
      destination: record.destination,
      tour_title: record.tour_title,
      passport_expiry: record.passport_expiry,
      visa_deadline: record.visa_deadline,
      visa_status: record.visa_status,
      insurance: record.insurance,
      flight_ticket: record.flight_ticket,
      hotel_voucher: record.hotel_voucher,
      note: record.note,
    });
    setIsVisaModalOpen(true);
  };

  const getDaysUntil = (dateStr: string) => {
    if (!dateStr) return null;
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
    return diff;
  };

  const VISA_STATUS_MAP: Record<VisaRecord['visa_status'], { label: string; color: string }> = {
    not_started: { label: "Boshlanmagan", color: "bg-slate-500/15 text-slate-400 border-slate-500/20" },
    in_progress: { label: "Jarayonda", color: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
    approved: { label: "✓ Tasdiqlandi", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
    rejected: { label: "✕ Rad etildi", color: "bg-rose-500/15 text-rose-400 border-rose-500/20" },
  };

  // Search Filter
  const [searchTerm, setSearchTerm] = useState('');

  // Tour Builder Modal / Forms
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [newTourTitle, setNewTourTitle] = useState('');
  const [newTourDest, setNewTourDest] = useState('');
  const [newTourDays, setNewTourDays] = useState(7);
  const [newTourPrice, setNewTourPrice] = useState('8500000');
  const [newTourSpots, setNewTourSpots] = useState(25);
  const [newTourGuide, setNewTourGuide] = useState('Shaxboz Qodirov');
  const [newTourDeparture, setNewTourDeparture] = useState('');
  const [itineraryInputs, setItineraryInputs] = useState<Array<{ day: number; title: string; desc: string }>>([
    { day: 1, title: 'Kutib olish va Mehmonxona', desc: 'Aeroportda kutib olish hamda premium mehmonxonaga joylashish.' },
    { day: 2, title: 'Tarixiy obidalar ekskursiyasi', desc: 'Shahar markazidagi qadimiy obidalar va muzeylarga sayohat.' }
  ]);

  // Synchronize itinerary inputs with number of days
  useEffect(() => {
    setItineraryInputs(prev => {
      const currentDays = prev.length;
      if (newTourDays === currentDays) return prev;
      if (newTourDays > currentDays) {
        // Add days
        const added = Array.from({ length: newTourDays - currentDays }, (_, i) => ({
          day: currentDays + i + 1,
          title: `Kun ${currentDays + i + 1} rejasi`,
          desc: 'Ushbu kun uchun rejalashtirilgan marshrut tavsifi.'
        }));
        return [...prev, ...added];
      } else {
        // Truncate days
        return prev.slice(0, newTourDays);
      }
    });
  }, [newTourDays]);

  // Booking Modal / Forms
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState<TourPackage | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [spotsToBook, setSpotsToBook] = useState(2);
  const [paidAmt, setPaidAmt] = useState('2000000'); // Initial deposit split
  const [incInsurance, setIncInsurance] = useState(true);

  // Load data from Supabase
  const loadData = useCallback(async () => {
    if (!tid) { setLoading(false); return; }
    setLoading(true);
    try {
      // 1. Fetch tour packages
      const { data: dbPackages, error: pkgErr } = await supabase
        .from('tour_packages')
        .select('*')
        .eq('tenant_id', tid);
      if (pkgErr) throw pkgErr;

      // 2. Fetch tour bookings
      const { data: dbBookings, error: bookErr } = await supabase
        .from('tour_bookings')
        .select('*')
        .eq('tenant_id', tid);
      if (bookErr) throw bookErr;

      // Map packages
      const mappedTours: TourPackage[] = (dbPackages || []).map(p => {
        // Parse itinerary from description if it exists in "Kun N: Title - Desc" format
        let itinerary: Array<{ day: number; title: string; desc: string }> = [];
        if (p.description) {
          const lines = p.description.split('\n').filter(Boolean);
          const parsed = lines.map((line, i) => {
            const match = line.match(/^Kun (\d+): (.+?) - (.+)$/);
            if (match) return { day: parseInt(match[1]), title: match[2], desc: match[3] };
            return { day: i + 1, title: `Kun ${i + 1}`, desc: line };
          });
          if (parsed.length > 0) itinerary = parsed;
        }
        if (itinerary.length === 0) {
          itinerary = [{ day: 1, title: 'Kutib olish va Mehmonxona', desc: 'Aeroportda kutib olish hamda premium mehmonxonaga joylashish.' }];
        }
        return {
          id: p.id,
          title: p.name,
          destinations: p.destination,
          duration_days: p.duration_days,
          price: p.price,
          currency: (p as any).currency || 'UZS',
          total_spots: p.max_slots || 25,
          booked_spots: 0, // calculated below from bookings
          guide_name: (p as any).guide_name || (p as any).guide || 'Belgilanmagan',
          departure_date: (p as any).departure_date || null,
          itinerary
        };
      });

      // Map bookings
      const mappedBookings: TourBooking[] = (dbBookings || []).map(b => {
        const pkg = mappedTours.find(t => t.id === b.package_id);
        return {
          id: b.id,
          tour_id: b.package_id,
          tour_title: pkg?.title || "Sayohat to'plami",
          customer_name: b.guest_name,
          customer_phone: b.guest_phone || '',
          spots_booked: (b as any).spots_booked || (b as any).num_guests || 1,
          payment_status: (b.status === 'paid' || b.status === 'partial' || b.status === 'unpaid') ? b.status : 'unpaid',
          total_amount: b.total_amount || 0,
          paid_amount: b.status === 'paid' ? (b.total_amount || 0) : b.status === 'partial' ? ((b as any).paid_amount || (b.total_amount || 0) * 0.4) : 0,
          insurance_included: (b as any).insurance_included ?? false,
          booking_date: b.created_at ? b.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
        };
      });

      // Update booked spot counts
      const bookedMap = new Map<string, number>();
      mappedBookings.forEach(mb => {
        const cur = bookedMap.get(mb.tour_id) || 0;
        bookedMap.set(mb.tour_id, cur + mb.spots_booked);
      });

      const finalTours = mappedTours.map(t => ({
        ...t,
        booked_spots: Math.min(t.total_spots, bookedMap.get(t.id) || 0)
      }));

      setTours(finalTours);
      setBookings(mappedBookings);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Xatolik",
        description: err?.message || err?.details || (typeof err === 'object' ? JSON.stringify(err) : String(err)),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [tid, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Delete Tour Package
  const handleDeleteTour = async (tourId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Haqiqatan ham ushbu sayohat paketini o'chirmoqchimisiz?")) return;
    try {
      const { error } = await supabase
        .from('tour_packages')
        .delete()
        .eq('id', tourId);
      if (error) throw error;
      toast({
        title: "Muvaffaqiyatli",
        description: "Sayohat paketi o'chirildi.",
      });
      loadData();
    } catch (err) {
      toast({
        title: "Xatolik",
        description: "Paketni o'chirib bo'lmadi.",
        variant: "destructive"
      });
    }
  };

  // Delete Booking
  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm("Haqiqatan ham ushbu buyurtmani o'chirmoqchimisiz?")) return;
    try {
      const { error } = await supabase
        .from('tour_bookings')
        .delete()
        .eq('id', bookingId);
      if (error) throw error;
      toast({
        title: "Muvaffaqiyatli",
        description: "Sayohat buyurtmasi o'chirildi.",
      });
      loadData();
    } catch (err) {
      toast({
        title: "Xatolik",
        description: "Buyurtmani o'chirib bo'lmadi.",
        variant: "destructive"
      });
    }
  };

  // Create new Tour Package
  const handleCreateTour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTourTitle.trim() || !newTourDest.trim()) return;

    try {
      const { error } = await supabase
        .from('tour_packages')
        .insert({
          tenant_id: tid,
          name: newTourTitle,
          destination: newTourDest,
          duration_days: newTourDays,
          price: parseFloat(newTourPrice),
          max_slots: newTourSpots,
          guide_name: newTourGuide,
          departure_date: newTourDeparture || null,
          description: itineraryInputs.map(it => `Kun ${it.day}: ${it.title} - ${it.desc}`).join('\n'),
          itinerary: itineraryInputs
        });
      if (error) throw error;

      setIsTourModalOpen(false);
      // Reset Form
      setNewTourTitle('');
      setNewTourDest('');
      setNewTourDays(7);
      setNewTourPrice('8500000');
      setNewTourSpots(25);
      setNewTourGuide('Shaxboz Qodirov');
      setNewTourDeparture('');
      setItineraryInputs([
        { day: 1, title: 'Kutib olish va Mehmonxona', desc: 'Aeroportda kutib olish hamda premium mehmonxonaga joylashish.' }
      ]);

      toast({
        title: "Yangi sayohat paketi yaratildi!",
        description: `"${newTourTitle}" safari muvaffaqiyatli ro'yxatga olindi.`,
      });
      loadData();
    } catch (err) {
      toast({
        title: "Xatolik",
        description: "Sayohat paketini yaratishda xatolik.",
        variant: "destructive"
      });
    }
  };

  // Book a Tour for Customer
  const handleBookTour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTour || !customerName.trim()) return;

    const availableSpots = selectedTour.total_spots - selectedTour.booked_spots;
    if (spotsToBook > availableSpots) {
      toast({
        title: "Joy yetarli emas!",
        description: `Bu turda atigi ${availableSpots} ta bo'sh joy qolgan.`,
        variant: "destructive"
      });
      return;
    }

    const totalAmount = spotsToBook * selectedTour.price;
    const paid = parseFloat(paidAmt);
    let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';
    if (paid >= totalAmount) status = 'paid';
    else if (paid > 0) status = 'partial';

    try {
      const { error } = await supabase
        .from('tour_bookings')
        .insert({
          tenant_id: tid,
          package_id: selectedTour.id,
          guest_name: customerName,
          guest_phone: customerPhone,
          guest_email: `${customerName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
          total_amount: totalAmount,
          status: status
        });
      if (error) throw error;

      // Automatically queue bot/sms messages
      const notificationMsg = `Hurmatli ${customerName}, tabriklaymiz! Sizning "${selectedTour.title}" sayohati uchun buyurtmangiz muvaffaqiyatli qabul qilindi. Band qilingan joylar: ${spotsToBook} ta. Jami to'lov miqdori: ${totalAmount.toLocaleString()} UZS. Sayohatingiz shaffof va qulay o'tishi kafolatlanadi. Savollar bo'yicha bizning Telegram botimiz va telefon liniyalarimiz har doim ochiq!`;

      await supabase.from('notification_queue').insert([
        {
          tenant_id: tid,
          type: 'sms',
          target: customerPhone,
          payload: { message: notificationMsg }
        },
        {
          tenant_id: tid,
          type: 'telegram',
          target: `@${customerName.toLowerCase().replace(/\s+/g, '')}`,
          payload: { message: notificationMsg }
        }
      ]);

      setIsBookingModalOpen(false);
      setCustomerName('');
      setCustomerPhone('');
      setSpotsToBook(2);
      setPaidAmt('2000000');

      toast({
        title: "Sayohat bron qilindi!",
        description: `${customerName} uchun ${spotsToBook} ta joy muvaffaqiyatli band qilindi.`,
      });
      loadData();
    } catch (err) {
      toast({
        title: "Xatolik",
        description: "Buyurtma berishda xatolik.",
        variant: "destructive"
      });
    }
  };

  // Quick spot availability color generator
  const getSpotBadge = (booked: number, total: number) => {
    const left = total - booked;
    if (left === 0) return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    if (left <= 5) return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  };

  // Payment badge generator
  const getPaymentBadge = (status: 'paid' | 'partial' | 'unpaid') => {
    switch (status) {
      case 'paid': return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20';
      case 'partial': return 'bg-amber-500/15 text-amber-400 border border-amber-500/20';
      case 'unpaid': return 'bg-rose-500/15 text-rose-400 border border-rose-500/20';
    }
  };

  // Mock PDF Export Itinerary Trigger
  const handleExportItinerary = (tour: TourPackage) => {
    toast({
      title: "Itinerary PDF tayyorlanmoqda...",
      description: `"${tour.title}" sayohati uchun PDF formatdagi marshrut varaqasi yuklab olinmoqda.`
    });

    setTimeout(() => {
      toast({
        title: "Yuklab olindi!",
        description: `Marshrut fayli muvaffaqiyatli saqlandi.`,
        variant: "default"
      });
    }, 1500);
  };

  // Compute statistika metrics
  const totalRevenue = bookings.reduce((sum, b) => sum + b.paid_amount, 0);
  const unpaidBalance = bookings.reduce((sum, b) => sum + (b.total_amount - b.paid_amount), 0);
  const totalBookedSeats = tours.reduce((sum, t) => sum + t.booked_spots, 0);
  const totalCapacity = tours.reduce((sum, t) => sum + t.total_spots, 0);
  const seatFillPercentage = totalCapacity > 0 ? Math.round((totalBookedSeats / totalCapacity) * 100) : 0;

  // Filter bookings or tours
  const filteredTours = tours.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.destinations.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dark bg-[#0a0a0c] text-white p-6 rounded-3xl border border-white/10 shadow-2xl min-h-[calc(100vh-120px)] space-y-6 max-w-7xl font-sans relative">
      {/* Background radial highlight */}
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Plane className="w-8 h-8 text-primary animate-pulse" /> 
            {activeTenant?.name ? `${activeTenant.name} Travel CRM` : 'Turistik Kompaniya Dashboard'}
          </h1>
          <p className="text-white/60 text-sm mt-1">Turlar boshqaruvi, kunlik visual taklifnomalar va buyurtmalar quvuri.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsTourModalOpen(true)} className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_0_15px_rgba(212,175,55,0.2)]">
            <Plus className="w-5 h-5" /> Yangi Tur Yaratish
          </Button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-px overflow-x-auto select-none">
        {[
          { id: 'insights', label: 'Statistika & Analitika', icon: TrendingUp },
          { id: 'tours', label: 'Sayohat Paketlari', icon: Plane },
          { id: 'bookings', label: 'Buyurtmalar (Bookings)', icon: FileText },
          { id: 'calendar', label: 'Kalendar', icon: Calendar },
          { id: 'leads', label: 'Lidlar (CRM)', icon: UserCheck },
          { id: 'visa', label: 'Viza & Hujjatlar', icon: BookOpen },
          { id: 'planner', label: 'Sayohat Tahlilchisi (Planner)', icon: MapIcon }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                activeTab === tab.id 
                  ? 'border-primary text-white bg-white/[0.02]' 
                  : 'border-transparent text-white/50 hover:text-white/80 hover:bg-white/[0.01]'
              }`}
            >
              <Icon className="w-4 h-4 text-primary" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-[#111111]/80 backdrop-blur-xl border border-white/5 rounded-2xl">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/50 font-bold uppercase tracking-wider">Jami Tushum</p>
                  <p className="text-2xl font-black text-emerald-400 mt-1">{totalRevenue.toLocaleString()} UZS</p>
                  <p className="text-[10px] text-white/40 mt-1">Kassa va hisob-kitoblar</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#111111]/80 backdrop-blur-xl border border-white/5 rounded-2xl">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/50 font-bold uppercase tracking-wider">Qarzdorlik (Balans)</p>
                  <p className="text-2xl font-black text-rose-400 mt-1">{unpaidBalance.toLocaleString()} UZS</p>
                  <p className="text-[10px] text-white/40 mt-1">Yig‘ilishi kutilayotgan summa</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#111111]/80 backdrop-blur-xl border border-white/5 rounded-2xl">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/50 font-bold uppercase tracking-wider">Joylar Bandligi</p>
                  <p className="text-2xl font-black text-sky-400 mt-1">{seatFillPercentage}%</p>
                  <p className="text-[10px] text-white/40 mt-1">{totalBookedSeats} ta band / {totalCapacity} jami</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-sky-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#111111]/80 backdrop-blur-xl border border-white/5 rounded-2xl">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/50 font-bold uppercase tracking-wider">Mavjud Turlar</p>
                  <p className="text-2xl font-black text-primary mt-1">{tours.length} xil paket</p>
                  <p className="text-[10px] text-white/40 mt-1">Samara berayotgan yo‘nalishlar</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Plane className="w-5 h-5 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Visual Reports */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-[#111111]/80 backdrop-blur-xl border border-white/5 rounded-2xl lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base text-white font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" /> Sayohatlar Oqimi Va Tushum
                </CardTitle>
                <CardDescription className="text-white/55">Oxirgi 6 oylik buyurtmalar va moliyaviy barqarorlik</CardDescription>
              </CardHeader>
              <CardContent className="h-64 flex flex-col justify-end">
                {/* SVG Animated Chart Mock */}
                <div className="w-full h-48 flex items-end justify-between px-4 pb-2 border-b border-white/5 relative">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                    <div className="w-full border-t border-white" />
                    <div className="w-full border-t border-white" />
                    <div className="w-full border-t border-white" />
                  </div>
                  
                  {/* Columns */}
                  {[
                    { month: 'Yan', val: 30, rev: '12M UZS' },
                    { month: 'Fev', val: 55, rev: '24M UZS' },
                    { month: 'Mar', val: 45, rev: '18M UZS' },
                    { month: 'Apr', val: 75, rev: '45M UZS' },
                    { month: 'May', val: 90, rev: '82M UZS' }
                  ].map((col, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2 z-10 w-12 group cursor-pointer">
                      <span className="text-[9px] font-bold text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 px-1 py-0.5 rounded">
                        {col.rev}
                      </span>
                      <div 
                        className="w-8 rounded-t bg-gradient-to-t from-primary/30 to-primary group-hover:from-emerald-500/40 group-hover:to-emerald-400 transition-all shadow-[0_0_10px_rgba(212,175,55,0.15)]"
                        style={{ height: `${col.val * 1.5}px` }}
                      />
                      <span className="text-[10px] text-white/55 font-bold uppercase tracking-wider">{col.month}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#111111]/80 backdrop-blur-xl border border-white/5 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base text-white font-bold">Ommabop Yo‘nalishlar</CardTitle>
                <CardDescription className="text-white/55">Paketlar bo‘yicha sotilgan chiptalar foizi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tours.map(t => {
                  const fill = t.total_spots > 0 ? Math.round((t.booked_spots / t.total_spots) * 100) : 0;
                  return (
                    <div key={t.id} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-white">
                        <span className="truncate">{t.title}</span>
                        <span>{fill}%</span>
                      </div>
                      <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500" 
                          style={{ width: `${fill}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-white/40">
                        <span>{t.booked_spots} ta sotildi</span>
                        <span>{t.total_spots - t.booked_spots} ta qoldi</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'tours' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                type="text"
                placeholder="Turlarni izlash (masalan: Samarqand, Turkiya)..."
                className="pl-11 h-11 bg-white/5 border-white/10 rounded-xl text-white focus:border-primary/50 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Tours Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredTours.map((tour) => (
              <Card key={tour.id} className="bg-[#111111]/80 backdrop-blur-xl border border-white/5 rounded-2xl flex flex-col justify-between overflow-hidden shadow-lg hover:border-white/10 transition-all">
                <div>
                  {/* Top Cover */}
                  <div className="h-32 bg-gradient-to-r from-primary/10 to-primary/5 p-5 flex flex-col justify-between border-b border-white/5 relative">
                    <span className="absolute top-4 right-4 bg-black/60 text-[10px] font-bold text-white px-2 py-1 rounded-full flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-primary" /> {tour.duration_days} Kun / {tour.duration_days - 1} Tun
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-primary font-bold">
                      <MapPin className="w-4 h-4 shrink-0" /> {tour.destinations}
                    </div>
                    <h3 className="text-base font-bold text-white leading-tight truncate mt-1">{tour.title}</h3>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                      <span className="text-white/50">Boshlovchi (Gid):</span>
                      <span className="text-white font-bold flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-primary" /> {tour.guide_name}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                      <span className="text-white/50">Joylar Bandligi:</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getSpotBadge(tour.booked_spots, tour.total_spots)}`}>
                        {tour.booked_spots} / {tour.total_spots} ta band
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/50">Narx (Mijoz boshiga):</span>
                      <span className="text-base font-black text-primary">
                        {tour.price.toLocaleString()} UZS
                      </span>
                    </div>

                    {/* Day-by-Day Itinerary Dropdown Mock */}
                    <div className="pt-2">
                      <h4 className="text-[10px] uppercase font-bold text-white/40 tracking-wider mb-2">Kunlik Marshrut</h4>
                      <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1 text-xs">
                        {tour.itinerary.map(it => (
                          <div key={it.day} className="flex gap-2 items-start bg-white/[0.02] p-2 rounded-lg border border-white/5">
                            <span className="bg-primary/10 text-primary font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                              {it.day}
                            </span>
                            <div>
                              <p className="font-bold text-white/95 leading-tight">{it.title}</p>
                              <p className="text-white/55 text-[10px] mt-0.5 leading-relaxed">{it.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-5 pt-0 border-t border-white/5 mt-4 flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-xl h-10 border-white/10 hover:bg-white/5 text-xs text-white"
                    onClick={() => handleExportItinerary(tour)}
                  >
                    <Download className="w-4 h-4 mr-1 text-primary" /> PDF marshrut
                  </Button>
                  <Button 
                    className="flex-1 rounded-xl h-10 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold"
                    onClick={() => {
                      setSelectedTour(tour);
                      setIsBookingModalOpen(true);
                    }}
                    disabled={tour.booked_spots >= tour.total_spots}
                  >
                    {tour.booked_spots >= tour.total_spots ? 'Joy Qolmadi' : 'Bron Qilish'}
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="h-10 w-10 shrink-0 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400"
                    onClick={(e) => handleDeleteTour(tour.id, e)}
                    title="O'chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="space-y-6">
          {/* Bookings Table */}
          <Card className="bg-[#111111]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 py-4">
              <div>
                <CardTitle className="text-base text-white">Buyurtmalar Ro‘yxati (Booking Pipeline)</CardTitle>
                <CardDescription className="text-white/55">Kompaniyaning joriy mavsumdagi barcha sayohat buyurtmalari</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/5 text-white/50 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4">Mijoz Ismi</th>
                      <th className="p-4">Sayohat Nomi</th>
                      <th className="p-4">Joy soni</th>
                      <th className="p-4">Tushum</th>
                      <th className="p-4">To‘lov Holati</th>
                      <th className="p-4">Sug‘urta</th>
                      <th className="p-4">Sana</th>
                      <th className="p-4 text-center">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-white">{booking.customer_name}</p>
                          <p className="text-[10px] text-white/40 mt-0.5">{booking.customer_phone}</p>
                        </td>
                        <td className="p-4 font-medium max-w-[180px] truncate">{booking.tour_title}</td>
                        <td className="p-4 font-bold">{booking.spots_booked} nafar</td>
                        <td className="p-4">
                          <p className="font-bold text-white">{booking.paid_amount.toLocaleString()} UZS</p>
                          <p className="text-[10px] text-white/40 mt-0.5">Jami: {booking.total_amount.toLocaleString()} UZS</p>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${getPaymentBadge(booking.payment_status)}`}>
                            {booking.payment_status}
                          </span>
                        </td>
                        <td className="p-4">
                          {booking.insurance_included ? (
                            <span className="text-emerald-400 flex items-center gap-1"><ShieldCheck className="w-4 h-4 shrink-0" /> Mavjud</span>
                          ) : (
                            <span className="text-white/30 font-medium">Yo‘q</span>
                          )}
                        </td>
                        <td className="p-4 text-white/50">{booking.booking_date}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button size="sm" variant="ghost" className="h-7 text-xs rounded-lg text-emerald-400 hover:bg-emerald-500/10">
                              <CheckCircle2 className="w-4 h-4 mr-1" /> Tasdiqlash
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 rounded-lg text-sky-400 hover:bg-sky-500/10"
                              onClick={() => generateInvoicePDF(booking, activeTenant?.name || 'UniPath', activeTenant?.subdomain || null)}
                              title="PDF Hisob-faktura yuklab olish"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 rounded-lg text-rose-400 hover:bg-rose-500/10"
                              onClick={() => handleDeleteBooking(booking.id)}
                              title="O'chirish"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ CALENDAR TAB ═══ */}
      {activeTab === 'calendar' && (() => {
        const MONTHS_UZ = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
        const DAYS_UZ = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sha', 'Ya'];
        const today = new Date();

        // Build calendar grid
        const firstDay = new Date(calendarYear, calendarMonth, 1);
        const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
        const startDow = (firstDay.getDay() + 6) % 7; // Mon=0
        const daysInMonth = lastDay.getDate();

        // Map departure dates → tours
        const toursByDay: Record<number, TourPackage[]> = {};
        tours.forEach(tour => {
          if (!tour.departure_date) return;
          const d = new Date(tour.departure_date);
          if (d.getFullYear() === calendarYear && d.getMonth() === calendarMonth) {
            const day = d.getDate();
            if (!toursByDay[day]) toursByDay[day] = [];
            toursByDay[day].push(tour);
          }
        });

        // Also map booking dates
        const bookingsByDay: Record<number, TourBooking[]> = {};
        bookings.forEach(b => {
          if (!b.booking_date) return;
          const d = new Date(b.booking_date);
          if (d.getFullYear() === calendarYear && d.getMonth() === calendarMonth) {
            const day = d.getDate();
            if (!bookingsByDay[day]) bookingsByDay[day] = [];
            bookingsByDay[day].push(b);
          }
        });

        const cells: (number | null)[] = [
          ...Array(startDow).fill(null),
          ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
        ];
        while (cells.length % 7 !== 0) cells.push(null);

        const prevMonth = () => {
          if (calendarMonth === 0) { setCalendarYear(y => y - 1); setCalendarMonth(11); }
          else setCalendarMonth(m => m - 1);
        };
        const nextMonth = () => {
          if (calendarMonth === 11) { setCalendarYear(y => y + 1); setCalendarMonth(0); }
          else setCalendarMonth(m => m + 1);
        };

        return (
          <div className="space-y-4">
            {/* Calendar header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">{MONTHS_UZ[calendarMonth]} {calendarYear}</h2>
                <p className="text-xs text-white/50 mt-0.5">Jo'nab ketish sanalari bo'yicha oylik ko'rinish</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={prevMonth} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all">‹</button>
                <button
                  onClick={() => { setCalendarMonth(today.getMonth()); setCalendarYear(today.getFullYear()); }}
                  className="px-3 h-8 rounded-xl bg-primary/20 text-primary text-xs font-bold hover:bg-primary/30 transition-all"
                >
                  Bugun
                </button>
                <button onClick={nextMonth} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all">›</button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-[10px] text-white/50">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" /> Jo'nab ketish</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Yangi bron</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-white/20 inline-block" /> Bugun</span>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1">
              {DAYS_UZ.map(d => (
                <div key={d} className="text-center text-[10px] font-bold uppercase text-white/30 py-1">{d}</div>
              ))}

              {/* Day cells */}
              {cells.map((day, idx) => {
                if (day === null) return <div key={`empty-${idx}`} />;
                const isToday = day === today.getDate() && calendarMonth === today.getMonth() && calendarYear === today.getFullYear();
                const departures = toursByDay[day] || [];
                const bkgs = bookingsByDay[day] || [];
                const hasEvents = departures.length > 0 || bkgs.length > 0;

                return (
                  <div
                    key={day}
                    className={`min-h-[72px] rounded-xl p-1.5 border transition-all cursor-default ${
                      isToday
                        ? 'border-white/30 bg-white/[0.06]'
                        : hasEvents
                        ? 'border-primary/20 bg-primary/5 hover:bg-primary/10'
                        : 'border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className={`text-xs font-bold mb-1 w-6 h-6 rounded-lg flex items-center justify-center ${
                      isToday ? 'bg-primary text-black' : 'text-white/60'
                    }`}>
                      {day}
                    </div>

                    {/* Departure dots */}
                    {departures.slice(0, 2).map((t, i) => (
                      <div key={t.id} title={t.title} className="text-[9px] font-bold truncate rounded px-1 py-0.5 bg-primary/20 text-primary mb-0.5 leading-tight">
                        ✈ {t.title}
                      </div>
                    ))}
                    {departures.length > 2 && (
                      <div className="text-[8px] text-primary/70">+{departures.length - 2} ta</div>
                    )}

                    {/* Booking dots */}
                    {bkgs.slice(0, 1).map((b, i) => (
                      <div key={b.id} title={b.customer_name} className="text-[9px] truncate rounded px-1 py-0.5 bg-amber-500/15 text-amber-300 leading-tight">
                        📋 {b.customer_name}
                      </div>
                    ))}
                    {bkgs.length > 1 && (
                      <div className="text-[8px] text-amber-400/70">+{bkgs.length - 1} bron</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Upcoming departures list */}
            {Object.keys(toursByDay).length > 0 ? (
              <div className="mt-4 space-y-2">
                <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider">Bu oydagi jo'nab ketishlar</h3>
                {Object.entries(toursByDay)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([day, ts]) => (
                    ts.map(t => (
                      <div key={t.id} className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl p-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                          <Plane className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{t.title}</p>
                          <p className="text-[10px] text-white/40">{t.destinations} · {t.duration_days} kun</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-primary">{MONTHS_UZ[calendarMonth]} {day}</p>
                          <p className="text-[10px] text-white/40">{t.booked_spots}/{t.total_spots} o'rin</p>
                        </div>
                      </div>
                    ))
                  ))}
              </div>
            ) : (
              <div className="text-center py-12 text-white/30">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Bu oyda jo'nab ketish yo'q</p>
                <p className="text-[10px] mt-1">Tur paketlarga departure_date kiriting</p>
              </div>
            )}
          </div>
        );
      })()}

      {/* ═══ LEADS (CRM) TAB ═══ */}
      {activeTab === 'leads' && (
        <div className="space-y-5">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Lidlar (CRM Pipeline)</h2>
              <p className="text-xs text-white/50 mt-0.5">Potentsial mijozlarni kuzating — yangi so'rovdan bronlashgacha</p>
            </div>
            <Button
              onClick={() => setIsLeadModalOpen(true)}
              className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
            >
              <Plus className="w-4 h-4" /> Yangi Lid
            </Button>
          </div>

          {/* Kanban-style columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {LEAD_STAGES.map(stage => {
              const stageLeads = leads.filter(l => l.status === stage.id);
              return (
                <div key={stage.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 min-h-[200px]">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${stage.color}`}>{stage.label}</span>
                    <span className="text-[10px] text-white/40 font-bold">{stageLeads.length} ta</span>
                  </div>
                  <div className="space-y-2">
                    {stageLeads.map(lead => (
                      <div key={lead.id} className="bg-[#111111]/80 border border-white/5 rounded-xl p-3 space-y-2 group">
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <p className="text-xs font-bold text-white">{lead.name}</p>
                            <p className="text-[10px] text-white/50">{lead.phone}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded bg-rose-500/10 flex items-center justify-center text-rose-400 text-[10px]"
                          >✕</button>
                        </div>
                        {lead.destination && (
                          <p className="text-[10px] text-primary font-semibold flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{lead.destination}
                          </p>
                        )}
                        {lead.budget && (
                          <p className="text-[10px] text-white/40 flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />{lead.budget}
                          </p>
                        )}
                        {lead.note && (
                          <p className="text-[10px] text-white/50 italic border-t border-white/5 pt-1.5 mt-1">{lead.note}</p>
                        )}
                        {/* Stage changer */}
                        <select
                          value={lead.status}
                          onChange={(e) => handleLeadStageChange(lead.id, e.target.value as any)}
                          className="w-full h-7 px-2 bg-white/5 border border-white/10 rounded-lg text-white text-[10px] font-bold"
                        >
                          {LEAD_STAGES.map(s => (
                            <option key={s.id} value={s.id} className="bg-[#111111]">{s.label}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                    {stageLeads.length === 0 && (
                      <p className="text-[10px] text-white/20 text-center py-4">Hozircha yo'q</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-[#111111]/80 border border-white/5 rounded-xl">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] text-white/50 uppercase font-bold">Jami Lidlar</p>
                  <p className="text-xl font-black text-white">{leads.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#111111]/80 border border-white/5 rounded-xl">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] text-white/50 uppercase font-bold">Yutilgan</p>
                  <p className="text-xl font-black text-emerald-400">{leads.filter(l => l.status === 'won').length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#111111]/80 border border-white/5 rounded-xl">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-white/50 uppercase font-bold">Konversiya</p>
                  <p className="text-xl font-black text-primary">
                    {leads.length > 0 ? Math.round((leads.filter(l => l.status === 'won').length / leads.length) * 100) : 0}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add Lead Modal */}
          {isLeadModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setIsLeadModalOpen(false)}>
              <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-base font-bold text-white">Yangi Lid Qo'shish</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-white/70 text-xs font-bold">Ism Familiya *</Label>
                    <Input value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})}
                      placeholder="Masalan: Jasur Karimov" className="bg-white/5 border-white/10 text-white rounded-xl h-10 mt-1" />
                  </div>
                  <div>
                    <Label className="text-white/70 text-xs font-bold">Telefon *</Label>
                    <Input value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})}
                      placeholder="+998 90 123-45-67" className="bg-white/5 border-white/10 text-white rounded-xl h-10 mt-1" />
                  </div>
                  <div>
                    <Label className="text-white/70 text-xs font-bold">Yo'nalish</Label>
                    <Input value={newLead.destination} onChange={e => setNewLead({...newLead, destination: e.target.value})}
                      placeholder="Masalan: Turkiya, Antaliya" className="bg-white/5 border-white/10 text-white rounded-xl h-10 mt-1" />
                  </div>
                  <div>
                    <Label className="text-white/70 text-xs font-bold">Byudjet</Label>
                    <Input value={newLead.budget} onChange={e => setNewLead({...newLead, budget: e.target.value})}
                      placeholder="Masalan: 5,000,000 UZS" className="bg-white/5 border-white/10 text-white rounded-xl h-10 mt-1" />
                  </div>
                  <div>
                    <Label className="text-white/70 text-xs font-bold">Izoh</Label>
                    <Input value={newLead.note} onChange={e => setNewLead({...newLead, note: e.target.value})}
                      placeholder="Qo'shimcha ma'lumot..." className="bg-white/5 border-white/10 text-white rounded-xl h-10 mt-1" />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button onClick={() => setIsLeadModalOpen(false)} variant="outline" className="flex-1 border-white/10 text-white rounded-xl h-10">Bekor</Button>
                  <Button onClick={handleAddLead} className="flex-1 bg-primary text-primary-foreground font-bold rounded-xl h-10">Saqlash</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── VISA & DOCUMENTS TRACKER TAB ─────────────────────────────────── */}
      {activeTab === 'visa' && (
        <div className="space-y-5">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" /> Viza & Hujjat Kuzatuvi
              </h2>
              <p className="text-xs text-white/50 mt-0.5">Har bir mijoz uchun pasport muddati, viza holati, sug'urta va chiptalarni nazorat qiling.</p>
            </div>
            <Button onClick={() => { setEditingVisa(null); setIsVisaModalOpen(true); }} className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-9">
              <Plus className="w-4 h-4" /> Yangi Yozuv
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Jami Mijozlar", value: visaRecords.length, color: "text-white", bg: "bg-white/5" },
              { label: "Viza Tasdiqlandi", value: visaRecords.filter(v => v.visa_status === 'approved').length, color: "text-emerald-400", bg: "bg-emerald-500/10" },
              { label: "Jarayonda", value: visaRecords.filter(v => v.visa_status === 'in_progress').length, color: "text-amber-400", bg: "bg-amber-500/10" },
              { label: "Muddati Yaqin (7 kun)", value: visaRecords.filter(v => { const d = getDaysUntil(v.passport_expiry); return d !== null && d >= 0 && d <= 7; }).length + visaRecords.filter(v => { const d = getDaysUntil(v.visa_deadline); return d !== null && d >= 0 && d <= 7; }).length, color: "text-rose-400", bg: "bg-rose-500/10" },
            ].map((stat, i) => (
              <Card key={i} className={`${stat.bg} border border-white/5 rounded-2xl`}>
                <CardContent className="p-4">
                  <p className="text-[10px] text-white/50 uppercase font-bold">{stat.label}</p>
                  <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Records Table */}
          {visaRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/30 gap-3 border border-white/5 rounded-2xl bg-white/[0.01]">
              <BookOpen className="w-10 h-10" />
              <p className="text-sm font-bold">Hech qanday yozuv yo'q</p>
              <p className="text-xs">"Yangi Yozuv" tugmasi orqali birinchi mijozni qo'shing.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visaRecords.map(rec => {
                const passportDays = getDaysUntil(rec.passport_expiry);
                const visaDays = getDaysUntil(rec.visa_deadline);
                const isPassportWarning = passportDays !== null && passportDays <= 30 && passportDays >= 0;
                const isVisaUrgent = visaDays !== null && visaDays <= 7 && visaDays >= 0;
                const checklist = [
                  { label: 'Sug\'urta', done: rec.insurance },
                  { label: 'Aviachipra', done: rec.flight_ticket },
                  { label: 'Hotel Voucher', done: rec.hotel_voucher },
                ];
                const checkCount = checklist.filter(c => c.done).length;

                return (
                  <div key={rec.id} className={`bg-[#111111]/80 border rounded-2xl p-4 space-y-3 transition-all ${isPassportWarning || isVisaUrgent ? 'border-rose-500/30' : 'border-white/5'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-white">{rec.customer_name}</span>
                          <span className="text-xs text-white/40">{rec.customer_phone}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${VISA_STATUS_MAP[rec.visa_status].color}`}>
                            {VISA_STATUS_MAP[rec.visa_status].label}
                          </span>
                          {(isPassportWarning || isVisaUrgent) && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-rose-500/15 text-rose-400 border-rose-500/30 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Diqqat!
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/50">{rec.tour_title} · {rec.destination}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => openEditVisa(rec)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteVisa(rec.id)} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className={`rounded-xl p-2.5 border ${isPassportWarning ? 'bg-rose-500/10 border-rose-500/20' : 'bg-white/[0.03] border-white/5'}`}>
                        <p className="text-[10px] text-white/50 uppercase font-bold">Pasport Tugash</p>
                        <p className={`font-bold mt-0.5 ${isPassportWarning ? 'text-rose-400' : 'text-white'}`}>
                          {rec.passport_expiry || '—'}
                        </p>
                        {passportDays !== null && passportDays >= 0 && (
                          <p className={`text-[10px] mt-0.5 ${passportDays <= 30 ? 'text-rose-400' : 'text-white/40'}`}>{passportDays} kun qoldi</p>
                        )}
                        {passportDays !== null && passportDays < 0 && (
                          <p className="text-[10px] text-rose-500 mt-0.5">Muddati o'tgan!</p>
                        )}
                      </div>
                      <div className={`rounded-xl p-2.5 border ${isVisaUrgent ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/[0.03] border-white/5'}`}>
                        <p className="text-[10px] text-white/50 uppercase font-bold">Viza Deadline</p>
                        <p className={`font-bold mt-0.5 ${isVisaUrgent ? 'text-amber-400' : 'text-white'}`}>
                          {rec.visa_deadline || '—'}
                        </p>
                        {visaDays !== null && visaDays >= 0 && (
                          <p className={`text-[10px] mt-0.5 ${visaDays <= 7 ? 'text-amber-400' : 'text-white/40'}`}>{visaDays} kun qoldi</p>
                        )}
                      </div>
                      <div className="rounded-xl p-2.5 border border-white/5 bg-white/[0.03]">
                        <p className="text-[10px] text-white/50 uppercase font-bold">Hujjatlar</p>
                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                          {checklist.map((c, i) => (
                            <span key={i} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${c.done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/30'}`}>
                              {c.done ? '✓' : '○'} {c.label}
                            </span>
                          ))}
                        </div>
                        <p className="text-[10px] text-white/40 mt-1">{checkCount}/3 tayyor</p>
                      </div>
                      <div className="rounded-xl p-2.5 border border-white/5 bg-white/[0.03]">
                        <p className="text-[10px] text-white/50 uppercase font-bold">Izoh</p>
                        <p className="text-[11px] text-white/70 mt-0.5 line-clamp-2">{rec.note || '—'}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Visa Modal */}
          {isVisaModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setIsVisaModalOpen(false)}>
              <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">{editingVisa ? 'Yozuvni Tahrirlash' : "Yangi Viza Yozuvi Qo'shish"}</h3>
                  <button onClick={() => setIsVisaModalOpen(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-white/70 text-xs font-bold">Mijoz Ismi *</Label>
                    <Input value={newVisa.customer_name} onChange={e => setNewVisa({...newVisa, customer_name: e.target.value})}
                      placeholder="Jasur Karimov" className="bg-white/5 border-white/10 text-white rounded-xl h-10" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white/70 text-xs font-bold">Telefon</Label>
                    <Input value={newVisa.customer_phone} onChange={e => setNewVisa({...newVisa, customer_phone: e.target.value})}
                      placeholder="+998 90 000-00-00" className="bg-white/5 border-white/10 text-white rounded-xl h-10" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white/70 text-xs font-bold">Yo'nalish</Label>
                    <Input value={newVisa.destination} onChange={e => setNewVisa({...newVisa, destination: e.target.value})}
                      placeholder="Turkiya, Istanbul" className="bg-white/5 border-white/10 text-white rounded-xl h-10" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-white/70 text-xs font-bold">Tur Paketi</Label>
                    <Input value={newVisa.tour_title} onChange={e => setNewVisa({...newVisa, tour_title: e.target.value})}
                      placeholder="Premium Istanbul Safari" className="bg-white/5 border-white/10 text-white rounded-xl h-10" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white/70 text-xs font-bold">Pasport Tugash Sanasi</Label>
                    <Input type="date" value={newVisa.passport_expiry} onChange={e => setNewVisa({...newVisa, passport_expiry: e.target.value})}
                      className="bg-white/5 border-white/10 text-white rounded-xl h-10" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white/70 text-xs font-bold">Viza Deadline</Label>
                    <Input type="date" value={newVisa.visa_deadline} onChange={e => setNewVisa({...newVisa, visa_deadline: e.target.value})}
                      className="bg-white/5 border-white/10 text-white rounded-xl h-10" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-white/70 text-xs font-bold">Viza Holati</Label>
                    <select value={newVisa.visa_status} onChange={e => setNewVisa({...newVisa, visa_status: e.target.value as VisaRecord['visa_status']})}
                      className="w-full h-10 rounded-xl bg-white/5 border border-white/10 text-white text-sm px-3 focus:ring-primary">
                      <option value="not_started">Boshlanmagan</option>
                      <option value="in_progress">Jarayonda</option>
                      <option value="approved">Tasdiqlandi</option>
                      <option value="rejected">Rad etildi</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70 text-xs font-bold">Hujjatlar Holati</Label>
                  {[
                    { key: 'insurance', label: "Sayohat Sug'urtasi" },
                    { key: 'flight_ticket', label: 'Aviachipra' },
                    { key: 'hotel_voucher', label: 'Hotel Voucher / Bronlash' },
                  ].map(item => (
                    <label key={item.key} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/5">
                      <input type="checkbox"
                        checked={newVisa[item.key as keyof typeof newVisa] as boolean}
                        onChange={e => setNewVisa({...newVisa, [item.key]: e.target.checked})}
                        className="w-4 h-4 accent-primary" />
                      <span className="text-xs text-white/80 font-medium">{item.label}</span>
                    </label>
                  ))}
                </div>
                <div className="space-y-1">
                  <Label className="text-white/70 text-xs font-bold">Izoh / Qo'shimcha ma'lumot</Label>
                  <textarea value={newVisa.note} onChange={e => setNewVisa({...newVisa, note: e.target.value})}
                    placeholder="Masalan: Biometrik pasport kerak, viza interview 3-iyun..." rows={2}
                    className="w-full rounded-xl bg-white/5 border border-white/10 text-white text-sm p-3 resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="flex gap-3 pt-1">
                  <Button onClick={handleSaveVisa} className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11">
                    {editingVisa ? 'Saqlash' : "Qo'shish"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsVisaModalOpen(false)} className="flex-1 rounded-xl border-white/10 text-white hover:bg-white/5 h-11">
                    Bekor qilish
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'planner' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-[#111111]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6 lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">Visual Sayohat Rejalashtirgichi (Planner AI)</h3>
                <p className="text-xs text-white/50 mt-1">Mijozlar uchun to‘liq kunlik marshrut, ob-havo prognozi va yo‘l kartasini boshqarish paneli.</p>
              </div>

              {/* Day Timeline Visualization */}
              <div className="space-y-4 relative pl-6 border-l border-white/10 ml-4 py-2">
                {[
                  { title: 'Toshkent-Istanbul-Antaliya Parvozi', time: '08:30', desc: 'TK-371 reysi bilan Toshkentdan parvoz, maxsus taomlar va xizmatlar.', type: 'flight' },
                  { title: 'Rixos Premium Hotel (Check-in)', time: '14:00', desc: 'Ultra hashamatli VIP xonaga joylashish, shaxsiy assistent xizmati bilan tanishuv.', type: 'hotel' },
                  { title: 'Ob-havo: 28°C Quyoshli', time: '16:00', desc: 'Sayohat hududida shabada, iliq suv harorati. Plyaj va basseyn ochiq.', type: 'weather' }
                ].map((item, idx) => (
                  <div key={idx} className="relative space-y-1">
                    <div className="absolute left-[-32px] top-1 bg-[#111111] p-1 rounded-full border-2 border-primary">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-[10px] font-bold text-primary">{item.time}</span>
                    <h4 className="text-xs font-bold text-white">{item.title}</h4>
                    <p className="text-[11px] text-white/55 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button className="rounded-xl flex-1 bg-primary text-primary-foreground font-bold text-xs h-11">
                  Ob-havo Ma’lumotlarini Yangilash
                </Button>
                <Button variant="outline" className="rounded-xl flex-1 border-white/10 hover:bg-white/5 text-white font-bold text-xs h-11">
                  Yangi Sayohat Nuqtasi Qo‘shish
                </Button>
              </div>
            </Card>

            <Card className="bg-[#111111]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white">Yo‘riqnomalar va Sug‘urta</h3>
              <p className="text-[11px] text-white/55">Kompaniyangiz turlariga bog‘langan standart sug‘urta qoplamalari va tibbiy ko‘mak xizmatlari</p>

              <div className="space-y-3 pt-2">
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Alfa Sug‘urta hamkorligi</h4>
                    <p className="text-[10px] text-white/50 mt-0.5">Har bir mijoz uchun 35,000 USD gacha bo‘lgan shoshilinch yordam qoplamasi.</p>
                  </div>
                </div>

                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Bagaj va Reys Kechikishi</h4>
                    <p className="text-[10px] text-white/50 mt-0.5">Yuklar yo‘qolishi yoki reyslar 4 soatdan ortiq kechikishi bo‘yunda to‘lov kompensatsiyalari.</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* New Tour Modal */}
      {isTourModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg bg-[#111111]/90 border border-white/10 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-white/5 pb-4">
              <CardTitle className="text-lg text-white">Yangi sayohat paketi yaratish</CardTitle>
              <CardDescription className="text-white/55">Sayohat nomi, yo‘nalishlari, narxi va kunlik marshrutini belgilang.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleCreateTour} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="tourTitle" className="text-xs text-white/80">Sayohat Paketi Nomi</Label>
                  <Input 
                    id="tourTitle" 
                    placeholder="Masalan: Rim va Venetsiya go'zalliklari" 
                    value={newTourTitle} 
                    onChange={(e) => setNewTourTitle(e.target.value)}
                    className="rounded-xl border-white/10 bg-white/5 text-white text-sm h-11"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="tourDest" className="text-xs text-white/80">Yo‘nalish (Shahar, Davlat)</Label>
                    <Input 
                      id="tourDest" 
                      placeholder="Masalan: Italiya, Rim" 
                      value={newTourDest} 
                      onChange={(e) => setNewTourDest(e.target.value)}
                      className="rounded-xl border-white/10 bg-white/5 text-white text-sm h-11"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tourDays" className="text-xs text-white/80">Muddati (Kun soni)</Label>
                    <Input 
                      id="tourDays" 
                      type="number"
                      value={newTourDays} 
                      onChange={(e) => setNewTourDays(parseInt(e.target.value) || 1)}
                      className="rounded-xl border-white/10 bg-white/5 text-white text-sm h-11"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="tourPrice" className="text-xs text-white/80">Narxi (UZS)</Label>
                    <Input 
                      id="tourPrice" 
                      type="number"
                      value={newTourPrice} 
                      onChange={(e) => setNewTourPrice(e.target.value)}
                      className="rounded-xl border-white/10 bg-white/5 text-white text-sm h-11"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tourSpots" className="text-xs text-white/80">Jami Bo‘sh Joylar soni</Label>
                    <Input 
                      id="tourSpots" 
                      type="number"
                      value={newTourSpots} 
                      onChange={(e) => setNewTourSpots(parseInt(e.target.value) || 1)}
                      className="rounded-xl border-white/10 bg-white/5 text-white text-sm h-11"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tourGuide" className="text-xs text-white/80">Sayohat Gidi (Boshlovchi)</Label>
                  <Input 
                    id="tourGuide" 
                    placeholder="Masalan: Akbar Aliyev" 
                    value={newTourGuide} 
                    onChange={(e) => setNewTourGuide(e.target.value)}
                    className="rounded-xl border-white/10 bg-white/5 text-white text-sm h-11"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tourDeparture" className="text-xs text-white/80">Jo'nab ketish sanasi (Kalendar uchun)</Label>
                  <Input
                    id="tourDeparture"
                    type="date"
                    value={newTourDeparture}
                    onChange={(e) => setNewTourDeparture(e.target.value)}
                    className="rounded-xl border-white/10 bg-white/5 text-white text-sm h-11"
                  />
                </div>

                {/* Day-by-Day Itinerary Builder Fields */}
                <div className="space-y-3 pt-2">
                  <Label className="text-xs font-bold text-white uppercase tracking-wider">Kunlik Dastur Sozlamalari (Marshrut)</Label>
                  <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1 border border-white/10 bg-white/[0.02] p-3 rounded-xl">
                    {itineraryInputs.map((it, idx) => (
                      <div key={it.day} className="space-y-2 p-2.5 rounded-lg bg-black/40 border border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="bg-primary/20 text-primary font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                            {it.day}
                          </span>
                          <Input 
                            placeholder={`Kun ${it.day} Sarlavhasi (Masalan: Mehmonxonaga joylashish)`}
                            value={it.title}
                            onChange={(e) => {
                              const updated = [...itineraryInputs];
                              updated[idx].title = e.target.value;
                              setItineraryInputs(updated);
                            }}
                            className="rounded-lg border-white/10 bg-white/5 text-white text-xs h-8"
                            required
                          />
                        </div>
                        <Input 
                          placeholder={`Kun ${it.day} marshrut tavsifi...`}
                          value={it.desc}
                          onChange={(e) => {
                            const updated = [...itineraryInputs];
                            updated[idx].desc = e.target.value;
                            setItineraryInputs(updated);
                          }}
                          className="rounded-lg border-white/10 bg-white/5 text-white text-xs h-8"
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                  <Button type="button" variant="outline" onClick={() => setIsTourModalOpen(false)} className="rounded-xl border-white/10 text-white hover:bg-white/5">
                    Bekor qilish
                  </Button>
                  <Button type="submit" className="rounded-xl bg-primary text-primary-foreground font-bold px-5">
                    Paketni Yaratish
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Booking Modal */}
      {isBookingModalOpen && selectedTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-[#111111]/90 border border-white/10 shadow-2xl rounded-2xl">
            <CardHeader className="border-b border-white/5 pb-4">
              <CardTitle className="text-lg text-white">Sayohatni Bron qilish</CardTitle>
              <CardDescription className="text-white/55">Tur: "{selectedTour.title}" · Narxi: {selectedTour.price.toLocaleString()} UZS</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleBookTour} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cName" className="text-xs text-white/80">Mijozning To‘liq Ismi</Label>
                  <Input 
                    id="cName" 
                    placeholder="Masalan: Behruz Hasanov" 
                    value={customerName} 
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="rounded-xl border-white/10 bg-white/5 text-white text-sm h-11"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cPhone" className="text-xs text-white/80">Telefon Raqami</Label>
                  <Input 
                    id="cPhone" 
                    placeholder="+998 90 123-45-67" 
                    value={customerPhone} 
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="rounded-xl border-white/10 bg-white/5 text-white text-sm h-11"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="cSpots" className="text-xs text-white/80">Kishilar Soni</Label>
                    <Input 
                      id="cSpots" 
                      type="number"
                      min={1}
                      max={10}
                      value={spotsToBook} 
                      onChange={(e) => setSpotsToBook(parseInt(e.target.value) || 1)}
                      className="rounded-xl border-white/10 bg-white/5 text-white text-sm h-11"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cPaid" className="text-xs text-white/80">Bo‘nak (Initial Deposit)</Label>
                    <Input 
                      id="cPaid" 
                      type="number"
                      value={paidAmt} 
                      onChange={(e) => setPaidAmt(e.target.value)}
                      className="rounded-xl border-white/10 bg-white/5 text-white text-sm h-11"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl mt-2">
                  <div className="space-y-0.5">
                    <Label className="text-xs text-white font-bold">VIP Sayohat Sug‘urtasi</Label>
                    <p className="text-[10px] text-white/40">Kompaniya tomonidan to‘liq tibbiy sug‘urta ta’minoti.</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={incInsurance}
                    onChange={(e) => setIncInsurance(e.target.checked)}
                    className="w-4 h-4 accent-primary shrink-0"
                  />
                </div>

                <div className="flex justify-between items-center text-xs font-bold text-white pt-2 border-t border-white/5 mt-4">
                  <span>Jami Summa:</span>
                  <span className="text-base text-primary">{(spotsToBook * selectedTour.price).toLocaleString()} UZS</span>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsBookingModalOpen(false)} className="rounded-xl border-white/10 text-white hover:bg-white/5">
                    Bekor qilish
                  </Button>
                  <Button type="submit" className="rounded-xl bg-primary text-primary-foreground font-bold px-5">
                    Tasdiqlash & Bron
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
