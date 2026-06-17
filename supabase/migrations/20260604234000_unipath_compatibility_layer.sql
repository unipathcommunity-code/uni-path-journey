-- ============================================================
-- UniPath Compatibility & Database Support Layer
-- ============================================================

-- 1. Create schemas for verticals if they do not exist
CREATE SCHEMA IF NOT EXISTS nova;
CREATE SCHEMA IF NOT EXISTS tour;

-- Helper function to drop relation (table/view/mview) safely without type conflicts
CREATE OR REPLACE FUNCTION public.safe_drop_relation(p_schema TEXT, p_relation TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_relkind CHAR;
BEGIN
  SELECT c.relkind INTO v_relkind
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = p_schema AND c.relname = p_relation;

  IF v_relkind IS NULL THEN
    RETURN;
  END IF;

  IF v_relkind = 'r' THEN
    EXECUTE format('DROP TABLE %I.%I CASCADE', p_schema, p_relation);
  ELSIF v_relkind = 'v' THEN
    EXECUTE format('DROP VIEW %I.%I CASCADE', p_schema, p_relation);
  ELSIF v_relkind = 'm' THEN
    EXECUTE format('DROP MATERIALIZED VIEW %I.%I CASCADE', p_schema, p_relation);
  ELSE
    EXECUTE format('DROP TABLE IF EXISTS %I.%I CASCADE', p_schema, p_relation);
  END IF;
END;
$$;

-- Run safe drops for all target compatibility relations
SELECT public.safe_drop_relation('public', 'user_roles');
SELECT public.safe_drop_relation('nova', 'organizations');
SELECT public.safe_drop_relation('nova', 'leads');
SELECT public.safe_drop_relation('nova', 'payments');
SELECT public.safe_drop_relation('nova', 'lessons');
SELECT public.safe_drop_relation('nova', 'attendance');
SELECT public.safe_drop_relation('nova', 'profiles');
SELECT public.safe_drop_relation('nova', 'user_roles');
SELECT public.safe_drop_relation('tour', 'profiles');
SELECT public.safe_drop_relation('tour', 'user_roles');

-- Clean up the helper function
DROP FUNCTION IF EXISTS public.safe_drop_relation(TEXT, TEXT);

-- 2. Create missing tables in public schema (if not exist)
-- Table: public.leads
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name TEXT NOT NULL,
  org_type TEXT DEFAULT 'center',
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  city TEXT,
  expected_students INTEGER,
  message TEXT,
  source TEXT,
  stage TEXT DEFAULT 'new',
  notes TEXT,
  created_org_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: public.payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  status TEXT DEFAULT 'pending',
  currency TEXT DEFAULT 'UZS',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: public.lessons
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: public.attendance (simple fallback)
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create public.user_roles backward compatibility view
-- Bridges profiles.role to user_roles table format expected by frontend
CREATE OR REPLACE VIEW public.user_roles AS
SELECT 
  id AS id,
  user_id AS user_id,
  tenant_id AS organization_id,
  role AS role
FROM public.profiles;


-- 4. Create public.bootstrap_current_user() RPC function
-- Essential for UniTour login/initialization
CREATE OR REPLACE FUNCTION public.bootstrap_current_user()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_full_name TEXT;
  v_role TEXT;
  v_tenant_id UUID;
  v_profile RECORD;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get user info from auth.users
  SELECT email, raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'role'
  INTO v_email, v_full_name, v_role
  FROM auth.users
  WHERE id = v_user_id;

  -- If it's a super admin email, force role to super_admin
  IF v_email = 'unipath.community@gmail.com' THEN
    v_role := 'super_admin';
  END IF;

  -- Default role to student/user if not specified
  IF v_role IS NULL THEN
    v_role := 'student';
  END IF;

  -- Check if profile already exists
  SELECT * INTO v_profile FROM public.profiles WHERE user_id = v_user_id;

  IF v_profile.id IS NULL THEN
    -- Get first tenant as default if none associated (just to bootstrap)
    SELECT id INTO v_tenant_id FROM public.tenants LIMIT 1;

    INSERT INTO public.profiles (user_id, email, full_name, role, tenant_id)
    VALUES (v_user_id, v_email, COALESCE(v_full_name, v_email), v_role, v_tenant_id)
    RETURNING * INTO v_profile;
  ELSE
    -- Ensure role is synced (especially for super admin)
    IF v_profile.role IS DISTINCT FROM v_role THEN
      UPDATE public.profiles
      SET role = v_role, updated_at = now()
      WHERE user_id = v_user_id
      RETURNING * INTO v_profile;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'profile', row_to_json(v_profile)
  );
END;
$$;

-- 5. Create compatibility views inside 'nova' schema
CREATE OR REPLACE VIEW nova.organizations AS
SELECT 
  id,
  name,
  subdomain AS slug,
  COALESCE(config->>'business_type', 'center') AS org_type,
  status,
  COALESCE(config->>'plan', plan, 'basic') AS billing_tier,
  config->'branding'->>'logo_url' AS logo_url,
  COALESCE(config->'branding'->>'theme_color', 'emerald') AS primary_color,
  COALESCE(config->'branding'->>'accent_color', 'indigo') AS accent_color,
  owner_email AS contact_email,
  owner_phone AS contact_phone,
  config->'settings'->>'city' AS city,
  config->'settings'->>'notes' AS notes,
  COALESCE(config->'features', '{}'::jsonb) AS features,
  (config->'settings'->>'monthly_price')::numeric AS monthly_price,
  COALESCE(config->'settings'->>'currency', 'UZS') AS currency,
  (config->'settings'->>'max_students')::integer AS max_students,
  config->'settings'->>'trial_ends_at' AS trial_ends_at,
  created_at
FROM public.tenants;

CREATE OR REPLACE VIEW nova.leads AS SELECT * FROM public.leads;
CREATE OR REPLACE VIEW nova.payments AS SELECT * FROM public.payments;
CREATE OR REPLACE VIEW nova.lessons AS SELECT * FROM public.lessons;
CREATE OR REPLACE VIEW nova.attendance AS SELECT * FROM public.attendance;

CREATE OR REPLACE VIEW nova.profiles AS
SELECT 
  id,
  user_id,
  tenant_id AS organization_id,
  full_name,
  created_at
FROM public.profiles;

CREATE OR REPLACE VIEW nova.user_roles AS
SELECT 
  id,
  tenant_id AS organization_id,
  role,
  user_id
FROM public.profiles;

-- 6. Create compatibility views inside 'tour' schema
CREATE OR REPLACE VIEW tour.profiles AS
SELECT 
  id,
  user_id,
  tenant_id AS organization_id,
  full_name,
  created_at
FROM public.profiles;

CREATE OR REPLACE VIEW tour.user_roles AS
SELECT 
  id,
  tenant_id AS organization_id,
  role,
  user_id
FROM public.profiles;
