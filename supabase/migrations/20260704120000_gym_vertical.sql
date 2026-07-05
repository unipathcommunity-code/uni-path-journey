-- Migration: 20260704120000_gym_vertical.sql
-- Description: Full operational gym/fitness vertical (1Fit-style) — membership plans,
--              members with QR tokens, subscriptions, recurring class schedule,
--              class bookings (admin + online) and check-ins, with multi-tenant RLS.
-- Idempotent: uses IF NOT EXISTS / DROP POLICY IF EXISTS so it is safe to re-run and
-- safe even if legacy gym tables already exist in prod.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. MEMBERSHIP PLANS (passes: monthly unlimited, 12-class pack, ...)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gym_plans (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id     uuid,
  name          text NOT NULL,
  price         numeric NOT NULL DEFAULT 0,
  duration_days integer NOT NULL DEFAULT 30,
  class_limit   integer,                          -- NULL = unlimited classes
  description   text,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gym_plans ADD COLUMN IF NOT EXISTS branch_id uuid;
ALTER TABLE public.gym_plans ADD COLUMN IF NOT EXISTS duration_days integer NOT NULL DEFAULT 30;
ALTER TABLE public.gym_plans ADD COLUMN IF NOT EXISTS class_limit integer;
ALTER TABLE public.gym_plans ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.gym_plans ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.gym_plans ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_gym_plans_tenant ON public.gym_plans(tenant_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. MEMBERS (mini-CRM, each member gets a QR token for check-in)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gym_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id   uuid,
  full_name   text NOT NULL,
  phone       text,
  email       text,
  notes       text,
  qr_token    text NOT NULL DEFAULT gen_random_uuid()::text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gym_members ADD COLUMN IF NOT EXISTS branch_id uuid;
ALTER TABLE public.gym_members ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.gym_members ADD COLUMN IF NOT EXISTS qr_token text NOT NULL DEFAULT gen_random_uuid()::text;
ALTER TABLE public.gym_members ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_gym_members_tenant ON public.gym_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gym_members_qr ON public.gym_members(qr_token);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. SUBSCRIPTIONS (a member holds a plan for a period)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gym_subscriptions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id         uuid,
  member_id         uuid REFERENCES public.gym_members(id) ON DELETE CASCADE,
  plan_id           uuid REFERENCES public.gym_plans(id) ON DELETE SET NULL,
  start_date        date NOT NULL DEFAULT CURRENT_DATE,
  end_date          date,
  status            text NOT NULL DEFAULT 'active',   -- active | frozen | expired | cancelled
  remaining_classes integer,                          -- NULL = unlimited
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gym_subscriptions ADD COLUMN IF NOT EXISTS branch_id uuid;
ALTER TABLE public.gym_subscriptions ADD COLUMN IF NOT EXISTS remaining_classes integer;
ALTER TABLE public.gym_subscriptions ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_gym_subs_tenant ON public.gym_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gym_subs_member ON public.gym_subscriptions(member_id);
CREATE INDEX IF NOT EXISTS idx_gym_subs_status ON public.gym_subscriptions(status);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. CLASSES (recurring weekly schedule: weekday 0=Yak ... 6=Shan)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gym_classes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id     uuid,
  name          text NOT NULL,
  trainer_name  text,
  capacity      integer NOT NULL DEFAULT 10,
  weekday       integer NOT NULL DEFAULT 1,        -- 0 (Sunday) .. 6 (Saturday)
  start_time    text NOT NULL DEFAULT '09:00',     -- HH:mm
  room          text,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gym_classes ADD COLUMN IF NOT EXISTS branch_id uuid;
ALTER TABLE public.gym_classes ADD COLUMN IF NOT EXISTS trainer_name text;
ALTER TABLE public.gym_classes ADD COLUMN IF NOT EXISTS capacity integer NOT NULL DEFAULT 10;
ALTER TABLE public.gym_classes ADD COLUMN IF NOT EXISTS weekday integer NOT NULL DEFAULT 1;
ALTER TABLE public.gym_classes ADD COLUMN IF NOT EXISTS start_time text NOT NULL DEFAULT '09:00';
ALTER TABLE public.gym_classes ADD COLUMN IF NOT EXISTS room text;
ALTER TABLE public.gym_classes ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.gym_classes ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_gym_classes_tenant ON public.gym_classes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gym_classes_weekday ON public.gym_classes(weekday);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. CLASS BOOKINGS (a member — or an online visitor — books a class on a date)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gym_class_bookings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id      uuid,
  class_id       uuid REFERENCES public.gym_classes(id) ON DELETE CASCADE,
  member_id      uuid REFERENCES public.gym_members(id) ON DELETE SET NULL,
  customer_name  text,
  customer_phone text,
  class_date     date NOT NULL DEFAULT CURRENT_DATE,
  status         text NOT NULL DEFAULT 'booked',   -- booked | attended | cancelled
  source         text NOT NULL DEFAULT 'admin',    -- admin | online
  checked_in_at  timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gym_class_bookings ADD COLUMN IF NOT EXISTS branch_id uuid;
ALTER TABLE public.gym_class_bookings ADD COLUMN IF NOT EXISTS member_id uuid REFERENCES public.gym_members(id) ON DELETE SET NULL;
ALTER TABLE public.gym_class_bookings ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.gym_class_bookings ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE public.gym_class_bookings ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'admin';
ALTER TABLE public.gym_class_bookings ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;
ALTER TABLE public.gym_class_bookings ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_gym_cbookings_tenant ON public.gym_class_bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gym_cbookings_class ON public.gym_class_bookings(class_id);
CREATE INDEX IF NOT EXISTS idx_gym_cbookings_date ON public.gym_class_bookings(class_date);
CREATE INDEX IF NOT EXISTS idx_gym_cbookings_status ON public.gym_class_bookings(status);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. CHECK-INS (gate entries: QR scan or manual)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gym_checkins (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id     uuid,
  member_id     uuid REFERENCES public.gym_members(id) ON DELETE CASCADE,
  method        text NOT NULL DEFAULT 'manual',    -- qr | manual
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gym_checkins ADD COLUMN IF NOT EXISTS branch_id uuid;
ALTER TABLE public.gym_checkins ADD COLUMN IF NOT EXISTS method text NOT NULL DEFAULT 'manual';
CREATE INDEX IF NOT EXISTS idx_gym_checkins_tenant ON public.gym_checkins(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gym_checkins_member ON public.gym_checkins(member_id);
CREATE INDEX IF NOT EXISTS idx_gym_checkins_time ON public.gym_checkins(checked_in_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.gym_plans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_classes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_class_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_checkins       ENABLE ROW LEVEL SECURITY;

-- Staff role set helper expression: get_auth_user_role() already exists in the DB.

-- ── PLANS ─────────────────────────────────────────────────────────────────────
-- Public may read active plans (needed for the online booking widget)
DROP POLICY IF EXISTS "gym_plans_public_select" ON public.gym_plans;
CREATE POLICY "gym_plans_public_select" ON public.gym_plans
  FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "gym_plans_staff_all" ON public.gym_plans;
CREATE POLICY "gym_plans_staff_all" ON public.gym_plans
  FOR ALL USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));

-- ── MEMBERS (staff only — anon must NOT read members) ────────────────────────
DROP POLICY IF EXISTS "gym_members_staff_all" ON public.gym_members;
CREATE POLICY "gym_members_staff_all" ON public.gym_members
  FOR ALL USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));

-- ── SUBSCRIPTIONS (staff only) ────────────────────────────────────────────────
DROP POLICY IF EXISTS "gym_subs_staff_all" ON public.gym_subscriptions;
CREATE POLICY "gym_subs_staff_all" ON public.gym_subscriptions
  FOR ALL USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));

