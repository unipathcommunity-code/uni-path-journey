---
name: smoke-test
description: Cheap, token-efficient way to find broken pages/buttons across all UniPath verticals WITHOUT a browser. Signs in as a temporary-admin test account and runs the key queries each dashboard makes, reporting only the failures (missing tables/columns, broken joins, RLS blocks). Use instead of Playwright when the user reports vague "bugs / buttons don't work" and wants limits conserved.
---

# Query-level smoke test (no browser, low token cost)

Most "button doesn't work" bugs are a failing Supabase query (missing table/column, missing FK for an
embedded join, RLS block). This finds them in ONE script run — far cheaper than Playwright UI testing.

## How
1. Temporarily make a throwaway account an admin + set a known password (via `pg`, pooler conn — see
   `db-migrate` skill). Account: `tester123@gmail.com`. Also `email_confirmed_at = now()`.
   ```sql
   UPDATE auth.users SET encrypted_password = crypt('TestPass123!', gen_salt('bf')),
     email_confirmed_at = COALESCE(email_confirmed_at, now()) WHERE email='tester123@gmail.com';
   UPDATE public.profiles SET role='admin' WHERE lower(email)='tester123@gmail.com';
   ```
2. Sign in with `@supabase/supabase-js` (URL + anon key from `apps/unipath-core/src/integrations/supabase/client.ts`)
   — NODE_PATH must include `apps/unipath-core/node_modules` (that's where supabase-js lives; `pg` is in root).
3. Run `sb.from(t).select('*').limit(1)` for the representative tables of each vertical + the real
   embedded-join selects the dashboards use (e.g. `agent_referrals` → `*, booking:bookings(*, tour:tours(...))`)
   + key RPCs. Print only errors.
4. **Revert**: `UPDATE profiles SET role='student' WHERE email='tester123@gmail.com'`.

Full runner saved at scratchpad `smoke.js` (adapt the table lists per vertical).

## Fixing findings
- "Could not find a relationship between X and Y" → missing FOREIGN KEY. PostgREST needs FKs for embedded
  joins. Extract FKs from the real source migrations (unitour-me-main / nova-flourish-hub-main) and add
  `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY ... REFERENCES ...` (see scratchpad `add_fks.js`).
- "column ... does not exist" → the reconstructed table missed a column; `ALTER TABLE ADD COLUMN IF NOT EXISTS`.
- Empty result (no error) is NOT a bug — it's just no data.
