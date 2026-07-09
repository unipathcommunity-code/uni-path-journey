# UniPath — TZ va Rivojlanish Rejasi (2026-07)

> Bu hujjat butun tizim auditi asosida tuzilgan: xulosa, mavjud holat, xavflar va bosqichma-bosqich reja.

---

## 1. XULOSA — UniPath nima?

**UniPath = ko'p-tenantli (multi-tenant) SaaS ekotizim** — HAR QANDAY biznesni tizimlashtirish uchun.
Bitta kod bazasi, har biznesga alohida subdomain (`biznes.unipath.me`) va vertikaliga mos panel.

- **17 vertikal**: consulting, tour, academy, hotel, restaurant, clinic, gym, manufacturing, parking,
  auto_service, wholesale, wedding_hall, kindergarten, library, cosmetics, stadium, pharmacy, car_showroom.
- **Ikki to'liq tizim ichiga singdirilgan** (alohida sayt/build YO'Q):
  - **NOVA** → `src/academy/` — **faqat o'quv markaz** OS (talaba/o'qituvchi/admin/owner/ota-ona/buxgalter).
  - **UniTour** → `src/tour/` — **faqat tur-kompaniya** OS (kompaniya/agent/operator/sayohatchi).
- `EcosystemRouter` subdomain vertikaliga qarab to'g'ri daraxtni ochadi — aralashmaydi.
- Identity: **bitta email → ko'p biznes** (`tenant_memberships`), har biznesda alohida rol.

---

## 2. MAVJUD HOLAT (tekshirilgan, ishlaydi)

- ✅ **DB to'liq**: NOVA + UniTour + 6 yangi vertikal (restoran/hotel/to'yxona/gym) jadvallari,
  86+ jadval, 44 qayta tiklangan, 37 foreign key, RPClar, storage buckets. **Audit: 0 yetishmaydi.**
- ✅ **Query smoke-test**: barcha vertikal dashboard so'rovlari xatosiz.
- ✅ **Deploy**: Vercel CLI orqali (`npx vercel --prod`). Git push avtomatik deploy QILMAYDI.
- ✅ **Yagona super admin**: `unipath.community@gmail.com` (backdoorlar olib tashlandi).
- ✅ **Hook-crash** (AgentDashboard) tuzatildi; rules-of-hooks: 0.
- ✅ **Brending**: logo yuklash (Systematize + AdminSettings), 3D IconBadge, tema presetlari.
- ✅ **Super admin panel**: firma yaratish/tasdiqlash/o'chirish, impersonatsiya, modullar, tariflar,
  Telegram, tema, real foydalanuvchi soni.

---

## 3. XAVFLAR / KAMCHILIKLAR (halol)

| # | Muammo | Ta'sir | Yechim (reja) |
|---|--------|--------|---------------|
| A | **Qayta tiklangan tour jadvallari RLS'i bo'sh** (authenticated hamma o'qiy/yozadi) | Xavfsizlik: bir tur-firma boshqasining ma'lumotini ko'rishi mumkin | Faza 2: tenant/company-scoped RLS |
| B | **JWT custom claims to'ldirilmagan** (`extractJWTClaims` bor, lekin server hook yo'q) | Rol/tenant har so'rovda DB'dan o'qiladi (sekinroq) | Faza 3: Supabase auth hook |
| C | **RLS tenant-scoped emas** — `get_auth_user_role()` faqat rolni tekshiradi, tenantni emas | Bir vertikalda admin boshqa tenant ma'lumotini ko'rishi mumkin | Faza 2: `tenant_id = current_tenant()` qo'shish |
| D | **`bootstrap_current_user()` "birinchi tenant" defaulti** jonli DB'da | Yangi user noto'g'ri tenantga bog'lanishi mumkin | Faza 1: join_tenant bilan almashtirish (qisman qilingan) |
| E | **UI/UX nomutanosibliklari** — ba'zi eski vertikallar (clinic/parking/cosmetics...) hali mock | Ko'rinish nomuvofiq | Faza 2: qolgan 10 vertikalni real DB + tab-shellga o'tkazish |
| F | **Migratsiya tarixi jonli DB bilan nomuvofiq** — `supabase db push` ishlamaydi | Faqat qo'lda (pg/pooler) qo'llash mumkin | Faza 3: migration baseline tiklash |

