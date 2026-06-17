-- ============================================================
-- UniPath Full Database Schema (Bundled)
-- Created: 2026-05-18T14:57:19.183Z
-- ============================================================

-- ------------------------------------------------------------
-- Migration: 20251213203816_d4dc1fd1-9d5c-4b87-abd3-6c1fc673c6d3.sql
-- ------------------------------------------------------------

-- Create profiles table for users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'uz' CHECK (preferred_language IN ('uz', 'en', 'ru')),
  selected_country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create universities table
CREATE TABLE public.universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_uz TEXT,
  name_ru TEXT,
  country TEXT NOT NULL,
  city TEXT,
  description TEXT,
  description_uz TEXT,
  description_ru TEXT,
  ranking INT,
  tuition_min INT,
  tuition_max INT,
  currency TEXT DEFAULT 'USD',
  scholarship_available BOOLEAN DEFAULT false,
  intake_spring BOOLEAN DEFAULT true,
  intake_fall BOOLEAN DEFAULT true,
  students_total INT,
  students_international INT,
  programs TEXT[],
  requirements JSONB,
  images TEXT[],
  website TEXT,
  contact_email TEXT,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for universities (public read)
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view universities" ON public.universities
  FOR SELECT USING (is_active = true);

-- Create applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'accepted', 'rejected', 'cancelled')),
  program TEXT,
  intake TEXT,
  documents JSONB DEFAULT '{}',
  application_fee DECIMAL(10, 2),
  fee_paid BOOLEAN DEFAULT false,
  admin_notes TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for applications
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications" ON public.applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own applications" ON public.applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications" ON public.applications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger for auto profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_universities_updated_at
  BEFORE UPDATE ON public.universities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------
-- Migration: 20251214170527_0e468dc9-a08e-44dc-8df0-04047b5a79a8.sql
-- ------------------------------------------------------------

-- Create enum for application roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table (separate from profiles to prevent privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles table
-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Only admins can manage roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add admin policies to universities table for management
CREATE POLICY "Admins can insert universities"
ON public.universities
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update universities"
ON public.universities
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete universities"
ON public.universities
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Add admin policy for viewing all applications (including admin_notes)
CREATE POLICY "Admins can view all applications"
ON public.applications
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all applications"
ON public.applications
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- ------------------------------------------------------------
-- Migration: 20251214172901_e85b6df4-034f-43dd-90f3-02a73646a9c1.sql
-- ------------------------------------------------------------

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

-- ------------------------------------------------------------
-- Migration: 20251215202242_0958e5a6-c365-42d2-bbba-385db93b920e.sql
-- ------------------------------------------------------------

-- Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Create storage bucket for student documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- RLS policies for avatars bucket (public read, authenticated upload own)
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS policies for documents bucket (users can access own, admins can access all)
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ------------------------------------------------------------
-- Migration: 20251215204842_946b3688-7e13-4490-a7b8-bd81920594b2.sql
-- ------------------------------------------------------------

-- Create documents table for tracking individual document uploads with status
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Users can view their own documents
CREATE POLICY "Users can view own documents"
ON public.documents FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own documents
CREATE POLICY "Users can insert own documents"
ON public.documents FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own documents
CREATE POLICY "Users can update own documents"
ON public.documents FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents"
ON public.documents FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all documents
CREATE POLICY "Admins can view all documents"
ON public.documents FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update all documents (for status changes)
CREATE POLICY "Admins can update all documents"
ON public.documents FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------
-- Migration: 20251215205527_54fb0ebd-1aa9-4816-9492-9a6f44a497b5.sql
-- ------------------------------------------------------------

-- Enable realtime for documents table
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;

-- ------------------------------------------------------------
-- Migration: 20251215211902_d44310dc-6f54-474b-8388-53f614a21644.sql
-- ------------------------------------------------------------

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can insert notifications for any user
CREATE POLICY "Admins can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- System can insert notifications (for triggers)
CREATE POLICY "System insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to notify on document status change
CREATE OR REPLACE FUNCTION public.notify_document_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Document Approved'
        WHEN NEW.status = 'rejected' THEN 'Document Rejected'
        ELSE 'Document Status Updated'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Your ' || NEW.document_type || ' has been approved.'
        WHEN NEW.status = 'rejected' THEN 'Your ' || NEW.document_type || ' was rejected. ' || COALESCE('Reason: ' || NEW.rejection_reason, 'Please check and re-upload.')
        ELSE 'Your ' || NEW.document_type || ' status has been updated to ' || NEW.status || '.'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'success'
        WHEN NEW.status = 'rejected' THEN 'error'
        ELSE 'info'
      END,
      '/student/documents'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for document status changes
CREATE TRIGGER on_document_status_change
AFTER UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.notify_document_status_change();

-- Create function to notify on application status change
CREATE OR REPLACE FUNCTION public.notify_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      CASE 
        WHEN NEW.status = 'accepted' THEN 'Application Accepted!'
        WHEN NEW.status = 'rejected' THEN 'Application Update'
        WHEN NEW.status = 'in_review' THEN 'Application In Review'
        WHEN NEW.status = 'submitted' THEN 'Application Submitted'
        ELSE 'Application Status Updated'
      END,
      CASE 
        WHEN NEW.status = 'accepted' THEN 'Congratulations! Your application has been accepted.'
        WHEN NEW.status = 'rejected' THEN 'Unfortunately, your application was not accepted. You may apply to other universities.'
        WHEN NEW.status = 'in_review' THEN 'Your application is now being reviewed by the admissions team.'
        WHEN NEW.status = 'submitted' THEN 'Your application has been successfully submitted and is awaiting review.'
        ELSE 'Your application status has been updated to ' || NEW.status || '.'
      END,
      CASE 
        WHEN NEW.status = 'accepted' THEN 'success'
        WHEN NEW.status = 'rejected' THEN 'error'
        ELSE 'info'
      END,
      '/student/applications'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for application status changes
CREATE TRIGGER on_application_status_change
AFTER UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.notify_application_status_change();

-- ------------------------------------------------------------
-- Migration: 20251218110045_408a55cf-ea73-48bf-bea6-627480bb29e0.sql
-- ------------------------------------------------------------

-- Add admin SELECT policy for profiles table
-- This enables admins to view all student profiles for the AdminStudents page

CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ------------------------------------------------------------
-- Migration: 20251219182844_bf7e67a8-b17f-43e9-9753-bc2a93782c5b.sql
-- ------------------------------------------------------------

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

-- ------------------------------------------------------------
-- Migration: 20251219183543_2360e916-7d0a-4d87-b27b-4f792bff6ae4.sql
-- ------------------------------------------------------------

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

-- ------------------------------------------------------------
-- Migration: 20251219204043_25a0a0ec-db9c-4960-b980-c1eafd11f297.sql
-- ------------------------------------------------------------

-- Add 'agent' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'agent';

-- Table for agent-student assignments
CREATE TABLE public.agent_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL,
    student_id UUID NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    assigned_by UUID,
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (agent_id, student_id)
);

