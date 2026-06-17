# CLAUDE_MEMORY.md

## Ecosystem Integration Task (100% Core Focus)

**STATUS**: APPROVED BY THE USER

The user has officially approved the full **Ecosystem Integration Architecture Plan**. 
Claude Code must execute the tasks 100% completely, avoiding half-baked or placeholder solutions.

### High-Priority Architectural Directives:

1. **Restructure Workspace to pnpm Monorepo**:
   - Create `pnpm-workspace.yaml` in the root.
   - Set up standard folders:
     - `apps/unipath-core` (migrated from current `src/` and frontend configs).
     - `apps/nova` (migrated from `novaios-main/`).
     - `apps/unitour` (migrated from `unitour-me-main/`).
     - `packages/db` (unified Supabase client, typed models).
     - `packages/ui` (shared components and stylesheets).
     - `packages/auth` (unified SSO session context).
     - `packages/tenant` (shared plan limits, active branch hooks).

2. **Supabase Schema Namespacing**:
   - Set up namespaced schemas in your SQL migrations:
     - `public` for central shared identities (`profiles`, `tenants`, `branches`, `user_roles`).
     - `nova` schema for education modules (`courses`, `groups`, `lessons`).
     - `travel` schema for travel modules (`tours`, `bookings`, `visa_applications`).
   - All tables must share a unified `tenant_id` and `branch_id` and be protected by corresponding Row Level Security (RLS) policies.

3. **Shared Layout Integrations**:
   - Unify the application layout in a shared `AppShell`.
   - Update `BranchSwitcher.tsx` to handle cross-app navigation smoothly.
   - Enforce limitations dynamically via a custom `<PlanGate>` component that checks user custom JWT claims.

**Goal**: Execute the transition smoothly step-by-step, ensuring clean builds, proper module resolution, and seamless database schema migrations. Do not use temporary placeholders — implement production-ready integrations.
