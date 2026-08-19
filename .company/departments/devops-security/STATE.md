# DevOps / Security -- State

## Infrastructure (confirmed in code)
- Hosting: Vercel, region pinned to `dub1` (Dublin) to match Supabase `eu-west-1`
- Database/Auth: Supabase (RLS-based)
- Containerization: Dockerfile present as an alternate deploy path
- Crons: 3 daily jobs (notifications 9am, email-engagement 10am, billing-enforcement 11am UTC)
- No CI pipeline found (`.github/workflows` absent) -- tests exist (Vitest) but automatic run-on-PR is unconfirmed

## Security Findings -- Latest Audit: 2026-08-19 (`.company/departments/devops-security/audit-2026-08-19.md`)

The 3 findings originally documented in `docs/07-roadmap.md` Phase 6 sub-phase 1 are **all confirmed fixed** as of this audit:
1. ~~Unauthenticated wallet-pass-download endpoint~~ -- fixed, both Apple/Google pass routes require a matching auth token
2. ~~Non-durable rate limiting~~ -- fixed, Postgres-backed via `lib/rate-limit.ts` (note: fails open on DB error -- confirm this is still desired pre-launch)
3. ~~Hardcoded dashboard branding~~ -- fixed, real settings page at `dashboard/settings/branding`

Dependency vulnerabilities (via `npm audit`), status as of 2026-08-19:
- ~~`next` (high)~~ / ~~`postcss` (high)~~ -- **fixed**, bumped `next` to 16.3.1 (`eslint-config-next` matched). Verified via `npm run build` (clean) -- CEO approved.
- ~~`dompurify` (moderate)~~ -- **fixed** via `npm audit fix`. CEO approved.
- `joi` / `passkit-generator` (moderate) -- **left unchanged**, per CEO decision (Apple Wallet working, fix needs semver-major bump + real-device testing)
- `sharp` (high, CVE-2026-33327/28, 35590/91) -- **investigated, not applied** (2026-08-19). Fix requires `sharp@0.35.3` (Node >=20.9.0, otherwise no breaking API impact -- smoke-tested clean against this codebase's actual usage). Low risk once Vercel's Node runtime version is confirmed >=20.9.0. Awaiting CEO go-ahead. Full writeup in `audit-2026-08-19.md`.
- No hardcoded secrets found in tracked source
- ~~Vitest `proxy.test.ts` module-resolution issue~~ -- **fixed** (2026-08-19). `vitest.config.ts` now inlines `next-intl` so Vitest transforms it through Vite's resolver instead of loading it natively (Node's native ESM loader couldn't complete `next-intl`'s extensionless `next/server` import). Test-config-only change; 43/43 tests now pass, `npm run build` still clean.

## CI Pipeline -- Added 2026-08-19
`.github/workflows/ci.yml` now runs `npm ci`, `npm test`, and `npm run build` on every push/PR to `main` -- the 43 tests previously only ran when manually invoked. Verified locally first by building with `.env.local` removed and only the workflow's placeholder env vars set (exit 0), confirming no real secrets are needed at build time.

## Rate Limiter Fail-Open -- Resolved 2026-08-19
Per CEO decision (Option B): `/api/customers/enroll` now fails **closed** on rate-limiter DB errors (`lib/rate-limit.ts`'s `checkRateLimit` takes a `{ failOpen }` option, default `true`). `/api/scan` unchanged -- still fails open, correctness guarded independently by the atomic `record_scan_event` RPC. Verified via `npm test` (43/43) and `npm run build` (clean).

## Credential Provisioning Status (confirmed by CEO, 2026-08)
- Apple Wallet certs + Google Wallet issuer credentials: **provisioned and working**
- Stripe live keys: **not provisioned yet** -- production billing still in progress, currently a launch blocker

## Incident History
None recorded yet -- greenfield department state.
