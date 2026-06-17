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