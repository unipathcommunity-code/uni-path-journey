---
name: db-migrate
description: Apply a SQL migration file (or ad-hoc SQL) to the live UniPath Supabase database, and reload the PostgREST schema cache. Use when the user adds/changes a supabase/migrations/*.sql file or asks to run SQL on the live DB ("migratsiyani qo'lla", "bazaga qo'sh", "apply migration"). Do NOT use `supabase db push` (remote history is out of sync).
---

# Apply a migration to the live UniPath DB

`supabase db push` is UNSAFE here (remote migration history diverged from the manually-applied SQL).
Apply SQL directly with the `pg` client over the **pooler** (the direct `db.<ref>.supabase.co` host no
longer resolves).

## Connection
```
postgresql://postgres.bpokyebvwhigpjrembcg:<DB_PASSWORD>@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```
`pg` is available at `C:\uni-path-journey-main\node_modules` — run node with
`$env:NODE_PATH = "C:\uni-path-journey-main\node_modules"`. The DB password is in the project memory
`nova-unitour-db-integration.md` (and antigravity scratch, e.g. `.gemini\antigravity\brain\*\scratch\reload_schema.js`).

## Runner (scratchpad script)
```js
const { Client } = require('pg'); const fs = require('fs');
const client = new Client({ connectionString: process.env.PG_URL });
(async () => {
  await client.connect();
  const sql = fs.readFileSync(process.argv[2], 'utf8');
  try { await client.query('BEGIN'); await client.query(sql); await client.query('COMMIT'); console.log('APPLIED OK'); }
  catch (e) { await client.query('ROLLBACK'); console.log('FAILED:', e.message); process.exitCode = 1; }
  await client.query("NOTIFY pgrst, 'reload schema';");   // make new tables/RPCs visible to the API immediately
  await client.end();
})().catch(e => { console.error(e.message); process.exit(1); });
```
Run: set `$env:PG_URL` to the pooler string, then `node runner.js path\to\migration.sql`.

## Rules
- Write migrations idempotent: `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `DROP POLICY IF EXISTS` before `CREATE POLICY`.
- New tables get RLS + a UniPath-style policy using `get_auth_user_role() IN ('admin','owner','manager','super_admin',...)`. NOVA's own helpers (has_role/user_organization/org_has_feature) do NOT exist here.
- After applying, always `NOTIFY pgrst, 'reload schema'` (already in the runner) or the API 404s on new objects.
- To find what's missing across the app, use the `db-audit` skill.