-- Table for agent internal notes (hidden from students)
CREATE TABLE public.agent_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL,
    student_id UUID NOT NULL,
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    note_type TEXT NOT NULL DEFAULT 'general',
    is_internal BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for agent tasks & deadlines
CREATE TABLE public.agent_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL,
    student_id UUID,
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'pending',
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for system configuration (admin-managed)
CREATE TABLE public.system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key TEXT NOT NULL UNIQUE,
    config_value JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.agent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- RLS for agent_students
CREATE POLICY "Agents can view their assigned students"
ON public.agent_students FOR SELECT
USING (agent_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage agent assignments"
ON public.agent_students FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS for agent_notes (hidden from students)
CREATE POLICY "Agents can view their own notes"
ON public.agent_notes FOR SELECT
USING (agent_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can create notes"
ON public.agent_notes FOR INSERT
WITH CHECK (agent_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can update their own notes"
ON public.agent_notes FOR UPDATE
USING (agent_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can delete their own notes"
ON public.agent_notes FOR DELETE
USING (agent_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- RLS for agent_tasks
CREATE POLICY "Agents can view their own tasks"
ON public.agent_tasks FOR SELECT
USING (agent_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can create their own tasks"
ON public.agent_tasks FOR INSERT
WITH CHECK (agent_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can update their own tasks"
ON public.agent_tasks FOR UPDATE
USING (agent_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can delete their own tasks"
ON public.agent_tasks FOR DELETE
USING (agent_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- RLS for system_config (admin only)
CREATE POLICY "Anyone can view system config"
ON public.system_config FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage system config"
ON public.system_config FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Update has_role function to support agent role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Triggers for updated_at
CREATE TRIGGER update_agent_students_updated_at
BEFORE UPDATE ON public.agent_students
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_notes_updated_at
BEFORE UPDATE ON public.agent_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_tasks_updated_at
BEFORE UPDATE ON public.agent_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at
BEFORE UPDATE ON public.system_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------
-- Migration: 20260102191521_a889bff6-7f1b-49e9-a8e0-6def951934e4.sql
-- ------------------------------------------------------------

-- Fix universities RLS so admins can see all (including inactive)
DROP POLICY IF EXISTS "Anyone can view universities" ON public.universities;

CREATE POLICY "Anyone can view active universities" 
ON public.universities 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can view all universities" 
ON public.universities 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Also fix documents RLS for admins
DROP POLICY IF EXISTS "Admins can view all documents" ON public.documents;

CREATE POLICY "Admins can view all documents" 
ON public.documents 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix agents to view their assigned students' documents  
CREATE POLICY "Agents can view assigned students documents" 
ON public.documents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.agent_students 
    WHERE agent_students.agent_id = auth.uid() 
    AND agent_students.student_id = documents.user_id
    AND agent_students.status = 'active'
  )
);

-- ------------------------------------------------------------
-- Migration: 20260102192509_fe83736f-30ad-4696-ac2b-47a7107a8c8c.sql
-- ------------------------------------------------------------

-- Fix 1: Profiles table - deny public/anonymous access
-- Drop the potentially vulnerable policy and create one that requires authentication
CREATE POLICY "Deny public access to profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix 2: System config - restrict to authenticated users only
DROP POLICY IF EXISTS "Anyone can view system config" ON public.system_config;

CREATE POLICY "Authenticated users can view system config" 
ON public.system_config 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- ------------------------------------------------------------
-- Migration: 20260102193247_507ed6b7-4acc-4c7f-a8b8-5881afb4d47a.sql
-- ------------------------------------------------------------

-- Add missing storage bucket policies for visa-documents and documents

-- 1. Users can update their own visa documents in storage
CREATE POLICY "Users can update own visa documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'visa-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 2. Admins can view all visa documents in storage
CREATE POLICY "Admins can view all visa documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'visa-documents' AND has_role(auth.uid(), 'admin'::app_role));

-- 3. Admins can update all visa documents in storage
CREATE POLICY "Admins can update all visa documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'visa-documents' AND has_role(auth.uid(), 'admin'::app_role));

-- 4. Admins can update all documents in storage
CREATE POLICY "Admins can update all documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'documents' AND has_role(auth.uid(), 'admin'::app_role));

-- 5. Admins can update visa_documents table records
CREATE POLICY "Admins can update all visa documents"
ON public.visa_documents FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- ------------------------------------------------------------
-- Migration: 20260102194421_1753ca69-64a5-4f56-9281-513ad6f78f09.sql
-- ------------------------------------------------------------

-- Fix 1: Replace permissive agent_notes INSERT policy with validated one
DROP POLICY IF EXISTS "Agents can create notes" ON public.agent_notes;

CREATE POLICY "Agents can create notes for assigned students only"
ON public.agent_notes FOR INSERT
WITH CHECK (
  (
    agent_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.agent_students
      WHERE agent_students.agent_id = auth.uid()
      AND agent_students.student_id = agent_notes.student_id
      AND agent_students.status = 'active'
    )
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

-- Fix 2: Add storage policies for agents to access assigned students' documents
CREATE POLICY "Agents can view assigned students documents storage"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.agent_students
    WHERE agent_students.agent_id = auth.uid()
    AND agent_students.student_id::text = (storage.foldername(name))[1]
    AND agent_students.status = 'active'
  )
);

-- Add same policy for visa-documents bucket
CREATE POLICY "Agents can view assigned students visa documents storage"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'visa-documents' AND
  EXISTS (
    SELECT 1 FROM public.agent_students
    WHERE agent_students.agent_id = auth.uid()
    AND agent_students.student_id::text = (storage.foldername(name))[1]
    AND agent_students.status = 'active'
  )
);

-- ------------------------------------------------------------
-- Migration: 20260103162902_7f4fd286-96ce-4f93-b6dd-aa29a6d14f8b.sql
-- ------------------------------------------------------------

-- Drop the overly broad policy that allows any authenticated user to view all profiles
DROP POLICY IF EXISTS "Deny public access to profiles" ON public.profiles;

-- Add policy for agents to view their assigned students' profiles
CREATE POLICY "Agents can view assigned students profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM agent_students
    WHERE agent_students.agent_id = auth.uid()
    AND agent_students.student_id = profiles.user_id
    AND agent_students.status = 'active'
  )
);

-- Add policy for agents to view applications of their assigned students
CREATE POLICY "Agents can view assigned students applications" 
ON public.applications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM agent_students
    WHERE agent_students.agent_id = auth.uid()
    AND agent_students.student_id = applications.user_id
    AND agent_students.status = 'active'
  )
);

-- ------------------------------------------------------------
-- Migration: 20260103173840_93152f79-6f2f-4361-826b-ca4b2d732ecc.sql
-- ------------------------------------------------------------

-- Create countries table to manage which countries are available
CREATE TABLE public.countries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  name_uz TEXT,
  name_ru TEXT,
  flag TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  avg_tuition TEXT,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

-- Anyone can view active countries
CREATE POLICY "Anyone can view active countries" 
ON public.countries 
FOR SELECT 
USING (is_active = true);

-- Admins can view all countries
CREATE POLICY "Admins can view all countries" 
ON public.countries 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage countries
CREATE POLICY "Admins can insert countries" 
ON public.countries 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update countries" 
ON public.countries 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete countries" 
ON public.countries 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_countries_updated_at
BEFORE UPDATE ON public.countries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default countries
INSERT INTO public.countries (name, name_uz, name_ru, flag, is_active, display_order, avg_tuition, currency) VALUES
('South Korea', 'Janubiy Koreya', 'Южная Корея', '🇰🇷', true, 1, '$4,000 - $12,000', 'KRW'),
('China', 'Xitoy', 'Китай', '🇨🇳', true, 2, '$2,500 - $10,000', 'CNY'),
('Japan', 'Yaponiya', 'Япония', '🇯🇵', true, 3, '$5,000 - $15,000', 'JPY'),
('USA', 'AQSH', 'США', '🇺🇸', true, 4, '$20,000 - $60,000', 'USD'),
('Germany', 'Germaniya', 'Германия', '🇩🇪', true, 5, '$500 - $3,000', 'EUR'),
('Poland', 'Polsha', 'Польша', '🇵🇱', true, 6, '$2,000 - $6,000', 'PLN'),
('Turkey', 'Turkiya', 'Турция', '🇹🇷', true, 7, '$1,500 - $8,000', 'TRY'),
('Czech Republic', 'Chexiya', 'Чехия', '🇨🇿', true, 8, '$3,000 - $8,000', 'CZK'),
('Malaysia', 'Malayziya', 'Малайзия', '🇲🇾', true, 9, '$3,000 - $10,000', 'MYR'),
('UAE', 'BAA', 'ОАЭ', '🇦🇪', true, 10, '$8,000 - $25,000', 'AED'),
('Georgia', 'Gruziya', 'Грузия', '🇬🇪', true, 11, '$2,000 - $6,000', 'GEL'),
('Hungary', 'Vengriya', 'Венгрия', '🇭🇺', true, 12, '$3,500 - $9,000', 'HUF'),
('Russia', 'Rossiya', 'Россия', '🇷🇺', true, 13, '$2,000 - $8,000', 'RUB'),
('UK', 'Buyuk Britaniya', 'Великобритания', '🇬🇧', true, 14, '$15,000 - $40,000', 'GBP'),
('Canada', 'Kanada', 'Канада', '🇨🇦', true, 15, '$15,000 - $35,000', 'CAD'),
('Australia', 'Avstraliya', 'Австралия', '🇦🇺', true, 16, '$20,000 - $45,000', 'AUD'),
('Italy', 'Italiya', 'Италия', '🇮🇹', true, 17, '$1,500 - $4,000', 'EUR'),
('France', 'Frantsiya', 'Франция', '🇫🇷', true, 18, '$200 - $5,000', 'EUR'),
('Spain', 'Ispaniya', 'Испания', '🇪🇸', true, 19, '$1,000 - $5,000', 'EUR'),
('Netherlands', 'Niderlandiya', 'Нидерланды', '🇳🇱', true, 20, '$10,000 - $20,000', 'EUR');

-- ------------------------------------------------------------
-- Migration: 20260104053834_14ca1251-474a-4cd0-ad61-2462fe12b472.sql
-- ------------------------------------------------------------

-- Add policy for agents to view assigned students' visa documents
CREATE POLICY "Agents can view assigned students visa documents"
ON public.visa_documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM agent_students
    WHERE agent_students.agent_id = auth.uid()
    AND agent_students.student_id = visa_documents.user_id
    AND agent_students.status = 'active'
  )
);

