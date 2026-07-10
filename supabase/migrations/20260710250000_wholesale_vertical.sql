-- Wholesale (Optom) vertical: real DB backing for partner clients + bulk orders.
CREATE TABLE IF NOT EXISTS public.wholesale_clients (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL DEFAULT current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  name        text NOT NULL,
  phone       text,
  tier        text NOT NULL DEFAULT 'silver',   -- silver | gold | platinum
  total_spent numeric NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wholesale_clients_tenant ON public.wholesale_clients(tenant_id);

CREATE TABLE IF NOT EXISTS public.wholesale_orders (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL DEFAULT current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_name   text NOT NULL,
  items_summary text,
  total_amount  numeric NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'pending',   -- pending | shipping | delivered | cancelled
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wholesale_orders_tenant ON public.wholesale_orders(tenant_id);

ALTER TABLE public.wholesale_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wholesale_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wholesale_clients_staff" ON public.wholesale_clients;
CREATE POLICY "wholesale_clients_staff" ON public.wholesale_clients FOR ALL TO authenticated
  USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));
DROP POLICY IF EXISTS "wholesale_orders_staff" ON public.wholesale_orders;
CREATE POLICY "wholesale_orders_staff" ON public.wholesale_orders FOR ALL TO authenticated
  USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));
