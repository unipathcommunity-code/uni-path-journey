-- ============================================================================
--  UniPath — consulting-only ma'lumotlar bazasini tozalash
--  ---------------------------------------------------------------------------
--  Kod endi faqat `consulting` vertikalini biladi. Bu skript bazani shu
--  holatga keltiradi.
--
--  ISHLATISH: Supabase SQL Editor -> yangi query -> shu faylni joylashtiring.
--  BO'LIMLARNI KETMA-KET ishlating va har birining natijasini tekshiring.
--
--  DIQQAT: 3- va 4-bo'lim ma'lumot O'CHIRADI. Avval 0-bo'limni ishlatib,
--  nima o'chishini ko'ring.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 0-BO'LIM · TEKSHIRUV (hech narsani o'zgartirmaydi — avval shuni ishlating)
-- ─────────────────────────────────────────────────────────────────────────────

-- 0.1  Qaysi tenant'lar hali eski vertikalda?
select id, name, subdomain, status, vertical, config->>'business_type' as cfg_business_type
from public.tenants
where vertical is distinct from 'consulting'
   or config->>'business_type' is distinct from 'consulting'
order by name;

-- 0.2  Tarif rejalari vertikal bo'yicha nechtadan?
select coalesce(vertical, '(null)') as vertical, count(*) as plans
from public.pricing_plans
group by 1
order by plans desc;

