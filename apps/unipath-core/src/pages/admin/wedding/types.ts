// Shared types & helpers for the Wedding-Hall / Event-Venue vertical.

export interface EventHall {
  id: string;
  tenant_id: string;
  name: string;
  capacity: number;
  base_price: number;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
}

export interface EventPackage {
  id: string;
  tenant_id: string;
  name: string;
  price_per_guest: number;
  description: string | null;
  includes: string[];
  is_active: boolean;
}

export type EventType = 'wedding' | 'birthday' | 'corporate' | 'other';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type BookingSource = 'admin' | 'online';
export type PaymentMethod = 'cash' | 'card' | 'click' | 'payme';

export interface EventBooking {
  id: string;
  tenant_id: string;
  hall_id: string | null;
  package_id: string | null;
  hall_name?: string;      // merged in the hook (joined from event_halls)
  package_name?: string;   // merged in the hook (joined from event_packages)
  client_name: string;
  phone: string | null;
  event_date: string;      // 'YYYY-MM-DD'
  event_type: EventType;
  guest_count: number;
  total_price: number;
  advance_payment: number; // zakalat (deposit)
  paid_amount: number;     // total paid so far (incl. deposit)
  status: BookingStatus;
  source: BookingSource;
  note: string | null;
  created_at: string;
}

export interface EventPayment {
  id: string;
  tenant_id: string;
  booking_id: string;
  amount: number;
  method: PaymentMethod;
  paid_at: string;
  note: string | null;
  client_name?: string;    // merged in the hook (joined from event_bookings)
}

// ── Helpers ──────────────────────────────────────────────────────────────────
export const fmtUZS = (n: number) =>
  `${Math.round(n || 0).toLocaleString('ru-RU')} so'm`;

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  wedding: "To'y",
  birthday: "Tug'ilgan kun",
  corporate: 'Korporativ',
  other: 'Boshqa marosim',
};

export const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Kutilmoqda',
  confirmed: 'Tasdiqlangan',
  completed: 'Yakunlangan',
  cancelled: 'Bekor qilingan',
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: 'Naqd',
  card: 'Karta',
  click: 'Click',
  payme: 'Payme',
};

export const statusClass = (status: string) => {
  switch (status) {
    case 'pending':   return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'confirmed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'completed': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    case 'cancelled': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    default:          return 'bg-muted text-muted-foreground border-border';
  }
};

export const eventTypeClass = (t: string) => {
  switch (t) {
    case 'wedding':   return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
    case 'birthday':  return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'corporate': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
    default:          return 'bg-muted text-muted-foreground border-border';
  }
};

/** Outstanding debt of a booking (never negative). */
export const outstanding = (b: Pick<EventBooking, 'total_price' | 'paid_amount'>) =>
  Math.max(0, Number(b.total_price || 0) - Number(b.paid_amount || 0));

/** Local YYYY-MM-DD (avoids UTC shift from toISOString). */
export const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
