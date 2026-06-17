-- ============================================================
-- Phase 2 — Multi-business owner (one owner → many tenants)
-- ============================================================
-- Lets a signed-in user fully access EVERY tenant they own (matched by
-- tenants.owner_email == their auth email), so they can switch between their
-- businesses like branches. Frontend `active_tenant` only scopes the UI view;
-- this migration is what grants the underlying DB (RLS) access.
--
-- SAFE TO RE-RUN: every statement is idempotent (CREATE OR REPLACE / DROP IF
-- EXISTS). It is ADDITIVE — it never drops or rewrites existing tenant-isolation
-- or super-admin policies. New permissive policies combine with existing ones
-- via OR, so current behaviour is preserved and owner access is added on top.
--
-- Run in: Supabase → SQL Editor.
-- ============================================================

-- 1. Helpers ---------------------------------------------------------------

-- Current authenticated user's email (lowercased), from JWT or auth.users.
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text AS $$
  SELECT lower(COALESCE(
    NULLIF(current_setting('request.jwt.claims', true)::jsonb ->> 'email', ''),
    (SELECT email FROM auth.users WHERE id = auth.uid())
  ));
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- True when the signed-in user owns the given tenant (by owner_email).
CREATE OR REPLACE FUNCTION public.user_owns_tenant(tid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenants t
    WHERE t.id = tid
      AND t.owner_email IS NOT NULL
      AND lower(t.owner_email) = public.current_user_email()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. tenants table — owner SELECT / INSERT / UPDATE ------------------------
-- Additive: existing "members or super admins" policies remain in force.

DROP POLICY IF EXISTS owner_select_tenants ON public.tenants;
CREATE POLICY owner_select_tenants ON public.tenants
  FOR SELECT TO authenticated
  USING (public.user_owns_tenant(id));

-- Self-service business creation: any authenticated user may create a tenant
-- they own (owner_email must be their own email).
DROP POLICY IF EXISTS owner_insert_tenants ON public.tenants;
CREATE POLICY owner_insert_tenants ON public.tenants
  FOR INSERT TO authenticated
  WITH CHECK (lower(owner_email) = public.current_user_email());

DROP POLICY IF EXISTS owner_update_tenants ON public.tenants;
CREATE POLICY owner_update_tenants ON public.tenants
  FOR UPDATE TO authenticated
  USING (public.user_owns_tenant(id))
  WITH CHECK (public.user_owns_tenant(id));

-- 3. All tenant-scoped data tables — additive owner full access ------------
-- For every BASE TABLE in `public` that has a `tenant_id` column, add a single
-- permissive policy granting full access to the tenant's owner. We do NOT touch
-- RLS enablement: if a table already has RLS on, this OR-combines with its
-- existing tenant_isolation policy; if RLS is off, the policy is simply inert.

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema
     AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'tenant_id'
      AND t.table_type = 'BASE TABLE'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS owner_full_access ON public.%I', r.table_name
    );
    EXECUTE format(
      'CREATE POLICY owner_full_access ON public.%I '
      || 'FOR ALL TO authenticated '
      || 'USING (public.user_owns_tenant(tenant_id)) '
      || 'WITH CHECK (public.user_owns_tenant(tenant_id))',
      r.table_name
    );
  END LOOP;
END $$;

-- 4. Verification (run manually after the migration) -----------------------
-- a) Function exists:
--      SELECT public.user_owns_tenant('00000000-0000-0000-0000-000000000000');
-- b) Owner policies present on tenants:
--      SELECT polname FROM pg_policy WHERE polrelid = 'public.tenants'::regclass;
-- c) owner_full_access fanned out to every tenant-scoped table:
--      SELECT relname FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid
--      WHERE p.polname = 'owner_full_access' ORDER BY relname;