-- ------------------------------------------------------------
-- Migration: 20260105094135_430ea591-3238-4ed4-b97c-842e6a29a915.sql
-- ------------------------------------------------------------

-- Add policies to explicitly deny anonymous access to sensitive tables

-- 1. Profiles table - deny anonymous access
CREATE POLICY "Deny public access to profiles" 
ON public.profiles 
FOR ALL 
TO anon
USING (false)
WITH CHECK (false);

-- 2. Visa applications table - deny anonymous access  
CREATE POLICY "Deny public access to visa applications"
ON public.visa_applications
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 3. Documents table - deny anonymous access
CREATE POLICY "Deny public access to documents"
ON public.documents
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 4. Visa documents table - deny anonymous access
CREATE POLICY "Deny public access to visa documents"
ON public.visa_documents
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 5. Expenses table - deny anonymous access
CREATE POLICY "Deny public access to expenses"
ON public.expenses
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- ------------------------------------------------------------
-- Migration: 20260111084821_c14fb22e-fe55-441d-b51d-d394e2871417.sql
-- ------------------------------------------------------------

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

-- ------------------------------------------------------------
-- Migration: 20260113023519_4cc57c04-efee-4d92-a438-a6d1ce097d33.sql
-- ------------------------------------------------------------

-- Fix 1: Create a public view for universities without sensitive contact info
CREATE OR REPLACE VIEW public.universities_public AS
SELECT 
  id,
  name,
  name_uz,
  name_ru,
  country,
  city,
  description,
  description_uz,
  description_ru,
  ranking,
  tuition_min,
  tuition_max,
  currency,
  scholarship_available,
  intake_spring,
  intake_fall,
  students_total,
  students_international,
  students_uzbek,
  students_local,
  programs,
  images,
  website,
  address,
  latitude,
  longitude,
  is_active,
  requirements,
  created_at,
  updated_at
  -- Excluding: contact_email (sensitive)
