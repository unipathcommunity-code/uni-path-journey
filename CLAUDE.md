# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> ⚠️ **Two-agent workflow:** Claude (builds code) and Antigravity (commits + deploys)
> share this folder. Read **`COLLABORATION.md`** before editing — it defines the
> file-ownership split and the "never co-edit a file" rule. Claude owns
> `packages/**`, `apps/unipath-core/src/**` (incl. `App.tsx`) and authors `.sql`
> migrations; Antigravity owns git/deploy, `vercel.json`, `scripts/`, configs, and
> runs migrations in Supabase.

---

## Commands

```bash
npm run dev        # Start Vite dev server
npm run build      # Production build (TypeScript + Vite)
npm run lint       # ESLint check
npm run preview    # Preview production build locally
```

No test runner is configured. TypeScript errors surface during `npm run build`.

---

## What This Is

**UniPath** — a multi-tenant SaaS platform at `unipath.me`. One codebase serves every registered business. Each business gets its own subdomain (`mytour.unipath.me`) and a vertically-specific admin dashboard determined by `business_type`.

Supported verticals: `tour` · `academy` · `hotel` · `restaurant` · `clinic` · `gym` · `manufacturing` · `parking` · `auto_service` · `wholesale` · `wedding_hall` · `kindergarten` · `library` · `cosmetics` · `stadium` · `pharmacy` · `consulting` (default fallback)

---

## Architecture

### Tenant Resolution (critical path)

`AppContext.tsx` → `mapTenant()` → sets `activeTenant` globally.

**`mapTenant` priority chain** (do not reorder):
1. `data.vertical` — DB enum column (most authoritative)
2. `data.business_type` — already-mapped objects (SuperAdmin impersonation)
3. `data.config?.business_type` — JSONB config field (set at Systematize registration)
4. `detectVerticalFromModules(data.config?.modules)` — scan boolean flags; `consulting` is **last** in detection order

**Critical rule**: `consulting` must always be the **last** entry in any vertical detection array. It is the fallback, not a priority.

Subdomain detection flow in `AppContext.resolveTenant()`:
1. Check `localStorage('active_tenant')` → SuperAdmin impersonation
2. Parse hostname subdomain → query `tenants` table by `subdomain`
3. Check `custom_domain` column
4. If authenticated and not core root → resolve tenant from `profiles.tenant_id`

### Vertical Routing

`/dashboard` → `DashboardRedirect.tsx` reads `effectiveTenant.business_type` → routes admin-level roles to `/admin/dashboard`

`/admin/dashboard` → `AdminDashboardPage.tsx` detects vertical → renders the matching component:
- `vertical === 'tour'` → `<AdminTour />`
- `vertical === 'academy'` → `<AdminAcademy />`
- everything else falls through to the Consulting dashboard (default)

### Role Hierarchy

```
super_admin → /super-admin
admin / owner / manager / accountant → /admin/dashboard
agent / specialist / mentor → /agent/dashboard
(everyone else) → /student/dashboard
```

Roles live in the `user_roles` Supabase table. `useUserRole` hook reads them.

### Tenant Registration (`Systematize.tsx`)

When a business registers, the insert saves:
```js
config: {
  business_type: formData.businessType,   // e.g. 'tour'
  modules: {
    tour: formData.businessType === 'tour',   // exactly one true
    academy: formData.businessType === 'academy',
    // ... all 17 verticals
  }
}
```
**Never omit a vertical from the modules object** — its absence causes detection to fall back to `consulting`.

### SuperAdmin Impersonation

SuperAdminDashboard → "Tizimga Kirish" button saves an enriched payload to `localStorage('active_tenant')`:
```js
{ ...selectedTenant, business_type: 'tour', config: { business_type: 'tour', modules: { tour: true } } }
```
Both `AdminDashboardPage` and `DashboardRedirect` read this before `activeTenant`.

---

## Translation System — Dual System (Important)

There are **two separate i18n systems** in this repo:

| System | File | Used by |
|--------|------|---------|
| `useLanguage` hook | `src/hooks/useLanguage.tsx` | NOVA/Academy inner pages (teacher, student, admin panels) |
| `useTranslation` + `LABELS` objects | `src/lib/i18n.ts` + inline objects | Consulting/Tour admin pages |