-- 0.3  Qaysi tariflar hozir tenant'lar tomonidan ishlatilyapti?
--      (o'chirishdan oldin shuni ko'ring — ishlatilayotgani o'chib ketmasin)
select p.vertical, p.name, count(t.id) as used_by_tenants
from public.pricing_plans p
left join public.tenants t on t.plan = p.name
group by p.vertical, p.name
having count(t.id) > 0
order by used_by_tenants desc;


-- ─────────────────────────────────────────────────────────────────────────────
-- 1-BO'LIM · TENANT'LARNI CONSULTING'GA O'TKAZISH  (xavfsiz, ma'lumot yo'qolmaydi)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1.1  `vertical` ustunini to'g'rilash.
--      Eslatma: `vertical` enum bo'lsa va 'consulting' qiymati unda bo'lmasa,
--      bu xato beradi — u holda avval 1.0 ni ishlating.
update public.tenants
set vertical = 'consulting'
where vertical is distinct from 'consulting';

-- 1.2  config.business_type va config.modules ni tozalash:
--      barcha eski vertikal bayroqlarini olib tashlab, faqat consulting qoldiramiz.
--      Funksional bayroqlar (billing, ai_camera, crm, payments, ...) saqlanadi.
update public.tenants
set config = jsonb_set(
      jsonb_set(
        coalesce(config, '{}'::jsonb),
        '{business_type}',
        '"consulting"'::jsonb,
        true
      ),
      '{modules}',
      (
        coalesce(config->'modules', '{}'::jsonb)
          - 'tour' - 'academy' - 'hotel' - 'restaurant' - 'clinic' - 'gym'
          - 'manufacturing' - 'parking' - 'auto_service' - 'wholesale'
          - 'wedding_hall' - 'kindergarten' - 'library' - 'cosmetics'
          - 'stadium' - 'pharmacy' - 'car_showroom' - 'nova' - 'unitour'
          - 'tour_catalog' - 'tour_bookings' - 'visa_tracker'
          - 'qr_attendance' - 'ai_tutor' - 'live_classes' - 'nova_store'
          - 'ai_presentation' - 'homework' - 'parent_mirror' - 'biometric'
          - 'ai_lesson_planner'
      ) || '{"consulting": true}'::jsonb,
      true
    );

-- 1.3  Natijani tekshirish — hammasi consulting bo'lishi kerak
select vertical, config->>'business_type' as cfg, count(*)
from public.tenants
group by 1, 2;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2-BO'LIM · SUPER-ADMIN VA ROLLARNI TEKSHIRISH
-- ─────────────────────────────────────────────────────────────────────────────

-- 2.1  Kim super_admin? Kod `unipath.community@gmail.com` ni tan oladi
--      (apps/unipath-core/src/hooks/useUserRole.ts -> SUPER_ADMIN_EMAILS).
--      Quyidagi natijadagi email shu bilan mos kelishi kerak.
select u.email, ur.role, ur.organization_id
from public.user_roles ur
join auth.users u on u.id = ur.user_id
where ur.role in ('super_admin', 'superadmin');

-- 2.2  Agar mos kelmasa — to'g'ri hisobga super_admin bering:
--      (emailni almashtiring va kommentni oching)
-- insert into public.user_roles (user_id, role)
-- select id, 'super_admin' from auth.users where lower(email) = 'unipath.community@gmail.com'
-- on conflict do nothing;

-- 2.3  profiles.role ham mos bo'lsin (server tomonidagi RLS shunga qaraydi)
-- update public.profiles p
-- set role = 'super_admin'
-- from auth.users u
-- where u.id = p.user_id and lower(u.email) = 'unipath.community@gmail.com';


-- ─────────────────────────────────────────────────────────────────────────────
-- 3-BO'LIM · KERAKSIZ TARIF REJALARINI O'CHIRISH   ⚠ MA'LUMOT O'CHADI
-- ─────────────────────────────────────────────────────────────────────────────
--  0.3 ni ishlatib, o'chirilayotgan tarif hech bir tenant tomonidan
--  ishlatilmayotganiga ishonch hosil qiling. Ishlatilayotgani bo'lsa —
--  avval o'sha tenant'ni consulting tarifiga o'tkazing.

-- 3.1  Nima o'chishini ko'rish (bu faqat SELECT)
select id, vertical, name, price
from public.pricing_plans
where vertical is distinct from 'consulting'
order by vertical, name;

-- 3.2  O'chirish (kommentni oching)
-- delete from public.pricing_plans
-- where vertical is distinct from 'consulting';


-- ─────────────────────────────────────────────────────────────────────────────
-- 4-BO'LIM · O'CHIRILGAN VERTIKALLARNING JADVALLARI   ⚠⚠ QAYTARIB BO'LMAYDI
-- ─────────────────────────────────────────────────────────────────────────────
--  Kod bu jadvallarning birortasiga ham murojaat qilmaydi. Lekin ular
--  ichida eski ma'lumot bo'lishi mumkin. AVVAL ZAXIRA NUSXA OLING
--  (Supabase -> Database -> Backups), keyin kommentni oching.

-- 4.1  Har birida nechta qator borligini ko'rish
select 'tour_packages'   as t, count(*) from public.tour_packages   union all
select 'tour_bookings',       count(*) from public.tour_bookings    union all
select 'tour_companies',      count(*) from public.tour_companies   union all
select 'bookings',            count(*) from public.bookings         union all
select 'tours',               count(*) from public.tours            union all
select 'destinations',        count(*) from public.destinations     union all
select 'academy_groups',      count(*) from public.academy_groups;
-- (jadval mavjud bo'lmasa xato beradi — o'sha qatorni olib tashlang)

-- 4.2  O'chirish (kommentni oching, faqat zaxiradan keyin)
-- drop table if exists public.booking_documents      cascade;
-- drop table if exists public.booking_agent_assignments cascade;
-- drop table if exists public.tour_bookings          cascade;
-- drop table if exists public.tour_packages          cascade;
-- drop table if exists public.tour_company_subscriptions cascade;
-- drop table if exists public.tour_companies         cascade;
-- drop table if exists public.bookings               cascade;
-- drop table if exists public.tours                  cascade;
-- drop table if exists public.destinations           cascade;
-- drop table if exists public.vehicles               cascade;
-- drop table if exists public.hotels                 cascade;
-- drop table if exists public.hotel_bookings         cascade;
-- drop table if exists public.restaurant_orders      cascade;
-- drop table if exists public.academy_groups         cascade;
-- drop table if exists public.lessons                cascade;
-- drop table if exists public.subjects               cascade;
-- drop table if exists public.rooms                  cascade;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5-BO'LIM · DEMO UCHUN TOZA TARIFLAR  (ixtiyoriy)
-- ─────────────────────────────────────────────────────────────────────────────
--  Agar 3-bo'limdan keyin consulting tariflari yetarli bo'lmasa, quyidagi
--  to'plamni qo'shishingiz mumkin. `on conflict` yo'q — takror qo'shmang.

-- insert into public.pricing_plans (vertical, name, price, currency, description, features, popular)
-- values
--   ('consulting', 'Consulting Starter', '199 000', 'UZS',
--    'Kichik konsalting va viza markazlari uchun',
--    '["100 ta arizachi limiti","3 ta xodim","Hujjatlarni avtomatlashtirish","Standard CRM Pipeline"]'::jsonb,
--    false),
--   ('consulting', 'Consulting Pro', '499 000', 'UZS',
--    'Professional konsalting agentliklari uchun',
--    '["500 ta arizachi limiti","15 ta xodim","Universitetlar bazasi","Buxgalteriya va to''lovlar","Telegram bot"]'::jsonb,
--    true),
--   ('consulting', 'Consulting Premium', '1 199 000', 'UZS',
--    'Yirik konsalting tarmoqlari uchun',
--    '["1500 ta arizachi limiti","40 ta xodim","Hamkor universitetlar portali","Mentor va kutib olish","Custom branding"]'::jsonb,
--    false);