FROM public.universities
WHERE is_active = true;

-- Grant access to the view for anon and authenticated users
GRANT SELECT ON public.universities_public TO anon, authenticated;

-- Fix 2: Update universities RLS - remove public access policy and make it admin-only for full data
DROP POLICY IF EXISTS "Anyone can view active universities" ON public.universities;

-- Create new policy: Only authenticated users can view active universities (basic info still via view)
CREATE POLICY "Authenticated users can view active universities" 
ON public.universities 
FOR SELECT 
USING (
  is_active = true AND auth.uid() IS NOT NULL
);

-- Fix 3: Ensure profiles table has proper restrictive policies
-- First, drop the problematic deny policy that might be causing issues
DROP POLICY IF EXISTS "Deny public access to profiles" ON public.profiles;

-- Re-create as a proper restrictive policy for anonymous access
CREATE POLICY "Block anonymous access to profiles" 
ON public.profiles 
AS RESTRICTIVE
FOR ALL 
TO anon
USING (false)
WITH CHECK (false);

-- Ensure authenticated users can only access their own or authorized profiles
-- The existing policies should handle this, but let's verify by recreating them properly

-- Drop and recreate user policies to ensure they're permissive
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
AS PERMISSIVE
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles 
AS PERMISSIVE
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
AS PERMISSIVE
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Ensure admin and agent policies are permissive
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Agents can view assigned students profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
AS PERMISSIVE
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can view assigned students profiles" 
ON public.profiles 
AS PERMISSIVE
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agent_students
    WHERE agent_students.agent_id = auth.uid()
    AND agent_students.student_id = profiles.user_id
    AND agent_students.status = 'active'
  )
);

