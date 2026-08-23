-- ============================================================================
--  UniPath — bazani consulting-only holatga keltirish
--  ---------------------------------------------------------------------------
--  HOLAT (2026-08-23, kechqurun):
--    tenants ............ 0   ✅ hammasi o'chirildi
--    organizations ...... 0   ✅
--    profiles ........... 0   ✅
--    pricing_plans ...... 59  ⚠️ 55 tasi o'chirilgan vertikallarniki
--    user_roles ......... 7   ⚠️ 6 tasi eski, 1 tasi super_admin (SAQLANSIN)
--    universities ....... 20  ✅ kerak
--    countries .......... 19  ✅ kerak
--    grants ............. 8   ✅ kerak
--
--  Zaxira nusxalar (repo tashqarisida, git'ga tushmaydi):
--    C:\Users\user\Projects\unipath-tenants-backup-2026-08-23.json
--    C:\Users\user\Projects\unipath-pricing-plans-backup-2026-08-23.json
--
--  ISHLATISH: Supabase → SQL Editor → yangi query.
--  Bo'limlarni KETMA-KET ishlating va har birining natijasini tekshiring.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 0-BO'LIM · 🔴 ENG MUHIM — ommaviy sayt murojaatlarini yoqish
-- ─────────────────────────────────────────────────────────────────────────────
--  Hozir agentlikning ommaviy saytidagi "Biz bilan bog'laning" formasi
--  ISHLAMAYDI. Tekshirdim: anon kalit bilan `contact_requests` ga yozishga
--  urinilganda RLS rad etadi (42501). Ya'ni har bir mijoz murojaati yo'qoladi.
--  Konsalting agentligi uchun butun voronka shu formadan boshlanadi.
--
--  Bundan tashqari jadvalda `tenant_id` ustuni umuman yo'q — murojaat qaysi
--  agentlikka kelgani yozilmaydi.

-- 0.1  Murojaat qaysi agentlikka kelganini saqlash uchun ustun
alter table public.contact_requests
  add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

create index if not exists contact_requests_tenant_id_idx
  on public.contact_requests (tenant_id);

-- 0.2  Har kim (ro'yxatdan o'tmagan mehmon ham) murojaat qoldira olsin
drop policy if exists "anyone can submit a contact request" on public.contact_requests;
create policy "anyone can submit a contact request"
  on public.contact_requests
  for insert
  to anon, authenticated
  with check (true);

-- 0.3  Murojaatni faqat o'sha agentlik xodimlari ko'rsin
drop policy if exists "tenant members read their contact requests" on public.contact_requests;
create policy "tenant members read their contact requests"
  on public.contact_requests
  for select
  to authenticated
  using (
    tenant_id in (
      select p.tenant_id from public.profiles p where p.user_id = auth.uid()
    )
    or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'super_admin'
    )
  );

-- 0.4  Telegram bildirishnomasi navbatiga ham yozish kerak
drop policy if exists "anyone can queue a notification" on public.notification_queue;
create policy "anyone can queue a notification"
  on public.notification_queue
  for insert
  to anon, authenticated
  with check (true);

-- 0.5  Tekshirish: quyidagi INSERT xatosiz o'tishi kerak
-- insert into public.contact_requests (full_name, phone, message, source_page, status)
-- values ('Sinov', '+998900000000', 'test', 'public:test', 'new');
-- delete from public.contact_requests where source_page = 'public:test';


-- ─────────────────────────────────────────────────────────────────────────────
-- 1-BO'LIM · 🚨 XAVFSIZLIK — birinchi navbatda shuni bajaring
-- ─────────────────────────────────────────────────────────────────────────────
--  `delete_tenant_cascade` funksiyasi hozir HAR KIMGA ochiq. Men uni oddiy
--  anon kalit bilan chaqira oldim — ya'ni saytning ochiq kalitini bilgan
--  istalgan odam istalgan firmani butun ma'lumoti bilan o'chira oladi.
--
--  Quyidagi kod uni faqat super_admin uchun ochiq qoldiradi.

-- 1.1  Hozirgi holatni ko'rish
select
  p.proname,
  p.prosecdef                       as security_definer,
  pg_get_userbyid(p.proowner)       as owner,
  array_to_string(p.proacl, ', ')   as grants
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'delete_tenant_cascade';

-- 1.2  Ochiq ruxsatni olib tashlash
revoke execute on function public.delete_tenant_cascade(uuid) from anon, authenticated, public;

