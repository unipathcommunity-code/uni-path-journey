
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