-- ------------------------------------------------------------
-- Migration: 20260113023603_44e4a6c8-90a5-4ffa-a87b-c051596f5658.sql
-- ------------------------------------------------------------

-- Fix the Security Definer View issue by adding security_invoker = true
DROP VIEW IF EXISTS public.universities_public;

CREATE VIEW public.universities_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  name_uz,
  name_ru,
  country,
  city,
  description,
  description_uz,
  description_ru,
  ranking,
  tuition_min,
  tuition_max,
  currency,
  scholarship_available,
  intake_spring,
  intake_fall,
  students_total,
  students_international,
  students_uzbek,
  students_local,
  programs,
  images,
  website,
  address,
  latitude,
  longitude,
  is_active,
  requirements,
  created_at,
  updated_at
FROM public.universities
WHERE is_active = true;

-- Grant access to the view for anon and authenticated users
GRANT SELECT ON public.universities_public TO anon, authenticated;

-- ------------------------------------------------------------
-- Migration: 20260118183025_99f2a07a-43dd-4b8d-8580-f3a2697971da.sql
-- ------------------------------------------------------------

-- Allow agents to send notifications to their assigned students
CREATE POLICY "Agents can send notifications to assigned students"
ON public.notifications
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'agent'::app_role) AND
  EXISTS (
    SELECT 1 FROM agent_students
    WHERE agent_students.agent_id = auth.uid()
    AND agent_students.student_id = notifications.user_id
    AND agent_students.status = 'active'
  )
);

-- ------------------------------------------------------------
-- Migration: 20260203194439_8daa3860-c26a-47d7-a5a2-edbe9288c608.sql
-- ------------------------------------------------------------

-- Fix: System Configuration should only be readable by admins
-- Drop the overly permissive policy that allows all authenticated users to view
DROP POLICY IF EXISTS "Authenticated users can view system config" ON public.system_config;
DROP POLICY IF EXISTS "Anyone can view system config" ON public.system_config;

-- Create a more restrictive policy - only admins can view system config
CREATE POLICY "Only admins can view system config"
ON public.system_config FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- ------------------------------------------------------------
-- Migration: 20260205202448_386cc0a7-04f8-4145-a57e-c59a41f6267c.sql
-- ------------------------------------------------------------

-- Add telegram_username column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS telegram_username text;

-- ------------------------------------------------------------
-- Migration: 20260209204010_4531f52f-e774-498f-afdb-c543f0a4a476.sql
-- ------------------------------------------------------------


