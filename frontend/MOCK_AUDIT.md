# Frontend mock-data audit (app screens)

What's wired to the live backend vs. still mock. Backend = `quantum-mythos-api`
on Render; data DTOs in `src/lib/api.ts`.

Legend: ✅ wired · 🔴 mock · ⚙️ fake (scripted, no data) · ⚫ no backend yet

| Screen | File (`src/routes/_authenticated/app/`) | Status | Wire to |
|---|---|---|---|
| Dashboard | `index.tsx` | ✅ wired | `GET /api/dashboard` via `useDashboard` (mock fallback + "sample data" banner) |
| Scan | `scan.tsx` | ⚙️→✅ (in progress) | `POST /api/scans` + poll `GET /api/scans/{id}` |
| Assets | `assets.tsx` | 🔴 mock | `GET /api/orgs/{org}/assets` (add current-org variant) |
| Asset detail | `assets.$assetId.tsx` | 🔴 mock | `GET /api/assets/{id}`; fix hardcoded `scn_91`/"TLS probe" + algorithm normalization |
| Prioritization | `prioritization.tsx` | 🔴 mock | reuse `GET /api/orgs/{org}/assets?sort=priority` |
| Findings | `findings.tsx` | 🔴 mock | `GET /api/orgs/{org}/findings` |
| Remediation | `remediation.tsx` | 🔴 mock | assets carry `remediation_state`/`pr_url`; `POST /api/assets/{id}/remediate` + `/reverify`. ⚠️ verified/differential-test is a backend **stub** — frame as "proposes migration, review-gated". Wire last. |
| Compliance | `compliance.tsx` | ⚫ fabricated | `mandates` from mock; **no backend model**. Reframe / "coming soon" / build a model. |
| Settings | `settings.tsx` | ⚫ aspirational | hardcoded org name + placeholder inputs; **no backend**. Reframe to what's real. |

## Cross-cutting
- 🔴 Org switcher hardcoded **"Acme Corp"** — `components/app/AppShell.tsx:158` (and `settings.tsx:81`). Show the real org. *Backend gap:* dashboard returns `orgId` but not org **name** — small add.
- 🟢 `components/app/StatusBadge.tsx` imports `mock-data` but only `import type { CryptoStatus }` — a type, harmless. (Eventually move shared types out of `mock-data.ts`.)
- `lib/mock-data.ts` stays as the dashboard offline fallback + type source; trim once all screens are wired.

## Backend prerequisites (small)
- Add current-org endpoints `GET /api/assets`, `GET /api/findings` (`Depends(get_current_org)`), mirroring `/api/dashboard` — so the frontend never passes org IDs.
- Return org **name** for the switcher.
- `api.ts`: add `listAssets`, `getAsset`, `listFindings` (+ remediation) methods + DTOs. `authHeaders` already attaches the JWT.

## Fix order (highest demo value first)
1. **Scan page** (hero — makes the site actually do something real)
2. **Assets + Findings** (populate from scans)
3. **Asset detail + Prioritization** (cheap; reuse assets endpoint)
4. **Org switcher** real name
5. **Remediation** (wire real parts; mark stubbed gates as preview)
6. **Compliance + Settings** (reframe to honest "coming soon" before judging)
