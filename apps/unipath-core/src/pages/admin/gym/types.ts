// Shared types & helpers for the Gym / Fitness vertical (1Fit-style).

export type SubscriptionStatus = 'active' | 'frozen' | 'expired' | 'cancelled';
export type ClassBookingStatus = 'booked' | 'attended' | 'cancelled';
export type BookingSource = 'admin' | 'online';
export type CheckinMethod = 'qr' | 'manual';

export interface GymPlan {
  id: string;
  tenant_id: string;
  name: string;
  price: number;
  duration_days: number;
  class_limit: number | null; // null = unlimited
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface GymMember {
  id: string;
  tenant_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  qr_token: string;
  created_at: string;
}

export interface GymSubscription {
  id: string;
  tenant_id: string;
  member_id: string | null;
  plan_id: string | null;
  start_date: string;
  end_date: string | null;
  status: SubscriptionStatus;
  remaining_classes: number | null; // null = unlimited
  created_at: string;
  member_name?: string; // merged client-side
  plan_name?: string;   // merged client-side
  plan_price?: number;  // merged client-side
}

export interface GymClass {
  id: string;
  tenant_id: string;
  name: string;
  trainer_name: string | null;
  capacity: number;
  weekday: number; // 0 (Sunday) .. 6 (Saturday)
  start_time: string; // HH:mm
  room: string | null;
  is_active: boolean;
  created_at: string;
}

export interface GymClassBooking {
  id: string;
  tenant_id: string;
  class_id: string | null;
  member_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  class_date: string;
  status: ClassBookingStatus;
  source: BookingSource;
  checked_in_at: string | null;
  created_at: string;
  class_name?: string;   // merged client-side
  member_name?: string;  // merged client-side
}

export interface GymCheckin {
  id: string;
  tenant_id: string;
  member_id: string | null;
  method: CheckinMethod;
  checked_in_at: string;
  member_name?: string; // merged client-side
}

// ── Helpers ──────────────────────────────────────────────────────────────────
export const fmtUZS = (n: number) =>
  `${Math.round(n || 0).toLocaleString('ru-RU')} so'm`;

export const SUB_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: 'Faol',
  frozen: 'Muzlatilgan',
  expired: 'Tugagan',
  cancelled: 'Bekor',
};

export const CBOOKING_STATUS_LABEL: Record<ClassBookingStatus, string> = {
  booked: 'Yozilgan',
  attended: 'Keldi',
  cancelled: 'Bekor',
};

export const CHECKIN_METHOD_LABEL: Record<CheckinMethod, string> = {
  qr: 'QR skan',
  manual: "Qo'lda",
};

export const WEEKDAY_LABEL: string[] = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
export const WEEKDAY_SHORT: string[] = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
// Display order Monday-first: 1..6 then 0 (Sunday)
export const WEEKDAY_ORDER: number[] = [1, 2, 3, 4, 5, 6, 0];

export const subStatusClass = (status: string) => {
  switch (status) {
    case 'active':    return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    case 'frozen':    return 'text-sky-500 bg-sky-500/10 border-sky-500/20';
    case 'expired':   return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    case 'cancelled': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    default:          return 'text-muted-foreground bg-muted border-border';
  }
};

export const cbookingStatusClass = (status: string) => {
  switch (status) {
    case 'booked':    return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    case 'attended':  return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    case 'cancelled': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    default:          return 'text-muted-foreground bg-muted border-border';
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

// Next calendar date (>= today) that falls on the given weekday (0-6).
export const nextDateForWeekday = (weekday: number) => {
  const now = new Date();
  const diff = (weekday - now.getDay() + 7) % 7;
  return addDays(toISODate(now), diff);
};

export const weekdayOfISO = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
};
