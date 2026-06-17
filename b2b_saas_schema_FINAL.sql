-- ============================================================
-- UniPath B2B SaaS - Final Database Schema
-- Supabase SQL Editor ga ko'chirib ishga tushiring
-- ============================================================

-- 1. Create tenants table (firmalar jadvali)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE,       -- e.g., 'firmA' -> firmA.unipath.uz
  custom_domain TEXT UNIQUE,   -- e.g., 'portal.firma.com'
  config JSONB DEFAULT '{}'::jsonb, -- features, branding, colors
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add tenant_id and role to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
-- Roles: super_admin | owner | manager | specialist | mentor | accountant | student

-- 3. Add tenant_id to applications table (if it exists)
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;

-- 4. Enable RLS on tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (to avoid duplication errors)
DROP POLICY IF EXISTS "Tenants viewable by members or super admins" ON public.tenants;
DROP POLICY IF EXISTS "Super admins can insert tenants" ON public.tenants;
DROP POLICY IF EXISTS "Super admins can update tenants" ON public.tenants;
DROP POLICY IF EXISTS "Profiles viewable by tenant users" ON public.profiles;

-- 5. RLS Policies for tenants
CREATE POLICY "Tenants viewable by members or super admins" 
ON public.tenants FOR SELECT 
USING (
  id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()) 
  OR 
  'super_admin' = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Super admins can insert tenants"
ON public.tenants FOR INSERT
WITH CHECK (
  'super_admin' = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Super admins can update tenants"
ON public.tenants FOR UPDATE
USING (
  'super_admin' = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

-- 6. RLS for Profiles (Isolating users by tenant)
CREATE POLICY "Profiles viewable by tenant users"
ON public.profiles FOR SELECT
USING (
  tenant_id = (SELECT tenant_id FROM public.profiles p2 WHERE p2.id = auth.uid())
  OR 
  'super_admin' = (SELECT role FROM public.profiles p2 WHERE p2.id = auth.uid())
  OR 
  id = auth.uid()
);

-- 7. Set Super Admin role (your email here)
UPDATE public.profiles 
SET role = 'super_admin' 
WHERE email = 'unipath.community@gmail.com';

-- ============================================================
-- TEKSHIRISH: Quyidagi qatorni ishga tushiring - rol to'g'ri o'rnatilganmi?
-- SELECT id, email, role FROM public.profiles WHERE email = 'unipath.community@gmail.com';
-- ============================================================
