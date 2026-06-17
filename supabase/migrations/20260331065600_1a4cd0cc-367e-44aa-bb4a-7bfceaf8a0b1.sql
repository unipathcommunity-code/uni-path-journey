
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
