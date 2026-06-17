-- ============================================================
-- UniPath Migration: Create pricing_plans table and seed data
-- Run this in the Supabase Dashboard SQL Editor
-- ============================================================

-- 1. Create pricing_plans table
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical TEXT NOT NULL,
  name TEXT NOT NULL,
  price TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UZS',
  description TEXT,
  features JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of strings
  popular BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if any
DROP POLICY IF EXISTS "Allow public select on pricing_plans" ON public.pricing_plans;
DROP POLICY IF EXISTS "Allow super_admin all on pricing_plans" ON public.pricing_plans;

-- 4. Create RLS Policies
CREATE POLICY "Allow public select on pricing_plans"
ON public.pricing_plans FOR SELECT
USING (true);

CREATE POLICY "Allow super_admin all on pricing_plans"
ON public.pricing_plans FOR ALL
USING (
  'super_admin' = (SELECT role FROM public.profiles WHERE user_id = auth.uid())
)
WITH CHECK (
  'super_admin' = (SELECT role FROM public.profiles WHERE user_id = auth.uid())
);

-- 5. Seed default plans (if the table is empty)
-- We insert only if there are no records in the table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.pricing_plans LIMIT 1) THEN
    -- Consulting Plans
    INSERT INTO public.pricing_plans (vertical, name, price, currency, description, features, popular) VALUES
    ('consulting', 'Consulting Starter', '199 000', 'UZS', 'Kichik konsalting va viza markazlari uchun', '["100 ta arizachi limiti", "3 ta xodim boshqaruvi", "Hujjatlarni avtomatlashtirish", "E''lonlar taxtasi", "Standard CRM Pipeline"]'::jsonb, false),
    ('consulting', 'Consulting Pro', '499 000', 'UZS', 'Professional konsalting agentliklari uchun', '["500 ta arizachi limiti", "15 ta xodim boshqaruvi", "Chet el universitetlari API sinxronizatsiyasi", "Buxgalteriya va to''lovlar nazorati", "Telegram Bot va bildirishnomalar"]'::jsonb, true),
    ('consulting', 'Consulting Premium', '1 199 000', 'UZS', 'Yirik konsalting tarmoqlari va agentliklari uchun', '["1500 ta arizachi limiti", "40 ta xodim boshqaruvi", "Hamkor xalqaro universitetlar portali", "Mentor va kutib olish modullari", "Custom branding va rang sxemalari"]'::jsonb, false),
    ('consulting', 'Office Enterprise', '2 499 000', 'UZS', 'Transmilliy va yirik korporativ tarmoqlar uchun', '["Cheksiz arizachilar", "Cheksiz xodimlar boshqaruvi", "Custom Domain ulanishi", "VIP 24/7 bag''ishlangan yordam", "SLA kafolati va yuqori xavfsizlik"]'::jsonb, false);

    -- Academy (NOVA) Plans
    INSERT INTO public.pricing_plans (vertical, name, price, currency, description, features, popular) VALUES
    ('academy', 'Repetitor Starter', '99 000', 'UZS', 'Yakka repetitor va individual o''qituvchilar uchun', '["30 o''quvchi", "1 ustoz", "5/18 faol modul", "Guruhlar boshqaruvi", "QR davomat"]'::jsonb, false),
    ('academy', 'Repetitor Pro', '199 000', 'UZS', 'Professional repetitorlar va kichik guruhlar uchun', '["80 o''quvchi", "1 ustoz", "12/18 faol modul", "Ota-ona oynasi", "To''lovlar nazorati"]'::jsonb, true),
    ('academy', 'Kurs Xona', '299 000', 'UZS', 'Kichik kurs xonalari va maxsus to''garaklar uchun', '["100 o''quvchi", "3 ta dars xonasi", "6/18 faol modul", "Moliya va hisobot", "Telegram Bot"]'::jsonb, false),
    ('academy', 'Center Starter', '499 000', 'UZS', 'Kichik o''quv markazlari va o''quv kurslari uchun', '["200 o''quvchi", "5 ustoz", "8/18 faol modul", "Telegram xabarnomalar", "Moliya nazorati"]'::jsonb, false),
    ('academy', 'Center Pro', '799 000', 'UZS', 'Rivojlanayotgan o''quv markazlari uchun eng yaxshi tanlov', '["500 o''quvchi", "15 ustoz", "16/18 faol modul", "Biometrik FaceID", "Keng analitika"]'::jsonb, false),
    ('academy', 'Center Premium', '1 299 000', 'UZS', 'Katta o''quv markazlari va ko''p filialli tarmoqlar uchun', '["1000 o''quvchi", "40 ustoz", "Barcha modullar yoqilgan", "Custom Domain", "24/7 VIP ko''mak"]'::jsonb, false),
    ('academy', 'Academy Enterprise', '1 990 000', 'UZS', 'Yirik ta''lim akademiyalari va o''quv muassasalari uchun', '["2000 o''quvchi", "Cheksiz ustozlar", "NovaCoins loyallik do''koni", "Custom SMS Gateway", "SLA kafolati"]'::jsonb, false),
    ('academy', 'School Basic', '2 990 000', 'UZS', 'Xususiy maktablar va litseylar uchun maxsus boshqaruv tizimi', '["3000 o''quvchi", "100 ustoz", "Dars jadvali generatori", "SMS debt gateway", "Dedicated server"]'::jsonb, false);

    -- Tour Plans
    INSERT INTO public.pricing_plans (vertical, name, price, currency, description, features, popular) VALUES
    ('tour', 'Tour Starter', '149 000', 'UZS', 'Yangi boshlayotgan turistik agentliklar uchun', '["50 ta faol buyurtma", "2 ta xodim boshqaruvi", "Turlar katalogi", "Invoys PDF yaratish", "Mijozlar bazasi (CRM)"]'::jsonb, false),
    ('tour', 'Tour Pro', '349 000', 'UZS', 'Tez o''sayotgan turizm agentliklari uchun', '["250 ta faol buyurtma", "10 ta xodim boshqaruvi", "Komissiya & Markup nazorati", "Telegram Bot va veb-sayt ulanishi", "Buxgalteriya va hisobotlar"]'::jsonb, true),
    ('tour', 'Tour Premium', '799 000', 'UZS', 'Katta va faol turistik kompaniyalar uchun', '["1000 ta faol buyurtma", "30 ta xodim boshqaruvi", "GDS Flight & Hotel integratsiyasi", "API va xalqaro hamkorlik tizimi", "SMS debt gateway integratsiyasi"]'::jsonb, false),
    ('tour', 'Tour Enterprise', '1 499 000', 'UZS', 'Cheksiz filiallar va yirik turistik tarmoqlar uchun', '["Cheksiz buyurtmalar", "Cheksiz xodimlar boshqaruvi", "100% Ma''lumotlar izolyatsiyasi", "Custom Domain ulanishi", "SLA barqarorlik kafolati"]'::jsonb, false);

    -- Car Showroom Plans
    INSERT INTO public.pricing_plans (vertical, name, price, currency, description, features, popular) VALUES
    ('car_showroom', 'Showroom Starter', '249 000', 'UZS', 'Kichik avtosalonlar yoki dilerlik do''konlari uchun', '["50 ta avtomobil limiti", "2 ta xodim boshqaruvi", "Test-drive taqvimi", "Standard CRM", "Shartnomalar PDF"]'::jsonb, false),
    ('car_showroom', 'Showroom Pro', '549 000', 'UZS', 'Professional avtosalonlar va dilerlik tarmoqlari uchun', '["250 ta avtomobil limiti", "10 ta xodim boshqaruvi", "Lizing & Kredit kalkulyatori", "Batafsil savdo tahlili", "Telegram Bot xabarnomalari"]'::jsonb, true),
    ('car_showroom', 'Showroom Enterprise', '1 299 000', 'UZS', 'Yirik dilerlik markazlari va ko''p filialli tarmoqlar uchun', '["Cheksiz avtomobillar", "Cheksiz xodimlar boshqaruvi", "Custom domain", "Avtoservis tizimi integratsiyasi", "SLA barqarorlik kafolati"]'::jsonb, false);

    -- Hotel Plans
    INSERT INTO public.pricing_plans (vertical, name, price, currency, description, features, popular) VALUES
    ('hotel', 'Hotel Starter', '199 000', 'UZS', 'Hostellar, mehmon uylari va kichik mehmonxonalar uchun', '["15 ta xona limiti", "3 ta xodim boshqaruvi", "Xonalar jadvali & Bron", "Standard CRM", "Invoys PDF yaratish"]'::jsonb, false),
    ('hotel', 'Hotel Pro', '499 000', 'UZS', 'O''rta kattalikdagi butik mehmonxonalar uchun', '["50 ta xona limiti", "15 ta xodim boshqaruvi", "Xonalarni tozalash jadvali", "Restoran & POS integratsiyasi", "Telegram Bot ogohlantirishlari"]'::jsonb, true),
    ('hotel', 'Hotel Premium', '999 000', 'UZS', 'Katta mehmonxonalar va dam olish maskanlari uchun', '["150 ta xona limiti", "40 ta xodim boshqaruvi", "Channel Manager integratsiyasi", "Batafsil moliya va audit", "Custom domain & brendlash"]'::jsonb, false),
    ('hotel', 'Hotel Enterprise', '1 990 000', 'UZS', 'Ko''p filialli yirik mehmonxona tarmoqlari uchun', '["Cheksiz xonalar", "Cheksiz xodimlar", "100% Ma''lumotlar izolyatsiyasi", "API va hamkorlar tizimi", "SLA barqarorlik kafolati"]'::jsonb, false);

    -- Restaurant Plans
    INSERT INTO public.pricing_plans (vertical, name, price, currency, description, features, popular) VALUES
    ('restaurant', 'Restaurant Starter', '149 000', 'UZS', 'Kichik kafelar, qahvaxonalar va fast-food shoxobchalari uchun', '["1 ta kassa (POS)", "Stollar xaritasi", "Raqamli menyu (QR)", "Buyurtmalar navbati", "Standard hisobotlar"]'::jsonb, false),
    ('restaurant', 'Restaurant Pro', '399 000', 'UZS', 'Professional restoran va kafe-barlar uchun', '["3 ta kassa (POS)", "Oshpaz ekrani (Kitchen Display)", "Ofitsiantlar mobil ilovasi", "Omborxona va kalkulyatsiya", "Telegram Bot integratsiyasi"]'::jsonb, true),
    ('restaurant', 'Restaurant Enterprise', '899 000', 'UZS', 'Yirik restoran tarmoqlari va umumiy ovqatlanish markazlari uchun', '["Cheksiz kassalar", "Filiallararo ombor integratsiyasi", "Yetkazib berish boshqaruvi", "Keng moliyaviy tahlil", "Custom domain & 24/7 VIP yordam"]'::jsonb, false);

    -- Gym Plans
    INSERT INTO public.pricing_plans (vertical, name, price, currency, description, features, popular) VALUES
    ('gym', 'Gym Starter', '149 000', 'UZS', 'Kichik fitness studiyalar va yoga markazlari uchun', '["150 ta faol a''zo", "3 ta murabbiy boshqaruvi", "A''zolik paketlari", "Standard CRM", "Darslar jadvali"]'::jsonb, false),
    ('gym', 'Gym Pro', '399 000', 'UZS', 'Kattaroq fitness klublari va sport zallari uchun', '["500 ta faol a''zo", "15 ta murabbiy boshqaruvi", "QR / FaceID kirish nazorati", "Shkafchalar nazorati", "Telegram bildirishnomalar"]'::jsonb, true),
    ('gym', 'Gym Enterprise', '899 000', 'UZS', 'Yirik sport majmualari va ko''p tarmoqli fitness zanjirlari uchun', '["Cheksiz faol a''zolar", "Cheksiz murabbiylar", "Hovuz/Spa band qilish modullari", "Batafsil moliya va HR", "Custom Domain & VIP yordam"]'::jsonb, false);

    -- Auto Service Plans
    INSERT INTO public.pricing_plans (vertical, name, price, currency, description, features, popular) VALUES
    ('auto_service', 'Auto Starter', '149 000', 'UZS', 'Kichik ustaxonalar va shinalar montaji nuqtalari uchun', '["3 ta ta''mirlash boksi", "Navbatlar boshqaruvi", "Mijozlar bazasi", "Ehtiyot qismlar hisobi", "Cheklar PDF"]'::jsonb, false),
    ('auto_service', 'Auto Pro', '399 000', 'UZS', 'Katta avtoservislar va texnik xizmat ko''rsatish markazlari uchun', '["10 ta ta''mirlash boksi", "Usta ish taqsimoti", "Ehtiyot qismlar ombori (Kalkulyatsiya)", "Telegram Bot bildirishnomalar", "Standard CRM Pipeline"]'::jsonb, true),
    ('auto_service', 'Auto Enterprise', '899 000', 'UZS', 'Yirik servis markazlari va dilerlik texnik tarmoqlari uchun', '["Cheksiz ta''mirlash bokslari", "Avtomatlashtirilgan hisob-kitoblar", "SMS debt gateway integratsiyasi", "Moliya va to''liq audit", "Custom domain & SLA kafolati"]'::jsonb, false);

    -- Clinic Plans
    INSERT INTO public.pricing_plans (vertical, name, price, currency, description, features, popular) VALUES
    ('clinic', 'Clinic Starter', '199 000', 'UZS', 'Shifokorlik kabineti / xususiy kabinetlar', '["3 ta shifokor limiti", "Bemorlar navbati taqvimi", "Elektron tibbiy kartalar", "Kassir & To''lovlar", "Invoys PDF"]'::jsonb, false),
    ('clinic', 'Clinic Pro', '599 000', 'UZS', 'Professional xususiy klinikalar va tashxis markazlari', '["15 ta shifokor limiti", "Bemorlarni qabul qilish navbati", "Retsept va yo''llanmalar", "Laboratoriya integratsiyasi", "Telegram Bot ogohlantirishlari"]'::jsonb, true),
    ('clinic', 'Clinic Enterprise', '1 299 000', 'UZS', 'Ko''p tarmoqli yirik klinikalar va kasalxonalar', '["Cheksiz shifokorlar", "Dorixona moduli integratsiyasi", "Batafsil shifokorlar analitikasi", "Custom domain & RLS", "SLA barqarorlik kafolati"]'::jsonb, false);

    -- Pharmacy Plans
    INSERT INTO public.pricing_plans (vertical, name, price, currency, description, features, popular) VALUES
    ('pharmacy', 'Pharmacy Starter', '199 000', 'UZS', 'Kichik yakka tartibdagi dorixonalar uchun', '["10 000 ta dori limiti", "2 ta kassir boshqaruvi", "Standard savdo oynasi", "Yaroqlilik muddati nazorati", "Barcode scanner integratsiyasi"]'::jsonb, false),
    ('pharmacy', 'Pharmacy Pro', '499 000', 'UZS', 'Professional dorixonalar uchun to''liq boshqaruv', '["50 000 ta dori limiti", "10 ta kassir boshqaruvi", "Yetkazib beruvchilar bazasi", "Avtomatik buyurtma tizimi", "Soliq & Chek integratsiyasi"]'::jsonb, true),
    ('pharmacy', 'Pharmacy Enterprise', '1 199 000', 'UZS', 'Yirik dorixona tarmoqlari va markaziy omborxonalar uchun', '["Cheksiz dori limiti", "Cheksiz filiallar & kassirlar", "Markaziy ombor nazorati", "Keng dorixona analitikasi", "Custom domain & SLA kafolati"]'::jsonb, false);

    -- Manufacturing Plans
    INSERT INTO public.pricing_plans (vertical, name, price, currency, description, features, popular) VALUES
    ('manufacturing', 'Mfg Starter', '299 000', 'UZS', 'Kichik Sex / Ustaxona', '["Xomashyo ombori", "BOM (Mahsulot tarkibi)", "Oddiy ishlab chiqarish bosqichlari", "Tayyor mahsulot hisobi", "Invoyslar PDF"]'::jsonb, false),
    ('manufacturing', 'Mfg Pro', '799 000', 'UZS', 'Zavod Pro', '["Ko''p bosqichli ishlab chiqarish", "Ishbay oylik hisobi", "Mahsulot tannarxi kalkulyatori", "Omborlararo transfer", "Sifat nazorati (QA) moduli"]'::jsonb, true),
    ('manufacturing', 'Mfg Enterprise', '1 699 000', 'UZS', 'Yirik sanoat korxonalari va ko''p sexli kombinatlar', '["Cheksiz xomashyo va mahsulotlar", "Ta''minot zanjiri boshqaruvi", "Barcode/RFID nazorati", "Dastgohlar yuklama tahlili", "SLA kafolati & VIP yordam"]'::jsonb, false);

    -- Parking Plans
    INSERT INTO public.pricing_plans (vertical, name, price, currency, description, features, popular) VALUES
    ('parking', 'Parking Starter', '99 000', 'UZS', 'Kichik ochiq avtoturargohlar uchun', '["1 ta kirish to''sig''i (shlagbaum)", "Soatbay to''lov hisoblagichi", "Band joylar nazorati", "Mijozlar ro''yxati", "Standard hisobotlar"]'::jsonb, false),
    ('parking', 'Parking Pro', '249 000', 'UZS', 'Professional yopiq va ko''p qavatli parkinglar', '["3 ta kirish to''sig''i", "Kamera (ANPR) integratsiyasi", "Abonementlar nazorati", "SMS debt gateway", "Telegram Bot boshqaruvi"]'::jsonb, true),
    ('parking', 'Parking Enterprise', '599 000', 'UZS', 'Aeroportlar, savdo markazlari va yirik parking tarmoqlari', '["Cheksiz kirish to''siqlari", "Smart datchiklar xaritasi", "Avtomatik to''lov terminallari", "Batafsil moliyaviy tahlil", "SLA kafolati & VIP yordam"]'::jsonb, false);

    -- Wedding Hall Plans
    INSERT INTO public.pricing_plans (vertical, name, price, currency, description, features, popular) VALUES
    ('wedding_hall', 'Wedding Starter', '299 000', 'UZS', 'Kichik tadbirlar zallari va kafelar uchun', '["Tadbirlar bandlik taqvimi", "Menyu konstruktori", "Mijozlar bazasi", "Avans to''lovlari hisobi", "Hisobotlar PDF"]'::jsonb, false),
    ('wedding_hall', 'Wedding Pro', '699 000', 'UZS', 'Professional tantanalar zallari va to''yxonalar', '["Ko''p zalli taqvim boshqaruvi", "Xomashyo & Mahsulotlar ombori", "Taomlar kalkulyatsiyasi", "Hamkorlar bazasi", "Telegram Bot ogohlantirishlari"]'::jsonb, true),
    ('wedding_hall', 'Wedding Enterprise', '1 399 000', 'UZS', 'Hashamatli tantanalar saroylari va restoran majmualari', '["Cheksiz tadbirlar & zallar", "3D stollar joylashuv xaritasi", "Batafsil HR va moliya nazorati", "Custom domain & VIP yordam", "SLA barqarorlik kafolati"]'::jsonb, false);

    -- Kindergarten Plans
    INSERT INTO public.pricing_plans (vertical, name, price, currency, description, features, popular) VALUES
    ('kindergarten', 'Kdg Starter', '149 000', 'UZS', 'Oilaviy bog''chalar va kichik guruhlar uchun', '["30 ta bola limiti", "2 ta tarbiyachi boshqaruvi", "Davomat tizimi", "Ota-onalar bilan bog''lanish", "To''lovlar hisobi"]'::jsonb, false),
    ('kindergarten', 'Kdg Pro', '399 000', 'UZS', 'Xususiy bog''chalar va bolalar markazlari uchun', '["100 ta bola limiti", "10 ta tarbiyachi boshqaruvi", "Guruhlar va dars jadvallari", "Taomnoma (ovqatlanish) hisobi", "Telegram Bot xabarnomalari"]'::jsonb, true),
    ('kindergarten', 'Kdg Enterprise', '899 000', 'UZS', 'Yirik bog''cha tarmoqlari va xususiy maktabgacha ta''lim muassasalari', '["Cheksiz bolalar & tarbiyachilar", "Avtomatik oylik billing to''lovlari", "Bolalar rivojlanish hisobotlari", "Custom domain & brending", "SLA barqarorlik kafolati"]'::jsonb, false);

    -- Library Plans
    INSERT INTO public.pricing_plans (vertical, name, price, currency, description, features, popular) VALUES
    ('library', 'Lib Starter', '99 000', 'UZS', 'Book Cafe / Kutubxona', '["1000 ta kitob limiti", "Kitobxon a''zolik kartalari", "Kitob berish va qaytarish", "Muddati o''tganlik ogohlantirishlari", "Standard hisobotlar"]'::jsonb, false),
    ('library', 'Lib Pro', '249 000', 'UZS', 'Professional kutubxonalar va maktab kutubxonalari', '["10 000 ta kitob limiti", "Barcode/QR tizimi", "Kutubxona navbatlar taqvimi", "Kitobxonlar jarimalari hisobi", "Telegram Bot integratsiyasi"]'::jsonb, true),
    ('library', 'Lib Enterprise', '599 000', 'UZS', 'Yirik kutubxona tarmoqlari uchun', '["Cheksiz kitoblar", "Raqamli kutubxona (E-book) moduli", "Filiallararo kitob qidiruv tizimi", "Custom domain ulanishi", "SLA barqarorlik kafolati"]'::jsonb, false);

    -- Cosmetics Plans
    INSERT INTO public.pricing_plans (vertical, name, price, currency, description, features, popular) VALUES
    ('cosmetics', 'Cosmetics Starter', '149 000', 'UZS', 'Kichik kosmetika do''konlari va orollar uchun', '["1 ta kassa (POS)", "Mahsulotlar ombori", "Standard CRM", "Yaroqlilik muddati nazorati", "Barcode scanner integratsiyasi"]'::jsonb, false),
    ('cosmetics', 'Cosmetics Pro', '349 000', 'UZS', 'Professional kosmetika do''konlari uchun to''liq boshqaruv', '["3 ta kassa (POS)", "Mijozlar loyallik tizimi (Bonuslar)", "Brendlar bo''yicha zaxira tahlili", "Telegram Bot integratsiyasi", "Buxgalteriya va hisobotlar"]'::jsonb, true),
    ('cosmetics', 'Cosmetics Enterprise', '799 000', 'UZS', 'Yirik kosmetika do''konlari zanjirlari va tarqatuvchilar uchun', '["Cheksiz kassalar & do''konlar", "Markaziy ulgurji ombor", "Avtomatik buyurtmalar va yetkazib berish", "Custom domain & 24/7 VIP yordam", "SLA barqarorlik kafolati"]'::jsonb, false);

    -- Stadium Plans
    INSERT INTO public.pricing_plans (vertical, name, price, currency, description, features, popular) VALUES
    ('stadium', 'Stadium Starter', '129 000', 'UZS', 'Kichik yakka tartibdagi sun''iy qoplamali stadionlar uchun', '["1 ta maydon limiti", "Soatbay bandlik taqvimi", "Mijozlar ro''yxati", "Yoritish & Dush xizmatlari hisobi", "Invoyslar PDF"]'::jsonb, false),
    ('stadium', 'Stadium Pro', '299 000', 'UZS', 'Kattaroq sport majmualari va ko''p maydonli stadionlar', '["5 ta maydon limiti", "Kiyinish xonalari taqsimoti", "Mijozlar avans to''lovlari nazorati", "Telegram Bot integratsiyasi", "Standard CRM Pipeline"]'::jsonb, true),
    ('stadium', 'Stadium Enterprise', '699 000', 'UZS', 'Yirik sport arenalari va stadionlar zanjirlari uchun', '["Cheksiz maydonlar", "Onlayn band qilish vidjeti", "Mijozlar loyallik tizimi", "SMS debt gateway", "Custom domain & SLA kafolati"]'::jsonb, false);
  END IF;
END $$;

-- 6. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
