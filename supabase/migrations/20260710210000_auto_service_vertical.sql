-- Auto-service vertical: real DB backing for service jobs.
CREATE TABLE IF NOT EXISTS public.auto_jobs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL DEFAULT current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  car_model         text NOT NULL,
  plate_number      text,
  customer_name     text,
  service_type      text,
  status            text NOT NULL DEFAULT 'pending',   -- pending | in_progress | completed
  price             numeric NOT NULL DEFAULT 0,
  assigned_mechanic text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_auto_jobs_tenant ON public.auto_jobs(tenant_id);
ALTER TABLE public.auto_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auto_staff_all" ON public.auto_jobs;
CREATE POLICY "auto_staff_all" ON public.auto_jobs FOR ALL TO authenticated
  USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));
