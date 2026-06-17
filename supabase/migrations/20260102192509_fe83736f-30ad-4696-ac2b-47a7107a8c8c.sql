-- Fix 1: Profiles table - deny public/anonymous access
-- Drop the potentially vulnerable policy and create one that requires authentication
CREATE POLICY "Deny public access to profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix 2: System config - restrict to authenticated users only
DROP POLICY IF EXISTS "Anyone can view system config" ON public.system_config;

CREATE POLICY "Authenticated users can view system config" 
ON public.system_config 
FOR SELECT 
USING (auth.uid() IS NOT NULL);