-- Fix the Security Definer View issue by adding security_invoker = true
DROP VIEW IF EXISTS public.universities_public;

CREATE VIEW public.universities_public 
WITH (security_invoker = true)
AS
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
FROM public.universities
WHERE is_active = true;

-- Grant access to the view for anon and authenticated users
GRANT SELECT ON public.universities_public TO anon, authenticated;