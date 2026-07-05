-- Migration: 20260629130000_hotel_vertical.sql
-- Description: Full operational hotel/motel vertical — room types, rooms, seasonal rate
--              plans, guests, bookings (front-desk + online), housekeeping, with
--              multi-tenant RLS.
-- Idempotent: uses IF NOT EXISTS / DROP POLICY IF EXISTS so it is safe to re-run and
-- safe even if legacy hotel_rooms/hotel_bookings tables already exist in prod.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ROOM TYPES (catalog: Standard, Deluxe, Suite ...)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hotel_room_types (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id   uuid,
  name        text NOT NULL,
  base_price  numeric NOT NULL DEFAULT 0,
  capacity    integer NOT NULL DEFAULT 2,
  amenities   jsonb NOT NULL DEFAULT '[]'::jsonb,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hotel_room_types_tenant ON public.hotel_room_types(tenant_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ROOMS (physical inventory) — keeps legacy `type` + `price_per_night` columns
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hotel_rooms (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id       uuid,
  room_number     text NOT NULL,
  room_type_id    uuid REFERENCES public.hotel_room_types(id) ON DELETE SET NULL,
  type            text,                                -- legacy: single | double | suite | deluxe
  floor           integer NOT NULL DEFAULT 1,
  status          text NOT NULL DEFAULT 'available',   -- available | occupied | cleaning | maintenance
  price_per_night numeric NOT NULL DEFAULT 0,          -- legacy per-room price
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
-- Guard columns in case a legacy table already exists
ALTER TABLE public.hotel_rooms ADD COLUMN IF NOT EXISTS branch_id uuid;
ALTER TABLE public.hotel_rooms ADD COLUMN IF NOT EXISTS room_type_id uuid REFERENCES public.hotel_room_types(id) ON DELETE SET NULL;
ALTER TABLE public.hotel_rooms ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.hotel_rooms ADD COLUMN IF NOT EXISTS floor integer NOT NULL DEFAULT 1;
ALTER TABLE public.hotel_rooms ADD COLUMN IF NOT EXISTS price_per_night numeric NOT NULL DEFAULT 0;
ALTER TABLE public.hotel_rooms ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.hotel_rooms ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_hotel_rooms_tenant ON public.hotel_rooms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hotel_rooms_type ON public.hotel_rooms(room_type_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RATE PLANS (seasonal pricing per room type)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hotel_rate_plans (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id     uuid,
  room_type_id  uuid REFERENCES public.hotel_room_types(id) ON DELETE CASCADE,
  name          text NOT NULL,
  price         numeric NOT NULL DEFAULT 0,
  start_date    date,
  end_date      date,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hotel_rate_plans_tenant ON public.hotel_rate_plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hotel_rate_plans_type ON public.hotel_rate_plans(room_type_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. GUESTS (mini-CRM)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hotel_guests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id    uuid,
  full_name    text NOT NULL,
  phone        text,
  email        text,
  document_no  text,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hotel_guests_tenant ON public.hotel_guests(tenant_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. BOOKINGS (front-desk + online) — keeps legacy column names
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hotel_bookings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id       uuid,
  room_id         uuid REFERENCES public.hotel_rooms(id) ON DELETE SET NULL,
  room_type_id    uuid REFERENCES public.hotel_room_types(id) ON DELETE SET NULL,
  guest_id        uuid REFERENCES public.hotel_guests(id) ON DELETE SET NULL,
  guest_name      text,
  guest_phone     text,
  guest_email     text,
  check_in        date,
  check_out       date,
  status          text NOT NULL DEFAULT 'pending',  -- pending | confirmed | checked_in | checked_out | cancelled
  source          text NOT NULL DEFAULT 'admin',    -- admin | online
  nights          integer NOT NULL DEFAULT 1,
  price_per_night numeric NOT NULL DEFAULT 0,
  total_amount    numeric NOT NULL DEFAULT 0,
  paid_amount     numeric NOT NULL DEFAULT 0,
  payment_method  text,                             -- cash | card | click | payme
  note            text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
-- Guard columns in case a legacy table already exists
ALTER TABLE public.hotel_bookings ADD COLUMN IF NOT EXISTS branch_id uuid;
ALTER TABLE public.hotel_bookings ADD COLUMN IF NOT EXISTS room_type_id uuid REFERENCES public.hotel_room_types(id) ON DELETE SET NULL;
ALTER TABLE public.hotel_bookings ADD COLUMN IF NOT EXISTS guest_id uuid REFERENCES public.hotel_guests(id) ON DELETE SET NULL;
ALTER TABLE public.hotel_bookings ADD COLUMN IF NOT EXISTS guest_email text;
ALTER TABLE public.hotel_bookings ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'admin';
ALTER TABLE public.hotel_bookings ADD COLUMN IF NOT EXISTS nights integer NOT NULL DEFAULT 1;
ALTER TABLE public.hotel_bookings ADD COLUMN IF NOT EXISTS price_per_night numeric NOT NULL DEFAULT 0;
ALTER TABLE public.hotel_bookings ADD COLUMN IF NOT EXISTS paid_amount numeric NOT NULL DEFAULT 0;
ALTER TABLE public.hotel_bookings ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.hotel_bookings ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE public.hotel_bookings ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- Online bookings arrive without an assigned room / guest — relax legacy NOT NULLs
ALTER TABLE public.hotel_bookings ALTER COLUMN room_id DROP NOT NULL;
ALTER TABLE public.hotel_bookings ALTER COLUMN guest_name DROP NOT NULL;
ALTER TABLE public.hotel_bookings ALTER COLUMN guest_phone DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_tenant ON public.hotel_bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_room ON public.hotel_bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_status ON public.hotel_bookings(status);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_dates ON public.hotel_bookings(check_in, check_out);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. HOUSEKEEPING TASKS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hotel_housekeeping_tasks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id    uuid,
  room_id      uuid REFERENCES public.hotel_rooms(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending',  -- pending | in_progress | done
  assigned_to  text,
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hotel_hk_tenant ON public.hotel_housekeeping_tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hotel_hk_room ON public.hotel_housekeeping_tasks(room_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.hotel_room_types         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_rooms              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_rate_plans         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_guests             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_bookings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_housekeeping_tasks ENABLE ROW LEVEL SECURITY;

-- Staff role set helper expression: get_auth_user_role() already exists in the DB.

-- ── ROOM TYPES ───────────────────────────────────────────────────────────────
-- Public may read active room types (needed for the online booking widget)
DROP POLICY IF EXISTS "hotel_rtype_public_select" ON public.hotel_room_types;
CREATE POLICY "hotel_rtype_public_select" ON public.hotel_room_types
  FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "hotel_rtype_staff_all" ON public.hotel_room_types;
CREATE POLICY "hotel_rtype_staff_all" ON public.hotel_room_types
  FOR ALL USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));

-- ── ROOMS ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "hotel_rooms_staff_all" ON public.hotel_rooms;
DROP POLICY IF EXISTS "hotel_room_public_select" ON public.hotel_rooms;
CREATE POLICY "hotel_room_public_select" ON public.hotel_rooms
  FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "hotel_room_staff_all" ON public.hotel_rooms;
CREATE POLICY "hotel_room_staff_all" ON public.hotel_rooms
  FOR ALL USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));

-- ── RATE PLANS ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "hotel_rate_staff_all" ON public.hotel_rate_plans;
CREATE POLICY "hotel_rate_staff_all" ON public.hotel_rate_plans
  FOR ALL USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));

-- ── GUESTS ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "hotel_guest_staff_all" ON public.hotel_guests;
CREATE POLICY "hotel_guest_staff_all" ON public.hotel_guests
  FOR ALL USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));

-- ── BOOKINGS ─────────────────────────────────────────────────────────────────
-- Staff full access
DROP POLICY IF EXISTS "hotel_bookings_staff_all" ON public.hotel_bookings;
DROP POLICY IF EXISTS "hotel_booking_staff_all" ON public.hotel_bookings;
CREATE POLICY "hotel_booking_staff_all" ON public.hotel_bookings
  FOR ALL USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));
-- Public/anon may CREATE a booking request from the tenant public page, only as online source.
-- Note: anon has NO select on hotel_bookings — the public widget inserts without .select().
DROP POLICY IF EXISTS "hotel_booking_public_insert" ON public.hotel_bookings;
CREATE POLICY "hotel_booking_public_insert" ON public.hotel_bookings
  FOR INSERT WITH CHECK (source = 'online');

-- ── HOUSEKEEPING ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "hotel_hk_staff_all" ON public.hotel_housekeeping_tasks;
CREATE POLICY "hotel_hk_staff_all" ON public.hotel_housekeeping_tasks
  FOR ALL USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));
