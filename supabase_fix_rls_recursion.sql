-- =====================================================================
-- UniPath: Fix Row Level Security (RLS) Infinite Recursion Loops
-- Run this in your Supabase Dashboard -> SQL Editor!
-- =====================================================================

-- 1. Drop existing broken policies that cause recursion loops
DROP POLICY IF EXISTS "Tenants viewable by members or super admins" ON public.tenants;
DROP POLICY IF EXISTS "Super admins can insert tenants" ON public.tenants;
DROP POLICY IF EXISTS "Super admins can update tenants" ON public.tenants;
DROP POLICY IF EXISTS "Profiles viewable by tenant users" ON public.profiles;

-- 2. Drop recursive owner policies on public.tenants (Phase 2 Multi-business)
DROP POLICY IF EXISTS owner_select_tenants ON public.tenants;
DROP POLICY IF EXISTS owner_update_tenants ON public.tenants;

-- 3. Create corrected policies for public.tenants using security definer helpers (prevents recursion)
CREATE POLICY "Tenants viewable by members or super admins" 
ON public.tenants FOR SELECT 
USING (
  id = public.current_tenant_id() 
  OR 
  public.is_super_admin()
);

CREATE POLICY "Super admins can insert tenants"
ON public.tenants FOR INSERT
WITH CHECK (
  public.is_super_admin()
);

CREATE POLICY "Super admins can update tenants"
ON public.tenants FOR UPDATE
USING (
  public.is_super_admin()
);

-- 4. Re-create owner policies with direct, non-recursive, high-performance checks
CREATE POLICY owner_select_tenants ON public.tenants
  FOR SELECT TO authenticated
  USING (
    lower(owner_email) = public.current_user_email()
  );

CREATE POLICY owner_update_tenants ON public.tenants
  FOR UPDATE TO authenticated
  USING (
    lower(owner_email) = public.current_user_email()
  )
  WITH CHECK (
    lower(owner_email) = public.current_user_email()
  );

-- 5. Create corrected policies for public.profiles (prevents recursion)
CREATE POLICY "Profiles viewable by tenant users"
ON public.profiles FOR SELECT
USING (
  tenant_id = public.current_tenant_id()
  OR 
  public.is_super_admin()
  OR 
  user_id = auth.uid()
);

-- 6. Reload PostgREST Cache to apply settings instantly
NOTIFY pgrst, 'reload schema';
