-- Create countries table to manage which countries are available
CREATE TABLE public.countries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  name_uz TEXT,
  name_ru TEXT,
  flag TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  avg_tuition TEXT,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

-- Anyone can view active countries
CREATE POLICY "Anyone can view active countries" 
ON public.countries 
FOR SELECT 
USING (is_active = true);

-- Admins can view all countries
CREATE POLICY "Admins can view all countries" 
ON public.countries 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage countries
CREATE POLICY "Admins can insert countries" 
ON public.countries 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update countries" 
ON public.countries 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete countries" 
ON public.countries 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_countries_updated_at
BEFORE UPDATE ON public.countries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default countries
INSERT INTO public.countries (name, name_uz, name_ru, flag, is_active, display_order, avg_tuition, currency) VALUES
('South Korea', 'Janubiy Koreya', 'Южная Корея', '🇰🇷', true, 1, '$4,000 - $12,000', 'KRW'),
('China', 'Xitoy', 'Китай', '🇨🇳', true, 2, '$2,500 - $10,000', 'CNY'),
('Japan', 'Yaponiya', 'Япония', '🇯🇵', true, 3, '$5,000 - $15,000', 'JPY'),
('USA', 'AQSH', 'США', '🇺🇸', true, 4, '$20,000 - $60,000', 'USD'),
('Germany', 'Germaniya', 'Германия', '🇩🇪', true, 5, '$500 - $3,000', 'EUR'),
('Poland', 'Polsha', 'Польша', '🇵🇱', true, 6, '$2,000 - $6,000', 'PLN'),
('Turkey', 'Turkiya', 'Турция', '🇹🇷', true, 7, '$1,500 - $8,000', 'TRY'),
('Czech Republic', 'Chexiya', 'Чехия', '🇨🇿', true, 8, '$3,000 - $8,000', 'CZK'),
('Malaysia', 'Malayziya', 'Малайзия', '🇲🇾', true, 9, '$3,000 - $10,000', 'MYR'),
('UAE', 'BAA', 'ОАЭ', '🇦🇪', true, 10, '$8,000 - $25,000', 'AED'),
('Georgia', 'Gruziya', 'Грузия', '🇬🇪', true, 11, '$2,000 - $6,000', 'GEL'),
('Hungary', 'Vengriya', 'Венгрия', '🇭🇺', true, 12, '$3,500 - $9,000', 'HUF'),
('Russia', 'Rossiya', 'Россия', '🇷🇺', true, 13, '$2,000 - $8,000', 'RUB'),
('UK', 'Buyuk Britaniya', 'Великобритания', '🇬🇧', true, 14, '$15,000 - $40,000', 'GBP'),
('Canada', 'Kanada', 'Канада', '🇨🇦', true, 15, '$15,000 - $35,000', 'CAD'),
('Australia', 'Avstraliya', 'Австралия', '🇦🇺', true, 16, '$20,000 - $45,000', 'AUD'),
('Italy', 'Italiya', 'Италия', '🇮🇹', true, 17, '$1,500 - $4,000', 'EUR'),
('France', 'Frantsiya', 'Франция', '🇫🇷', true, 18, '$200 - $5,000', 'EUR'),
('Spain', 'Ispaniya', 'Испания', '🇪🇸', true, 19, '$1,000 - $5,000', 'EUR'),
('Netherlands', 'Niderlandiya', 'Нидерланды', '🇳🇱', true, 20, '$10,000 - $20,000', 'EUR');