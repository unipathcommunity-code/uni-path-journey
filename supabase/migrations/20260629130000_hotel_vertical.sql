-- Migration: 20260629130000_hotel_vertical.sql
-- Description: Database tables and RLS security policies for hotel rooms and bookings.

CREATE TABLE IF NOT EXISTS public.hotel_rooms (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id        uuid,
  room_number      text NOT NULL,
  type             text NOT NULL DEFAULT 'single',   -- single | double | suite | deluxe
  status           text NOT NULL DEFAULT 'available', -- available | occupied | cleaning | maintenance
  price_per_night  numeric NOT NULL DEFAULT 0,
  floor            integer NOT NULL DEFAULT 1,
  description      text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hotel_rooms_tenant ON public.hotel_rooms(tenant_id);

CREATE TABLE IF NOT EXISTS public.hotel_bookings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id       uuid,
  room_id         uuid NOT NULL REFERENCES public.hotel_rooms(id) ON DELETE CASCADE,
  guest_name      text NOT NULL,
  guest_phone     text NOT NULL,
  guest_email     text,
  check_in        date NOT NULL,
  check_out       date NOT NULL,
  status          text NOT NULL DEFAULT 'confirmed',  -- pending | confirmed | checked_in | checked_out | cancelled
  total_amount    numeric NOT NULL DEFAULT 0,
  paid_amount     numeric NOT NULL DEFAULT 0,
  payment_method  text,                                -- cash | card | click | payme
  note            text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hotel_bookings_tenant ON public.hotel_bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_room ON public.hotel_bookings(room_id);

-- RLS policies
ALTER TABLE public.hotel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_bookings ENABLE ROW LEVEL SECURITY;

-- Staff role check
DROP POLICY IF EXISTS "hotel_rooms_staff_all" ON public.hotel_rooms;
CREATE POLICY "hotel_rooms_staff_all" ON public.hotel_rooms
  FOR ALL USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));

DROP POLICY IF EXISTS "hotel_bookings_staff_all" ON public.hotel_bookings;
CREATE POLICY "hotel_bookings_staff_all" ON public.hotel_bookings
  FOR ALL USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));
