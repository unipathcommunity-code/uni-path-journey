-- Migration: 20260629120000_restaurant_vertical.sql
-- Description: Full operational restaurant/cafe vertical — menu catalog, tables (QR),
--              orders (POS), normalized order items (KDS), with multi-tenant RLS.
-- Idempotent: uses IF NOT EXISTS / DROP POLICY IF EXISTS so it is safe to re-run and
-- safe even if a partial restaurant_tables/restaurant_orders table already exists in prod.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. MENU CATEGORIES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.restaurant_menu_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id   uuid,
  name        text NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. MENU ITEMS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.restaurant_menu_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id    uuid,
  category_id  uuid REFERENCES public.restaurant_menu_categories(id) ON DELETE SET NULL,
  name         text NOT NULL,
  description  text,
  price        numeric NOT NULL DEFAULT 0,
  image_url    text,
  modifiers    jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order   integer NOT NULL DEFAULT 0,
  is_active    boolean NOT NULL DEFAULT true,
  is_available boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rest_menu_items_tenant ON public.restaurant_menu_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rest_menu_items_category ON public.restaurant_menu_items(category_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. TABLES (with QR token)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id     uuid,
  table_number  text NOT NULL,
  capacity      integer NOT NULL DEFAULT 4,
  zone          text,
  status        text NOT NULL DEFAULT 'available',
  qr_token      text DEFAULT gen_random_uuid()::text,
  qr_code_url   text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
-- Guard columns in case a legacy table already exists
ALTER TABLE public.restaurant_tables ADD COLUMN IF NOT EXISTS zone text;
ALTER TABLE public.restaurant_tables ADD COLUMN IF NOT EXISTS qr_token text DEFAULT gen_random_uuid()::text;
ALTER TABLE public.restaurant_tables ADD COLUMN IF NOT EXISTS branch_id uuid;
CREATE INDEX IF NOT EXISTS idx_rest_tables_tenant ON public.restaurant_tables(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rest_tables_qr ON public.restaurant_tables(qr_token);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ORDERS (checks / receipts)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.restaurant_orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id       uuid,
  table_id        uuid REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
  order_type      text NOT NULL DEFAULT 'dine_in',   -- dine_in | takeaway | delivery
  status          text NOT NULL DEFAULT 'new',        -- new | kitchen | served | paid | cancelled
  source          text NOT NULL DEFAULT 'admin',      -- admin | qr | online
  customer_name   text,
  customer_phone  text,
  subtotal        numeric NOT NULL DEFAULT 0,
  service_fee     numeric NOT NULL DEFAULT 0,
  discount        numeric NOT NULL DEFAULT 0,
  total           numeric NOT NULL DEFAULT 0,
  payment_method  text,                                -- cash | card | click | payme
  paid_at         timestamptz,
  note            text,
  -- legacy columns kept for backward-compat with the old single-page dashboard
  items           jsonb,
  total_amount    numeric,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
-- Guard columns in case a legacy table already exists
ALTER TABLE public.restaurant_orders ADD COLUMN IF NOT EXISTS branch_id uuid;
ALTER TABLE public.restaurant_orders ADD COLUMN IF NOT EXISTS order_type text NOT NULL DEFAULT 'dine_in';
ALTER TABLE public.restaurant_orders ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'admin';
ALTER TABLE public.restaurant_orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.restaurant_orders ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE public.restaurant_orders ADD COLUMN IF NOT EXISTS subtotal numeric NOT NULL DEFAULT 0;
ALTER TABLE public.restaurant_orders ADD COLUMN IF NOT EXISTS service_fee numeric NOT NULL DEFAULT 0;
ALTER TABLE public.restaurant_orders ADD COLUMN IF NOT EXISTS discount numeric NOT NULL DEFAULT 0;
ALTER TABLE public.restaurant_orders ADD COLUMN IF NOT EXISTS total numeric NOT NULL DEFAULT 0;
ALTER TABLE public.restaurant_orders ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.restaurant_orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE public.restaurant_orders ADD COLUMN IF NOT EXISTS note text;
CREATE INDEX IF NOT EXISTS idx_rest_orders_tenant ON public.restaurant_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rest_orders_status ON public.restaurant_orders(status);
CREATE INDEX IF NOT EXISTS idx_rest_orders_created ON public.restaurant_orders(created_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ORDER ITEMS (normalized — for KDS + reporting)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.restaurant_order_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id      uuid NOT NULL REFERENCES public.restaurant_orders(id) ON DELETE CASCADE,
  menu_item_id  uuid REFERENCES public.restaurant_menu_items(id) ON DELETE SET NULL,
  name          text NOT NULL,
  qty           integer NOT NULL DEFAULT 1,
  price         numeric NOT NULL DEFAULT 0,
  modifiers     jsonb NOT NULL DEFAULT '[]'::jsonb,
  status        text NOT NULL DEFAULT 'new',  -- new | ready | served
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rest_order_items_order ON public.restaurant_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_rest_order_items_tenant ON public.restaurant_order_items(tenant_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.restaurant_menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_menu_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_order_items     ENABLE ROW LEVEL SECURITY;

-- Staff role set helper expression: get_auth_user_role() already exists in the DB.
-- Management/cashier roles that may operate the restaurant.

-- ── MENU CATEGORIES ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "rest_cat_public_select" ON public.restaurant_menu_categories;
CREATE POLICY "rest_cat_public_select" ON public.restaurant_menu_categories
  FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "rest_cat_staff_all" ON public.restaurant_menu_categories;
CREATE POLICY "rest_cat_staff_all" ON public.restaurant_menu_categories
  FOR ALL USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));

-- ── MENU ITEMS ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "rest_item_public_select" ON public.restaurant_menu_items;
CREATE POLICY "rest_item_public_select" ON public.restaurant_menu_items
  FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "rest_item_staff_all" ON public.restaurant_menu_items;
CREATE POLICY "rest_item_staff_all" ON public.restaurant_menu_items
  FOR ALL USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));

-- ── TABLES ───────────────────────────────────────────────────────────────────
-- Public can read tables (needed to resolve a QR token → table on the public menu page)
DROP POLICY IF EXISTS "rest_table_public_select" ON public.restaurant_tables;
CREATE POLICY "rest_table_public_select" ON public.restaurant_tables
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "rest_table_staff_all" ON public.restaurant_tables;
CREATE POLICY "rest_table_staff_all" ON public.restaurant_tables
  FOR ALL USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));

-- ── ORDERS ───────────────────────────────────────────────────────────────────
-- Staff full access
DROP POLICY IF EXISTS "rest_order_staff_all" ON public.restaurant_orders;
CREATE POLICY "rest_order_staff_all" ON public.restaurant_orders
  FOR ALL USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));
-- Public/anon may CREATE an order (QR self-order or online order), but only as qr/online source
DROP POLICY IF EXISTS "rest_order_public_insert" ON public.restaurant_orders;
CREATE POLICY "rest_order_public_insert" ON public.restaurant_orders
  FOR INSERT WITH CHECK (source IN ('qr','online'));

-- ── ORDER ITEMS ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "rest_oitem_staff_all" ON public.restaurant_order_items;
CREATE POLICY "rest_oitem_staff_all" ON public.restaurant_order_items
  FOR ALL USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));
-- Public/anon may insert items that belong to a qr/online order they just created
DROP POLICY IF EXISTS "rest_oitem_public_insert" ON public.restaurant_order_items;
CREATE POLICY "rest_oitem_public_insert" ON public.restaurant_order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.restaurant_orders o
      WHERE o.id = restaurant_order_items.order_id
        AND o.source IN ('qr','online')
    )
  );
