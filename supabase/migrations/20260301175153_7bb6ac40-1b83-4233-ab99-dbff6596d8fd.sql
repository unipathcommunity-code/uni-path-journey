-- Add acceptance_letter_url column to applications table
ALTER TABLE public.applications ADD COLUMN acceptance_letter_url text;
