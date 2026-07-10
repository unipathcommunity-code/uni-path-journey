-- Kindergarten vertical: real DB backing for enrolled children.
CREATE TABLE IF NOT EXISTS public.kindergarten_kids (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL DEFAULT current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  name           text NOT NULL,
  age            integer,
  group_name     text,
  parent_name    text,
  parent_phone   text,
  status         text NOT NULL DEFAULT 'present',   -- present | absent | sick
  payment_status text NOT NULL DEFAULT 'unpaid',    -- paid | unpaid
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kg_kids_tenant ON public.kindergarten_kids(tenant_id);
ALTER TABLE public.kindergarten_kids ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "kg_staff_all" ON public.kindergarten_kids;
CREATE POLICY "kg_staff_all" ON public.kindergarten_kids FOR ALL TO authenticated
  USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));
