# COLLABORATION — Claude ⇄ Antigravity (two-agent workflow)

Two AI agents work on **this same folder** (`C:\uni-path-journey-main`). This file
is the shared contract so we never clobber each other (the past `App.tsx`
"chalkashlik" came from both editing one file at once). Both agents MUST read
and honor this.

## Roles (updated 2026-06-21)

- **Claude** = builds **and commits + pushes** its own work. Writes/edits
  application source, authors SQL migrations, then stages **everything**
  (`git add -A`, so deletions are never dropped), commits, and pushes to
  `origin/main`. Vercel auto-deploys from `main`.
- **Antigravity** = owns build/infra/config (`vercel.json`, `scripts/**`,
  `*.config.*`, CI, env), runs SQL migrations in Supabase, and watches the
  Vercel deploy. Antigravity does NOT write application feature code.

> **Why this changed:** the old rule "Claude does NOT commit (this machine has
> no `git`)" was wrong — git IS available (bundled with GitHub Desktop:
> `…\GitHubDesktop\app-*\resources\app\git\cmd\git.exe`). Under the old model
> Claude's changes lived only in the working tree until Antigravity committed
> them. **Directory DELETIONS were never committed** (`git log --diff-filter=D --
> apps/nova` was empty) because a selective `git add <files>` never stages a
> removed folder. Whenever the repo was reset to `origin/main`, every
> uncommitted local change vanished — this is the "revert / work keeps
> disappearing" symptom. Fix: Claude commits with `git add -A` and pushes, so
> work is on `origin/main` immediately and cannot be lost to a reset.

### Git on this machine
- Executable: `C:\Users\user\AppData\Local\GitHubDesktop\app-3.5.12\resources\app\git\cmd\git.exe`
  (not on PATH — invoke by full path).
- Local repo identity: `Claude (UniPath) <bikkijoxa8@gmail.com>`.
- `main` tracks `origin/main`. Credentials via Git Credential Manager (`manager`).

### Claude commit checklist (every change set)
1. `git add -A` — captures edits, new files **and deletions**.
2. `git status` — verify the staged set matches the intended "Changed files".
3. `git commit -m "<clear message>"`.
4. `git push` — to `origin/main`. Confirm `git status` shows `up to date`.
5. End the turn with the **"Changed files"** list + commit hash so Antigravity
   knows what shipped and only needs to watch the deploy / run any new SQL.

> ⚠️ Only ONE agent commits at a time. If Antigravity needs to push, it says so
> in the handoff first. `App.tsx` remains Claude-owned (historical conflict point).

## Ownership map — never co-edit a file

| Path / area | Owner |
|---|---|
| `packages/**` | **Claude** |
| `apps/unipath-core/src/**` (components, pages, hooks, contexts, **App.tsx/routing**) | **Claude** |
| `*.sql` migrations (authoring) | **Claude** (writes) → **Antigravity** runs in Supabase |
| `vercel.json`, `scripts/**`, `*.config.*`, CI, env | **Antigravity** |
| committing/pushing **application code** to `main` | **Claude** (`git add -A` + push) |
| branches, deploy pipeline, Vercel dashboard, tags/releases | **Antigravity** |
| root `package.json` **dependencies** | Coordinate (Claude requests a dep → Antigravity installs/commits) |

`apps/unipath-core/src/App.tsx` is **Claude-owned** (routing / EcosystemRouter).
Antigravity must not edit it — this was the historical conflict point.

## Handoff protocol

1. Claude finishes a change set, runs the **commit checklist** above
   (`git add -A` + commit + push), and ends its turn with a **"Changed files"**
   list **plus the commit hash**.
2. Antigravity watches the Vercel deploy for that commit and runs any new SQL
   migrations in Supabase. It does NOT re-commit Claude's code.
3. SQL migrations: Claude writes the `.sql` file (and commits it) and lists it;
   Antigravity (or the human) runs it in Supabase SQL Editor. Migrations are
   idempotent and additive; never auto-run anything destructive without human
   confirmation.
4. If Antigravity must touch a Claude-owned file (or vice-versa), say so in the
   handoff note first — one owner per file at a time, one committer at a time.

## Current state pointers

- Active app: `apps/unipath-core` (`@unipath/core`). Root build: `pnpm build`.
- Pending migrations authored by Claude, run by Antigravity in Supabase:
  `supabase_owner_multi_business.sql`, `supabase_set_superadmin.sql`,
  `supabase_crm_stages.sql`.
- See `CLAUDE.md` for architecture.
