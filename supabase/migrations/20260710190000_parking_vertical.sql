-- Parking vertical: real DB backing for parking sessions.
CREATE TABLE IF NOT EXISTS public.parking_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL DEFAULT current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id    uuid,
  plate_number text NOT NULL,
  slot_name    text,
  zone         text,
  status       text NOT NULL DEFAULT 'active',   -- active | completed
  started_at   timestamptz DEFAULT now(),
  ended_at     timestamptz,
  amount_due   numeric NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_parking_tenant ON public.parking_sessions(tenant_id);

ALTER TABLE public.parking_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parking_staff_all" ON public.parking_sessions;
CREATE POLICY "parking_staff_all" ON public.parking_sessions FOR ALL TO authenticated
  USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));
