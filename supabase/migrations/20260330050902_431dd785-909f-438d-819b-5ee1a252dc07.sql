-- Remove client-side INSERT policy on spin_wheel_logs to prevent manipulation
DROP POLICY IF EXISTS "Users can insert own spins" ON public.spin_wheel_logs;