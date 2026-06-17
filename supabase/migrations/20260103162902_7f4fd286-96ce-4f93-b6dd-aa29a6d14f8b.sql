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