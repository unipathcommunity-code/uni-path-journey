-- Fix: System Configuration should only be readable by admins
-- Drop the overly permissive policy that allows all authenticated users to view
DROP POLICY IF EXISTS "Authenticated users can view system config" ON public.system_config;
DROP POLICY IF EXISTS "Anyone can view system config" ON public.system_config;

-- Create a more restrictive policy - only admins can view system config
CREATE POLICY "Only admins can view system config"
ON public.system_config FOR SELECT
USING (has_role(auth.uid(), 'admin'));