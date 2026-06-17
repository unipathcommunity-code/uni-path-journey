-- ============================================================
-- UNI — GLOBAL BUSINESS OPERATING SYSTEM (ULTRA PRO MAX SCHEMA)
-- Professional, Scalable, Production-Ready, Database-Level Multi-Tenancy
-- ============================================================

-- 1. Helper Functions for Tenant Isolation and Security
-- Using JWT custom metadata for zero-latency tenant lookup (prevents recursion)
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'tenant_id', '')::uuid,
    (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role') = 'super_admin',
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'super_admin')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Core System Tables
-- Ensure Tenants table matches core specifications
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE,
  custom_domain TEXT UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended')),
  plan TEXT DEFAULT 'Starter' CHECK (plan IN ('Starter', 'Growth', 'Enterprise')),
  owner_name TEXT,
  owner_email TEXT,
  owner_phone TEXT,
  config JSONB DEFAULT '{}'::jsonb, -- modules, theme variables, currency, timezone
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Branches (Filiallar)
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  timezone TEXT DEFAULT 'Asia/Tashkent',
  currency TEXT DEFAULT 'UZS',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Roles and custom permissions
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  permissions JSONB DEFAULT '{}'::jsonb, -- module-level permissions
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tenant_id, name)
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Modify Profiles Table to support branches and roles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT now();

-- 4. Billing system triggers for hard ceiling limits
CREATE OR REPLACE FUNCTION public.check_tenant_limits()
RETURNS TRIGGER AS $$
DECLARE
  v_plan TEXT;
  v_count INTEGER;
  v_tenant_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'profiles' THEN
    v_tenant_id := NEW.tenant_id;
    IF v_tenant_id IS NULL OR NEW.role = 'student' OR NEW.role = 'super_admin' THEN
      RETURN NEW;
    END IF;
  ELSIF TG_TABLE_NAME = 'branches' THEN
    v_tenant_id := NEW.tenant_id;
  ELSE
    RETURN NEW;
  END IF;

  -- Fetch active tenant plan
  SELECT plan INTO v_plan FROM public.tenants WHERE id = v_tenant_id;
  IF v_plan IS NULL THEN
    v_plan := 'Starter';
  END IF;

  IF TG_TABLE_NAME = 'profiles' THEN
    -- Count current staff
    SELECT COUNT(*) INTO v_count FROM public.profiles 
    WHERE tenant_id = v_tenant_id AND role NOT IN ('student', 'super_admin');
    
    IF v_plan = 'Starter' AND v_count >= 3 THEN
      RAISE EXCEPTION 'Starter plan allows a maximum of 3 staff members. Please upgrade your subscription.';
    ELSIF v_plan = 'Growth' AND v_count >= 25 THEN
      RAISE EXCEPTION 'Growth plan allows a maximum of 25 staff members. Please upgrade your subscription.';
    END IF;
  ELSIF TG_TABLE_NAME = 'branches' THEN
    -- Count current branches
    SELECT COUNT(*) INTO v_count FROM public.branches WHERE tenant_id = v_tenant_id;
    
    IF v_plan = 'Starter' AND v_count >= 1 THEN
      RAISE EXCEPTION 'Starter plan allows a maximum of 1 branch. Please upgrade your subscription.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate triggers
DROP TRIGGER IF EXISTS trg_limit_profiles ON public.profiles;
CREATE TRIGGER trg_limit_profiles
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_tenant_limits();

DROP TRIGGER IF EXISTS trg_limit_branches ON public.branches;
CREATE TRIGGER trg_limit_branches
  BEFORE INSERT ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.check_tenant_limits();


-- 5. Modules Specific Tables

-- ACADEMY MODULE
CREATE TABLE IF NOT EXISTS public.academy_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  schedule JSONB DEFAULT '[]'::jsonb, -- days, times, classroom
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.academy_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  group_id UUID NOT NULL REFERENCES public.academy_groups(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'excused')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (group_id, student_id, date)
);

-- HOTEL MODULE
CREATE TABLE IF NOT EXISTS public.hotel_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  room_number TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('single', 'double', 'suite', 'deluxe')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'cleaning', 'maintenance')),
  price_per_night NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tenant_id, room_number)
);

