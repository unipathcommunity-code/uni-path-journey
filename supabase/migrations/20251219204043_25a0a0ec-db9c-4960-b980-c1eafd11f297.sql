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