---

## 4. SUPER ADMIN PANEL — mavjud + qo'shiladigan

**Mavjud:** Firmalar (CRUD), foydalanuvchilar, to'lovlar, analitika, domenlar, bildirishnomalar,
impersonatsiya, modul/tarif/tema/Telegram boshqaruvi.

**Qo'shish tavsiya (prioritet bo'yicha):**
1. **Firma tafsilot statistikasi** — har firma uchun real: foydalanuvchilar, daromad, faollik (oxirgi kirish),
   vertikalga xos KPI (o'quvchi soni / bron soni / buyurtma soni).
2. **Status boshqaruvi** — approve/reject'dan tashqari **suspend/reactivate** (to'lamagan firmani vaqtincha to'xtatish).
3. **Tarifni o'zgartirish** — mavjud firmaning tarif/tier'ini panel orqali o'zgartirish (hozir faqat yaratishda).
4. **Global monitoring** — platforma bo'ylab: jami daromad, faol firmalar, xato loglar, tizim salomatligi.
5. **Audit log** — super admin amallari (kim, qachon, nima o'zgartirdi).
6. **Ommaviy amallar** — bir nechta firmaga bir vaqtda modul yoqish, xabar yuborish.

---

## 5. ROADMAP (bosqichma-bosqich)

### Faza 1 — Barqarorlik (DONE / davom etmoqda)
DB rekonstruksiya ✅, hook-crash ✅, yagona super admin ✅, real statistika ✅, deploy avtomatlashtirish ✅.
Qoldiq: `bootstrap_current_user` tozalash, qolgan hook/UI mayda baglar (smoke-test + webapp-testing bilan).

### Faza 2 — Xavfsizlik va mukammallik
1. **Tenant-scoped RLS** — barcha vertikal jadvallariga `tenant_id`/`company_id` bo'yicha RLS
   (hozirgi bo'sh RLS o'rniga). Bu eng muhim xavfsizlik ishi.
2. **Qolgan 10 vertikal** (clinic, parking, cosmetics, kindergarten, library, stadium, wholesale,
   pharmacy, manufacturing, auto_service) — mock'dan real DB + tab-shell + public bron'ga o'tkazish
   (restoran/hotel andozasi bilan).
3. **Super admin qo'shimcha funksiyalar** (4-bo'lim: suspend, tarif o'zgartirish, monitoring, audit).

### Faza 3 — Ko'lam va tezlik
1. **JWT custom claims** (Supabase auth hook) — rol/tenant/plan tokenga, DB so'rovlarsiz tez ruxsat.
2. **Migration baseline** — jonli DB bilan sinxron, `supabase db push` tiklash.
3. **AI assistent** har vertikalда (public chat widget), **email bildirishnoma** (SMTP).
4. **Advanced analitika** — hotel occupancy/RevPAR, clinic navbat, gym davomat, restoran smena-kassa.

### Faza 4 — Biznes
Billing avtomatlashtirish (Payme/Click integratsiya), plan-limit majburlash (`PlanGate` server-side),
white-label custom domenlar, mobil ilova (PWA allaqachon bor).

---

## 6. XAVFSIZLIK — darhol e'tibor
1. **Tour jadvallari RLS** (Xavf A) — birinchi navbatda.
2. **DB paroli** jonli — rotatsiya tavsiya (bir necha marta chatda ishlatilgan).
3. **Anon insert policylar** — spam himoyasi (rate-limit / captcha public formlarda).

---

*Har faza mustaqil deploy qilinadi. Prioritet: Faza 2.1 (tenant-scoped RLS) — eng katta xavfsizlik yutug'i.*
