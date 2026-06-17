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