`useLanguage` stores preference in `localStorage('nova-lang')`.  
`AppContext` stores preference in `localStorage('unipath_language')` and syncs to `profiles.preferred_language` in DB.

When adding new UI text:
- Academy/NOVA pages → add key to `translations` object in `useLanguage.tsx` for all 3 languages (`uz`, `ru`, `en`)
- Tour/Consulting/Admin pages → add to the inline `LABELS` object in that file

---

## Key Files

| File | Purpose |
|------|---------|
| `src/contexts/AppContext.tsx` | Central tenant state, `mapTenant()`, subdomain resolution |
| `src/core/TenantRouter.tsx` | Guards: shows TenantNotFound if no tenant on non-root domain |
| `src/pages/DashboardRedirect.tsx` | Role + vertical → route decision |
| `src/pages/admin/AdminDashboardPage.tsx` | Vertical detection → renders correct admin UI |
| `src/pages/Auth.tsx` | Universal login — shows tenant branding or generic UniPath |
| `src/pages/Systematize.tsx` | 4-step business onboarding/registration |
| `src/pages/TenantPublicPage.tsx` | Public-facing site for every tenant subdomain (unauthenticated) |
| `src/pages/superadmin/SuperAdminDashboard.tsx` | Platform management, tenant impersonation |
| `src/pages/admin/AdminTour.tsx` | Tour vertical: packages, bookings, CRM leads, visa tracker |
| `src/pages/admin/AdminAcademy.tsx` | Academy vertical dashboard |
| `supabase_fix_verticals.sql` | Run in Supabase SQL editor to fix existing tenants missing `modules.tour` |

---

## Supabase

Client: `src/integrations/supabase/client.ts`  
Types: `src/integrations/supabase/types.ts` (may be outdated — `tenants` table not yet in generated types; use `as any` casts for `vertical` column)

Key tables: `tenants`, `profiles`, `user_roles`, `tour_packages`, `tour_bookings`, `notification_queue`, `contact_requests`, `branches`

The `tenants.config` column is JSONB. Its shape matches `TenantConfig` interface in `AppContext.tsx`.

---

## Ecosystem Integration Architecture (Approved Integration Plan)

We are unifying the standalone NOVA (`novaios-main/`) and UniTour (`unitour-me-main/`) applications directly into the main `src/` directory to build a single, solid, multi-tenant SaaS ecosystem under a single domain framework.

### Integration Architectural Blueprint:
1. **pnpm Monorepo Structure**: Transition the repository into a pnpm monorepo.
   - `apps/unipath-core`: The main code inside `src/`.
   - `apps/nova`: Code from `novaios-main/`.
   - `apps/unitour`: Code from `unitour-me-main/`.
   - `packages/db`, `packages/ui`, `packages/auth`, and `packages/tenant` will hold the shared types, shared shadcn components, unified authentication context, and tenant plan-limit/entitlements gates respectively.
2. **Unified Supabase Schema Namespacing**:
   - Instead of separate databases, we use one single database with namespaced schemas (`public` for core profiles, `nova` schema for education tables, and `travel` schema for booking/tours).
   - Apply Row Level Security (RLS) on all schemas checked by `tenant_id` and `branch_id`.
3. **JWT Entitlements & PlanLimits**:
   - Custom claims in the Supabase user JWT token store the user's active tenant, membership role, and active plan entitlements.
   - Enforce plan features dynamically in the UI using a unified `<PlanGate>` component which reads from the enriched session JWT.
4. **AppShell Layout & BranchSwitcher**:
   - `AppShell.tsx` dynamically renders the correct sidebar menu (NOVA, UniTour, or Consulting) depending on `activeTenant.business_type` or the active application route.
   - The compact `BranchSwitcher` component in the sidebar manages both cross-org switching and cross-app switching under a single dropdown.

