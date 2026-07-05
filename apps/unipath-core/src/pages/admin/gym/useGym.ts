import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import {
  GymPlan, GymMember, GymSubscription, GymClass, GymClassBooking, GymCheckin,
  CheckinMethod, addDays, todayISO,
} from './types';

// Untyped client — these tables are not in the generated Supabase types yet.
const db = supabase as any;

export function useGym() {
  const { activeTenant } = useApp();
  const { toast } = useToast();
  const tid = activeTenant?.id;

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<GymPlan[]>([]);
  const [members, setMembers] = useState<GymMember[]>([]);
  const [subscriptions, setSubscriptions] = useState<GymSubscription[]>([]);
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [bookings, setBookings] = useState<GymClassBooking[]>([]);
  const [todayCheckins, setTodayCheckins] = useState<GymCheckin[]>([]);
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
      const todayStart = `${todayISO()}T00:00:00`;
      const [planRes, memberRes, subRes, classRes, bookingRes, checkinRes] = await Promise.all([
        db.from('gym_plans').select('*').eq('tenant_id', tid).order('price'),
        db.from('gym_members').select('*').eq('tenant_id', tid).order('created_at', { ascending: false }),
        db.from('gym_subscriptions').select('*').eq('tenant_id', tid).order('created_at', { ascending: false }),
        db.from('gym_classes').select('*').eq('tenant_id', tid).order('start_time'),
        db.from('gym_class_bookings').select('*').eq('tenant_id', tid).order('created_at', { ascending: false }),
        db.from('gym_checkins').select('*').eq('tenant_id', tid).gte('checked_in_at', todayStart).order('checked_in_at', { ascending: false }),
      ]);

      const planList = (planRes.data || []) as GymPlan[];
      const memberList = (memberRes.data || []) as GymMember[];
      const classList = (classRes.data || []) as GymClass[];
      const planMap = new Map(planList.map(p => [p.id, p]));
      const memberMap = new Map(memberList.map(m => [m.id, m.full_name]));
      const classMap = new Map(classList.map(c => [c.id, c.name]));

      setPlans(planList);
      setMembers(memberList);
      setClasses(classList);
      setSubscriptions(((subRes.data || []) as any[]).map(s => ({
        ...s,
        member_name: s.member_id ? (memberMap.get(s.member_id) || '—') : undefined,
        plan_name: s.plan_id ? (planMap.get(s.plan_id)?.name || '—') : undefined,
        plan_price: s.plan_id ? Number(planMap.get(s.plan_id)?.price || 0) : 0,
      })));
      setBookings(((bookingRes.data || []) as any[]).map(b => ({
        ...b,
        class_name: b.class_id ? (classMap.get(b.class_id) || '—') : undefined,
        member_name: b.member_id ? (memberMap.get(b.member_id) || undefined) : undefined,
      })));
      setTodayCheckins(((checkinRes.data || []) as any[]).map(c => ({
        ...c,
        member_name: c.member_id ? (memberMap.get(c.member_id) || '—') : undefined,
      })));
    } catch (e: any) {
      // RLS / missing-table errors should not hard-crash the dashboard
      console.error('Gym load error:', e);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [tid]);

  useEffect(() => { load(); }, [load]);

  // Light polling so the front desk stays fresh without manual refresh.
  useEffect(() => {
    if (!tid) return;
    const id = setInterval(() => load(false), 20000);
    return () => clearInterval(id);
  }, [tid, load]);

  // ── Plan CRUD ───────────────────────────────────────────────────────────────
  const addPlan = async (payload: { name: string; price: number; duration_days: number; class_limit?: number | null; description?: string }) => {
    try {
      const { error } = await db.from('gym_plans').insert({
        tenant_id: tid,
        name: payload.name,
        price: payload.price,
        duration_days: payload.duration_days,
        class_limit: payload.class_limit ?? null,
        description: payload.description || null,
        is_active: true,
      });
      if (error) throw error;
      toast({ title: "Abonement qo'shildi", description: payload.name });
      await load(false);
    } catch (e) { fail(e); }
  };

  const updatePlan = async (id: string, patch: Partial<GymPlan>) => {
    try {
      const { error } = await db.from('gym_plans').update(patch).eq('id', id);
      if (error) throw error;
      await load(false);
    } catch (e) { fail(e); }
  };

  const deletePlan = async (id: string) => {
    try {
      const { error } = await db.from('gym_plans').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Abonement o'chirildi" });
      await load(false);
    } catch (e) { fail(e); }
  };

  // ── Member CRUD ─────────────────────────────────────────────────────────────
  const addMember = async (payload: { full_name: string; phone?: string; email?: string; notes?: string }) => {
    try {
      const { data, error } = await db.from('gym_members').insert({
        tenant_id: tid,
        full_name: payload.full_name,
        phone: payload.phone || null,
        email: payload.email || null,
        notes: payload.notes || null,
      }).select().single();
      if (error) throw error;
      toast({ title: "A'zo qo'shildi", description: payload.full_name });
      await load(false);
      return (data?.id as string) || null;
    } catch (e) { fail(e); return null; }
  };

  const updateMember = async (id: string, patch: Partial<GymMember>) => {
    try {
      const { error } = await db.from('gym_members').update(patch).eq('id', id);
      if (error) throw error;
      await load(false);
    } catch (e) { fail(e); }
  };

  const deleteMember = async (id: string) => {
    try {
      const { error } = await db.from('gym_members').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "A'zo o'chirildi" });
      await load(false);
    } catch (e) { fail(e); }
  };

  // ── Subscriptions ───────────────────────────────────────────────────────────
  // Active (non-expired-by-date) subscription of a member, if any.
  const activeSubOf = (memberId: string) =>
    subscriptions.find(s =>
      s.member_id === memberId &&
      s.status === 'active' &&
      (!s.end_date || s.end_date >= todayISO())
    ) || null;

  const assignSubscription = async (memberId: string, planId: string, startDate?: string) => {
    try {
      const plan = plans.find(p => p.id === planId);
      if (!plan) { toast({ title: 'Xatolik', description: 'Abonement topilmadi.', variant: 'destructive' }); return; }
      const start = startDate || todayISO();
      const end = addDays(start, Number(plan.duration_days || 30));
      const { error } = await db.from('gym_subscriptions').insert({
        tenant_id: tid,
        member_id: memberId,
        plan_id: planId,
        start_date: start,
        end_date: end,
        status: 'active',
        remaining_classes: plan.class_limit ?? null,
      });
      if (error) throw error;
      toast({ title: 'Abonement biriktirildi', description: `${plan.name} · ${start} → ${end}` });
      await load(false);
    } catch (e) { fail(e); }
  };

  const freezeSubscription = async (subId: string) => {
    try {
      const sub = subscriptions.find(s => s.id === subId);
      const next = sub?.status === 'frozen' ? 'active' : 'frozen';
      const { error } = await db.from('gym_subscriptions').update({ status: next }).eq('id', subId);
      if (error) throw error;
      toast({ title: next === 'frozen' ? 'Abonement muzlatildi' : 'Abonement faollashtirildi' });
      await load(false);
    } catch (e) { fail(e); }
  };

  const cancelSubscription = async (subId: string) => {
    try {
      const { error } = await db.from('gym_subscriptions').update({ status: 'cancelled' }).eq('id', subId);
      if (error) throw error;
      toast({ title: 'Abonement bekor qilindi' });
      await load(false);
    } catch (e) { fail(e); }
  };

  // ── Class CRUD ──────────────────────────────────────────────────────────────
  const addClass = async (payload: { name: string; trainer_name?: string; capacity: number; weekday: number; start_time: string; room?: string }) => {
    try {
      const { error } = await db.from('gym_classes').insert({
        tenant_id: tid,
        name: payload.name,
        trainer_name: payload.trainer_name || null,
        capacity: payload.capacity,
        weekday: payload.weekday,
        start_time: payload.start_time,
        room: payload.room || null,
        is_active: true,
      });
      if (error) throw error;
      toast({ title: "Mashg'ulot qo'shildi", description: payload.name });
      await load(false);
    } catch (e) { fail(e); }
  };

  const updateClass = async (id: string, patch: Partial<GymClass>) => {
    try {
      const { error } = await db.from('gym_classes').update(patch).eq('id', id);
      if (error) throw error;
      await load(false);
    } catch (e) { fail(e); }
  };

  const deleteClass = async (id: string) => {
    try {
      const { error } = await db.from('gym_classes').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Mashg'ulot o'chirildi" });
      await load(false);
    } catch (e) { fail(e); }
  };

  // ── Class bookings ──────────────────────────────────────────────────────────
  const bookedCount = (classId: string, dateISO: string) =>
    bookings.filter(b => b.class_id === classId && b.class_date === dateISO && b.status !== 'cancelled').length;

  const bookClass = async (opts: { class_id: string; class_date: string; member_id?: string | null; customer_name?: string; customer_phone?: string }) => {
    try {
      const cls = classes.find(c => c.id === opts.class_id);
      if (cls && bookedCount(opts.class_id, opts.class_date) >= cls.capacity) {
        toast({ title: "Joy yo'q", description: "Bu mashg'ulotda barcha joylar band.", variant: 'destructive' });
        return null;
      }
      const member = opts.member_id ? members.find(m => m.id === opts.member_id) : null;
      const { data, error } = await db.from('gym_class_bookings').insert({
        tenant_id: tid,
        class_id: opts.class_id,
        member_id: opts.member_id || null,
        customer_name: opts.customer_name || member?.full_name || null,
        customer_phone: opts.customer_phone || member?.phone || null,
        class_date: opts.class_date,
        status: 'booked',
        source: 'admin',
      }).select().single();
      if (error) throw error;

      // Class-pack subscription → decrement remaining classes
      if (opts.member_id) {
        const sub = activeSubOf(opts.member_id);
        if (sub && sub.remaining_classes != null && sub.remaining_classes > 0) {
          await db.from('gym_subscriptions').update({ remaining_classes: sub.remaining_classes - 1 }).eq('id', sub.id);
        }
      }

      toast({ title: 'Yozildi', description: `${cls?.name || "Mashg'ulot"} · ${opts.class_date}` });
      await load(false);
      return (data?.id as string) || null;
    } catch (e) { fail(e); return null; }
  };

  const markAttended = async (bookingId: string) => {
    try {
      const { error } = await db.from('gym_class_bookings')
        .update({ status: 'attended', checked_in_at: new Date().toISOString() }).eq('id', bookingId);
      if (error) throw error;
      toast({ title: 'Qatnashdi deb belgilandi' });
      await load(false);
    } catch (e) { fail(e); }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      const { error } = await db.from('gym_class_bookings').update({ status: 'cancelled' }).eq('id', bookingId);
      if (error) throw error;
      toast({ title: 'Yozilish bekor qilindi' });
      await load(false);
    } catch (e) { fail(e); }
  };

  // ── Check-in ────────────────────────────────────────────────────────────────
  const checkInMember = async (memberId: string, method: CheckinMethod = 'manual') => {
    try {
      const member = members.find(m => m.id === memberId);
      const { error } = await db.from('gym_checkins').insert({
        tenant_id: tid,
        member_id: memberId,
        method,
        checked_in_at: new Date().toISOString(),
      });
      if (error) throw error;

      // If the member has a class booked today → mark it attended
      const today = todayISO();
      const todaysBooking = bookings.find(b => b.member_id === memberId && b.class_date === today && b.status === 'booked');
      if (todaysBooking) {
        await db.from('gym_class_bookings')
          .update({ status: 'attended', checked_in_at: new Date().toISOString() }).eq('id', todaysBooking.id);
      }

      toast({ title: 'Check-in bajarildi', description: member?.full_name || '' });
      await load(false);
    } catch (e) { fail(e); }
  };

  return {
    loading, plans, members, subscriptions, classes, bookings, todayCheckins,
    reload: () => load(false),
    addPlan, updatePlan, deletePlan,
    addMember, updateMember, deleteMember,
    assignSubscription, freezeSubscription, cancelSubscription, activeSubOf,
    addClass, updateClass, deleteClass,
    bookClass, markAttended, cancelBooking, bookedCount,
    checkInMember,
  };
}

export type GymApi = ReturnType<typeof useGym>;