-- ── CLASSES ───────────────────────────────────────────────────────────────────
-- Public may read active classes (schedule shown on the tenant public page)
DROP POLICY IF EXISTS "gym_classes_public_select" ON public.gym_classes;
CREATE POLICY "gym_classes_public_select" ON public.gym_classes
  FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "gym_classes_staff_all" ON public.gym_classes;
CREATE POLICY "gym_classes_staff_all" ON public.gym_classes
  FOR ALL USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));

-- ── CLASS BOOKINGS ────────────────────────────────────────────────────────────
-- Staff full access
DROP POLICY IF EXISTS "gym_cbookings_staff_all" ON public.gym_class_bookings;
CREATE POLICY "gym_cbookings_staff_all" ON public.gym_class_bookings
  FOR ALL USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));
-- Public/anon may CREATE a booking from the tenant public page, only as online source.
-- Note: anon has NO select on gym_class_bookings — the public widget inserts without .select().
DROP POLICY IF EXISTS "gym_cbookings_public_insert" ON public.gym_class_bookings;
CREATE POLICY "gym_cbookings_public_insert" ON public.gym_class_bookings
  FOR INSERT WITH CHECK (source = 'online');

-- ── CHECK-INS (staff only — anon must NOT read check-ins) ─────────────────────
DROP POLICY IF EXISTS "gym_checkins_staff_all" ON public.gym_checkins;
CREATE POLICY "gym_checkins_staff_all" ON public.gym_checkins
  FOR ALL USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));
