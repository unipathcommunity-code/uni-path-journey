# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

```bash
pnpm dev          # Start Vite dev server (apps/unipath-core)
pnpm build        # Production build (all workspaces + merge-dist)
pnpm build:core   # Build just apps/unipath-core
pnpm lint         # ESLint across workspaces
pnpm preview      # Preview production build locally
```

No test runner is configured. TypeScript errors surface during the build (`tsc -b` runs first).

---

## What This Is

**UniPath** — a multi-tenant SaaS at `unipath.me` for **study-abroad consulting agencies**. One codebase serves every registered agency. Each agency gets its own subdomain (`myagency.unipath.me`), a branded public site and an admin workspace.

There is exactly **one vertical: `consulting`**. The tour (UniTour) and academy (NOVA) verticals, plus the hotel / restaurant / gym / clinic / wedding-hall / etc. modules, were removed in the consulting-only cleanup — do not reintroduce vertical branching.

Live code root is `apps/unipath-core/src/` (pnpm monorepo; shared `packages/{auth,tenant,db,ui,telegram,unicoin}`).

### Identity: one account, many agencies
Supabase auth email is global. `tenant_memberships` (`supabase/migrations/20260705120000_tenant_memberships.sql`) gives a user a SEPARATE role per agency (`join_tenant` / `get_membership_role` RPCs). `hooks/useUserRole.ts` resolves the role for the ACTIVE tenant from memberships first, falling back to legacy `profiles.role` + `tenants.owner_email`. End-users always route to `/student/dashboard`.

**Migrations are NOT auto-applied** — run new SQL files in the Supabase SQL editor (or via `supabase db push` with the real DB password).

> Note: the database still contains tables from the removed verticals (`tour_packages`, `tour_bookings`, `tour_companies`, `academy_groups`, `hotel_bookings`, `restaurant_orders`, …). Nothing in the app reads them any more; dropping them is a separate, deliberate migration.

---

## Architecture

### Tenant Resolution (critical path)

`TenantProvider` (`packages/tenant`) → `mapTenant()` → `AppContext` exposes `activeTenant` globally.

`mapTenant` no longer detects a vertical: every tenant is mapped with `business_type: 'consulting'`.

Subdomain detection flow in `TenantProvider` / `AppContext.resolveTenant()`:
1. Check `localStorage('active_tenant')` → SuperAdmin impersonation
2. Parse hostname subdomain → query `tenants` table by `subdomain`
3. Check `custom_domain` column
4. If authenticated and not core root → resolve tenant from `profiles.tenant_id`

### Routing

`App.tsx` holds a single flat `<Routes>` tree — there is no `EcosystemRouter` and no lazy vertical route trees.

`/dashboard` → `DashboardRedirect.tsx` routes by role only.

`/admin/dashboard` → `AdminConsulting.tsx` (the consulting dashboard) directly.

### Role Hierarchy

```
super_admin                            → /super-admin
admin / owner / manager                → /admin
accountant                             → /accountant
agent / specialist / mentor            → /agent/dashboard
(everyone else)                        → /student/dashboard
```

Roles live in `tenant_memberships` (primary) with a `profiles.role` fallback. `useUserRole` reads them.

### Agency Registration (`Systematize.tsx`)

Step 1 shows a single fixed "Konsalting" card. The insert always writes:
```js
vertical: 'consulting',
config: {
  business_type: 'consulting',
  modules: { consulting: true, ai_camera: …, billing: true },
}
```

### SuperAdmin Impersonation

`impersonateTenant()` in `lib/verticalConfig.ts` saves an enriched payload to `localStorage('active_tenant')` and hard-navigates to `/admin`:
```js
{ ...selectedTenant, business_type: 'consulting', config: { business_type: 'consulting', modules: { consulting: true } } }
```
Both `AdminConsulting` and `DashboardRedirect` read this before `activeTenant`. Impersonation uses `window.location.href` (not `navigate()`) so AppContext re-reads localStorage.

---

## Translation System — Dual System (Important)

There are **two separate i18n systems** in this repo:

| System | File | Used by |
|--------|------|---------|
| `useLanguage` hook | `src/hooks/useLanguage.tsx` | A handful of shared components (ProtectedRoute, ThemeLangSwitcher, …) |
| `useTranslation` + `LABELS` objects | `src/lib/i18n.ts` + inline objects | Admin / consulting pages |
| `translations` object | `src/lib/translations.ts` | The public marketing landing page (`components/landing/*`) |

`useLanguage` stores preference in `localStorage('unipath-lang')`.
`AppContext` stores preference in `localStorage('unipath_language')` and syncs to `profiles.preferred_language` in DB.

When adding new UI text, add it to whichever system that file already uses, for all 3 languages (`uz`, `ru`, `en`).

---

## Key Files

| File | Purpose |
|------|---------|
| `src/contexts/AppContext.tsx` | Central tenant state, subdomain resolution |
| `src/core/TenantRouter.tsx` | Guards: shows TenantNotFound if no tenant on non-root domain |
| `src/pages/DashboardRedirect.tsx` | Role → route decision |
| `src/pages/admin/AdminConsulting.tsx` | The admin dashboard |
| `src/pages/Auth.tsx` | Universal login — shows tenant branding or generic UniPath |
| `src/pages/Systematize.tsx` | Agency onboarding/registration |
| `src/pages/TenantPublicPage.tsx` | Public-facing site for every tenant subdomain (unauthenticated) |
| `src/pages/superadmin/SuperAdminDashboard.tsx` | Platform management, tenant impersonation |
| `packages/tenant/src/verticals.ts` | `mapTenant()` — always resolves `consulting` |

---

## Supabase

Client: `src/integrations/supabase/client.ts`
Types: `src/integrations/supabase/types.ts` (may be outdated — `tenants` table not yet in generated types; use `as any` casts for the `vertical` column)

Key tables: `tenants`, `tenant_memberships`, `profiles`, `applications`, `agent_students`, `crm_stages`, `universities`, `payment_transactions`, `notification_queue`, `contact_requests`, `branches`

The `tenants.config` column is JSONB. Its shape matches the `TenantConfig` interface in `AppContext.tsx`.

Deploy: Vercel git integration on the repo root (`pnpm -r build && node scripts/merge-dist.js` → root `dist/`). **Deploy = commit + push to main.**

---

## Architecture decisions to respect

- **One vertical only.** Never add `business_type` / vertical branching back into routing, layouts, dashboards or onboarding.
- Every agency that registers automatically gets a public site at their subdomain via `TenantPublicPage`.
- All tenant state goes through `AppContext` / `TenantProvider` — do not create parallel tenant state.
- Telegram bot config lives in `tenants.config.branding.telegram_bot_token/username/chat_id`.
- PDF generation uses `jsPDF` (already in `package.json` as `jspdf`).
- Notification Center reads from `contact_requests` + `notification_queue`.
- Loose diagnostic scripts (`check_*.js`, `test_*.cjs`, `search_*.js`) must not be committed — see `.gitignore`.
