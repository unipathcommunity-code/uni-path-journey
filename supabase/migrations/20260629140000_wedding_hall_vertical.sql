-- Migration: 20260629140000_wedding_hall_vertical.sql
-- Description: Wedding-hall / event-venue vertical.
--   Part A (legacy): wedding_hall_bookings + wedding_hall_seating (kept for backward-compat).
--   Part B: full operational schema — event_halls, event_packages, event_bookings
--           (calendar), event_payments (installments), with multi-tenant RLS.
-- Idempotent: uses IF NOT EXISTS / DROP POLICY IF EXISTS so it is safe to re-run and
-- safe even if a partial table already exists in prod.

-- ═════════════════════════════════════════════════════════════════════════════
-- PART A — LEGACY TABLES (kept as-is so previously applied environments match)
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.wedding_hall_bookings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id             uuid,
  client_name           text NOT NULL,
  client_phone          text NOT NULL,
  event_date            date NOT NULL,
  guest_count           integer NOT NULL DEFAULT 100,
  total_price           numeric NOT NULL DEFAULT 0,
  paid_deposit          numeric NOT NULL DEFAULT 0,
  status                text NOT NULL DEFAULT 'pending', -- pending | confirmed | completed | cancelled
  hall_name             text NOT NULL,
  menu_package          text NOT NULL DEFAULT 'standard', -- standard | gold | platinum
  timeline_events_json  jsonb DEFAULT '[]'::jsonb,      -- array of { id, time, title, desc }
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wedding_hall_bookings_tenant ON public.wedding_hall_bookings(tenant_id);

CREATE TABLE IF NOT EXISTS public.wedding_hall_seating (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  booking_id         uuid NOT NULL REFERENCES public.wedding_hall_bookings(id) ON DELETE CASCADE,
  table_layout_json  jsonb NOT NULL DEFAULT '[]'::jsonb, -- array of { id, type, x, y, label, seats: [] }
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wedding_hall_seating_tenant ON public.wedding_hall_seating(tenant_id);
CREATE INDEX IF NOT EXISTS idx_wedding_hall_seating_booking ON public.wedding_hall_seating(booking_id);

ALTER TABLE public.wedding_hall_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_hall_seating  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wedding_hall_bookings_staff_all" ON public.wedding_hall_bookings;
CREATE POLICY "wedding_hall_bookings_staff_all" ON public.wedding_hall_bookings
  FOR ALL USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));

DROP POLICY IF EXISTS "wedding_hall_seating_staff_all" ON public.wedding_hall_seating;
CREATE POLICY "wedding_hall_seating_staff_all" ON public.wedding_hall_seating
  FOR ALL USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));

