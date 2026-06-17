-- Create grants table for scholarship/grant programs
CREATE TABLE public.grants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_id UUID REFERENCES public.countries(id) ON DELETE CASCADE,
  university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL,
  
  -- Grant details
  name TEXT NOT NULL,
  name_uz TEXT,
  name_ru TEXT,
  description TEXT,
  description_uz TEXT,
  description_ru TEXT,
  
  -- Grant type: bachelor, master, phd, transfer
  grant_type TEXT NOT NULL DEFAULT 'bachelor',
  
  -- Coverage: full, partial, tuition_only, living_expenses
  coverage_type TEXT NOT NULL DEFAULT 'partial',
  coverage_amount TEXT, -- e.g., "100%", "$10,000/year", "Full tuition + stipend"
  
  -- Eligibility
  eligibility_criteria TEXT,
  eligibility_criteria_uz TEXT,
  eligibility_criteria_ru TEXT,
  
  -- Transfer specific fields
  is_transfer_program BOOLEAN DEFAULT false,
  transfer_from_year INTEGER, -- e.g., 2 means can transfer from 2nd year
  transfer_details TEXT,
  transfer_details_uz TEXT,
  transfer_details_ru TEXT,
  
  -- Application info
  application_deadline DATE,
  application_url TEXT,
  required_documents JSONB DEFAULT '[]'::jsonb,
  
  -- Additional info
  spots_available INTEGER,
  success_rate TEXT, -- e.g., "15%", "High", etc.
  
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.grants ENABLE ROW LEVEL SECURITY;

-- Anyone can view active grants
CREATE POLICY "Anyone can view active grants"
ON public.grants
FOR SELECT
USING (is_active = true);

-- Admins can manage grants
CREATE POLICY "Admins can manage grants"
ON public.grants
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_grants_updated_at
BEFORE UPDATE ON public.grants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();