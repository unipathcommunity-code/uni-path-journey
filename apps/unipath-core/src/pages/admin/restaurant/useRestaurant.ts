import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import {
  MenuCategory, MenuItem, RestaurantTable, RestaurantOrder, OrderItem,
  OrderType, OrderStatus, ItemStatus, PaymentMethod, MenuModifier, itemTotal,
} from './types';

// Untyped client — these tables are not in the generated Supabase types yet.
const db = supabase as any;

interface NewOrderItem {
  menu_item_id: string | null;
  name: string;
  qty: number;
  price: number;
  modifiers: MenuModifier[];
  note?: string;
}

export function useRestaurant() {
  const { activeTenant } = useApp();
  const { toast } = useToast();
  const tid = activeTenant?.id;

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const loadingRef = useRef(false);

  const fail = (e: any) =>
    toast({ title: 'Xatolik', description: e?.message || String(e), variant: 'destructive' });

  // ── Load everything ─────────────────────────────────────────────────────────
  const load = useCallback(async (showSpinner = true) => {
    if (!tid) { setLoading(false); return; }
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (showSpinner) setLoading(true);
    try {
      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);

      const [catRes, itemRes, tableRes, orderRes] = await Promise.all([
        db.from('restaurant_menu_categories').select('*').eq('tenant_id', tid).order('sort_order'),
        db.from('restaurant_menu_items').select('*').eq('tenant_id', tid).order('sort_order'),
        db.from('restaurant_tables').select('*').eq('tenant_id', tid).order('table_number'),
        db.from('restaurant_orders').select('*').eq('tenant_id', tid)
          .or(`status.in.(new,kitchen,served),created_at.gte.${startOfDay.toISOString()}`)
          .order('created_at', { ascending: false }),
      ]);

      const cats = (catRes.data || []) as MenuCategory[];
      const its = ((itemRes.data || []) as any[]).map(normItem);
      const tbls = (tableRes.data || []) as RestaurantTable[];
      const ords = (orderRes.data || []) as any[];

      // Fetch order items for the loaded orders
      let orderItems: OrderItem[] = [];
      if (ords.length) {
        const ids = ords.map(o => o.id);
        const { data: oiData } = await db
          .from('restaurant_order_items').select('*').in('order_id', ids);
        orderItems = ((oiData || []) as any[]).map(normOrderItem);
      }

      const tableMap = new Map(tbls.map(t => [t.id, t.table_number]));
      const merged: RestaurantOrder[] = ords.map(o => ({
        ...o,
        table_number: o.table_id ? (tableMap.get(o.table_id) || '—') : null,
        order_items: orderItems.filter(oi => oi.order_id === o.id),
      }));

      setCategories(cats);
      setItems(its);
      setTables(tbls);
      setOrders(merged);
    } catch (e: any) {
      // RLS / missing-table errors should not hard-crash the dashboard
      console.error('Restaurant load error:', e);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [tid]);

  useEffect(() => { load(); }, [load]);

  // Light polling so the kitchen queue (KDS) stays fresh without manual refresh.
  useEffect(() => {
    if (!tid) return;
    const id = setInterval(() => load(false), 20000);
    return () => clearInterval(id);
  }, [tid, load]);

  // ── Category CRUD ─────────────────────────────────────────────────────────
  const addCategory = async (name: string) => {
    try {
      const { error } = await db.from('restaurant_menu_categories')
        .insert({ tenant_id: tid, name, sort_order: categories.length });
      if (error) throw error;
      await load(false);
    } catch (e) { fail(e); }
  };
  const updateCategory = async (id: string, patch: Partial<MenuCategory>) => {
    try { await db.from('restaurant_menu_categories').update(patch).eq('id', id); await load(false); }
    catch (e) { fail(e); }
  };
  const deleteCategory = async (id: string) => {
    try { await db.from('restaurant_menu_categories').delete().eq('id', id); await load(false); }
    catch (e) { fail(e); }
  };

  // ── Item CRUD ─────────────────────────────────────────────────────────────
  const addItem = async (payload: Partial<MenuItem>) => {
    try {
      const { error } = await db.from('restaurant_menu_items').insert({
        tenant_id: tid,
        category_id: payload.category_id || null,
        name: payload.name,
        description: payload.description || null,
        price: payload.price || 0,
        image_url: payload.image_url || null,
        modifiers: payload.modifiers || [],
        is_available: payload.is_available ?? true,
        sort_order: items.length,
      });
      if (error) throw error;
      toast({ title: 'Taom qo\'shildi', description: payload.name });
      await load(false);
    } catch (e) { fail(e); }
  };
  const updateItem = async (id: string, patch: Partial<MenuItem>) => {
    try { await db.from('restaurant_menu_items').update(patch).eq('id', id); await load(false); }
    catch (e) { fail(e); }
  };
  const deleteItem = async (id: string) => {
    try { await db.from('restaurant_menu_items').delete().eq('id', id); await load(false); }
    catch (e) { fail(e); }
  };

  // ── Table CRUD ──────────────────────────────────────────────────────────────
  const addTable = async (table_number: string, capacity: number, zone?: string) => {
    try {
      const { error } = await db.from('restaurant_tables')
        .insert({ tenant_id: tid, table_number, capacity, zone: zone || null, status: 'available' });
      if (error) throw error;
      toast({ title: 'Stol qo\'shildi', description: `№ ${table_number}` });
      await load(false);
    } catch (e) { fail(e); }
  };
  const deleteTable = async (id: string) => {
    try { await db.from('restaurant_tables').delete().eq('id', id); await load(false); }
    catch (e) { fail(e); }
  };
  const setTableStatus = async (id: string, status: string) => {
    try { await db.from('restaurant_tables').update({ status }).eq('id', id); await load(false); }
    catch (e) { fail(e); }
  };

  // ── Order operations ──────────────────────────────────────────────────────
  const createOrder = async (opts: {
    table_id: string | null;
    order_type: OrderType;
    items: NewOrderItem[];
    customer_name?: string;
    customer_phone?: string;
    service_fee?: number;
    discount?: number;
    note?: string;
  }) => {
    try {
      const subtotal = opts.items.reduce((s, it) => s + itemTotal(it), 0);
      const total = Math.max(0, subtotal + (opts.service_fee || 0) - (opts.discount || 0));

      const { data: order, error } = await db.from('restaurant_orders').insert({
        tenant_id: tid,
        table_id: opts.table_id,
        order_type: opts.order_type,
        status: 'new',
        source: 'admin',
        customer_name: opts.customer_name || null,
        customer_phone: opts.customer_phone || null,
        subtotal, service_fee: opts.service_fee || 0, discount: opts.discount || 0, total,
        note: opts.note || null,
      }).select().single();
      if (error) throw error;

      const rows = opts.items.map(it => ({
        tenant_id: tid, order_id: order.id, menu_item_id: it.menu_item_id,
        name: it.name, qty: it.qty, price: it.price, modifiers: it.modifiers || [],
        status: 'new', note: it.note || null,
      }));
      const { error: oiErr } = await db.from('restaurant_order_items').insert(rows);
      if (oiErr) throw oiErr;

      if (opts.table_id) await db.from('restaurant_tables').update({ status: 'occupied' }).eq('id', opts.table_id);

      toast({ title: 'Buyurtma qabul qilindi', description: 'Oshxona navbatiga yuborildi.' });
      await load(false);
      return order.id as string;
    } catch (e) { fail(e); return null; }
  };

  const setOrderStatus = async (orderId: string, status: OrderStatus, tableId?: string | null) => {
    try {
      await db.from('restaurant_orders').update({ status }).eq('id', orderId);
      if ((status === 'paid' || status === 'cancelled') && tableId) {
        await db.from('restaurant_tables').update({ status: 'available' }).eq('id', tableId);
      }
      await load(false);
    } catch (e) { fail(e); }
  };

  const setItemStatus = async (itemId: string, status: ItemStatus) => {
    try { await db.from('restaurant_order_items').update({ status }).eq('id', itemId); await load(false); }
    catch (e) { fail(e); }
  };

  const payOrder = async (orderId: string, method: PaymentMethod, opts?: { discount?: number; service_fee?: number; tableId?: string | null }) => {
    try {
      const order = orders.find(o => o.id === orderId);
      const subtotal = order?.subtotal ?? 0;
      const discount = opts?.discount ?? order?.discount ?? 0;
      const service_fee = opts?.service_fee ?? order?.service_fee ?? 0;
      const total = Math.max(0, subtotal + service_fee - discount);
      await db.from('restaurant_orders').update({
        status: 'paid', payment_method: method, paid_at: new Date().toISOString(),
        discount, service_fee, total,
      }).eq('id', orderId);
      if (opts?.tableId) await db.from('restaurant_tables').update({ status: 'available' }).eq('id', opts.tableId);
      toast({ title: 'To\'lov qabul qilindi', description: 'Chek yopildi.' });
      await load(false);
    } catch (e) { fail(e); }
  };

  return {
    loading, categories, items, tables, orders,
    reload: () => load(false),
    addCategory, updateCategory, deleteCategory,
    addItem, updateItem, deleteItem,
    addTable, deleteTable, setTableStatus,
    createOrder, setOrderStatus, setItemStatus, payOrder,
  };
}

export type RestaurantApi = ReturnType<typeof useRestaurant>;

// ── normalizers (jsonb fields can come back as string/null) ───────────────────
function normItem(raw: any): MenuItem {
  return { ...raw, modifiers: parseJson(raw.modifiers, []) };
}
function normOrderItem(raw: any): OrderItem {
  return { ...raw, modifiers: parseJson(raw.modifiers, []) };
}
function parseJson(v: any, fallback: any) {
  if (v == null) return fallback;
  if (typeof v === 'string') { try { return JSON.parse(v); } catch { return fallback; } }
  return v;
}
