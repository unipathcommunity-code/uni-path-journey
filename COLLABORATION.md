# COLLABORATION — Claude ⇄ Antigravity (two-agent workflow)

Two AI agents work on **this same folder** (`C:\uni-path-journey-main`). This file
is the shared contract so we never clobber each other (the past `App.tsx`
"chalkashlik" came from both editing one file at once). Both agents MUST read
and honor this.

## Roles

- **Claude** = builds. Writes/edits application source and authors SQL migrations.
- **Antigravity** = ships. Runs git (add/commit/push), triggers Vercel deploy,
  owns build/infra/config, and runs SQL migrations in Supabase.

Claude does NOT commit, push, or deploy (this machine has no `git` and no `.git`).
Antigravity does NOT write application feature code.

## Ownership map — never co-edit a file

| Path / area | Owner |
|---|---|
| `packages/**` | **Claude** |
| `apps/unipath-core/src/**` (components, pages, hooks, contexts, **App.tsx/routing**) | **Claude** |
| `*.sql` migrations (authoring) | **Claude** (writes) → **Antigravity** runs in Supabase |
| `vercel.json`, `scripts/**`, `*.config.*`, CI, env | **Antigravity** |
| git history, branches, deploy pipeline, Vercel | **Antigravity** |
| root `package.json` **dependencies** | Coordinate (Claude requests a dep → Antigravity installs/commits) |

`apps/unipath-core/src/App.tsx` is **Claude-owned** (routing / EcosystemRouter).
Antigravity must not edit it — this was the historical conflict point.

## Handoff protocol

1. Claude finishes a change set and ends its turn with a **"Changed files"** list.
2. Antigravity commits exactly those files with a clear message and pushes →
   Vercel auto-deploys.
3. SQL migrations: Claude writes the `.sql` file and lists it; Antigravity (or the
   human) runs it in Supabase SQL Editor. Migrations are idempotent and additive;
   never auto-run anything destructive without human confirmation.
4. If Antigravity must touch a Claude-owned file (or vice-versa), say so in the
   commit/handoff note first — one owner per file at a time.

## Current state pointers

- Active app: `apps/unipath-core` (`@unipath/core`). Root build: `pnpm build`.
- Pending migrations authored by Claude, run by Antigravity in Supabase:
  `supabase_owner_multi_business.sql`, `supabase_set_superadmin.sql`,
  `supabase_crm_stages.sql`.
- See `CLAUDE.md` for architecture.
