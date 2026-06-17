# UniPath — Yagona Ekosistem: TZ va Amalga oshirish rejasi

> Maqsad: bitta platforma. Tenant ro'yxatdan o'tadi → biznes turini (vertical) tanlaydi → **tarifiga qarab** mos workspace + public sayt + end-user portal **avtomatik va shaffof** ochiladi.
> `academy` → NOVAdek · `tour` → UniTourdek · `consulting` → UniPathdek. Alohida app/sayt YO'Q.

Holat: 2026-06-15 audit asosida. Asosiy app: `apps/unipath-core` (`@unipath/core`, unipath.me).

---

## 1. Hozirgi holat (audit)

| Qatlam | Holat | Izoh |
|---|---|---|
| Admin workspace | ✅ Vertikal-birlashgan | `pages/admin/AdminDashboardPage.tsx` → business_type bo'yicha `AdminAcademy`/`AdminTour`/`AdminConsulting`/… |
| Public sayt | 🟡 Vertikal-aware, lekin yupqa | `pages/TenantPublicPage.tsx` (tour/academy/consulting bo'limlari bor, NOVA/UniTour darajasida boy emas) |
| End-user portal | ❌ Faqat consulting | `pages/student/*` — academy o'quvchi / tour mijoz uchun mos emas |
| Tarif (entitlements) | 🟡 Bor, qo'llanmagan | `packages/tenant/src/plan.ts` (starter/growth/enterprise) + `PlanGate` mavjud, UI/route'larda kam ishlatilgan |
| Alohida turishi | ❌ Muammo | `apps/nova`, `apps/unitour` alohida build; `vercel.json` host-rewrite (`nova.*→/nova`, `tour.*→/unitour`) + `scripts/merge-dist.js` |
| Dead/dublikat kod | ❌ Chalkashlik | ildiz `src/` (eski monorepogacha); core ichida dublikat: `pages/CompanyPublicSite.tsx` ↔ `tour/pages/CompanyPublicSite.tsx`, `pages/BookingPage.tsx` ↔ `tour/pages/BookingPage.tsx` va h.k. |

**Xulosa:** "birlashtirish" yarmi qilingan — admin va public qisman tayyor, lekin 2 ta alohida app, dublikat sahifalar va consultingga qotirilgan end-user portal qolib ketgan.

---

## 2. Maqsadli arxitektura

Bitta app, bitta build, bitta domen sxemasi:
```
{tenant}.unipath.me  →  apps/unipath-core  →  business_type bo'yicha hamma narsa
```
Har bir vertical uchun 3 qatlam, hammasi `activeTenant.business_type` + `plan` bilan boshqariladi:
1. **Public sayt** — `TenantPublicPage` ichidagi vertical-template (NOVA/UniTour/UniPath ko'rinishlari).
2. **Admin workspace** — `AdminDashboardPage` (allaqachon bor) + vertical sidebar.
3. **End-user portal** — vertical-aware: academy=kurs/davomat/jadval, tour=booking/to'lov, consulting=ariza/viza/hujjat.

**Entitlements qoidasi:** `ko'rinadigan modul = f(vertical, plan)`. Bitta manba: `packages/tenant` (`plan.ts` + yangi `entitlements.ts`). UI'da `<PlanGate feature=…>`, route'da `requireFeature`.

---

## 3. Bosqichli reja

### Phase 0 — Tozalash (dead code) ⚠️ destruktiv
- Ildiz `src/`, ildiz `vite.config.ts`/`index.html`/`tsconfig*`/`eslint.config.js` (legacy) — o'chirish.
- Core ichidagi dublikat sahifalar: `pages/CompanyPublicSite`, `pages/BookingPage`, `pages/ContactPage` (agar `tour/pages/*` ishlatilsa) — bittasini qoldirish.
- `CLAUDE.md` + xotirani haqiqatga moslash.
- *Natija:* faqat `apps/*` qoladi, chalkashlik yo'qoladi. Build o'zgarmaydi.

### Phase 1 — Apps birlashtirish (NOVA + UniTour → core)
- `apps/nova` va `apps/unitour` dagi KERAKLI UI/feature'lar core'ga (`src/academy/*`, `src/tour/*`) ko'chirilgan-ko'chirilmaganini tekshirish (ko'pi bor).
- Yetishmaganini ko'chirish.
- So'ng o'chirish: `apps/nova`, `apps/unitour`, `scripts/merge-dist.js`, `vercel.json` host-rewrite'lari, root `build` skriptini `build:core` ga soddalashtirish.
- *Natija:* bitta build, bitta SPA. "Alohida turishi" yo'qoladi.

### Phase 2 — End-user portal vertikal-aware
- `StudentLayout` + `pages/student/*` ni vertical bo'yicha shoxlash (yoki `CustomerPortal`/`LearnerPortal`/`ClientPortal`).
- academy: kurslar, davomat, jadval, to'lovlar (NOVAdan); tour: bronlar, to'lov, hujjatlar (UniTourdan); consulting: hozirgi oqim.

### Phase 3 — Public sayt template'larini boyitish
- `TenantPublicPage` vertical-template'larini NOVA/UniTour bosh sahifalari darajasiga yetkazish (hero, bo'limlar, lead forma).

### Phase 4 — Tarif (entitlements) — shaffof va haqiqiy
- `packages/tenant/entitlements.ts`: `(vertical, plan) → modullar/limitlar`.
- UI: `<PlanGate>` bilan qulflangan funksiyalar (blur + "Pro'ga o'ting"); AdminSettings'da "Sizning tarifingiz" jadvali (real ko'rsatilgandek).
- Route guard: `requireFeature` — tarifsiz route'ga kirsa, upgrade sahifasi.
- Limitlar majburlash: `maxStaff`, `maxBranches` (AssignAgent/Users qo'shishda).

### Phase 5 — Onboarding va routing tuzatish
- `Systematize` → to'g'ri `business_type` + `modules` + `plan` yozish; `AdminWelcome` → vertical workspace'ga.
- Buzilgan/eski yo'naltirishlarni (link/redirect) tuzatish; `DashboardRedirect` rol+vertical bo'yicha.

### Phase 6 — Migration, QA, deploy
- DB: entitlements/limit ustunlari kerak bo'lsa (`crm_stages` uslubida `.sql`).
- Multi-tenant izolyatsiya tekshiruvi (audit'da boshlandi: AdminStudents/Applications/Documents tuzatildi).
- Typecheck + build + deploy.

---

## 4. Qaror nuqtalari (sizdan tasdiq kerak)
1. `apps/nova` va `apps/unitour` **butunlay o'chirilsinmi**? (Vision = ha. Bu hard-to-reverse, shuning uchun tasdiq.)
2. Subdomenlar: `nova.unipath.me` / `tour.unipath.me` kabilar oddiy **tenant subdomain**ga aylansinmi (host-rewrite o'chadi)?
3. Tarif nomlari: **Starter / Pro (Growth) / Enterprise** shu qolsinmi?
4. Boshlash tartibi: Phase 0 (tozalash) dan boshlaymizmi, yoki avval Phase 4 (tariflar) muhimroqmi?

---

## 5. Audit'da allaqachon tuzatilgan (shu ekosistem ishi doirasida)
- Konsalting CRM `crm_stages` jadvaliga ko'chirildi (agent_students buzilishi tugatildi) — `supabase_crm_stages.sql`.
- AdminStudents/Applications/Documents tenant bo'yicha scope qilindi (impersonation ma'lumot oqishi tugatildi).
- `JSON.parse(active_tenant)` crash guard (AdminDashboardPage, AdminCRM).
- Telegram `@` normalizatsiyasi (AdminCRM).
