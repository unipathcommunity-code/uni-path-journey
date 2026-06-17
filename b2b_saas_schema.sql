-- 1. Create tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE, -- e.g., 'firmA.unipath.uz'
  custom_domain TEXT UNIQUE, -- e.g., 'portal.firma.com'
  config JSONB DEFAULT '{}'::jsonb, -- branding, colors, logos
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add tenant_id and role to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student'; -- super_admin, owner, manager, specialist, mentor, student

-- 3. Add tenant_id to other main tables
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;

-- Assuming there is a payments or orders table based on the CRM spec
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;

-- 4. Enable RLS on tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants are viewable by users who belong to them or super admins" 
ON public.tenants FOR SELECT 
USING (
  id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()) 
  OR 
  'super_admin' = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

-- 5. RLS for Profiles (Isolating users by tenant)
-- Users can see profiles in their own tenant, or super_admin can see all
CREATE POLICY "Profiles viewable by tenant users"
ON public.profiles FOR SELECT
USING (
  tenant_id = (SELECT tenant_id FROM public.profiles p2 WHERE p2.id = auth.uid())
  OR 
  'super_admin' = (SELECT role FROM public.profiles p2 WHERE p2.id = auth.uid())
  OR 
  id = auth.uid() -- Can always see themselves
);

-- 6. RLS for Applications
CREATE POLICY "Applications viewable by tenant users"
ON public.applications FOR SELECT
USING (
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  OR 
  'super_admin' = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

-- Set Super Admin manually (since the script couldn't do it via client without RLS bypassing)
-- Update the user you just created to be super_admin:
UPDATE public.profiles 
SET role = 'super_admin' 
WHERE email = 'unipath.community@gmail.com';
