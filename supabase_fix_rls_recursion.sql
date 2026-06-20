-- =====================================================================
-- UniPath: Fix Row Level Security (RLS) Infinite Recursion Loops
-- Run this in your Supabase Dashboard -> SQL Editor!
-- =====================================================================

-- 1. Create or Replace non-recursive helper functions in public schema
-- These query auth.users instead of public.profiles to prevent RLS recursion

CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text AS $$
  SELECT lower(COALESCE(
    NULLIF(current_setting('request.jwt.claims', true)::jsonb ->> 'email', ''),
    (SELECT email FROM auth.users WHERE id = auth.uid())
  ));
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role') = 'super_admin',
    (SELECT (raw_user_meta_data ->> 'role') = 'super_admin' FROM auth.users WHERE id = auth.uid())
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'tenant_id', '')::uuid,
    (SELECT (raw_user_meta_data ->> 'tenant_id')::uuid FROM auth.users WHERE id = auth.uid())
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.user_owns_tenant(tid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenants t
    WHERE t.id = tid
      AND t.owner_email IS NOT NULL
      AND lower(t.owner_email) = public.current_user_email()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- 2. Drop existing broken policies on public.tenants (to avoid conflicts)
DROP POLICY IF EXISTS "Tenants viewable by members or super admins" ON public.tenants;
DROP POLICY IF EXISTS "Super admins can insert tenants" ON public.tenants;
DROP POLICY IF EXISTS "Super admins can update tenants" ON public.tenants;
DROP POLICY IF EXISTS owner_select_tenants ON public.tenants;
DROP POLICY IF EXISTS owner_insert_tenants ON public.tenants;
DROP POLICY IF EXISTS owner_update_tenants ON public.tenants;


-- 3. Create corrected policies for public.tenants
-- Resolves the infinite recursion loops and fixes the subdomain check / registration wizard

-- SELECT: Allow members, super admins, or owners to view their tenants
CREATE POLICY "Tenants viewable by members or super admins" 
ON public.tenants FOR SELECT 
USING (
  id = public.current_tenant_id() 
  OR 
  public.is_super_admin()
);

CREATE POLICY owner_select_tenants ON public.tenants
  FOR SELECT TO authenticated
  USING (
    lower(owner_email) = public.current_user_email()
  );

-- SELECT: Critical for registration subdomain check (public lookup)
CREATE POLICY "Subdomains are publicly readable" ON public.tenants
  FOR SELECT
  USING (true);

-- INSERT: Self-service business registration (both guests and signed-in owners)
CREATE POLICY owner_insert_tenants ON public.tenants
  FOR INSERT TO authenticated, anon
  WITH CHECK (
    (auth.role() = 'authenticated' AND lower(owner_email) = public.current_user_email())
    OR
    (auth.role() = 'anon' AND status = 'pending')
  );

-- UPDATE: Owners and Super Admins can update their tenants
CREATE POLICY owner_update_tenants ON public.tenants
  FOR UPDATE TO authenticated
  USING (
    lower(owner_email) = public.current_user_email()
    OR
    public.is_super_admin()
  )
  WITH CHECK (
    lower(owner_email) = public.current_user_email()
    OR
    public.is_super_admin()
  );


-- 4. Clean up and recreate policies on public.profiles (to prevent recursion)
DROP POLICY IF EXISTS "Profiles viewable by tenant users" ON public.profiles;

CREATE POLICY "Profiles viewable by tenant users"
ON public.profiles FOR SELECT
USING (
  tenant_id = public.current_tenant_id()
  OR 
  public.is_super_admin()
  OR 
  user_id = auth.uid()
);


-- 5. Reload PostgREST Cache to apply settings instantly
NOTIFY pgrst, 'reload schema';
