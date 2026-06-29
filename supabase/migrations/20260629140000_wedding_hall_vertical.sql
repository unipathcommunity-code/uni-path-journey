-- Migration: 20260629140000_wedding_hall_vertical.sql
-- Description: Database tables and RLS security policies for wedding/banquet halls, guest seating, and timelines.

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

-- RLS policies
ALTER TABLE public.wedding_hall_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_hall_seating    ENABLE ROW LEVEL SECURITY;

-- Staff role check
DROP POLICY IF EXISTS "wedding_hall_bookings_staff_all" ON public.wedding_hall_bookings;
CREATE POLICY "wedding_hall_bookings_staff_all" ON public.wedding_hall_bookings
  FOR ALL USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));

DROP POLICY IF EXISTS "wedding_hall_seating_staff_all" ON public.wedding_hall_seating;
CREATE POLICY "wedding_hall_seating_staff_all" ON public.wedding_hall_seating
  FOR ALL USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));
