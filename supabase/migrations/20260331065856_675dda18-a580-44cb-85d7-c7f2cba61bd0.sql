
-- Tariffs table for admin-configurable UniCoin plans
CREATE TABLE public.tariffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_uz text,
  name_ru text,
  price_uzs numeric NOT NULL,
  coin_amount integer NOT NULL,
  bonus_coins integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  badge text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tariffs ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can view active tariffs
CREATE POLICY "Anyone authenticated can view active tariffs"
  ON public.tariffs FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins full access
CREATE POLICY "Admins can manage tariffs"
  ON public.tariffs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Deny anon
CREATE POLICY "Deny anon access to tariffs"
  ON public.tariffs FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Seed default tariffs
INSERT INTO public.tariffs (name, name_uz, name_ru, price_uzs, coin_amount, bonus_coins, display_order, badge) VALUES
  ('Starter', 'Boshlang''ich', 'Стартовый', 10000, 10, 0, 1, NULL),
  ('Standard', 'Standart', 'Стандартный', 50000, 50, 5, 2, 'ENG QULAY'),
  ('Premium', 'Premium', 'Премиум', 100000, 100, 20, 3, 'VIP');

-- Add confirmed_by and confirmed_at to payment_transactions
ALTER TABLE public.payment_transactions 
  ADD COLUMN IF NOT EXISTS tariff_id uuid REFERENCES public.tariffs(id),
  ADD COLUMN IF NOT EXISTS confirmed_by uuid,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