-- 1.3  Faqat autentifikatsiyadan o'tganlarga qaytarish
--      (funksiyaning ichida super_admin tekshiruvi 1.4 da qo'shiladi)
grant execute on function public.delete_tenant_cascade(uuid) to authenticated;

-- 1.4  Funksiya ichiga rol tekshiruvini qo'shish.
--      DIQQAT: funksiyaning mavjud tanasini avval ko'chirib oling —
--      quyidagi `...` o'rniga o'zingizning eski kodingizni qo'ying:
--
--      select pg_get_functiondef(p.oid)
--      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--      where n.nspname = 'public' and p.proname = 'delete_tenant_cascade';
--
--      Keyin boshiga shu qatorlarni qo'shing:
--
--        if not exists (
--          select 1 from public.user_roles
--          where user_id = auth.uid() and role = 'super_admin'
--        ) then
--          raise exception 'faqat super_admin firmani o''chira oladi';
--        end if;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2-BO'LIM · KERAKSIZ TARIF REJALARINI O'CHIRISH   ⚠ ma'lumot o'chadi
-- ─────────────────────────────────────────────────────────────────────────────

-- 2.1  Nima o'chishini ko'rish (faqat SELECT)
select vertical, count(*) as rejalar
from public.pricing_plans
where vertical is distinct from 'consulting'
group by vertical
order by rejalar desc;
-- kutilgan natija: academy 8, tour 4, hotel 4, va h.k. — jami 55 ta

-- 2.2  O'chirish
delete from public.pricing_plans
where vertical is distinct from 'consulting';

-- 2.3  Qolgani 4 ta consulting tarifi bo'lishi kerak
select vertical, name, price, currency, popular
from public.pricing_plans
order by popular desc, name;
-- Consulting Starter 199 000 · Consulting Pro 499 000 (mashhur)
-- Consulting Premium 1 199 000 · Office Enterprise 2 499 000


-- ─────────────────────────────────────────────────────────────────────────────
-- 3-BO'LIM · ESKI ROLLARNI TOZALASH   ⚠ ehtiyot bo'ling
-- ─────────────────────────────────────────────────────────────────────────────
--  user_roles da 7 qator qoldi. Bittasi super_admin — U O'CHIRILMASIN,
--  aks holda super-admin panelga kira olmaysiz.

-- 3.1  Kim qaysi rolda ekanini email bilan ko'rish
select u.email, ur.role, ur.organization_id
from public.user_roles ur
join auth.users u on u.id = ur.user_id
order by ur.role;

-- 3.2  super_admin roli to'g'ri emailda ekanini tasdiqlang.
--      Kod faqat shu emailni taniydi:
--      apps/unipath-core/src/hooks/useUserRole.tsx → SUPER_ADMIN_EMAILS
--      = 'unipath.community@gmail.com'
--
--      Agar super_admin boshqa emailda bo'lsa, to'g'rilang:
-- insert into public.user_roles (user_id, role)
-- select id, 'super_admin' from auth.users
-- where lower(email) = 'unipath.community@gmail.com'
-- on conflict do nothing;

-- 3.3  super_admin'dan boshqa hamma eski rolni o'chirish
delete from public.user_roles
where role <> 'super_admin';

-- 3.4  Tekshirish — bitta qator qolishi kerak
select u.email, ur.role from public.user_roles ur
join auth.users u on u.id = ur.user_id;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4-BO'LIM · TEST FOYDALANUVCHISI
-- ─────────────────────────────────────────────────────────────────────────────
--  Tekshirish uchun yaratilgan hisob. SQL bilan emas, panel orqali o'chiriladi:
--  Supabase → Authentication → Users → qa.audit.unipath@gmail.com → Delete user
select id, email, created_at from auth.users
where email = 'qa.audit.unipath@gmail.com';


-- ─────────────────────────────────────────────────────────────────────────────
-- 5-BO'LIM · O'CHIRILGAN VERTIKALLARNING JADVALLARI   ⚠⚠ QAYTARIB BO'LMAYDI
-- ─────────────────────────────────────────────────────────────────────────────
--  Kod bu jadvallarning birortasiga ham murojaat qilmaydi.
--  AVVAL ZAXIRA NUSXA OLING: Supabase → Database → Backups

-- 5.1  Qaysilari mavjud va nechta qator borligini ko'rish
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'tour_packages','tour_bookings','tour_companies','tour_company_subscriptions',
    'bookings','booking_documents','booking_agent_assignments','tours',
    'destinations','vehicles','hotels','hotel_bookings','restaurant_orders',
    'academy_groups','lessons','subjects','rooms'
  )
order by table_name;

-- 5.2  O'chirish (kommentni oching, faqat zaxiradan keyin)
-- drop table if exists public.booking_documents            cascade;
-- drop table if exists public.booking_agent_assignments    cascade;
-- drop table if exists public.tour_bookings                cascade;
-- drop table if exists public.tour_packages                cascade;
-- drop table if exists public.tour_company_subscriptions   cascade;
-- drop table if exists public.tour_companies               cascade;
-- drop table if exists public.bookings                     cascade;
-- drop table if exists public.tours                        cascade;
-- drop table if exists public.destinations                 cascade;
-- drop table if exists public.vehicles                     cascade;
-- drop table if exists public.hotels                       cascade;
-- drop table if exists public.hotel_bookings               cascade;
-- drop table if exists public.restaurant_orders            cascade;
-- drop table if exists public.academy_groups               cascade;
-- drop table if exists public.lessons                      cascade;
-- drop table if exists public.subjects                     cascade;
-- drop table if exists public.rooms                        cascade;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6-BO'LIM · DEMO UCHUN BIRINCHI AGENTLIK
-- ─────────────────────────────────────────────────────────────────────────────
--  Baza endi bo'sh. Yangi agentlikni SQL bilan emas, ilovaning o'zidan oching:
--    https://unipath-ruby.vercel.app/tizimlashtirish
--  4 bosqich: biznes → tarif → sozlash → egalik. Shunda config to'g'ri
--  to'ldiriladi va subdomen ishlaydi.