-- Add application_fee and required_documents to universities
ALTER TABLE public.universities 
ADD COLUMN IF NOT EXISTS application_fee numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS required_documents text[] DEFAULT NULL;

-- Add visa/embassy website to countries
ALTER TABLE public.countries 
ADD COLUMN IF NOT EXISTS visa_website text DEFAULT NULL;


-- ------------------------------------------------------------
-- Migration: 20260210214519_3dd276a6-398b-4f37-a24c-ef5add88ac39.sql
-- ------------------------------------------------------------


-- Create announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  target_role TEXT NOT NULL DEFAULT 'all',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage announcements"
ON public.announcements FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can view active announcements
CREATE POLICY "Users can view active announcements"
ON public.announcements FOR SELECT
USING (is_active = true AND auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;


-- ------------------------------------------------------------
-- Migration: 20260220095256_38f2a303-1489-4f07-b768-06231e30fee0.sql
-- ------------------------------------------------------------

-- Allow admins to delete any document record
CREATE POLICY "Admins can delete all documents"
ON public.documents
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete files from documents storage bucket
CREATE POLICY "Admins can delete document files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'documents' AND has_role(auth.uid(), 'admin'::app_role));

-- ------------------------------------------------------------
-- Migration: 20260221212332_4c4142a3-3474-4724-b7cb-d5b4e9bdf64a.sql
-- ------------------------------------------------------------


-- Add rich data columns to countries table
ALTER TABLE public.countries
ADD COLUMN IF NOT EXISTS visa_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS cost_of_living JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS education_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS key_requirements TEXT[] DEFAULT '{}';


-- ------------------------------------------------------------
-- Migration: 20260301175153_7bb6ac40-1b83-4233-ab99-dbff6596d8fd.sql
-- ------------------------------------------------------------

-- Add acceptance_letter_url column to applications table
ALTER TABLE public.applications ADD COLUMN acceptance_letter_url text;


-- ------------------------------------------------------------
-- Migration: 20260301180226_4f6ee216-4b3e-4fcc-bac2-75782036a942.sql
-- ------------------------------------------------------------


-- Add parent contact fields to profiles
ALTER TABLE public.profiles ADD COLUMN parent_name text;
ALTER TABLE public.profiles ADD COLUMN parent_phone text;

-- Update the application status change trigger to include parent info notification
CREATE OR REPLACE FUNCTION public.notify_application_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _parent_name text;
  _parent_phone text;
  _uni_name text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get parent info and university name for accepted notifications
    IF NEW.status = 'accepted' THEN
      SELECT p.parent_name, p.parent_phone INTO _parent_name, _parent_phone
      FROM public.profiles p WHERE p.user_id = NEW.user_id;
      
      SELECT u.name INTO _uni_name
      FROM public.universities u WHERE u.id = NEW.university_id;
    END IF;

    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      CASE 
        WHEN NEW.status = 'accepted' THEN 'Application Accepted!'
        WHEN NEW.status = 'rejected' THEN 'Application Update'
        WHEN NEW.status = 'in_review' THEN 'Application In Review'
        WHEN NEW.status = 'submitted' THEN 'Application Submitted'
        ELSE 'Application Status Updated'
      END,
      CASE 
        WHEN NEW.status = 'accepted' THEN 
          'Congratulations! Your application to ' || COALESCE(_uni_name, 'university') || ' has been accepted!' ||
          CASE WHEN _parent_phone IS NOT NULL THEN ' Parent (' || COALESCE(_parent_name, '') || ': ' || _parent_phone || ') has been notified.' ELSE '' END
        WHEN NEW.status = 'rejected' THEN 'Unfortunately, your application was not accepted. You may apply to other universities.'
        WHEN NEW.status = 'in_review' THEN 'Your application is now being reviewed by the admissions team.'
        WHEN NEW.status = 'submitted' THEN 'Your application has been successfully submitted and is awaiting review.'
        ELSE 'Your application status has been updated to ' || NEW.status || '.'
      END,
      CASE 
        WHEN NEW.status = 'accepted' THEN 'success'
        WHEN NEW.status = 'rejected' THEN 'error'
        ELSE 'info'
      END,
      '/student/applications'
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_application_status_change ON public.applications;
CREATE TRIGGER on_application_status_change
  AFTER UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_application_status_change();


-- ------------------------------------------------------------
-- Migration: 20260301182924_25858422-19a8-4d59-869f-5f4983489228.sql
-- ------------------------------------------------------------

-- Enable realtime for applications table so student dashboard updates live
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;

-- ------------------------------------------------------------
-- Migration: 20260309185805_a9b6c200-4ba5-4c2a-b8ce-bf3301d31389.sql
-- ------------------------------------------------------------


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


-- ------------------------------------------------------------
-- Migration: 20260309201307_1dff495b-d106-4235-b58c-b36a37091e7a.sql
-- ------------------------------------------------------------


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


-- ------------------------------------------------------------
-- Migration: 20260327045512_3015e81e-ff76-4328-ad96-ef99bfc964df.sql
-- ------------------------------------------------------------

CREATE POLICY "Admins can upload document files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND has_role(auth.uid(), 'admin'::app_role)
);

