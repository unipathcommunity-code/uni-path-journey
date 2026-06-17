
-- Mentors table
CREATE TABLE public.mentors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  name_uz TEXT,
  name_ru TEXT,
  bio TEXT,
  bio_uz TEXT,
  bio_ru TEXT,
  university_graduated TEXT,
  country_expertise TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  telegram_username TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  call_cost_credits INTEGER DEFAULT 5,
  total_calls INTEGER DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 5.0,
  can_review_documents BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mentor booking sessions
CREATE TABLE public.mentor_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  credits_spent INTEGER NOT NULL DEFAULT 5,
  scheduled_at TIMESTAMPTZ,
  notes TEXT,
  student_rating INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add platform margin to countries
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS platform_margin_percent INTEGER DEFAULT 30;

-- Enable RLS
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_bookings ENABLE ROW LEVEL SECURITY;

-- Mentors policies
CREATE POLICY "Anyone authenticated can view active mentors" ON public.mentors FOR SELECT USING (is_active = true AND auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage mentors" ON public.mentors FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Mentor bookings policies
CREATE POLICY "Students can view own bookings" ON public.mentor_bookings FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can create bookings" ON public.mentor_bookings FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update own bookings" ON public.mentor_bookings FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Admins can manage all bookings" ON public.mentor_bookings FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Mentors can view their bookings" ON public.mentor_bookings FOR SELECT USING (EXISTS (SELECT 1 FROM public.mentors WHERE mentors.id = mentor_bookings.mentor_id AND mentors.user_id = auth.uid()));
