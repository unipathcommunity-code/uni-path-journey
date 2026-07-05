import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import {
  EventHall, EventPackage, EventBooking, EventPayment,
  BookingStatus, EventType, PaymentMethod,
} from './types';

// Untyped client — these tables are not in the generated Supabase types yet.
const db = supabase as any;

export interface NewBookingInput {
  hall_id: string | null;
  package_id: string | null;
  client_name: string;
  phone: string;
  event_date: string;           // 'YYYY-MM-DD'
  event_type: EventType;
  guest_count: number;
  total_price: number;
  advance_payment: number;
  note?: string;
}

export function useWedding() {
  const { activeTenant } = useApp();
  const { toast } = useToast();
  const tid = activeTenant?.id;

  const [loading, setLoading] = useState(true);
  const [halls, setHalls] = useState<EventHall[]>([]);
  const [packages, setPackages] = useState<EventPackage[]>([]);
  const [bookings, setBookings] = useState<EventBooking[]>([]);
  const [payments, setPayments] = useState<EventPayment[]>([]);
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
      const [hallRes, pkgRes, bookRes, payRes] = await Promise.all([
        db.from('event_halls').select('*').eq('tenant_id', tid).order('created_at'),
        db.from('event_packages').select('*').eq('tenant_id', tid).order('created_at'),
        db.from('event_bookings').select('*').eq('tenant_id', tid).order('event_date', { ascending: true }),
        db.from('event_payments').select('*').eq('tenant_id', tid).order('paid_at', { ascending: false }),
      ]);

      const hls = (hallRes.data || []) as EventHall[];
      const pkgs = ((pkgRes.data || []) as any[]).map(normPackage);
      const bks = (bookRes.data || []) as any[];
      const pays = (payRes.data || []) as any[];

      const hallMap = new Map(hls.map(h => [h.id, h.name]));
      const pkgMap = new Map(pkgs.map(p => [p.id, p.name]));
      const mergedBookings: EventBooking[] = bks.map(b => ({
        ...b,
        hall_name: b.hall_id ? (hallMap.get(b.hall_id) || '—') : '—',
        package_name: b.package_id ? (pkgMap.get(b.package_id) || undefined) : undefined,
      }));
      const bookMap = new Map(mergedBookings.map(b => [b.id, b.client_name]));
      const mergedPayments: EventPayment[] = pays.map(p => ({
        ...p,
        client_name: bookMap.get(p.booking_id) || '—',
      }));

      setHalls(hls);
      setPackages(pkgs);
      setBookings(mergedBookings);
      setPayments(mergedPayments);
    } catch (e: any) {
      // RLS / missing-table errors should not hard-crash the dashboard
      console.error('Wedding load error:', e);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [tid]);

  useEffect(() => { load(); }, [load]);

  // ── Hall CRUD ───────────────────────────────────────────────────────────────
  const addHall = async (payload: Partial<EventHall>) => {
    try {
      const { error } = await db.from('event_halls').insert({
        tenant_id: tid,
        name: payload.name,
        capacity: payload.capacity || 200,
        base_price: payload.base_price || 0,
        description: payload.description || null,
        image_url: payload.image_url || null,
        is_active: payload.is_active ?? true,
      });
      if (error) throw error;
      toast({ title: "Zal qo'shildi", description: payload.name });
      await load(false);
    } catch (e) { fail(e); }
  };
  const updateHall = async (id: string, patch: Partial<EventHall>) => {
    try {
      const { error } = await db.from('event_halls').update(patch).eq('id', id);
      if (error) throw error;
      await load(false);
    } catch (e) { fail(e); }
  };
  const deleteHall = async (id: string) => {
    try {
      const { error } = await db.from('event_halls').delete().eq('id', id);
      if (error) throw error;
      await load(false);
    } catch (e) { fail(e); }
  };

  // ── Package CRUD ────────────────────────────────────────────────────────────
  const addPackage = async (payload: Partial<EventPackage>) => {
    try {
      const { error } = await db.from('event_packages').insert({
        tenant_id: tid,
        name: payload.name,
        price_per_guest: payload.price_per_guest || 0,
        description: payload.description || null,
        includes: payload.includes || [],
        is_active: payload.is_active ?? true,
      });
      if (error) throw error;
      toast({ title: "Paket qo'shildi", description: payload.name });
      await load(false);
    } catch (e) { fail(e); }
  };
  const updatePackage = async (id: string, patch: Partial<EventPackage>) => {
    try {
      const { error } = await db.from('event_packages').update(patch).eq('id', id);
      if (error) throw error;
      await load(false);
    } catch (e) { fail(e); }
  };
  const deletePackage = async (id: string) => {
    try {
      const { error } = await db.from('event_packages').delete().eq('id', id);
      if (error) throw error;
      await load(false);
    } catch (e) { fail(e); }
  };

  // ── Booking operations ──────────────────────────────────────────────────────
  const createBooking = async (opts: NewBookingInput) => {
    try {
      const advance = Number(opts.advance_payment) || 0;
      const { data: booking, error } = await db.from('event_bookings').insert({
        tenant_id: tid,
        hall_id: opts.hall_id,
        package_id: opts.package_id,
        client_name: opts.client_name,
        phone: opts.phone || null,
        event_date: opts.event_date,
        event_type: opts.event_type,
        guest_count: Number(opts.guest_count) || 0,
        total_price: Number(opts.total_price) || 0,
        advance_payment: advance,
        paid_amount: advance,
        status: 'pending',
        source: 'admin',
        note: opts.note || null,
      }).select().single();
      if (error) throw error;

      // Deposit goes into the payments ledger so the kassa stays consistent.
      if (advance > 0) {
        await db.from('event_payments').insert({
          tenant_id: tid, booking_id: booking.id, amount: advance,
          method: 'cash', note: 'Zakalat (avans)',
        });
      }

      toast({ title: 'Buyurtma qabul qilindi', description: `${opts.client_name} — ${opts.event_date}` });
      await load(false);
      return booking.id as string;
    } catch (e) { fail(e); return null; }
  };

  const updateBookingStatus = async (id: string, status: BookingStatus) => {
    try {
      const { error } = await db.from('event_bookings').update({ status }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Status yangilandi' });
      await load(false);
    } catch (e) { fail(e); }
  };

  const deleteBooking = async (id: string) => {
    try {
      const { error } = await db.from('event_bookings').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Buyurtma o'chirildi" });
      await load(false);
    } catch (e) { fail(e); }
  };

  // ── Payments ────────────────────────────────────────────────────────────────
  const addPayment = async (bookingId: string, amount: number, method: PaymentMethod, note?: string) => {
    try {
      const sum = Number(amount) || 0;
      if (sum <= 0) return;
      const booking = bookings.find(b => b.id === bookingId);
      const { error } = await db.from('event_payments').insert({
        tenant_id: tid, booking_id: bookingId, amount: sum, method, note: note || null,
      });
      if (error) throw error;
      const newPaid = Number(booking?.paid_amount || 0) + sum;
      await db.from('event_bookings').update({ paid_amount: newPaid }).eq('id', bookingId);
      toast({ title: "To'lov qabul qilindi" });
      await load(false);
    } catch (e) { fail(e); }
  };

  return {
    loading, halls, packages, bookings, payments,
    reload: () => load(false),
    addHall, updateHall, deleteHall,
    addPackage, updatePackage, deletePackage,
    createBooking, updateBookingStatus, deleteBooking,
    addPayment,
  };
}

export type WeddingApi = ReturnType<typeof useWedding>;

// ── normalizers (jsonb fields can come back as string/null) ───────────────────
function normPackage(raw: any): EventPackage {
  return { ...raw, includes: parseJson(raw.includes, []) };
}
function parseJson(v: any, fallback: any) {
  if (v == null) return fallback;
  if (typeof v === 'string') { try { return JSON.parse(v); } catch { return fallback; } }
  return v;
}