CREATE TABLE IF NOT EXISTS public.hotel_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  room_id UUID NOT NULL REFERENCES public.hotel_rooms(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled')),
  total_amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- PHARMACY & INVENTORY MODULE
CREATE TABLE IF NOT EXISTS public.inventory_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  barcode TEXT,
  name TEXT NOT NULL,
  sku TEXT,
  stock_qty INTEGER DEFAULT 0,
  min_qty INTEGER DEFAULT 5,
  supplier_id UUID REFERENCES public.inventory_suppliers(id) ON DELETE SET NULL,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
  qty INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RESTAURANT MODULE
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  table_number TEXT NOT NULL,
  capacity INTEGER DEFAULT 2,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved')),
  qr_code_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tenant_id, table_number)
);

CREATE TABLE IF NOT EXISTS public.restaurant_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'kitchen', 'served', 'completed', 'cancelled')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb, -- dish details, quantity, price
  total_amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- GYM MODULE
CREATE TABLE IF NOT EXISTS public.gym_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'paused')),
  qr_code TEXT UNIQUE,
  face_id_token TEXT, -- Token reference for FaceID scanner
  expires_at DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gym_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  trainer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  activity TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- MANUFACTURING MODULE
CREATE TABLE IF NOT EXISTS public.mfg_boms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  product_id UUID, -- Finished product reference
  raw_materials JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{item_id: uuid, qty: number}]
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mfg_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mfg_piecework_salaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI OPERATIONAL SURVEILLANCE & CAMERA SYSTEM
CREATE TABLE IF NOT EXISTS public.camera_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  -- Plain camera URLs are security vulnerabilities. Encrypt them using a custom key or reference hashes.
  stream_url_encrypted TEXT NOT NULL, 
  auth_token_encrypted TEXT,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'reconnecting')),
  heartbeat_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.camera_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  device_id UUID REFERENCES public.camera_devices(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('face_recognition', 'uniform_violation', 'anpr_plate', 'unauthorized_entry')),
  payload JSONB DEFAULT '{}'::jsonb, -- recognition metadata, bounding box coordinates
  is_alert BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. ASYNC QUEUE & NOTIFICATION SYSTEM
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('telegram', 'sms', 'push', 'dashboard')),
  target TEXT NOT NULL, -- phone, chat_id, user_uuid
  payload JSONB NOT NULL DEFAULT '{}'::jsonb, -- title, message, url
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'dead_letter')),
  retry_count INTEGER DEFAULT 0,
  error_details TEXT,
  run_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);


-- ============================================================
-- 7. ROW LEVEL SECURITY (RLS) FOR ALL MODULES (TENANT ISOLATION)
-- ============================================================

-- Enable RLS
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfg_boms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfg_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfg_piecework_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.camera_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.camera_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- Helper to declare modular tenant-based policy for CRUD
-- We use a standardized dynamic tenant filtering mechanism

CREATE POLICY tenant_isolation_branches ON public.branches
  FOR ALL USING (tenant_id = public.current_tenant_id() OR public.is_super_admin());

CREATE POLICY tenant_isolation_roles ON public.roles
  FOR ALL USING (tenant_id = public.current_tenant_id() OR public.is_super_admin());

CREATE POLICY tenant_isolation_audit ON public.audit_logs
  FOR ALL USING (tenant_id = public.current_tenant_id() OR public.is_super_admin());

CREATE POLICY tenant_isolation_academy_g ON public.academy_groups
  FOR ALL USING (tenant_id = public.current_tenant_id() OR public.is_super_admin());

CREATE POLICY tenant_isolation_academy_a ON public.academy_attendance
  FOR ALL USING (tenant_id = public.current_tenant_id() OR public.is_super_admin());

CREATE POLICY tenant_isolation_hotel_r ON public.hotel_rooms
  FOR ALL USING (tenant_id = public.current_tenant_id() OR public.is_super_admin());

CREATE POLICY tenant_isolation_hotel_b ON public.hotel_bookings
  FOR ALL USING (tenant_id = public.current_tenant_id() OR public.is_super_admin());

CREATE POLICY tenant_isolation_inv_s ON public.inventory_suppliers
  FOR ALL USING (tenant_id = public.current_tenant_id() OR public.is_super_admin());

CREATE POLICY tenant_isolation_inv_i ON public.inventory_items
  FOR ALL USING (tenant_id = public.current_tenant_id() OR public.is_super_admin());

CREATE POLICY tenant_isolation_inv_m ON public.inventory_movements
  FOR ALL USING (tenant_id = public.current_tenant_id() OR public.is_super_admin());

CREATE POLICY tenant_isolation_rest_t ON public.restaurant_tables
  FOR ALL USING (tenant_id = public.current_tenant_id() OR public.is_super_admin());

