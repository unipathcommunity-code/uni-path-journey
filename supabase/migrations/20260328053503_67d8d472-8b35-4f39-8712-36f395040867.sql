CREATE POLICY "Authenticated users can view system config"
ON public.system_config
FOR SELECT
TO authenticated
USING (true);