-- ═════════════════════════════════════════════════════════════════════════════
-- PART B — OPERATIONAL EVENT-VENUE SCHEMA
-- ═════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. EVENT HALLS (banquet rooms)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_halls (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id   uuid,
  name        text NOT NULL,
  capacity    integer NOT NULL DEFAULT 200,
  base_price  numeric NOT NULL DEFAULT 0,
  description text,
  image_url   text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
-- Guard columns in case a legacy/partial table already exists
ALTER TABLE public.event_halls ADD COLUMN IF NOT EXISTS branch_id uuid;
ALTER TABLE public.event_halls ADD COLUMN IF NOT EXISTS base_price numeric NOT NULL DEFAULT 0;
ALTER TABLE public.event_halls ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.event_halls ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.event_halls ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_event_halls_tenant ON public.event_halls(tenant_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. EVENT PACKAGES (menu / program packages, priced per guest)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_packages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id       uuid,
  name            text NOT NULL,
  price_per_guest numeric NOT NULL DEFAULT 0,
  description     text,
  includes        jsonb NOT NULL DEFAULT '[]'::jsonb,   -- array of strings
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.event_packages ADD COLUMN IF NOT EXISTS branch_id uuid;
ALTER TABLE public.event_packages ADD COLUMN IF NOT EXISTS includes jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.event_packages ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_event_packages_tenant ON public.event_packages(tenant_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. EVENT BOOKINGS (the calendar — one event per hall per date)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_bookings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id        uuid,
  hall_id          uuid REFERENCES public.event_halls(id) ON DELETE SET NULL,
  package_id       uuid REFERENCES public.event_packages(id) ON DELETE SET NULL,
  client_name      text NOT NULL,
  phone            text,
  event_date       date NOT NULL,
  event_type       text NOT NULL DEFAULT 'wedding',    -- wedding | birthday | corporate | other
  guest_count      integer NOT NULL DEFAULT 0,
  total_price      numeric NOT NULL DEFAULT 0,
  advance_payment  numeric NOT NULL DEFAULT 0,          -- zakalat (deposit)
  paid_amount      numeric NOT NULL DEFAULT 0,          -- total paid so far (incl. deposit)
  status           text NOT NULL DEFAULT 'pending',     -- pending | confirmed | completed | cancelled
  source           text NOT NULL DEFAULT 'admin',       -- admin | online
  note             text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
-- Guard columns in case a legacy/partial table already exists
ALTER TABLE public.event_bookings ADD COLUMN IF NOT EXISTS branch_id uuid;
ALTER TABLE public.event_bookings ADD COLUMN IF NOT EXISTS hall_id uuid REFERENCES public.event_halls(id) ON DELETE SET NULL;
ALTER TABLE public.event_bookings ADD COLUMN IF NOT EXISTS package_id uuid REFERENCES public.event_packages(id) ON DELETE SET NULL;
ALTER TABLE public.event_bookings ADD COLUMN IF NOT EXISTS event_type text NOT NULL DEFAULT 'wedding';
ALTER TABLE public.event_bookings ADD COLUMN IF NOT EXISTS advance_payment numeric NOT NULL DEFAULT 0;
ALTER TABLE public.event_bookings ADD COLUMN IF NOT EXISTS paid_amount numeric NOT NULL DEFAULT 0;
ALTER TABLE public.event_bookings ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'admin';
ALTER TABLE public.event_bookings ADD COLUMN IF NOT EXISTS note text;
CREATE INDEX IF NOT EXISTS idx_event_bookings_tenant ON public.event_bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_event_bookings_date ON public.event_bookings(event_date);
CREATE INDEX IF NOT EXISTS idx_event_bookings_status ON public.event_bookings(status);
CREATE INDEX IF NOT EXISTS idx_event_bookings_hall ON public.event_bookings(hall_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. EVENT PAYMENTS (installments — deposit + follow-up payments)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_payments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id   uuid,
  booking_id  uuid NOT NULL REFERENCES public.event_bookings(id) ON DELETE CASCADE,
  amount      numeric NOT NULL DEFAULT 0,
  method      text NOT NULL DEFAULT 'cash',   -- cash | card | click | payme
  paid_at     timestamptz NOT NULL DEFAULT now(),
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_event_payments_tenant ON public.event_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_event_payments_booking ON public.event_payments(booking_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.event_halls    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_payments ENABLE ROW LEVEL SECURITY;

-- Staff role set helper expression: get_auth_user_role() already exists in the DB.

-- ── HALLS ────────────────────────────────────────────────────────────────────
-- Public can browse active halls (public site booking widget)
DROP POLICY IF EXISTS "event_hall_public_select" ON public.event_halls;
CREATE POLICY "event_hall_public_select" ON public.event_halls
  FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "event_hall_staff_all" ON public.event_halls;
CREATE POLICY "event_hall_staff_all" ON public.event_halls
  FOR ALL USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));

-- ── PACKAGES ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "event_pkg_public_select" ON public.event_packages;
CREATE POLICY "event_pkg_public_select" ON public.event_packages
  FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "event_pkg_staff_all" ON public.event_packages;
CREATE POLICY "event_pkg_staff_all" ON public.event_packages
  FOR ALL USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));

-- ── BOOKINGS ─────────────────────────────────────────────────────────────────
-- Staff full access
DROP POLICY IF EXISTS "event_booking_staff_all" ON public.event_bookings;
CREATE POLICY "event_booking_staff_all" ON public.event_bookings
  FOR ALL USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));
-- Public/anon may CREATE a booking request from the public site, but only as online source.
-- Anon has NO select policy on event_bookings — client data stays private.
DROP POLICY IF EXISTS "event_booking_public_insert" ON public.event_bookings;
CREATE POLICY "event_booking_public_insert" ON public.event_bookings
  FOR INSERT WITH CHECK (source = 'online');

-- ── PAYMENTS ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "event_payment_staff_all" ON public.event_payments;
CREATE POLICY "event_payment_staff_all" ON public.event_payments
  FOR ALL USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));

-- ─────────────────────────────────────────────────────────────────────────────
-- Public helper: booked dates for a hall (SECURITY DEFINER so anon can check
-- availability WITHOUT reading any booking/client data directly).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_hall_booked_dates(p_hall_id uuid)
RETURNS SETOF date
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT event_date
  FROM public.event_bookings
  WHERE hall_id = p_hall_id
    AND status IN ('pending','confirmed')
    AND event_date >= CURRENT_DATE;
$$;
GRANT EXECUTE ON FUNCTION public.get_hall_booked_dates(uuid) TO anon, authenticated;
