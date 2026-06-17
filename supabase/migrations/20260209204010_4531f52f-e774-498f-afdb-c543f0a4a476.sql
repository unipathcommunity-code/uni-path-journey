
-- Add application_fee and required_documents to universities
ALTER TABLE public.universities 
ADD COLUMN IF NOT EXISTS application_fee numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS required_documents text[] DEFAULT NULL;

-- Add visa/embassy website to countries
ALTER TABLE public.countries 
ADD COLUMN IF NOT EXISTS visa_website text DEFAULT NULL;