-- ------------------------------------------------------------
-- Migration: 20260328050537_276894ee-6b03-41b8-89d1-96e1d2e0f135.sql
-- ------------------------------------------------------------


-- User credits table
CREATE TABLE public.user_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits" ON public.user_credits
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits" ON public.user_credits
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credits" ON public.user_credits
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all credits" ON public.user_credits
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Credit transactions log
CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL DEFAULT 'purchase',
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.credit_transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.credit_transactions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all transactions" ON public.credit_transactions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID,
  referral_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  credits_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals" ON public.referrals
  FOR SELECT TO authenticated
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users can insert referrals" ON public.referrals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Admins can manage all referrals" ON public.referrals
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add credit_cost to universities table
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS credit_cost INTEGER NOT NULL DEFAULT 1;

-- Add is_top_tier to universities table  
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS is_top_tier BOOLEAN DEFAULT false;


-- ------------------------------------------------------------
-- Migration: 20260328053503_67d8d472-8b35-4f39-8712-36f395040867.sql
-- ------------------------------------------------------------

CREATE POLICY "Authenticated users can view system config"
ON public.system_config
FOR SELECT
TO authenticated
USING (true);

-- ------------------------------------------------------------
-- Migration: 20260328064647_c8c9aaa5-b22e-4285-8b7e-e195d5562622.sql
-- ------------------------------------------------------------


CREATE TABLE public.spin_wheel_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  prize_type text NOT NULL DEFAULT 'nothing',
  prize_value integer NOT NULL DEFAULT 0,
  spin_number integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.spin_wheel_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own spins" ON public.spin_wheel_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own spins" ON public.spin_wheel_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all spins" ON public.spin_wheel_logs FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));


-- ------------------------------------------------------------
-- Migration: 20260328072401_98cd0bfd-573a-42de-87a2-c29a73dce54f.sql
-- ------------------------------------------------------------

ALTER TABLE public.universities ALTER COLUMN credit_cost SET DEFAULT 5;

-- ------------------------------------------------------------
-- Migration: 20260328134113_9ba70e3e-3db5-4908-9136-e87c378245fa.sql
-- ------------------------------------------------------------


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


-- ------------------------------------------------------------
-- Migration: 20260330042554_c11f25e4-bcc6-4a4d-baa2-8bf877cb8b55.sql
-- ------------------------------------------------------------


CREATE TABLE public.daily_login_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  current_streak integer NOT NULL DEFAULT 1,
  max_streak integer NOT NULL DEFAULT 1,
  last_login_date date NOT NULL DEFAULT CURRENT_DATE,
  last_reward_date date,
  total_coins_earned integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.daily_login_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streaks" ON public.daily_login_streaks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks" ON public.daily_login_streaks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks" ON public.daily_login_streaks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all streaks" ON public.daily_login_streaks
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));


-- ------------------------------------------------------------
-- Migration: 20260330050902_431dd785-909f-438d-819b-5ee1a252dc07.sql
-- ------------------------------------------------------------

-- Remove client-side INSERT policy on spin_wheel_logs to prevent manipulation
DROP POLICY IF EXISTS "Users can insert own spins" ON public.spin_wheel_logs;

-- ------------------------------------------------------------
-- Migration: 20260331065600_1a4cd0cc-367e-44aa-bb4a-7bfceaf8a0b1.sql
-- ------------------------------------------------------------


-- Payment transactions table
CREATE TABLE public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  unicoin_amount integer NOT NULL,
  uzs_amount numeric NOT NULL,
  rate_per_coin numeric NOT NULL DEFAULT 1000,
  status text NOT NULL DEFAULT 'pending',
  payment_method text NOT NULL DEFAULT 'click',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own payment transactions"
  ON public.payment_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment transactions"
  ON public.payment_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment transactions"
  ON public.payment_transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all payment transactions"
  ON public.payment_transactions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Deny anonymous
CREATE POLICY "Deny anon access to payment transactions"
  ON public.payment_transactions FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Insert default UniCoin price config
INSERT INTO public.system_config (config_key, config_value, description)
VALUES ('unicoin_price_uzs', '1000', 'Price of 1 UniCoin in UZS')
ON CONFLICT DO NOTHING;


-- ------------------------------------------------------------
-- Migration: 20260331065856_675dda18-a580-44cb-85d7-c7f2cba61bd0.sql
-- ------------------------------------------------------------


