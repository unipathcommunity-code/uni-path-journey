-- Add student count fields to universities table
ALTER TABLE public.universities 
ADD COLUMN IF NOT EXISTS students_uzbek integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS students_local integer DEFAULT 0;

-- Update existing universities with sample data
UPDATE public.universities SET 
  students_total = COALESCE(students_total, 28000),
  students_international = COALESCE(students_international, 3500),
  students_uzbek = 120,
  students_local = 24000
WHERE name = 'Seoul National University';

UPDATE public.universities SET 
  students_total = COALESCE(students_total, 10000),
  students_international = COALESCE(students_international, 1800),
  students_uzbek = 45,
  students_local = 8000
WHERE name = 'KAIST';

UPDATE public.universities SET 
  students_total = COALESCE(students_total, 32000),
  students_international = COALESCE(students_international, 4200),
  students_uzbek = 156,
  students_local = 27000
WHERE name = 'Yonsei University';