-- Cosmetics vertical: real DB backing (inventory + sales).
CREATE TABLE IF NOT EXISTS public.cosmetics_products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL DEFAULT current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  name        text NOT NULL,
  brand       text,
  category    text,
  price       numeric NOT NULL DEFAULT 0,
  stock       integer NOT NULL DEFAULT 0,
  expiry_date date,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cosmetics_products_tenant ON public.cosmetics_products(tenant_id);

CREATE TABLE IF NOT EXISTS public.cosmetics_sales (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL DEFAULT current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  quantity     integer NOT NULL DEFAULT 1,
  total_price  numeric NOT NULL DEFAULT 0,
  sale_date    date DEFAULT CURRENT_DATE,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cosmetics_sales_tenant ON public.cosmetics_sales(tenant_id);

ALTER TABLE public.cosmetics_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cosmetics_sales    ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cosm_prod_staff" ON public.cosmetics_products;
CREATE POLICY "cosm_prod_staff" ON public.cosmetics_products FOR ALL TO authenticated
  USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));
DROP POLICY IF EXISTS "cosm_sale_staff" ON public.cosmetics_sales;
CREATE POLICY "cosm_sale_staff" ON public.cosmetics_sales FOR ALL TO authenticated
  USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));