-- Tariffs table for admin-configurable UniCoin plans
CREATE TABLE public.tariffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_uz text,
  name_ru text,
  price_uzs numeric NOT NULL,
  coin_amount integer NOT NULL,
  bonus_coins integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  badge text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tariffs ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can view active tariffs
CREATE POLICY "Anyone authenticated can view active tariffs"
  ON public.tariffs FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins full access
CREATE POLICY "Admins can manage tariffs"
  ON public.tariffs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Deny anon
CREATE POLICY "Deny anon access to tariffs"
  ON public.tariffs FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Seed default tariffs
INSERT INTO public.tariffs (name, name_uz, name_ru, price_uzs, coin_amount, bonus_coins, display_order, badge) VALUES
  ('Starter', 'Boshlang''ich', 'Стартовый', 10000, 10, 0, 1, NULL),
  ('Standard', 'Standart', 'Стандартный', 50000, 50, 5, 2, 'ENG QULAY'),
  ('Premium', 'Premium', 'Премиум', 100000, 100, 20, 3, 'VIP');

-- Add confirmed_by and confirmed_at to payment_transactions
ALTER TABLE public.payment_transactions 
  ADD COLUMN IF NOT EXISTS tariff_id uuid REFERENCES public.tariffs(id),
  ADD COLUMN IF NOT EXISTS confirmed_by uuid,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;


-- ------------------------------------------------------------
-- Migration: 20260512154206_80c1709d-8497-4dfb-827e-cdd4c40b231b.sql
-- ------------------------------------------------------------

ALTER PUBLICATION supabase_realtime ADD TABLE public.system_config;

-- ------------------------------------------------------------
-- Migration: 20260512160913_d6ce1f84-5f94-439f-9916-5a864376cc8f.sql
-- ------------------------------------------------------------

CREATE TABLE public.contact_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_user_id UUID,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT,
  source_page TEXT NOT NULL DEFAULT 'landing',
  status TEXT NOT NULL DEFAULT 'new',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create contact requests"
ON public.contact_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view contact requests"
ON public.contact_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update contact requests"
ON public.contact_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete contact requests"
ON public.contact_requests
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_contact_requests_status_created_at
ON public.contact_requests (status, created_at DESC);

CREATE TRIGGER update_contact_requests_updated_at
BEFORE UPDATE ON public.contact_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------
-- B2B SaaS Schema & Final Polish
-- ------------------------------------------------------------

-- ============================================================
-- UniPath B2B SaaS - Final Database Schema
-- Supabase SQL Editor ga ko'chirib ishga tushiring
-- ============================================================

-- 1. Create tenants table (firmalar jadvali)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE,       -- e.g., 'firmA' -> firmA.unipath.uz
  custom_domain TEXT UNIQUE,   -- e.g., 'portal.firma.com'
  config JSONB DEFAULT '{}'::jsonb, -- features, branding, colors
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add tenant_id and role to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
-- Roles: super_admin | owner | manager | specialist | mentor | accountant | student

-- 3. Add tenant_id to applications table (if it exists)
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;

-- 4. Enable RLS on tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (to avoid duplication errors)
DROP POLICY IF EXISTS "Tenants viewable by members or super admins" ON public.tenants;
DROP POLICY IF EXISTS "Super admins can insert tenants" ON public.tenants;
DROP POLICY IF EXISTS "Super admins can update tenants" ON public.tenants;
DROP POLICY IF EXISTS "Profiles viewable by tenant users" ON public.profiles;

-- 5. RLS Policies for tenants
CREATE POLICY "Tenants viewable by members or super admins" 
ON public.tenants FOR SELECT 
USING (
  id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()) 
  OR 
  'super_admin' = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Super admins can insert tenants"
ON public.tenants FOR INSERT
WITH CHECK (
  'super_admin' = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Super admins can update tenants"
ON public.tenants FOR UPDATE
USING (
  'super_admin' = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

-- 6. RLS for Profiles (Isolating users by tenant)
CREATE POLICY "Profiles viewable by tenant users"
ON public.profiles FOR SELECT
USING (
  tenant_id = (SELECT tenant_id FROM public.profiles p2 WHERE p2.id = auth.uid())
  OR 
  'super_admin' = (SELECT role FROM public.profiles p2 WHERE p2.id = auth.uid())
  OR 
  id = auth.uid()
);

-- 7. Set Super Admin role (your email here)
UPDATE public.profiles 
SET role = 'super_admin' 
WHERE email = 'unipath.community@gmail.com';

-- ============================================================
-- TEKSHIRISH: Quyidagi qatorni ishga tushiring - rol to'g'ri o'rnatilganmi?
-- SELECT id, email, role FROM public.profiles WHERE email = 'unipath.community@gmail.com';
-- ============================================================


