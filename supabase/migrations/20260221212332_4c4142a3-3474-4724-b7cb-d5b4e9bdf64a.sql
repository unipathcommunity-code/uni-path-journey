
-- Add rich data columns to countries table
ALTER TABLE public.countries
ADD COLUMN IF NOT EXISTS visa_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS cost_of_living JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS education_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS key_requirements TEXT[] DEFAULT '{}';
