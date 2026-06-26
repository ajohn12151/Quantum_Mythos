# Quantum Mythos — Build Status (2026-06-26)

Companion to `ROADMAP.md` (moat thesis) and `ENTERPRISE_ROADMAP.md` (phased plan).
This tracks concrete done/remaining.

## ✅ Done

### Engine / backend
- **White-box scan fixed** — drives `semgrep-core` directly (the `semgrep` CLI hangs on slow-FS hosts). `backend/app/scanners/whitebox/discover.py`.
- **FP-suppression demo** — `examples/vulnerable-app/cache.py` (non-security md5).
- **Triage LLM provider seam** — `LLM_PROVIDER` (ollama dev / **groq** prod), pinned `llama-3.3-70b-versatile`. `whitebox/llm.py` + `config.py`.
- **Heuristic false-negative fixed** — test-path filter now segment-based (was suppressing real `attestation/`/`latest/`).
- **Eval harness** — `backend/scripts/eval_triage.py`, golden set: **95% acc / 100% recall / 91% precision**; real k8s kept 12/12 real keygens (local 7B dropped ~4).
- **Dashboard BFF** — `GET /api/dashboard` + `app/dto.py` (crypto_asset→frontend DTOs; owner/env null, not faked) + `scan_summary` posture-trend table.
- **`org.plan` + entitlements scaffold** — `free|pro|enterprise`; `app/entitlements.py` (`GATING_ENABLED=False` → nothing locked for judges).

### Binary tier (parallel session, on `backend` branch — needs merge to `main`)
- Rust (RustCrypto) coverage, container-image scanning, CBOM (CycloneDX), artifact scan + API binary mode, untrusted-binary sandbox.

### Frontend / integration
- **Explored every screen**, mapped each to the backend (what's real vs guessed vs missing).
- **Dashboard wired to live backend** — `frontend/src/lib/api.ts`, `hooks/useDashboard.ts`, live `index.tsx` (mock fallback + "backend unreachable" banner).
- **Monorepo** — merged frontend+backend into one tree (`frontend/` + `backend/`), cut over to `main`.
- **Auth + multi-tenancy** — `app/auth.py` `get_current_org()` verifies the Supabase JWT against the project's public JWKS (ES256, dqdmp project; no secret in backend) → get-or-creates the user's org + `app_user` (`supabase_uid`), defaults plan `free`. Scopes `/api/dashboard` + `POST /api/scans` by the caller's org (one place); no/invalid header → shared demo org so the no-login walkthrough still works. Frontend `api.ts` sends the access token. Signup/login were already wired to Supabase email auth.

### Infra / deploy / decisions
- Repo **public**; Vercel **root dir = `frontend`**; production **builds green** and serves (behind Vercel login wall until protection disabled).
- Decisions locked: **no Aurora/AWS** (free Postgres), **SaaS single model** (Groq), **monorepo**, `scan_summary` trend, **null owner/env** (no fabrication).
- **Monetization model** defined: free black-box wedge → paid white-box/binary/CBOM/continuous/remediation → enterprise SSO/on-prem; value metric = **estate size** (assets/repos/domains), not seats. Gate **after judging**.

## ⛔ Remaining

### Integration (wire screens mock → real)
1. ~~**Supabase email auth + backend org-from-user + multi-tenancy**~~ ✅ DONE (see above). Note: `/api/orgs/{org_id}/*` explicit-org endpoints are not yet tenant-guarded (anyone can pass any id) — the *current-org* endpoints the frontend uses are scoped; guard the explicit ones when wiring screens that call them.
2. **Assets + Findings** (endpoints exist — cleanest next). *Add current-org variants `Depends(get_current_org)` like `/api/dashboard`.*
3. **Scan page** real `POST /api/scans` + poll (black/white-box; binary deferred).
4. **Asset detail** (+ algorithm-name normalization fix).
5. **Remediation / Compliance / Settings** (need backend work — see gaps).

### Deploy for live data
- **Host the backend** (free: Oracle Always-Free ARM / Render / local+tunnel) + set **`VITE_API_BASE_URL`** on Vercel → real data on the hosted site.
- **Disable Vercel Deployment Protection** to make the site publicly viewable.

### Email / auth (signup confirmation flow)
- **Canonical Supabase project = `wxiwu…` ("Aegis", ajohn12151's, Production)** — the one Alan owns/controls. `dqdmp…` was the Lovable auto-created throwaway that leaked into the committed `frontend/.env`. Vercel has **no env vars**, so the live site builds from `frontend/.env`; repoint that + backend `SUPABASE_URL` to wxiwu so auth + SMTP live on one project.
- **Custom SMTP = Resend.** ⏳ **TODO: buy + verify a real sending domain** (Cloudflare/Namecheap ~$10/yr) → Resend Domains → add DNS (SPF/DKIM) → set Sender `noreply@<domain>`. Until then we're on **Option A: `onboarding@resend.dev`** which only delivers to the Resend-account owner's own email (test mode) — good enough to demo signup→confirmation live, NOT for public/judge signups.
- Set wxiwu **URL Configuration**: Site URL + redirect allow-list (Vercel prod + localhost, `/**`).
- ⚠️ **Rotate the Resend API key** (`re_axTjwfeA_…`) after the hackathon — pasted in chat.

### Post-judging
- Flip `GATING_ENABLED=True` + add `allows()` checks at scan/CBOM/remediation; comp the demo org to `enterprise`.
- **Merge binary `backend` branch → `main`**; then expose binary/container/CBOM in the UI.

### Dash changes noted (don't add yet)
- Expose binary/container scan mode + CBOM export (after binary tier lands).
- Asset detail: replace hardcoded `scn_91`/"TLS probe" with real scan/source.
- Reframe **Compliance** (no backend model — fabricated mandates) and **Settings** (monitored domains/GitHub App/API keys/notifications all aspirational) to what's real, or mark "coming soon".

### Product gaps / known stubs (enterprise roadmap)
- `reason.py` reachability + `est_time_to_break` (QEC) + remediation PRs/differential test are **stubs** — the moat isn't real yet.
- No real multitenancy isolation, SSO, SOC 2, Java/.NET coverage.

### Hygiene / security
- **Rotate** the Groq key and the Supabase `service_role` key (both pasted in chat).
- `frontend/.env` tracked (publishable keys only — fine, but gitignore eventually).
