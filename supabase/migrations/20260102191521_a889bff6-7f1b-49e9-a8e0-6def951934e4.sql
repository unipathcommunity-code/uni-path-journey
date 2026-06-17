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