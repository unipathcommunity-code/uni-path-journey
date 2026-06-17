-- Create visa_applications table to track visa status
CREATE TABLE public.visa_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country text NOT NULL,
  status text NOT NULL DEFAULT 'not_started',
  admission_letter_received boolean DEFAULT false,
  documents_gathered boolean DEFAULT false,
  embassy_appointment_date timestamp with time zone,
  interview_completed boolean DEFAULT false,
  visa_received boolean DEFAULT false,
  visa_number text,
  visa_expiry_date date,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create visa_documents table for visa-specific document uploads
CREATE TABLE public.visa_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visa_application_id uuid REFERENCES public.visa_applications(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  status text NOT NULL DEFAULT 'pending',
  uploaded_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create expenses table for financial tracking
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  date date NOT NULL DEFAULT CURRENT_DATE,
  receipt_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visa_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visa_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for visa_applications
CREATE POLICY "Users can view own visa applications"
ON public.visa_applications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own visa applications"
ON public.visa_applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own visa applications"
ON public.visa_applications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own visa applications"
ON public.visa_applications FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all visa applications"
ON public.visa_applications FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for visa_documents
CREATE POLICY "Users can view own visa documents"
ON public.visa_documents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own visa documents"
ON public.visa_documents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own visa documents"
ON public.visa_documents FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own visa documents"
ON public.visa_documents FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all visa documents"
ON public.visa_documents FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for expenses
CREATE POLICY "Users can view own expenses"
ON public.expenses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own expenses"
ON public.expenses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
ON public.expenses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
ON public.expenses FOR DELETE
USING (auth.uid() = user_id);

-- Create visa-documents storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('visa-documents', 'visa-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for visa-documents bucket
CREATE POLICY "Users can view own visa documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'visa-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own visa documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'visa-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own visa documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'visa-documents' AND auth.uid()::text = (storage.foldername(name))[1]);