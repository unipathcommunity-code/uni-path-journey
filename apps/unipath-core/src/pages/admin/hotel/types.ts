// Shared types & helpers for the Hotel / Motel vertical.

export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance';
export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
export type BookingSource = 'admin' | 'online';
export type HousekeepingStatus = 'pending' | 'in_progress' | 'done';
export type PaymentMethod = 'cash' | 'card' | 'click' | 'payme';

export interface HotelRoomType {
  id: string;
  tenant_id: string;
  name: string;
  base_price: number;
  capacity: number;
  amenities: string[];
  description: string | null;
  is_active: boolean;
}

export interface HotelRoom {
  id: string;
  tenant_id: string;
  room_number: string;
  room_type_id: string | null;
  type: string | null; // legacy: single | double | suite | deluxe (or room type name)
  floor: number;
  status: RoomStatus;
  price_per_night: number;
  is_active: boolean;
}

export interface HotelRatePlan {
  id: string;
  tenant_id: string;
  room_type_id: string | null;
  name: string;
  price: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
}

export interface HotelGuest {
  id: string;
  tenant_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  document_no: string | null;
  notes: string | null;
  created_at: string;
}

export interface HotelBooking {
  id: string;
  tenant_id: string;
  room_id: string | null;
  room_type_id: string | null;
  guest_id: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  check_in: string;
  check_out: string;
  status: BookingStatus;
  source: BookingSource;
  nights: number;
  price_per_night: number;
  total_amount: number;
  paid_amount: number;
  payment_method: PaymentMethod | null;
  note: string | null;
  created_at: string;
  room_number?: string; // merged client-side
}

export interface HousekeepingTask {
  id: string;
  tenant_id: string;
  room_id: string | null;
  status: HousekeepingStatus;
  assigned_to: string | null;
  note: string | null;
  created_at: string;
  room_number?: string; // merged client-side
}

// ── Helpers ──────────────────────────────────────────────────────────────────
export const fmtUZS = (n: number) =>
  `${Math.round(n || 0).toLocaleString('ru-RU')} so'm`;

export const ROOM_STATUS_LABEL: Record<RoomStatus, string> = {
  available: "Bo'sh",
  occupied: 'Band',
  cleaning: 'Tozalanmoqda',
  maintenance: "Ta'mirda",
};

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Kutilmoqda',
  confirmed: 'Tasdiqlangan',
  checked_in: 'Joylashgan',
  checked_out: 'Chiqqan',
  cancelled: 'Bekor',
};

export const HK_STATUS_LABEL: Record<HousekeepingStatus, string> = {
  pending: 'Kutilmoqda',
  in_progress: 'Jarayonda',
  done: 'Bajarildi',
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: 'Naqd',
  card: 'Karta',
  click: 'Click',
  payme: 'Payme',
};

export const roomStatusClass = (status: string) => {
  switch (status) {
    case 'available':   return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'occupied':    return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    case 'cleaning':    return 'bg-sky-500/10 text-sky-500 border-sky-500/20';
    case 'maintenance': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    default:            return 'bg-muted text-muted-foreground border-border';
  }
};

export const bookingStatusClass = (status: string) => {
  switch (status) {
    case 'pending':     return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    case 'confirmed':   return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    case 'checked_in':  return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    case 'checked_out': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    default:            return 'text-muted-foreground bg-muted border-border';
  }
};

export const hkStatusClass = (status: string) => {
  switch (status) {
    case 'pending':     return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    case 'in_progress': return 'text-sky-500 bg-sky-500/10 border-sky-500/20';
    case 'done':        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    default:            return 'text-muted-foreground bg-muted border-border';
  }
};

// Local (timezone-safe) date helpers — always yyyy-mm-dd strings.
export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const todayISO = () => toISODate(new Date());

export const addDays = (iso: string, days: number) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  return toISODate(dt);
};

export const nightsBetween = (checkIn: string, checkOut: string) => {
  const [y1, m1, d1] = checkIn.split('-').map(Number);
  const [y2, m2, d2] = checkOut.split('-').map(Number);
  const diff = (new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / 86400000;
  return Math.max(1, Math.round(diff));
};

// A booking blocks a room on date `d` (yyyy-mm-dd) if check_in <= d < check_out.
export const BLOCKING_STATUSES: BookingStatus[] = ['pending', 'confirmed', 'checked_in'];
export const bookingCoversDate = (b: Pick<HotelBooking, 'check_in' | 'check_out'>, iso: string) =>
  !!b.check_in && !!b.check_out && b.check_in <= iso && iso < b.check_out;
