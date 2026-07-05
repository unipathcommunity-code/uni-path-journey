import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import {
  HotelRoom, HotelRoomType, HotelRatePlan, HotelGuest, HotelBooking, HousekeepingTask,
  BookingStatus, RoomStatus, HousekeepingStatus, PaymentMethod,
  nightsBetween, BLOCKING_STATUSES,
} from './types';

// Untyped client — these tables are not in the generated Supabase types yet.
const db = supabase as any;

export interface NewBooking {
  room_id: string | null;
  room_type_id?: string | null;
  guest_id?: string | null;
  guest_name: string;
  guest_phone: string;
  check_in: string;   // yyyy-mm-dd
  check_out: string;  // yyyy-mm-dd
  price_per_night: number;
  status?: BookingStatus;
  payment_method?: PaymentMethod;
  paid_amount?: number;
  note?: string;
}

export function useHotel() {
  const { activeTenant } = useApp();
  const { toast } = useToast();
  const tid = activeTenant?.id;

  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [roomTypes, setRoomTypes] = useState<HotelRoomType[]>([]);
  const [ratePlans, setRatePlans] = useState<HotelRatePlan[]>([]);
  const [guests, setGuests] = useState<HotelGuest[]>([]);
  const [bookings, setBookings] = useState<HotelBooking[]>([]);
  const [housekeeping, setHousekeeping] = useState<HousekeepingTask[]>([]);
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
      const [roomRes, typeRes, rateRes, guestRes, bookingRes, hkRes] = await Promise.all([
        db.from('hotel_rooms').select('*').eq('tenant_id', tid).order('room_number'),
        db.from('hotel_room_types').select('*').eq('tenant_id', tid).order('created_at'),
        db.from('hotel_rate_plans').select('*').eq('tenant_id', tid).order('start_date'),
        db.from('hotel_guests').select('*').eq('tenant_id', tid).order('created_at', { ascending: false }),
        db.from('hotel_bookings').select('*').eq('tenant_id', tid).order('created_at', { ascending: false }),
        db.from('hotel_housekeeping_tasks').select('*').eq('tenant_id', tid).order('created_at', { ascending: false }),
      ]);

      const rms = (roomRes.data || []) as HotelRoom[];
      const roomMap = new Map(rms.map(r => [r.id, r.room_number]));

      setRooms(rms);
      setRoomTypes(((typeRes.data || []) as any[]).map(normRoomType));
      setRatePlans((rateRes.data || []) as HotelRatePlan[]);
      setGuests((guestRes.data || []) as HotelGuest[]);
      setBookings(((bookingRes.data || []) as any[]).map(b => ({
        ...b,
        room_number: b.room_id ? (roomMap.get(b.room_id) || '—') : undefined,
      })));
      setHousekeeping(((hkRes.data || []) as any[]).map(t => ({
        ...t,
        room_number: t.room_id ? (roomMap.get(t.room_id) || '—') : undefined,
      })));
    } catch (e: any) {
      // RLS / missing-table errors should not hard-crash the dashboard
      console.error('Hotel load error:', e);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [tid]);

  useEffect(() => { load(); }, [load]);

  // Light polling so the reception desk stays fresh without manual refresh.
  useEffect(() => {
    if (!tid) return;
    const id = setInterval(() => load(false), 20000);
    return () => clearInterval(id);
  }, [tid, load]);

  // ── Room CRUD ───────────────────────────────────────────────────────────────
  const addRoom = async (payload: { room_number: string; room_type_id?: string | null; type?: string | null; floor?: number; price_per_night?: number }) => {
    try {
      const { error } = await db.from('hotel_rooms').insert({
        tenant_id: tid,
        room_number: payload.room_number,
        room_type_id: payload.room_type_id || null,
        type: payload.type || null,
        floor: payload.floor || 1,
        price_per_night: payload.price_per_night || 0,
        status: 'available',
        is_active: true,
      });
      if (error) throw error;
      toast({ title: "Xona qo'shildi", description: `№ ${payload.room_number}` });
      await load(false);
    } catch (e) { fail(e); }
  };

  const setRoomStatus = async (id: string, status: RoomStatus) => {
    try {
      const { error } = await db.from('hotel_rooms').update({ status }).eq('id', id);
      if (error) throw error;
      await load(false);
    } catch (e) { fail(e); }
  };

  const deleteRoom = async (id: string) => {
    try {
      const { error } = await db.from('hotel_rooms').delete().eq('id', id);
      if (error) throw error;
      await load(false);
    } catch (e) { fail(e); }
  };

  // ── Room type CRUD ──────────────────────────────────────────────────────────
  const addRoomType = async (payload: { name: string; base_price: number; capacity: number; amenities?: string[]; description?: string }) => {
    try {
      const { error } = await db.from('hotel_room_types').insert({
        tenant_id: tid,
        name: payload.name,
        base_price: payload.base_price,
        capacity: payload.capacity,
        amenities: payload.amenities || [],
        description: payload.description || null,
        is_active: true,
      });
      if (error) throw error;
      toast({ title: "Xona turi qo'shildi", description: payload.name });
      await load(false);
    } catch (e) { fail(e); }
  };

  const updateRoomType = async (id: string, patch: Partial<HotelRoomType>) => {
    try {
      const { error } = await db.from('hotel_room_types').update(patch).eq('id', id);
      if (error) throw error;
      await load(false);
    } catch (e) { fail(e); }
  };

  const deleteRoomType = async (id: string) => {
    try {
      const { error } = await db.from('hotel_room_types').delete().eq('id', id);
      if (error) throw error;
      await load(false);
    } catch (e) { fail(e); }
  };

  // ── Rate plan CRUD ──────────────────────────────────────────────────────────
  const addRatePlan = async (payload: { room_type_id: string; name: string; price: number; start_date: string; end_date: string }) => {
    try {
      const { error } = await db.from('hotel_rate_plans').insert({
        tenant_id: tid,
        room_type_id: payload.room_type_id,
        name: payload.name,
        price: payload.price,
        start_date: payload.start_date,
        end_date: payload.end_date,
        is_active: true,
      });
      if (error) throw error;
      toast({ title: "Narx rejasi qo'shildi", description: payload.name });
      await load(false);
    } catch (e) { fail(e); }
  };

  const updateRatePlan = async (id: string, patch: Partial<HotelRatePlan>) => {
    try {
      const { error } = await db.from('hotel_rate_plans').update(patch).eq('id', id);
      if (error) throw error;
      await load(false);
    } catch (e) { fail(e); }
  };

  const deleteRatePlan = async (id: string) => {
    try {
      const { error } = await db.from('hotel_rate_plans').delete().eq('id', id);
      if (error) throw error;
      await load(false);
    } catch (e) { fail(e); }
  };

  // ── Guest CRUD ──────────────────────────────────────────────────────────────
  const addGuest = async (payload: { full_name: string; phone?: string; email?: string; document_no?: string; notes?: string }) => {
    try {
      const { data, error } = await db.from('hotel_guests').insert({
        tenant_id: tid,
        full_name: payload.full_name,
        phone: payload.phone || null,
        email: payload.email || null,
        document_no: payload.document_no || null,
        notes: payload.notes || null,
      }).select().single();
      if (error) throw error;
      toast({ title: "Mehmon qo'shildi", description: payload.full_name });
      await load(false);
      return (data?.id as string) || null;
    } catch (e) { fail(e); return null; }
  };

  const updateGuest = async (id: string, patch: Partial<HotelGuest>) => {
    try {
      const { error } = await db.from('hotel_guests').update(patch).eq('id', id);
      if (error) throw error;
      await load(false);
    } catch (e) { fail(e); }
  };

  const deleteGuest = async (id: string) => {
    try {
      const { error } = await db.from('hotel_guests').delete().eq('id', id);
      if (error) throw error;
      await load(false);
    } catch (e) { fail(e); }
  };

  // ── Booking operations ──────────────────────────────────────────────────────
  const hasConflict = (room_id: string, check_in: string, check_out: string, excludeId?: string) =>
    bookings.some(b =>
      b.room_id === room_id &&
      b.id !== excludeId &&
      BLOCKING_STATUSES.includes(b.status) &&
      b.check_in < check_out && check_in < b.check_out
    );

  const createBooking = async (opts: NewBooking) => {
    try {
      if (opts.room_id && hasConflict(opts.room_id, opts.check_in, opts.check_out)) {
        toast({ title: 'Xona band', description: 'Tanlangan sanalarda bu xona allaqachon band qilingan.', variant: 'destructive' });
        return null;
      }
      const nights = nightsBetween(opts.check_in, opts.check_out);
      const total = nights * (opts.price_per_night || 0);
      const status: BookingStatus = opts.status || 'confirmed';

      const { data: booking, error } = await db.from('hotel_bookings').insert({
        tenant_id: tid,
        room_id: opts.room_id,
        room_type_id: opts.room_type_id || null,
        guest_id: opts.guest_id || null,
        guest_name: opts.guest_name,
        guest_phone: opts.guest_phone,
        check_in: opts.check_in,
        check_out: opts.check_out,
        status,
        source: 'admin',
        nights,
        price_per_night: opts.price_per_night || 0,
        total_amount: total,
        paid_amount: opts.paid_amount || 0,
        payment_method: opts.payment_method || null,
        note: opts.note || null,
      }).select().single();
      if (error) throw error;

      // Checking in right now → mark the room occupied
      if (status === 'checked_in' && opts.room_id) {
        await db.from('hotel_rooms').update({ status: 'occupied' }).eq('id', opts.room_id);
      }

      toast({ title: 'Bron yaratildi', description: `${opts.guest_name} · ${nights} kecha` });
      await load(false);
      return booking.id as string;
    } catch (e) { fail(e); return null; }
  };

  const confirmBooking = async (bookingId: string) => {
    try {
      const { error } = await db.from('hotel_bookings').update({ status: 'confirmed' }).eq('id', bookingId);
      if (error) throw error;
      toast({ title: 'Bron tasdiqlandi' });
      await load(false);
    } catch (e) { fail(e); }
  };

  const checkIn = async (bookingId: string, roomId?: string | null) => {
    try {
      const { error } = await db.from('hotel_bookings').update({ status: 'checked_in' }).eq('id', bookingId);
      if (error) throw error;
      if (roomId) await db.from('hotel_rooms').update({ status: 'occupied' }).eq('id', roomId);
      toast({ title: 'Check-in bajarildi', description: 'Mehmon xonaga joylashtirildi.' });
      await load(false);
    } catch (e) { fail(e); }
  };

  const checkOut = async (bookingId: string, roomId?: string | null) => {
    try {
      const { error } = await db.from('hotel_bookings').update({ status: 'checked_out' }).eq('id', bookingId);
      if (error) throw error;
      if (roomId) {
        await db.from('hotel_rooms').update({ status: 'cleaning' }).eq('id', roomId);
        // Auto-create a housekeeping task for the vacated room
        await db.from('hotel_housekeeping_tasks').insert({
          tenant_id: tid, room_id: roomId, status: 'pending', note: 'Check-out dan keyin tozalash',
        });
      }
      toast({ title: 'Check-out yakunlandi', description: 'Xona tozalash holatiga o\'tkazildi.' });
      await load(false);
    } catch (e) { fail(e); }
  };

  const cancelBooking = async (bookingId: string, roomId?: string | null) => {
    try {
      const b = bookings.find(x => x.id === bookingId);
      const { error } = await db.from('hotel_bookings').update({ status: 'cancelled' }).eq('id', bookingId);
      if (error) throw error;
      // If the guest was already in the room, free it
      if (b?.status === 'checked_in' && roomId) {
        await db.from('hotel_rooms').update({ status: 'available' }).eq('id', roomId);
      }
      toast({ title: 'Bron bekor qilindi' });
      await load(false);
    } catch (e) { fail(e); }
  };

  const setPaidAmount = async (bookingId: string, paid_amount: number, payment_method?: PaymentMethod) => {
    try {
      const patch: any = { paid_amount };
      if (payment_method) patch.payment_method = payment_method;
      const { error } = await db.from('hotel_bookings').update(patch).eq('id', bookingId);
      if (error) throw error;
      await load(false);
    } catch (e) { fail(e); }
  };

  // ── Housekeeping ────────────────────────────────────────────────────────────
  const addHousekeepingTask = async (roomId: string, note?: string, assignedTo?: string) => {
    try {
      const { error } = await db.from('hotel_housekeeping_tasks').insert({
        tenant_id: tid, room_id: roomId, status: 'pending',
        note: note || null, assigned_to: assignedTo || null,
      });
      if (error) throw error;
      const room = rooms.find(r => r.id === roomId);
      if (room && room.status === 'available') {
        await db.from('hotel_rooms').update({ status: 'cleaning' }).eq('id', roomId);
      }
      toast({ title: 'Tozalash vazifasi yaratildi' });
      await load(false);
    } catch (e) { fail(e); }
  };

  const setHousekeepingStatus = async (taskId: string, status: HousekeepingStatus) => {
    try {
      const { error } = await db.from('hotel_housekeeping_tasks').update({ status }).eq('id', taskId);
      if (error) throw error;
      // Task finished → the room is ready again (only if it was in cleaning)
      if (status === 'done') {
        const task = housekeeping.find(t => t.id === taskId);
        const room = task?.room_id ? rooms.find(r => r.id === task.room_id) : null;
        if (room && room.status === 'cleaning') {
          await db.from('hotel_rooms').update({ status: 'available' }).eq('id', room.id);
        }
      }
      await load(false);
    } catch (e) { fail(e); }
  };

  const deleteHousekeepingTask = async (taskId: string) => {
    try {
      const { error } = await db.from('hotel_housekeeping_tasks').delete().eq('id', taskId);
      if (error) throw error;
      await load(false);
    } catch (e) { fail(e); }
  };

  return {
    loading, rooms, roomTypes, ratePlans, guests, bookings, housekeeping,
    reload: () => load(false),
    addRoom, setRoomStatus, deleteRoom,
    addRoomType, updateRoomType, deleteRoomType,
    addRatePlan, updateRatePlan, deleteRatePlan,
    addGuest, updateGuest, deleteGuest,
    createBooking, confirmBooking, checkIn, checkOut, cancelBooking, setPaidAmount, hasConflict,
    addHousekeepingTask, setHousekeepingStatus, deleteHousekeepingTask,
  };
}

export type HotelApi = ReturnType<typeof useHotel>;

// ── normalizers (jsonb fields can come back as string/null) ───────────────────
function normRoomType(raw: any): HotelRoomType {
  return { ...raw, amenities: parseJson(raw.amenities, []) };
}
function parseJson(v: any, fallback: any) {
  if (v == null) return fallback;
  if (typeof v === 'string') { try { return JSON.parse(v); } catch { return fallback; } }
  return v;
}
