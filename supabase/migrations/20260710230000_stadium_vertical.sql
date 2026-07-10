-- Stadium vertical: real DB backing for field bookings.
CREATE TABLE IF NOT EXISTS public.stadium_bookings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL DEFAULT current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_name    text NOT NULL,
  phone          text,
  booking_date   date DEFAULT CURRENT_DATE,
  start_time     text,
  duration_hours numeric NOT NULL DEFAULT 1,
  field_name     text,
  total_price    numeric NOT NULL DEFAULT 0,
  status         text NOT NULL DEFAULT 'pending',   -- confirmed | pending | cancelled
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stadium_tenant ON public.stadium_bookings(tenant_id);
ALTER TABLE public.stadium_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stadium_staff_all" ON public.stadium_bookings;
CREATE POLICY "stadium_staff_all" ON public.stadium_bookings FOR ALL TO authenticated
  USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));
