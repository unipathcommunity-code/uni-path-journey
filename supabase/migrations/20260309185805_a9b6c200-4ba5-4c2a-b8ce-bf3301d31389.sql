
-- Jobs table
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company_name text NOT NULL,
  country text NOT NULL,
  city text NOT NULL,
  university_id uuid REFERENCES public.universities(id) ON DELETE SET NULL,
  salary_min numeric,
  salary_max numeric,
  currency text DEFAULT 'USD',
  working_hours text,
  job_type text NOT NULL DEFAULT 'part-time',
  language_requirement text,
  required_documents text[],
  description text,
  employer_contact text,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Housing table
CREATE TABLE public.housing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  country text NOT NULL,
  city text NOT NULL,
  university_id uuid REFERENCES public.universities(id) ON DELETE SET NULL,
  price_per_month numeric NOT NULL,
  deposit numeric,
  currency text DEFAULT 'USD',
  distance_from_university text,
  room_type text NOT NULL DEFAULT 'shared',
  housing_type text NOT NULL DEFAULT 'apartment',
  has_internet boolean DEFAULT false,
  has_kitchen boolean DEFAULT false,
  has_bathroom boolean DEFAULT false,
  photos text[],
  contact_details text,
  description text,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Saved jobs table
CREATE TABLE public.saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_id)
);

-- Saved housing table
CREATE TABLE public.saved_housing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  housing_id uuid NOT NULL REFERENCES public.housing(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, housing_id)
);

-- RLS for jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active jobs" ON public.jobs
  FOR SELECT TO public
  USING (is_active = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage jobs" ON public.jobs
  FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS for housing
ALTER TABLE public.housing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active housing" ON public.housing
  FOR SELECT TO public
  USING (is_active = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage housing" ON public.housing
  FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS for saved_jobs
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved jobs" ON public.saved_jobs
  FOR SELECT TO public USING (auth.uid() = user_id);

CREATE POLICY "Users can save jobs" ON public.saved_jobs
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave jobs" ON public.saved_jobs
  FOR DELETE TO public USING (auth.uid() = user_id);

-- RLS for saved_housing
ALTER TABLE public.saved_housing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved housing" ON public.saved_housing
  FOR SELECT TO public USING (auth.uid() = user_id);

CREATE POLICY "Users can save housing" ON public.saved_housing
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave housing" ON public.saved_housing
  FOR DELETE TO public USING (auth.uid() = user_id);

-- Updated_at triggers
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_housing_updated_at BEFORE UPDATE ON public.housing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
