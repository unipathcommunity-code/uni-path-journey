-- Add admin SELECT policy for profiles table
-- This enables admins to view all student profiles for the AdminStudents page

CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));