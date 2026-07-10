---
name: deploy
description: Deploy the UniPath app to Vercel production and verify the live bundle actually updated. Use whenever the user wants changes to go live ("deploy", "jonli qil", "publish", "chiqar", "push live"). CRITICAL because a plain git push does NOT trigger a Vercel deploy on this repo.
---

# Deploy UniPath to production

**Git push does NOT auto-deploy** (the Vercel Git integration is disconnected). Always deploy with the
Vercel CLI, which is already authenticated (`npx vercel whoami` → `startupakseleratsiya-1211`).

## Steps
1. (Optional but recommended) commit changes first so the repo matches production.
2. From the repo root `C:\uni-path-journey-main`:
   ```
   npx --yes vercel --prod --yes
   ```
   It uploads local code, builds on Vercel (`pnpm -r build && node scripts/merge-dist.js`), and aliases
   to `www.unipath.me` + wildcard `*.unipath.me`. Wait for `readyState: READY` and the `Aliased` line.
3. **Verify it really updated** (SPA, so check the bundle — the markdown won't show it):
   ```powershell
   $html = (Invoke-WebRequest "https://apex-academy.unipath.me/?cb=$(Get-Random)" -UseBasicParsing).Content
   $bundle = ([regex]::Match($html,'assets/index-[A-Za-z0-9\-]+\.js')).Value
   $js = (Invoke-WebRequest "https://apex-academy.unipath.me/$bundle" -UseBasicParsing).Content
   $js -match '<A STRING UNIQUE TO YOUR CHANGE>'   # should be True
   ```
   The bundle hash should change and a string unique to your change should be present.

## Notes
- Project: `uni-path-journey-unipath-core` (prj_s9ilZHpf003HrVdZbjFOcYU2wk8T, org team_U1igZ1QG75xyfZrFekTFP1Yv).
- DB migrations are separate and are NOT applied by a deploy — see the `db-migrate` skill.
