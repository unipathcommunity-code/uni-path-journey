-- Create separate table for admin notes with admin-only access
CREATE TABLE public.application_admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(application_id)
);

-- Enable RLS
ALTER TABLE public.application_admin_notes ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can view all admin notes"
  ON public.application_admin_notes
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert admin notes"
  ON public.application_admin_notes
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update admin notes"
  ON public.application_admin_notes
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete admin notes"
  ON public.application_admin_notes
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Migrate existing admin_notes data
INSERT INTO public.application_admin_notes (application_id, notes)
SELECT id, admin_notes FROM public.applications WHERE admin_notes IS NOT NULL;

-- Drop the admin_notes column from applications table
ALTER TABLE public.applications DROP COLUMN admin_notes;

-- Add trigger for updated_at
CREATE TRIGGER update_application_admin_notes_updated_at
  BEFORE UPDATE ON public.application_admin_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();