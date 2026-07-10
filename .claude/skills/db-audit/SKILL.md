---
name: db-audit
description: Find every database table and RPC the frontend code calls that is MISSING from the live Supabase DB (the #1 cause of "buttons silently don't work" / broken verticals). Use when a vertical or page seems broken, after integrating a new app (NOVA/UniTour), or when the user reports many bugs across a system.
---

# Audit code → live DB (missing tables/RPCs)

Scans every `.from('X')` and `.rpc('Y')` in the app and diffs against the live DB. Any missing table =
a broken feature (queries 404). This is how we found the tour vertical had NO schema (39 missing tables).

## Runner
```js
const { Client } = require('pg'); const fs = require('fs'); const path = require('path');
const ROOT = 'C:/uni-path-journey-main/apps/unipath-core/src';
const dirs = ['academy','tour','pages','hooks','components','contexts'];
function walk(d, a){ for (const e of fs.readdirSync(d,{withFileTypes:true})){ const p=path.join(d,e.name);
  e.isDirectory()?walk(p,a):/\.(tsx?|ts)$/.test(e.name)&&a.push(p);} return a; }
const files=[]; for (const d of dirs){ const f=path.join(ROOT,d); if(fs.existsSync(f)) walk(f,files); }
const T=new Set(), R=new Set();
for (const f of files){ const c=fs.readFileSync(f,'utf8'); let m;
  const ft=/\.from\(\s*['"`]([a-zA-Z_]\w*)['"`]\s*\)/g; while((m=ft.exec(c)))T.add(m[1]);
  const fr=/\.rpc\(\s*['"`]([a-zA-Z_]\w*)['"`]/g; while((m=fr.exec(c)))R.add(m[1]); }
(async()=>{ const client=new Client({connectionString:process.env.PG_URL}); await client.connect();
  const tb=new Set((await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`)).rows.map(r=>r.table_name));
  const fn=new Set((await client.query(`SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'`)).rows.map(r=>r.proname));
  console.log('MISSING TABLES:', [...T].filter(t=>!tb.has(t)).sort().join(', ')||'none');
  console.log('MISSING RPCS:', [...R].filter(r=>!fn.has(r)).sort().join(', ')||'none');
  await client.end(); })().catch(e=>{console.error(e.message);process.exit(1);});
```
Run with `$env:PG_URL` = pooler string (see `db-migrate` skill), `$env:NODE_PATH="C:\uni-path-journey-main\node_modules"`.

## Fixing what's found
- Tables missing → generate `CREATE TABLE` from that app's own `integrations/supabase/types.ts`
  (parser: table name at 6-space indent, `Row: {` at 8-space; map string→text, number→numeric,
  boolean→boolean, Json/[]→jsonb, *_at→timestamptz, *_id→uuid), add RLS, apply via `db-migrate`.
- `avatars`, `documents` etc. that look missing are usually **storage buckets** (`supabase.storage.from`),
  not tables — check the call site before creating a table.
- RPCs missing → port from NOVA migrations but ADAPT to UniPath (tenant_id/tenants, get_auth_user_role).
