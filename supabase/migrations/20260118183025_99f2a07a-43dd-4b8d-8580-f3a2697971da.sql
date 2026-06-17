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