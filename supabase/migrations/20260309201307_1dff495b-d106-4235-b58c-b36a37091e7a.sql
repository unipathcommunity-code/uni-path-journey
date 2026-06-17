
-- Table for admin to manually override feature locks per student
CREATE TABLE public.student_feature_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feature_key text NOT NULL,
  is_unlocked boolean NOT NULL DEFAULT false,
  overridden_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, feature_key)
);

-- Enable RLS
ALTER TABLE public.student_feature_overrides ENABLE ROW LEVEL SECURITY;

-- Admin can manage all overrides
CREATE POLICY "Admins can manage feature overrides"
ON public.student_feature_overrides
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Students can read their own overrides
CREATE POLICY "Users can view own feature overrides"
ON public.student_feature_overrides
FOR SELECT
USING (auth.uid() = user_id);

-- Deny anonymous
CREATE POLICY "Deny anon access to feature overrides"
ON public.student_feature_overrides
FOR ALL
TO anon
USING (false)
WITH CHECK (false);