### Immediate Action Checklist for Claude Code:
1. **Initialize Monorepo Scaffold**: Create `pnpm-workspace.yaml` and restructure `novaios-main/` -> `apps/nova/`, `unitour-me-main/` -> `apps/unitour/`, and the current root -> `apps/unipath-core/`.
2. **Create Core Packages**: Set up `packages/db`, `packages/ui`, `packages/auth`, and `packages/tenant` and export the shared logic.
3. **Unify AuthContext**: Port the global `AuthContext` to use a shared connection and read custom JWT Claims.
4. **Migrate NOVA and UniTour Pages**: Integrate educational and travel views into the unified routing layout under the main `AppShell` with plan limits and RLS schema separation.

---

## Recently Completed (May 2026)

- ✅ Theme system — 5 presets, dark/light reactive (MutationObserver), AdminSettings picker, vertical default themes
- ✅ Telegram Bot — AdminSettings: token/username/chat_id + test button. TenantPublicPage contact form → instant Telegram push
- ✅ Invoice PDF — AdminTour bookings table: 🧾 button → A4 PDF (jsPDF), tenant branding, payment status
- ✅ Unified Notification Center — `src/pages/admin/AdminNotificationCenter.tsx`, route `/admin/notifications`, all verticals
- ✅ Tour Calendar — new "Kalendar" tab in AdminTour, monthly grid, departure markers, booking dots
- ✅ WhatsApp + Telegram share buttons on TenantPublicPage tour cards
- ✅ `departure_date` field added to tour create form + Supabase (see `supabase_tour_calendar.sql`)
- ✅ Branches RLS fix — branch insert moved AFTER user signup; try-catch so registration never fails on branch
- ✅ AdminSettings useState→useEffect bug fixed — `profile` data syncs correctly
- ✅ Impersonation hard-reload — SuperAdminDashboard uses `window.location.href` not `navigate()`, so AppContext re-reads localStorage and vertical routing works
- ✅ Impersonation config preservation — impersonate payload merges existing config (preserves branding/settings)
- ✅ Return to Super Admin hard-reload — `window.location.href` clears impersonation state cleanly
- ✅ PWA manifest.json — `public/manifest.json` with shortcuts, icons, display standalone
- ✅ Mobile meta tags — apple-mobile-web-app-capable, theme-color, apple-touch-icon in `index.html`
- ✅ Post-Systematize Welcome Screen — `src/pages/admin/AdminWelcome.tsx`, route `/admin/welcome`, 5-step onboarding (uz/ru/en)
- ✅ Consulting dashboard analytics charts — recharts BarChart (clients) + LineChart (applications), last 6 months
- ✅ Consulting dashboard full redesign — impressive header, animated stat cards, better pipeline, proper empty states, uz/ru/en labels
- ✅ CRM infinite loading fixed — `if (!tid)` now calls `setLoading(false)` before returning; RLS errors handled gracefully
- ✅ AdminTour/AdminAcademy infinite loading fixed — same `if (!tid)` pattern fixed
- ✅ AdminSettings biznes turi/subdomain display — reads from impersonated tenant (localStorage) not just `activeTenant`
- ✅ SuperAdmin impersonation payload — now includes `subdomain`, `custom_domain`, full `config` (branding preserved)

## Supabase Migrations to Run

| File | Purpose |
|------|---------|
| `supabase_fix_verticals.sql` | Fix existing tenants missing `modules.tour` etc |
| `supabase_tour_calendar.sql` | Add `departure_date`, `guide_name`, `itinerary` to `tour_packages` |

## Ongoing Roadmap

**Next up:**
- AI assistant per vertical (chat widget on public pages)
- Multi-branch support full UI (AdminBranches page)
- Advanced per-vertical analytics (hotel occupancy, clinic queue, gym attendance)
- Email notification system (SMTP config in AdminSettings)
- Student/client portal improvements

**Architecture decisions to respect:**
- One unified platform — never split verticals into separate deployments
- `consulting` is the **default fallback vertical**, not a primary one
- Every business that registers automatically gets a public site at their subdomain via `TenantPublicPage`
- All state goes through `AppContext` — do not create parallel tenant state
- Telegram bot config lives in `tenants.config.branding.telegram_bot_token/username/chat_id`
- PDF generation uses `jsPDF` (already in `package.json` as `jspdf`)
- Notification Center reads from `contact_requests` + `notification_queue` + vertical-specific tables
