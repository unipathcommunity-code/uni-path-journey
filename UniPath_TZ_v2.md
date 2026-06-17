# UniPath Ekosistema — To'liq Texnik Vazifa (TZ)
### Versiya 2.1 | 2026-yil, May (Yangilangan)
### Muallif: Behruz Hasanov | unipath.community@gmail.com

---

## MUNDARIJA

1. [Loyiha Haqida](#1-loyiha-haqida)
2. [Bozor Tahlili va Raqobatchilar](#2-bozor-tahlili-va-raqobatchilar)
3. [Ekosistema Arxitekturasi](#3-ekosistema-arxitekturasi)
4. [Vertikal Modullar Tizimi](#4-vertikal-modullar-tizimi)
5. [Rollar va Huquqlar Matritsasi](#5-rollar-va-huquqlar-matritsasi)
6. [NOVA Moduli — O'quv Markaz SaaS](#6-nova-moduli--oquv-markaz-saas)
7. [UniTour Moduli — Tur Agentlik SaaS](#7-unitour-moduli--tur-agentlik-saas)
8. [UniPath Core — Universal Biznes SaaS](#8-unipath-core--universal-biznes-saas)
9. [Umumiy Shared Modullar](#9-umumiy-shared-modullar)
10. [Ma'lumotlar Bazasi Sxemasi](#10-malumotlar-bazasi-sxemasi)
11. [Tariflar va Monetizatsiya](#11-tariflar-va-monetizatsiya)
12. [UI/UX Talablari](#12-uiux-talablari)
13. [API va Integratsiyalar](#13-api-va-integratsiyalar)
14. [Implementatsiya Rejasi (Fazalar)](#14-implementatsiya-rejasi-fazalar)
15. [Zaif Tomonlar va Tavsiyalar](#15-zaif-tomonlar-va-tavsiyalar)

---

## 1. LOYIHA HAQIDA

### 1.1 Vizion

**UniPath** — O'zbekiston va MDH bozori uchun yaratilgan, bir necha soha vertikallarini qamrab oluvchi **ko'p-tenant (multi-tenant) SaaS platforma ekosistema**si. Har bir biznes o'z sohasiga mos ravishda moslashtirilgan ilovadan foydalanadi — bitta akkaunt, bitta subscriptsiya, bitta dashboard.

> **Maqsad:** "Har bir O'zbek biznesiga Zoho/Odoo darajasida professional, lekin o'z tiliga va biznes madaniyatiga moslashtirilgan raqamli boshqaruv tizimi."

### 1.2 Ekosistema Tarkibi

```
UniPath Platforma Ekosistema
├── UniPath Core          → Universal bizneslar (consulting, restoran, fitnes, do'kon, klinika...)
├── NOVA (edu)            → O'quv markazlar, maktablar, kurslar, akademiyalar
└── UniTour (travel)      → Tur agentliklar, sayohat kompaniyalar
```

Har uch loyiha bitta **platformada** ishlayd, bitta **Supabase** backend, bitta **autentifikatsiya** tizimi, ammo alohida **vertikal UI/UX** va **DB namespace**ga ega.

### 1.3 Hozirgi Holat (Baseline — 2026 May)

| Loyiha | Holat | Asosiy gap |
|--------|-------|-----------|
| UniPath Core | ✅ MVP ishlayapti | Multi-branch, CRM, Accounting, role system, plan limits mavjud |
| NOVA | ✅ MVP ishlayapti | O'quv markaz uchun to'liq. Alohida Supabase instance |
| UniTour | ✅ MVP ishlayapti | Tur kompaniya uchun to'liq. Alohida Supabase instance |
| **Integratsiya** | 🔄 Rejalashtirilgan | Uch loyiha hozir alohida. TZ maqsadi — birlashtirish |

### 1.4 v2.1 Implementatsiya Natijalari (Yangi)

Bu versiyada quyidagi muhim xususiyatlar implement qilindi:

| Modul | Xususiyat | Holat |
|-------|-----------|-------|
| `usePlanLimits.ts` | `planToTier()` helper, TIER_FEATURES map, `canAddBranch`, `canAddStaff` | ✅ Tayyor |
| `AdminLayout.tsx` | NOVA/UniTour vertikal nav, plan-gated sections, BranchSwitcher | ✅ Tayyor |
| `AdminCRM.tsx` | Kanban pipeline (Lead→Viza→Kirdi), 6 bosqich, drag UX | ✅ Tayyor |
| `AdminAccounting.tsx` | Daromad/xarajat, P&L hisobot, UpgradeGate (Starter) | ✅ Tayyor |
| `BranchSwitcher.tsx` | Sidebar kompakt branch tanlash, plan limit badge | ✅ Tayyor |
| `useBranches.ts` | Branch CRUD, plan limit enforcement, active branch | ✅ Tayyor |
| `UpgradeGate.tsx` | Bug fix: `useTranslation` → `useApp()` + ternary i18n | ✅ Tuzatildi |
| `Index.tsx` | Hooks bug (useEffect after return) tuzatildi, Verticals showcase | ✅ Tuzatildi |
| `pricing.ts` | Russian (`descRu`, `featuresRu`) qo'shildi | ✅ Yangilandi |
| `vercel.json` | Security headers, asset caching, framework config | ✅ Tayyor |
| `.env.example` | Deployment uchun env variables hujjatlash | ✅ Yangi |
| `AdminDashboardPage.tsx` | Universal (consulting-neytral) labels, CRM/Accounting shortcuts | ✅ Yangilandi |

---

## 2. BOZOR TAHLILI VA RAQOBATCHILAR

### 2.1 Global Raqobatchilar

#### Gorizontal (Ko'p soha) Platformalar

| Platforma | Narx | Kuchli tomoni | Zaif tomoni |
|-----------|------|---------------|-------------|
| **Zoho One** | $37–$105/foydalanuvchi/oy | 55+ ilova, yaxshi integratsiya | Qimmat, UI murakkab, O'zbek yo'q |
| **Odoo** | $24.90/foydalanuvchi/oy | Open-source, modulli | Deployment qiyin, texnik bilim kerak |
| **HubSpot** | $20–$800/oy | CRM kuchli, marketing automation | Cheksiz narx oshishi, faqat CRM |
| **Monday.com** | $9–$29/foydalanuvchi/oy | Vizual, qulay | Biznes vertikali yo'q |

#### Vertikal (Soha-specific) Raqobatchilar

| Soha | Raqobatchi | Kamchilik |
|------|-----------|----------|
| O'quv markaz | **Classter, EdisonOS, Moodle** | O'zbek yo'q, MDH uchun emas |
| Tur agentlik | **Moonstride, FareHarbor, Tern** | Qimmat ($200–$500/oy), O'zbek yo'q |
| Universal biznes | **AmoCRM, Bitrix24** | Murakkab, O'zbek yo'q |

#### MDH/O'zbekiston Bozori

| Platforma | Soha | Kamchilik |
|-----------|------|----------|
| **Bitrix24** | Universal | Juda murakkab, rus UI |
| **1C** | Buxgalteriya | Desktop, qadimiy |
| **REZVO** | Mehmonxona | Faqat bitta soha |
| **ETCITA** | Moliya | Faqat soliq/hisob |

### 2.2 UniPath Raqobat Ustunligi

```
✅ O'zbek / Rus / Ingliz — 3 til
✅ O'zbek biznes madaniyatiga moslashgan
✅ Affordable: $29–$199/oy (Zoho ga nisbatan 3x arzon)
✅ Vertikal ixtisoslashuv — har soha uchun alohida modul
✅ Multi-tenant white-label — har kompaniya o'z domeni
✅ AI-kamera, Telegram bot — mahalliy bozor uchun kerakli
✅ Ko'p-filial boshqaruvi — O'zbekiston realiyasiga mos
```

### 2.3 Bozor Hajmi (O'zbekiston)

- O'quv markazlar: ~15,000+ (faqat Toshkentda 3,000+)
- Tur agentliklar: ~2,500+ ro'yxatdan o'tgan
- Fitnes, klinika, restoran, do'kon: ~500,000+ SME
- Maqsadli segment: 50,000 biznes, konversiya 2% = **1,000 to'lovchi mijoz**

---

## 3. EKOSISTEMA ARXITEKTURASI

### 3.1 Umumiy Arxitektura

```
┌─────────────────────────────────────────────────────────┐
│                   UniPath Platforma                      │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  UniPath Core │  │    NOVA      │  │   UniTour    │  │
│  │  (biznes)    │  │  (ta'lim)    │  │   (travel)   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │           │
│  ┌──────▼─────────────────▼──────────────────▼───────┐  │
│  │              Shared Core Layer                     │  │
│  │  Auth · Billing · Notifications · Analytics       │  │
│  │  Branch System · Role System · File Storage       │  │
│  └───────────────────────┬───────────────────────────┘  │
│                          │                               │
│  ┌───────────────────────▼───────────────────────────┐  │
│  │                 Supabase Backend                   │  │
│  │  PostgreSQL · Auth · Storage · Realtime · Edge    │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Multi-Tenant Modelı

```
tenants jadvali
├── id, slug, name, plan, vertical
├── config (JSON): { branding, modules, features }
└── vertical: 'core' | 'nova' | 'unitour'

Tenant aniqlash usullari:
1. Custom domain: firma.unipath.me → slug lookup
2. Query param: ?tenant=firma
3. Session storage: unipath_session_tenant
4. Path: /c/:slug (public saytlar uchun)
```

### 3.3 Feature Flag Tizimi

```typescript
// Har tenant uchun feature yoqish/o'chirish
interface TenantFeatureFlags {
  // Core features (hammada bor)
  crm: boolean;
  accounting: boolean;
  branches: boolean;
  telegram_bot: boolean;
  
  // NOVA-specific
  lessons: boolean;
  attendance: boolean;
  certificates: boolean;
  ai_lesson_planner: boolean;
  parent_portal: boolean;
  website_builder: boolean;
  
  // UniTour-specific
  tour_bookings: boolean;
  tour_catalog: boolean;
  agent_network: boolean;
  wishlist: boolean;
  travel_planner: boolean;
  
  // Plan-gated
  ai_camera: boolean;
  custom_domain: boolean;
  api_access: boolean;
  white_label: boolean;
}
```

### 3.4 Vertikal Tanlov Mantigi

```
Foydalanuvchi ro'yxatdan o'tganda:
  1. Soha tanlaydi: "Nima boshqarmoqchisiz?"
     → O'quv markaz / Maktab / Kurs → vertical = 'nova'
     → Tur agentlik / Sayohat → vertical = 'unitour'
     → Boshqa biznes → vertical = 'core'
  
  2. Tarif tanlaydi: Starter / Growth / Enterprise
  
  3. Tizim avtomatik:
     - Tegishli modullarni yoqadi
     - Dashboard ko'rinishini moslashtiradi
     - Onboarding flow ni ko'rsatadi
```

---

## 4. VERTIKAL MODULLAR TIZIMI

### 4.1 UniPath Core Vertikali — Qo'llab-quvvatlanadigan Soha Turlari

```
vertical: 'core'
  ├── consulting       → Ta'lim konsalting, chet el ta'limi
  ├── fitness          → Fitnes zal, sport markaz
  ├── restaurant       → Restoran, cafe, food delivery
  ├── clinic           → Klinika, stomatologiya, go'zallik salon
  ├── retail           → Do'kon, savdo
  ├── real_estate      → Qo'chmas mulk
  ├── logistics        → Yuk tashish, kuryer
  ├── it_agency        → IT kompaniya, dizayn studiya
  └── general          → Boshqa
```

### 4.2 NOVA Vertikali — Ta'lim Muassasalari

```
vertical: 'nova'
  ├── language_center  → Ingliz, Rus, Xitoy, Korea tili kurslari
  ├── it_school        → Dasturlash, IT kurslari
  ├── university_prep  → IELTS, SAT, OTM tayyorlov
  ├── school           → Xususiy maktab, lisey
  ├── kindergarten     → Bog'cha, maktabgacha ta'lim
  └── driving_school   → Avto maktab
```

### 4.3 UniTour Vertikali — Sayohat Soha

```
vertical: 'unitour'
  ├── tour_operator    → To'liq tur operatori
  ├── travel_agency    → Tur agentlik (boshqa operatorlar touri sotadi)
  ├── visa_center      → Viza markaz
  └── hotel_booking    → Mehmonxona bron qilish
```

---

## 5. ROLLAR VA HUQUQLAR MATRITSASI

### 5.1 Universal Rollar (Barcha Vertikallarda)

| Rol | Tavsif | Dashboard |
|-----|--------|-----------|
| `super_admin` | Platforma egasi (UniPath jamoa) | Barcha tenant ko'rish, super panel |
| `admin` | Platforma moderatori | Tenant boshqarish |
| `owner` | Biznes egasi | To'liq nazorat, billing |
| `manager` | Menejer | Xodimlar, hisobotlar |
| `accountant` | Buxgalter | Faqat moliya moduli |

### 5.2 Core Vertikali — Qo'shimcha Rollar

| Rol | Tavsif | Kirish imkoni |
|-----|--------|---------------|
| `specialist` | Mutaxassis / Maslahatchi | O'z mijozlari, CRM |
| `agent` | Agent | Leadlar, komissiya |

### 5.3 NOVA Vertikali — Ta'lim Rollari

| Rol | Tavsif | Dashboard |
|-----|--------|-----------|
| `teacher` | O'qituvchi | Guruhlar, darslar, uyga vazifa, testlar, daromad |
| `student` | O'quvchi | Jadval, uyga vazifa, sertifikat, balans, AI chatbot |
| `parent` | Ota-ona | Farzand monitoring: davomat, baho, to'lov |
| `accountant` | Buxgalter (nova) | Oylik to'lovlar, qarzdorlar, o'qituvchi maoş |

### 5.4 UniTour Vertikali — Sayohat Rollari

| Rol | Tavsif | Dashboard |
|-----|--------|-----------|
| `tour_agent` | Tur agenti | O'z mijozlari, turlar, komissiya, referallar |
| `booking_manager` | Bron menejeri | Barcha bronlar, holat yangilash |
| `guide` | Gid | Tayinlangan turlar, mijoz ma'lumoti |
| `driver` | Haydovchi | Tayinlangan marshrut, kontaktlar |

### 5.5 Huquqlar Matritsasi (Core + NOVA)

| Resurs | super_admin | owner | manager | accountant | teacher | specialist | student |
|--------|:-----------:|:-----:|:-------:|:----------:|:-------:|:----------:|:-------:|
| Tenant boshqarish | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Xodimlar CRUD | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| CRM Pipeline | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Buxgalteriya | ✅ | ✅ | ko'rish | ✅ | ❌ | ❌ | ❌ |
| Guruhlar/Darslar | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ko'rish |
| Davomat | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | o'zi |
| Sertifikatlar | ✅ | ✅ | ✅ | ❌ | ✅ (berish) | ❌ | ko'rish |
| Billing/Tarif | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Website Builder | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 6. NOVA MODULI — O'QUV MARKAZ SAAS

### 6.1 Mavjud Funksiyalar (Baseline — Saqlash Kerak)

#### 6.1.1 O'qituvchi Paneli
- **TodayCommandCenter** — bugungi darslar, o'quvchi davomati, vazifalar
- **AILessonPlanner** — AI yordamida dars rejasi tuzish
- **AIPresentationGenerator** — AI taqdimot yaratish
- **TestBuilder** — test va savolnoma yaratish
- **HomeworkCRUD** — uyga vazifa berish, baholash
- **SyllabusManager** — dastur va o'quv rejasi
- **ResourceLibrary** — o'quv materiallari kutubxona
- **CertificateIssueModal** — sertifikat berish
- **MyEarnings** — o'qituvchi daromadi va to'lovlar

#### 6.1.2 O'quvchi Paneli
- **ScheduleTimeline** — dars jadvali (real-time)
- **ProgressCompass** — o'quv progressi vizualizatsiyasi
- **StudentTests** — testlarni topshirish
- **HomeworkPanel** — uyga vazifa ko'rish/topshirish
- **CertificatesList** — olingan sertifikatlar
- **PaymentTracker** — to'lov tarixi va qarzdorlik
- **BalancePanel** — balans va UniCoin
- **AIChatbot** — AI yordamchi (savol-javob)
- **CameraQRCheckin** — QR kod bilan darsga kirish
- **StudentResourceLibrary** — materiallar

#### 6.1.3 Admin Paneli (Markaz Rahbari)
- **GroupCRUD** — guruhlar yaratish va boshqarish
- **LessonCRUD** — darslar jadval
- **RoomCRUD** — xonalar va sig'im
- **SubjectCRUD** — fanlar ro'yxati
- **StudentDebtsPanel** — o'quvchi qarzdorlar
- **TeacherPayoutsPanel** — o'qituvchi to'lovlari
- **TeacherEarningsBreakdown** — daromad hisobi
- **CRMFunnel** — yangi o'quvchi jalb qilish

#### 6.1.4 Ota-ona Portali
- **ChildLiveStatus** — farzand real-time holati (darsda/darsda emas)
- Davomat hisoboti, baholar, to'lov holati

#### 6.1.5 Buxgalter Paneli
- **InvoicesSection** — fakturalar
- **SalariesSection** — ish haqlar
- To'lov hisobotlari

#### 6.1.6 Website Builder
- Har o'quv markaz uchun public sayt (`/c/:slug`)
- Sahifalar boshqaruvi, branding
- **CertificateVerify** — `/verify/:token` sertifikat tasdiqlash

#### 6.1.7 NovaStore
- O'quv materiallar do'koni
- Kitob, kurs, video material sotish

### 6.2 Kamchiliklar (Taklif — Qo'shish Kerak)

#### 6.2.1 Moliya Moduli Kengaytirish
- **To'lov usullari integratsiyasi**: Click, Payme, Uzum Bank
- **Avtomatik eslatma**: To'lov muddati kelganda SMS/Telegram
- **Shartnoma yaratish**: O'quvchi bilan shartnoma PDF generatsiya
- **Qaytarish (refund)**: Pul qaytarish jarayoni

#### 6.2.2 Davomat Kengaytirish
- **GPS geofence**: Talaba markaz yaqinida ekanini tekshirish
- **Face recognition**: Biometrik kirish (premium)
- **Ota-onaga avtomatik xabar**: Kelmadi → darhol SMS

#### 6.2.3 AI Imkoniyatlari
- **AI Grader**: Uyga vazifani AI tekshirish va baho berish
- **Progress predictor**: O'quvchi natijasini bashorat qilish
- **Weak spot detector**: Qaysi temada zaifligi aniqlash

#### 6.2.4 Yangi Modullar
- **Exam Center**: Rasmiy imtihon o'tkazish tizimi (bitta guruh emas, ko'p guruh)
- **Alumni Network**: Bitiruvchilar tarmog'i va karyera yordami
- **Parent App**: Ota-ona uchun mobil ilov (minimal)
- **Live Classes**: Zoom/Jitsi integratsiya (onlayn darslar)

---

## 7. UNITOUR MODULI — TUR AGENTLIK SAAS

### 7.1 Mavjud Funksiyalar (Baseline — Saqlash Kerak)

#### 7.1.1 Public Katalog (Saylovchilar uchun)
- Turlar ro'yxati, filter, qidiruv
- Tur batafsil sahifasi (foto, narx, jadval)
- Mehmonxonalar katalogi
- Transport katalogi
- Yo'nalishlar (destinations) sahifasi
- Wishlist (sevimlilar)
- Custom tur so'rovi
- TravelPlanner (marshrut rejalashtiruvchi)

#### 7.1.2 Bron Tizimi
- Online bron qilish
- **BookingTimeline** — bron bosqichlari (qadamlar)
- **DocumentUpload** — hujjat yuklash (pasport, foto)
- To'lov skrinshotı yuklash
- Bron holati kuzatuvi

#### 7.1.3 Kompaniya Paneli (Har Tur Agentlik)
- **CompanyDashboard** — statistika va boshqaruv
- **CompanyBranches** — filiallar
- **CompanyTours** — o'z turlarini yaratish/tahrirlash
- **CompanyBookings** — bronlar boshqaruvi
- **CompanyLeads** — yangi so'rovlar
- **CompanyPosts** — yangiliklar va e'lonlar
- **CompanyBranding** — logo, rang, brending
- **CompanySite** — o'z public sayt sozlamalari
- **CompanyTeam** — jamoa a'zolari
- **CompanyCustomers** — mijozlar bazasi
- **CompanyAnalytics** — statistika va hisobotlar

#### 7.1.4 Agent Paneli
- **AgentDashboard** — statistika
- **AgentTours** — tayinlangan turlar
- **AgentClients** — o'z mijozlari
- **AgentReferrals** — referallar va komissiya
- **AgentEarnings** — daromad hisobi
- **AgentAccounting** — moliyaviy hisobot

#### 7.1.5 Admin Panel (Platforma darajasi)
- AdminTourCompanies, AdminSubscriptions
- AdminTelegramBots, AdminBilling
- AdminFeatureMatrix — har kompaniyaga feature yoqish
- AdminFeatureOverrides, AdminChangeRequests
- AdminSiteEditor, AdminAnalytics
- AdminAuditLog, AdminDocumentControl

### 7.2 Kamchiliklar (Taklif — Qo'shish Kerak)

#### 7.2.1 Bron Tizimi Kengaytirish
- **Onlayn to'lov**: Click/Payme/Uzum integratsiya
- **E-Ticket generatsiya**: Bron tasdiqlanganda PDF bilet
- **Group booking**: 10+ odam uchun guruh bronlash
- **Multi-destination**: Bir safar bir necha davlat

#### 7.2.2 Viza Moduli
- **Viza talablari bazasi**: Har davlat uchun hujjatlar ro'yxati
- **Viza arizasi tracking**: Berildi → Ko'rib chiqildi → Tasdiqlandi/Rad etildi
- **Hujjat checklist**: Avtomatik tekshirish

#### 7.2.3 Insurance Moduli
- Sayohat sug'urta sotish (partner orqali)
- Sug'urta polisi generatsiya

#### 7.2.4 AI Imkoniyatlari
- **AI Itinerary Builder**: Marshrut tavsiyasi (manba, vaqt, byudjet asosida)
- **Price Predictor**: Tur narxini bashorat (talab-taklif)
- **Review Analyzer**: Mijoz fikrlarini tahlil qilish

#### 7.2.5 B2B Tarmoq
- **Agency Network**: Tur agentliklar orasida tur almashtirish
- **Wholesale pricing**: Tur operatorlardan agentlarga ulgurji narx
- **Commission management**: Murakkab komissiya tizimi

---

## 8. UNIPATH CORE — UNIVERSAL BIZNES SAAS

### 8.1 Mavjud Funksiyalar (Baseline)

#### 8.1.1 Barcha Sohalarga Umumiy
- **AdminDashboard** — umumiy statistika
- **CRM Pipeline** — Lead → Muloqot → Hujjat → Viza → Kirdi → Alumni
- **AdminAccounting** — daromad/xarajat, oylik P&L
- **BranchSwitcher** — bir akkauntdan ko'p filial boshqarish
- **UserManagement** — xodimlar ro'yxati va rollari
- **Telegram Bot** — bildirishnoma integratsiya
- **AI Camera** — kamera orqali nazorat (Growth+)

#### 8.1.2 Soha-Specific (Vertikal Nav)
- Har soha uchun alohida navigatsiya (`VERTICAL_NAV` map)
- Consulting → CRM, Arizalar, Hujjatlar, Talabalar, Viza
- Fitnes → Mijozlar, Jadval, Abonement, Trenerlar
- Restoran → Menyu, Stol Rezervatsiya, Buyurtmalar, Xodimlar
- Klinika → Bemorlar, Uchrashuvlar, Davolash tarixi

### 8.2 Kamchiliklar (Taklif — Qo'shish Kerak)

#### 8.2.1 HR Moduli
```
Jadval: HR jadvali (employee schedule)
Mehnat shartnomasi: PDF generatsiya
Ish vaqti hisobi: Clock in/out (manual yoki QR)
Mehnat ta'tili: Ta'til so'rovi va tasdiqlash
KPI tracking: Xodim samaradorligi
Bonuslar: Mukofot tizimi
```

#### 8.2.2 Inventar/Ombor Moduli
```
Mahsulotlar ro'yxati: SKU, narx, miqdor
Kirim/Chiqim: Har operatsiya log
Minimum qoldiq: Tugayotgan mahsulot ogohlantirish
Yetkazib beruvchilar: Kontaktlar va shartnomalar
```

#### 8.2.3 Kengaytirilgan Buxgalteriya
```
Hisob-faktura (Invoice): PDF, mijozga yuborish
To'lov qabul qilish: Click/Payme/Uzum
Soliq hisoboti: QQS, daromad solig'i
Valyuta: Ko'p valyuta (UZS/USD/EUR/RUB)
P&L hisobot: Yillik, choraklik taqqoslash
Cash flow: Pul oqimi rejalashtirish
```

#### 8.2.4 Mijoz Portali
```
Har mijozga shaxsiy login
O'z holati ko'rish (consulting: ariza, fitnes: abonement)
Hujjat yuklash
To'lov tarixi
```

#### 8.2.5 Marketing Moduli
```
Email kampaniya: Bulk email jo'natish
SMS kampaniya: SMS xabar
Referral tizimi: Mijoz → yangi mijoz keltirsa bonus
Review yig'ish: Google Reviews, Telegram
```

---

## 9. UMUMIY SHARED MODULLAR

Bu modullar UniPath Core, NOVA va UniTour — hammasida mavjud:

### 9.1 Notification Tizimi

```typescript
interface Notification {
  id: string;
  tenant_id: string;
  user_id: string;
  type: 'sms' | 'email' | 'telegram' | 'push' | 'in_app';
  title: string;
  body: string;
  status: 'pending' | 'sent' | 'failed' | 'read';
  created_at: string;
  scheduled_at?: string;  // kechiktirilgan yuborish
  metadata: {
    entity_type?: string;  // 'booking' | 'lesson' | 'invoice'
    entity_id?: string;
  };
}

// Avtomatik triggerlar:
// - To'lov muddati kelganda (3 kun oldin, 1 kun oldin, kuni)
// - Dars boshlanganda (30 min oldin)
// - Bron holati o'zgarganda
// - Yangi lead kelganda
```

### 9.2 Fayl Saqlash

```
Supabase Storage buckets:
  documents/       → hujjatlar (pasport, shartnoma, sertifikat)
  branding/        → logo, banner
  tour-photos/     → tur rasmlari
  lesson-materials/ → o'quv materiallari
  invoices/        → fakturalar PDF
  homework/        → uyga vazifa fayllar

Limit:
  Starter  → 5 GB
  Growth   → 50 GB
  Enterprise → Unlimited
```

### 9.3 Analytics (Tahlil)

```
Har tenant uchun:
  - Oylik faol foydalanuvchilar (MAU)
  - Konversiya funnel (Lead → Mijoz)
  - Daromad dinamikasi (oylar bo'yicha)
  - Eng yaxshi xodimlar/agentlar
  - Mijoz retention rate

PageAnalyticsTracker (UniTour'dan olinib umumlashtiriladi):
  - Har sahifa ko'rishlari
  - UTM parametr tracking
  - Referer tahlili
```

### 9.4 Audit Log

```
Barcha muhim harakatlar log qilinadi:
  - Kim (user_id, email, role)
  - Nima qildi (action_type: create/update/delete/login)
  - Qaysi entity (entity_type, entity_id)
  - Eski va yangi qiymat (old_values, new_values)
  - IP manzil, vaqt
```

### 9.5 Telegram Bot Integratsiya

```
Har tenant o'z Telegram bot token'ini ulay oladi.

Bot imkoniyatlari:
  → Bildirishnomalar (to'lov, dars, bron)
  → Mijoz yuboradi: "balansim necha?" → bot javob beradi
  → Admin yuboradi: bugungi statistika
  → Lead kelsa → darhol xabar

NOVA uchun:
  → Ota-ona darsga kelmadi xabari
  → Uyga vazifa eslatmasi
  
UniTour uchun:
  → Bron tasdiqlandi
  → Sayohat kuni eslatmasi
```

---

## 10. MA'LUMOTLAR BAZASI SXEMASI

### 10.1 Tenant (Asosiy Jadval)

```sql
CREATE TABLE tenants (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT UNIQUE NOT NULL,          -- 'alfabusiness', 'nova-center'
  name         TEXT NOT NULL,                 -- 'Alpha Business'
  vertical     TEXT NOT NULL DEFAULT 'core',  -- 'core' | 'nova' | 'unitour'
  plan         TEXT NOT NULL DEFAULT 'Starter', -- 'Starter' | 'Pro' | 'Enterprise'
  plan_expires_at TIMESTAMPTZ,
  is_active    BOOLEAN DEFAULT true,
  custom_domain TEXT,                         -- 'alfabusiness.uz'
  config       JSONB DEFAULT '{}'::jsonb,     -- branding, modules, features
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- config JSONB misoli:
{
  "branding": {
    "logo_url": "...",
    "primary_color": "#22c55e",
    "secondary_color": "#0ea5e9"
  },
  "modules": {
    "crm": true,
    "accounting": true,
    "lessons": false,
    "tours": false
  },
  "telegram_bot_token": "...",
  "industry": "consulting"  -- core uchun
}
```

### 10.2 Profiles (Foydalanuvchilar)

```sql
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id),
  tenant_id     UUID REFERENCES tenants(id),
  email         TEXT,
  full_name     TEXT,
  phone         TEXT,
  role          TEXT NOT NULL DEFAULT 'user',
  -- universal: super_admin | admin | owner | manager | accountant | agent | specialist
  -- nova:      teacher | student | parent
  -- unitour:   tour_agent | booking_manager | guide | driver
  avatar_url    TEXT,
  telegram_id   TEXT,
  is_active     BOOLEAN DEFAULT true,
  metadata      JSONB DEFAULT '{}'::jsonb,  -- soha-specific ma'lumot
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### 10.3 Branches (Filiallar — Barcha Vertikallarda)

```sql
CREATE TABLE branches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  name            TEXT NOT NULL,
  city            TEXT,
  address         TEXT,
  phone           TEXT,
  latitude        FLOAT,
  longitude       FLOAT,
  geofence_radius_m INT DEFAULT 100,
  is_main         BOOLEAN DEFAULT false,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 10.4 NOVA-Specific Jadvallar

```sql
-- Fanlar
CREATE TABLE subjects (id, name, tenant_id, description);

-- Guruhlar
CREATE TABLE groups (
  id, tenant_id, branch_id, name, subject_id, teacher_id,
  capacity INT, schedule JSONB, start_date DATE, end_date DATE
);

-- Guruh a'zolari
CREATE TABLE group_members (id, group_id, student_id, tenant_id, joined_at);

-- Darslar
CREATE TABLE lessons (
  id, group_id, teacher_id, room_id, tenant_id,
  title, starts_at TIMESTAMPTZ, duration_min INT, status
);

-- Davomat
CREATE TABLE attendance (
  id, lesson_id, student_id, tenant_id,
  status TEXT, -- 'present'|'absent'|'late'
  checked_in_at TIMESTAMPTZ,
  face_verified BOOLEAN, gps_verified BOOLEAN
);

-- Sertifikatlar
CREATE TABLE certificates (
  id, student_id, tenant_id, issued_by UUID,
  title, subject, grade, score, public_token TEXT UNIQUE,
  issued_at TIMESTAMPTZ
);

-- Uyga vazifalar
CREATE TABLE homework (id, lesson_id, teacher_id, tenant_id, title, due_date, max_score);
CREATE TABLE homework_submissions (id, homework_id, student_id, score, feedback, status);

-- To'lov jadval
CREATE TABLE tuition_plans (id, tenant_id, name, amount, currency, billing_cycle);
CREATE TABLE student_payments (id, student_id, tenant_id, amount, status, due_date, paid_at);
```

### 10.5 UniTour-Specific Jadvallar

```sql
-- Turlar
CREATE TABLE tours (
  id, tenant_id (NULL = platforma turi), company_id UUID,
  title, description, price, currency, duration_days,
  destinations JSONB, includes JSONB, excludes JSONB,
  max_participants INT, images JSONB, is_published BOOLEAN
);

-- Bronlar
CREATE TABLE bookings (
  id, tour_id, user_id, company_id, branch_id,
  travel_date DATE, people_count INT, total_price NUMERIC,
  status TEXT, -- 'pending'|'confirmed'|'cancelled'|'completed'
  payment_status TEXT, deposit_amount NUMERIC,
  guide_name, driver_name, hotel_info, flight_info
);

-- Vaqt chizig'i (timeline)
CREATE TABLE booking_timeline (id, booking_id, step, title, completed, completed_at);

-- Agent tizimi
CREATE TABLE agents (id, user_id, company_name, commission_rate, status);
CREATE TABLE agent_referrals (id, agent_id, booking_id, commission_amount, status);

-- Mehmonxonalar va transport
CREATE TABLE hotels (id, name, city, stars, price_per_night, images);
CREATE TABLE vehicles (id, type, capacity, driver_name, phone);
```

---

## 11. TARIFLAR VA MONETIZATSIYA

### 11.1 UniPath Core Tariflar (Yangilangan)

| | Starter | Growth (Pro) | Enterprise |
|--|---------|-------------|-----------|
| **Narx/oy** | $29 | $79 | $199 |
| **Narx/yil** | $24/oy | $64/oy | $159/oy |
| **Filiallar** | 1 | 5 | Cheksiz |
| **Xodimlar** | 3 | 25 | Cheksiz |
| **CRM Pipeline** | ✅ | ✅ | ✅ |
| **Buxgalteriya** | Ko'rish | To'liq | To'liq + Invoice |
| **HR Moduli** | ❌ | ✅ | ✅ |
| **Inventar** | ❌ | ✅ | ✅ |
| **AI Camera** | ❌ | ✅ | ✅ |
| **Telegram Bot** | Asosiy | To'liq | VIP |
| **Fayl xotira** | 5 GB | 50 GB | Unlimited |
| **Custom Domain** | ❌ | ❌ | ✅ |
| **White Label** | ❌ | ❌ | ✅ |
| **API kirish** | ❌ | ✅ | ✅ |
| **Yordam** | Email | Chat | 24/7 VIP |

### 11.2 NOVA Tariflar

| | Starter | Growth | Enterprise |
|--|---------|--------|-----------|
| **Narx/oy** | $39 | $99 | $249 |
| **O'quvchilar** | 50 | 300 | Cheksiz |
| **O'qituvchilar** | 3 | 15 | Cheksiz |
| **Filiallar** | 1 | 3 | Cheksiz |
| **Website Builder** | Asosiy | ✅ | ✅ + Custom Domain |
| **AI Lesson Planner** | ❌ | ✅ | ✅ |
| **Ota-ona Portali** | ❌ | ✅ | ✅ |
| **Sertifikatlar** | 50/oy | 500/oy | Unlimited |
| **NovaStore** | ❌ | ✅ | ✅ |
| **Biometrik Davomat** | ❌ | ❌ | ✅ |
| **Live Classes** | ❌ | ✅ | ✅ |

### 11.3 UniTour Tariflar

| | Starter | Growth | Enterprise |
|--|---------|--------|-----------|
| **Narx/oy** | $49 | $129 | $299 |
| **Bronlar/oy** | 30 | 200 | Unlimited |
| **Agentlar** | 3 | 20 | Unlimited |
| **Turlar** | 10 | 100 | Unlimited |
| **Filiallar** | 1 | 3 | Unlimited |
| **AI Itinerary** | ❌ | ✅ | ✅ |
| **Viza Moduli** | ❌ | ✅ | ✅ |
| **B2B Tarmoq** | ❌ | ❌ | ✅ |
| **White Label Sayt** | Asosiy | ✅ | ✅ + Custom Domain |
| **Analytics** | Asosiy | To'liq | Kengaytirilgan |

### 11.4 Super-Admin Darajasida Monetizatsiya

```
Platforma darajasi (UniPath jamoa uchun):
  1. Subscriptsiya daromadi: tenant × narx
  2. Transaction fee: Onlayn to'lovlardan 1.5–2.5%
  3. SMS/Email kredit: Bulk xabar uchun
  4. Marketplace: 3rd party plugin va integratsiya
  5. White-label reseller: Agency uchun reseller panel
```

---

## 12. UI/UX TALABLARI

### 12.1 Dizayn Tizimi

```
Stack:
  → React 18 + TypeScript
  → Tailwind CSS (utility-first)
  → shadcn/ui (komponent kutubxona)
  → Framer Motion (animatsiya)
  → Recharts (grafik)
  → Lucide React (iconlar)

Ranglar:
  UniPath Core:  Emerald (yashil) — #10b981
  NOVA:          Violet (binafsha) — #8b5cf6
  UniTour:       Sky (ko'k) — #0ea5e9
  
Umumiy:
  Background: #030712 (dark) / #ffffff (light)
  Surface: #0f172a / #f8fafc
  Border: white/5 (dark) / zinc-200 (light)
```

### 12.2 Sahifa Strukturasi

```
AdminLayout tarkibi:
  ┌──────────────────────────────────┐
  │  Sidebar (280px)                 │
  │  ├── Brand Header (logo + slug)  │
  │  ├── BranchSwitcher              │
  │  ├── Nav Items (vertical-specific)│
  │  ├── Plan-gated sections         │
  │  └── User info + logout          │
  ├──────────────────────────────────┤
  │  Main Content Area               │
  │  ├── Topbar (branch, notif, user)│
  │  └── Page Content                │
  └──────────────────────────────────┘

Mobile (< 768px):
  → Bottom navigation bar
  → Hamburger menu
  → Floating Action Button (asosiy amal)
```

### 12.3 Onboarding Flow

```
Yangi tenant uchun:
  1. Soha tanlash (vertical selector)
  2. Tarif tanlash (pricing cards)
  3. Biznes nomi + logo yuklash
  4. Birinchi filial yaratish
  5. Birinchi xodim taklif qilish
  6. Asosiy modul setup (CRM, guruh, tur...)
  7. "Tayyor! Ishni boshlang" → dashboard

Har qadam — progress bar bilan ko'rsatiladi.
Har qadam — o'tkazib yuborish mumkin (skip).
```

### 12.4 Loading va Error Holatlari

```
Tenant yuklanmoqda:
  → Glassmorphic spinner (hozir bor, ✅)
  → Tenant nomi ko'rsatiladi

Tenant topilmadi:
  → Premium TenantNotFound sahifasi (hozir bor, ✅)

Network xato:
  → OfflineDetector component (NOVA'dan olinadi)
  → Retry button

Ruxsat yo'q:
  → 403 sahifasi, "Sizning rolizga bu sahifa ruxsat etilmagan"
```

---

## 13. API VA INTEGRATSIYALAR

### 13.1 Supabase API

```typescript
// Asosiy pattern (barcha vertikal uchun):
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('tenant_id', activeTenant.id)
  .order('created_at', { ascending: false });

// Real-time subscription:
const channel = supabase
  .channel('table-changes')
  .on('postgres_changes', {
    event: '*', schema: 'public',
    table: 'bookings', filter: `tenant_id=eq.${tenantId}`
  }, handleChange)
  .subscribe();
```

### 13.2 To'lov Tizimlari (Muhim — Hali Yo'q)

```
Click (Uzbekistan): click.uz API
  → Merchant ID va Service ID kerak
  → Webhook: to'lov tasdiqlanganda

Payme: payme.uz API
  → Prepare + Perform + Cancel endpoints
  → JSONRPC 2.0 protokol

Uzum Bank: uzumbank.uz
  → Yangi, o'sayotgan platforma
  → API hali rivojlanmoqda

Stripe (xorijiy kartalar):
  → Growth+ tarifda
  → Subscription billing uchun
```

### 13.3 Telegram Bot API

```
Telegramga qo'shilish jarayoni:
  1. Tenant BotFather'dan token oladi
  2. Token'ni UniPath'ga kiritadi
  3. Bot registratsiya: /setwebhook → UniPath endpoint

Webhook endpoint:
  POST /api/telegram/webhook/:tenantSlug
  → Token validatsiya
  → Komanda parse qilish
  → Supabase'dan ma'lumot olish
  → Javob yuborish
```

### 13.4 AI Integratsiyalar

```
OpenAI GPT-4:
  → AILessonPlanner (NOVA)
  → AIPresentationGenerator (NOVA)
  → AI Itinerary Builder (UniTour)
  → AIChatbot (student)

Computer Vision (kamera):
  → Face detection (biometrik davomat)
  → Geofence validation (GPS)

Texnologiya:
  → Edge Functions (Supabase) orqali AI call
  → Natija cache qilinadi (10 min)
  → Rate limit: Starter 10 req/oy, Growth 100, Enterprise unlimited
```

---

## 14. IMPLEMENTATSIYA REJASI (FAZALAR)

### Faza 1 — Asosiy Integratsiya (1–2 oy)

```
Maqsad: 3 loyihani bitta codebase'ga birlashtirish

Vazifalar:
  □ Monorepo yoki shared package tuzilmasi
  □ Bitta Supabase instance, universal auth
  □ Tenant vertical field qo'shish
  □ TenantRouter'ni vertical-aware qilish
  □ Bitta shared design system (Tailwind + shadcn)
  □ Unified AppContext — vertical-ga mos state
  □ Universal BranchSwitcher barcha panellarda
```

### Faza 2 — NOVA Moduli Integratsiyasi (2–3 oy)

```
Maqsad: NOVA'ni UniPath ichiga import qilish

Vazifalar:
  □ NOVA DB schema → UniPath Supabase'ga migratsiya
  □ NOVA komponentlarini UniPath structure'ga ko'chirish
  □ NOVA plan limits → usePlanLimits'ga qo'shish
  □ NOVA vertical nav → AdminLayout'ga qo'shish
  □ NOVA landing sahifasi (nova.unipath.me yoki unipath.me/education)
  □ NOVA onboarding flow
  □ Yangi kamchiliklar: To'lov integratsiya, ota-ona portal
```

### Faza 3 — UniTour Moduli Integratsiyasi (2–3 oy)

```
Maqsad: UniTour'ni UniPath ichiga import qilish

Vazifalar:
  □ UniTour DB schema → UniPath Supabase'ga migratsiya
  □ Company panel → UniPath admin layout'ga integratsiya
  □ Public katalog → unipath.me/travel
  □ UniTour plan limits
  □ Yangi kamchiliklar: Viza moduli, onlayn to'lov, e-bilet
  □ Agent network tizimi
```

### Faza 4 — Yangi Funksiyalar (3–4 oy)

```
Maqsad: Raqobatchilardan o'zib ketish

Vazifalar:
  □ Onlayn to'lov: Click + Payme + Uzum
  □ HR moduli (barcha vertical)
  □ Inventar moduli (Core)
  □ SMS kampaniya tizimi
  □ Alumni/Referral tarmog'i
  □ Advanced analytics dashboard
  □ Mobile PWA yoki React Native app
```

### Faza 5 — AI va Avtomatlashtirish (4–6 oy)

```
Maqsad: AI-driven platforma

Vazifalar:
  □ AI Grader (NOVA uyga vazifa tekshirish)
  □ AI Itinerary Builder (UniTour marshrut)
  □ Progress Predictor (o'quvchi bashorat)
  □ Smart Pricing (tur narxi tavsiya)
  □ Churn prediction (ketib qolishi mumkin mijozlar)
  □ Auto-reporting (haftalik/oylik email hisobot)
```

---

## 15. ZAIF TOMONLAR VA TAVSIYALAR

### 15.1 UniPath Core — Hozirgi Muammolar

| Muammo | Sabab | Yechim |
|--------|-------|--------|
| Fake data ko'p | Demo rejim yo'q | Demo/Sandbox mode qo'shish |
| Onlayn to'lov yo'q | Hali implement qilinmagan | Click/Payme priority |
| Mobile qulay emas | Bottom nav incomplete | PWA yoki React Native |
| Slow fetch | No caching | React Query + staleTime |
| Invoice yo'q | Faqat log | PDF Invoice generatsiya |

### 15.2 NOVA — Hozirgi Muammolar

| Muammo | Sabab | Yechim |
|--------|-------|--------|
| Alohida Supabase | Standalone project | Migratsiya → shared DB |
| Theme switching qiyin | Ko'p state | ThemeProvider refactor |
| Parent app yo'q | Faqat web | Minimal PWA parent view |
| Ko'p DB table | Yaxshi, saqlansin | |
| AI overloading | Har AI call slow | Cache + loading state |

### 15.3 UniTour — Hozirgi Muammolar

| Muammo | Sabab | Yechim |
|--------|-------|--------|
| Alohida Supabase | Standalone project | Migratsiya → shared DB |
| Onlayn to'lov yo'q | Yuqori prioritet | Click/Payme asap |
| Viza moduli yo'q | Katta gap | Faza 3'da implement |
| Mobile bottom nav | Mavjud, lekin incomplete | Kengaytirish |
| Analytics shallow | Faqat basic stats | Recharts kengaytirish |

### 15.4 Umumiy Arxitektura Tavsiyalari

```
1. Shared Type Package
   packages/types/    → barcha interface va type
   packages/utils/    → planToTier, formatCurrency, etc.
   packages/ui/       → shared shadcn komponentlar

2. Row-Level Security (RLS)
   Supabase'da har jadval uchun:
   CREATE POLICY "tenant_isolation" ON table_name
   USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

3. Edge Functions
   Supabase Edge Functions:
   → /telegram-webhook/:slug
   → /payment-callback/:provider
   → /ai-lesson-plan
   → /generate-pdf-invoice

4. Monitoring
   → Sentry: error tracking
   → PostHog: user analytics
   → Supabase Dashboard: DB performance

5. CI/CD
   → GitHub Actions
   → Vercel (frontend) / Supabase (backend)
   → Preview deployments har PR uchun

6. Deploy konfiguratsiya (✅ Tayyor)
   → vercel.json: framework, buildCommand, SPA rewrites,
     security headers (X-Frame-Options, X-Content-Type-Options,
     X-XSS-Protection, Referrer-Policy, Permissions-Policy),
     asset caching (public, max-age=31536000, immutable)
   → .env.example: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY,
     VITE_APP_DOMAIN + optional keys
   → Domain: unipath.me → Vercel DNS settings
```

---

## 16. DEPLOY VA PRODUCTION CHECKLIST (Yangi)

### 16.1 Vercel Deploy Qilish

```bash
# 1. GitHub repoga push qiling
git add .
git commit -m "feat: v2.1 - Russian i18n, dashboard polish, deploy config"
git push origin main

# 2. Vercel.com'da yangi loyiha qo'shing yoki
vercel --prod

# 3. Environment Variables qo'shing (Vercel Dashboard → Settings → Env Vars):
#    VITE_SUPABASE_URL       = https://xxx.supabase.co
#    VITE_SUPABASE_PUBLISHABLE_KEY = eyJ...
```

### 16.2 Custom Domain Ulash

```
Vercel Dashboard → Project → Settings → Domains
  → unipath.me qo'shing
  → DNS Provider'da:
     A record: @ → 76.76.21.21  (Vercel IP)
     CNAME: www → cname.vercel-dns.com
```

### 16.3 Production Tayyor Belgichasi

| Soha | Holat |
|------|-------|
| SPA routing (rewrites) | ✅ vercel.json |
| Security headers | ✅ X-Frame, CSP, XSS |
| Asset caching | ✅ 1 yil immutable |
| Environment vars | ✅ .env.example hujjatlangan |
| Build command | ✅ `npm run build` |
| i18n: uz/ru/en | ✅ Barcha sahifalarda |
| Mobile responsive | ✅ Tailwind breakpoints |
| React hooks compliance | ✅ useEffect before returns |
| Plan limits enforcement | ✅ canAddBranch, canAddStaff |

---

## XULOSA

UniPath ekosistema O'zbekiston bozori uchun **Odoo/Zoho darajasidagi** kompleks yechim bo'lish imkoniyatiga ega. Uch vertikal — UniPath Core, NOVA, UniTour — birlashtirilganda:

- **O'quv markazlar**: 15,000+ potensial mijoz
- **Tur agentliklar**: 2,500+ potensial mijoz
- **Boshqa bizneslar**: 500,000+ potensial mijoz

Bitta SaaS platformasidan **uchala soha**ga xizmat ko'rsatish — bu O'zbekistonda birinchi bunday yechim bo'ladi. Raqobatchilar (Bitrix24, AmoCRM) faqat gorizontal, va O'zbek tiliga moslashmagan. **UniPath** — vertikal ixtisoslashuv + mahalliy til + affordable narx bilan bozorda dominant pozitsiya egallashi mumkin.

**Keyingi qadam:** Faza 1 — DB va auth birlashtirilishi. Bu texnik asos bo'lib, keyingi barcha ishlar shuning ustiga quriladi.

---

*Hujjat versiyasi: 2.1 | Oxirgi yangilangan: 2026-05-27*  
*UniPath Community | unipath.community@gmail.com*
