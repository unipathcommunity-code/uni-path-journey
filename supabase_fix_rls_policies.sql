-- =====================================================================
-- UniPath Multi-Tenant: Fix Row Level Security (RLS) Policies
-- Run this in: Supabase Dashboard → SQL Editor
-- =====================================================================

-- 1. Drop existing broken policies on public.tenants
DROP POLICY IF EXISTS "Tenants viewable by members or super admins" ON public.tenants;
DROP POLICY IF EXISTS "Super admins can insert tenants" ON public.tenants;
DROP POLICY IF EXISTS "Super admins can update tenants" ON public.tenants;

-- 2. Create corrected policies on public.tenants (using user_id instead of id)
CREATE POLICY "Tenants viewable by members or super admins" 
ON public.tenants FOR SELECT 
USING (
  id = (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()) 
  OR 
  'super_admin' = (SELECT role FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Super admins can insert tenants"
ON public.tenants FOR INSERT
WITH CHECK (
  'super_admin' = (SELECT role FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Super admins can update tenants"
ON public.tenants FOR UPDATE
USING (
  'super_admin' = (SELECT role FROM public.profiles WHERE user_id = auth.uid())
);

-- 3. Drop existing broken policies on public.profiles
DROP POLICY IF EXISTS "Profiles viewable by tenant users" ON public.profiles;

-- 4. Create corrected policies on public.profiles (using user_id instead of id)
CREATE POLICY "Profiles viewable by tenant users"
ON public.profiles FOR SELECT
USING (
  tenant_id = (SELECT tenant_id FROM public.profiles p2 WHERE p2.user_id = auth.uid())
  OR 
  'super_admin' = (SELECT role FROM public.profiles p2 WHERE p2.user_id = auth.uid())
  OR 
  user_id = auth.uid()
);

-- 5. Reload PostgREST Schema Cache to ensure it is active
NOTIFY pgrst, 'reload schema';
