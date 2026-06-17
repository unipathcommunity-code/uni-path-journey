-- Fix 1: Create a public view for universities without sensitive contact info
CREATE OR REPLACE VIEW public.universities_public AS
SELECT 
  id,
  name,
  name_uz,
  name_ru,
  country,
  city,
  description,
  description_uz,
  description_ru,
  ranking,
  tuition_min,
  tuition_max,
  currency,
  scholarship_available,
  intake_spring,
  intake_fall,
  students_total,
  students_international,
  students_uzbek,
  students_local,
  programs,
  images,
  website,
  address,
  latitude,
  longitude,
  is_active,
  requirements,
  created_at,
  updated_at
  -- Excluding: contact_email (sensitive)
FROM public.universities
WHERE is_active = true;

-- Grant access to the view for anon and authenticated users
GRANT SELECT ON public.universities_public TO anon, authenticated;

-- Fix 2: Update universities RLS - remove public access policy and make it admin-only for full data
DROP POLICY IF EXISTS "Anyone can view active universities" ON public.universities;

-- Create new policy: Only authenticated users can view active universities (basic info still via view)
CREATE POLICY "Authenticated users can view active universities" 
ON public.universities 
FOR SELECT 
USING (
  is_active = true AND auth.uid() IS NOT NULL
);

-- Fix 3: Ensure profiles table has proper restrictive policies
-- First, drop the problematic deny policy that might be causing issues
DROP POLICY IF EXISTS "Deny public access to profiles" ON public.profiles;

-- Re-create as a proper restrictive policy for anonymous access
CREATE POLICY "Block anonymous access to profiles" 
ON public.profiles 
AS RESTRICTIVE
FOR ALL 
TO anon
USING (false)
WITH CHECK (false);

-- Ensure authenticated users can only access their own or authorized profiles
-- The existing policies should handle this, but let's verify by recreating them properly

-- Drop and recreate user policies to ensure they're permissive
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
AS PERMISSIVE
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles 
AS PERMISSIVE
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
AS PERMISSIVE
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Ensure admin and agent policies are permissive
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Agents can view assigned students profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
AS PERMISSIVE
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can view assigned students profiles" 
ON public.profiles 
AS PERMISSIVE
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agent_students
    WHERE agent_students.agent_id = auth.uid()
    AND agent_students.student_id = profiles.user_id
    AND agent_students.status = 'active'
  )
);