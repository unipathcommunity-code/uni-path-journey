-- Car showroom (Avtosalon) vertical: real DB backing for the vehicle catalog.
CREATE TABLE IF NOT EXISTS public.showroom_cars (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL DEFAULT current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  brand            text NOT NULL,
  model            text NOT NULL,
  color            text,
  year             integer,
  price            numeric NOT NULL DEFAULT 0,
  engine           text,               -- Electro | Hybrid | Petrol
  battery_capacity text,
  range_km         integer,
  status           text NOT NULL DEFAULT 'available',   -- available | reserved | sold
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_showroom_cars_tenant ON public.showroom_cars(tenant_id);

ALTER TABLE public.showroom_cars ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "showroom_cars_staff" ON public.showroom_cars;
CREATE POLICY "showroom_cars_staff" ON public.showroom_cars FOR ALL TO authenticated
  USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));
