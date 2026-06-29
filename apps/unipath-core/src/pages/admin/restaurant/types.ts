// Shared types & helpers for the Restaurant / Cafe vertical.

export interface MenuCategory {
  id: string;
  tenant_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface MenuModifier {
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  tenant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  modifiers: MenuModifier[];
  sort_order: number;
  is_active: boolean;
  is_available: boolean;
}

export type TableStatus = 'available' | 'occupied' | 'reserved';

export interface RestaurantTable {
  id: string;
  tenant_id: string;
  table_number: string;
  capacity: number;
  zone: string | null;
  status: TableStatus;
  qr_token: string | null;
}

export type OrderType = 'dine_in' | 'takeaway' | 'delivery';
export type OrderStatus = 'new' | 'kitchen' | 'served' | 'paid' | 'cancelled';
export type OrderSource = 'admin' | 'qr' | 'online';
export type ItemStatus = 'new' | 'ready' | 'served';
export type PaymentMethod = 'cash' | 'card' | 'click' | 'payme';

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name: string;
  qty: number;
  price: number;
  modifiers: MenuModifier[];
  status: ItemStatus;
  note: string | null;
}

export interface RestaurantOrder {
  id: string;
  tenant_id: string;
  table_id: string | null;
  table_number?: string;
  order_type: OrderType;
  status: OrderStatus;
  source: OrderSource;
  customer_name: string | null;
  customer_phone: string | null;
  subtotal: number;
  service_fee: number;
  discount: number;
  total: number;
  payment_method: PaymentMethod | null;
  paid_at: string | null;
  note: string | null;
  created_at: string;
  order_items: OrderItem[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────
export const fmtUZS = (n: number) =>
  `${Math.round(n || 0).toLocaleString('ru-RU')} so'm`;

export const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  dine_in: 'Zalda',
  takeaway: 'Olib ketish',
  delivery: 'Yetkazib berish',
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'Yangi',
  kitchen: 'Oshxonada',
  served: 'Berildi',
  paid: "To'landi",
  cancelled: 'Bekor',
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: 'Naqd',
  card: 'Karta',
  click: 'Click',
  payme: 'Payme',
};

export const tableStatusClass = (status: string) => {
  switch (status) {
    case 'available': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'occupied':  return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    case 'reserved':  return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    default:          return 'bg-muted text-muted-foreground border-border';
  }
};

export const orderStatusClass = (status: string) => {
  switch (status) {
    case 'new':       return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    case 'kitchen':   return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    case 'served':    return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
    case 'paid':      return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    default:          return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
  }
};

export const itemTotal = (it: { price: number; qty: number; modifiers?: MenuModifier[] }) => {
  const mods = (it.modifiers || []).reduce((s, m) => s + (Number(m.price) || 0), 0);
  return (Number(it.price) + mods) * Number(it.qty);
};