CREATE POLICY tenant_isolation_rest_o ON public.restaurant_orders
  FOR ALL USING (tenant_id = public.current_tenant_id() OR public.is_super_admin());

CREATE POLICY tenant_isolation_gym_m ON public.gym_memberships
  FOR ALL USING (tenant_id = public.current_tenant_id() OR public.is_super_admin());

CREATE POLICY tenant_isolation_gym_s ON public.gym_schedules
  FOR ALL USING (tenant_id = public.current_tenant_id() OR public.is_super_admin());

CREATE POLICY tenant_isolation_mfg_b ON public.mfg_boms
  FOR ALL USING (tenant_id = public.current_tenant_id() OR public.is_super_admin());

CREATE POLICY tenant_isolation_mfg_s ON public.mfg_stages
  FOR ALL USING (tenant_id = public.current_tenant_id() OR public.is_super_admin());

CREATE POLICY tenant_isolation_mfg_p ON public.mfg_piecework_salaries
  FOR ALL USING (tenant_id = public.current_tenant_id() OR public.is_super_admin());

CREATE POLICY tenant_isolation_cam_d ON public.camera_devices
  FOR ALL USING (tenant_id = public.current_tenant_id() OR public.is_super_admin());

CREATE POLICY tenant_isolation_cam_e ON public.camera_events
  FOR ALL USING (tenant_id = public.current_tenant_id() OR public.is_super_admin());

CREATE POLICY tenant_isolation_notif_q ON public.notification_queue
  FOR ALL USING (tenant_id = public.current_tenant_id() OR public.is_super_admin());


-- ============================================================
-- 8. AUTO-ONBOARDING AND SETUP AUTOMATION
-- ============================================================

-- Function triggered on tenant request approval to automatically configure the environment
CREATE OR REPLACE FUNCTION public.auto_setup_tenant()
RETURNS TRIGGER AS $$
DECLARE
  v_branch_id UUID;
  v_role_admin_id UUID;
  v_role_staff_id UUID;
BEGIN
  -- We only setup when status transitions to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved' OR OLD.status IS NULL) THEN
    
    -- 1. Create Default Branch (Asosiy Filial)
    INSERT INTO public.branches (tenant_id, name, address)
    VALUES (NEW.id, 'Main Branch / Bosh Filial', 'Tashkent, Uzbekistan')
    RETURNING id INTO v_branch_id;

    -- 2. Create Default Roles & Permissions
    INSERT INTO public.roles (tenant_id, name, permissions)
    VALUES 
      (NEW.id, 'Owner', '{"all": true, "billing": true, "modules": ["*"]}'::jsonb),
      (NEW.id, 'Manager', '{"all": false, "billing": false, "modules": ["consulting", "academy"]}'::jsonb)
    RETURNING id INTO v_role_admin_id;

    -- 3. Set Default Theme configurations into Config JSONB if not present
    IF NOT (NEW.config ? 'branding') THEN
      NEW.config := jsonb_set(NEW.config, '{branding}', '{"theme_color": "emerald", "currency": "UZS"}'::jsonb);
    END IF;

    -- 4. Log creation in Audit Log
    INSERT INTO public.audit_logs (tenant_id, action, target_table, details)
    VALUES (NEW.id, 'TENANT_ONBOARDED', 'tenants', jsonb_build_object('tenant_name', NEW.name, 'branch_id', v_branch_id));

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_setup_tenant ON public.tenants;
CREATE TRIGGER trg_auto_setup_tenant
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.auto_setup_tenant();


-- ============================================================
-- 9. TRIGGER FOR AUDIT LOGGING ON CORE TRANSACTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_audit_action()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (tenant_id, user_id, action, target_table, target_id, details)
  VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object('record_type', TG_TABLE_NAME)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_hotel_bookings
  AFTER INSERT OR UPDATE OR DELETE ON public.hotel_bookings
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_action();

CREATE TRIGGER audit_inventory_movements
  AFTER INSERT ON public.inventory_movements
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_action();


-- ============================================================
-- 10. AUTH PROFILE CREATION TRIGGER FIX
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    email, 
    full_name, 
    tenant_id, 
    role
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    (NEW.raw_user_meta_data ->> 'tenant_id')::uuid,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'student')
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    tenant_id = COALESCE(EXCLUDED.tenant_id, profiles.tenant_id),
    role = COALESCE(EXCLUDED.role, profiles.role);
  RETURN NEW;
END;
$$;

