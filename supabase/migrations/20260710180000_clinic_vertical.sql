-- Clinic vertical: real DB backing for the patient/appointment queue.
-- tenant_id auto-fills via current_tenant_id() so inserts are always scoped (same pattern as NOVA).
CREATE TABLE IF NOT EXISTS public.clinic_appointments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL DEFAULT current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id        uuid,
  name             text NOT NULL,
  phone            text,
  age              integer,
  doctor_name      text,
  status           text NOT NULL DEFAULT 'scheduled',   -- scheduled | treating | completed | cancelled
  appointment_date date DEFAULT CURRENT_DATE,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_clinic_appts_tenant ON public.clinic_appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clinic_appts_date   ON public.clinic_appointments(appointment_date);

ALTER TABLE public.clinic_appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_staff_all" ON public.clinic_appointments;
CREATE POLICY "clinic_staff_all" ON public.clinic_appointments FOR ALL TO authenticated
  USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));
