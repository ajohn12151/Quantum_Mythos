# Frontend mock-data audit (app screens)

What's wired to the live backend vs. still mock. Backend = `quantum-mythos-api`
on Render; data DTOs in `src/lib/api.ts`.

Legend: ✅ wired · 🔴 mock · ⚙️ fake (scripted, no data) · ⚫ no backend yet

| Screen | File (`src/routes/_authenticated/app/`) | Status | Wire to |
|---|---|---|---|
| Dashboard | `index.tsx` | ✅ wired | `GET /api/dashboard` via `useDashboard` (mock fallback + "sample data" banner) |
| Scan | `scan.tsx` | ✅ wired | `POST /api/scans` + poll `GET /api/scans/{id}` |
| Assets | `assets.tsx` | ✅ wired | `GET /api/assets` (current-org) via `useAssets` (mock fallback + banner) |
| Asset detail | `assets.$assetId.tsx` | ✅ wired | `GET /api/assets/{id}` (DTO); algorithm normalizer + real discovery/lifecycle; mock fallback |
| Prioritization | `prioritization.tsx` | ✅ wired | `useAssets` (client-side weighted ranking; owner-blast falls back since owner unknown) |
| Findings | `findings.tsx` | ✅ wired | `GET /api/findings` (current-org) via `useFindings` (mock fallback + banner) |
| Remediation | `remediation.tsx` | ✅ wired (preview) | Board fills from real assets by `remediationState` (via `useAssets`); diff + safety-gates clearly labeled **Preview** (differential test is a backend stub). Mock fallback. |
| Compliance | `compliance.tsx` | ✅ reframed | Readiness **derived from real inventory** (`useDashboard` quantum-safe share) across CNSA 2.0 / NIST IR 8547 / FIPS 203-205; per-control tracking marked "coming soon"; export marked coming soon. No fabricated mandates. |
| Settings | `settings.tsx` | ✅ reframed | Real org name + plan (`useMe`, read-only); monitored domains / GitHub App / API keys / notifications shown as honest **"coming soon"** cards (no fake data). |

## Cross-cutting
- ✅ Org switcher now shows the real org via `GET /api/me` + `useMe` (AppShell topbar + settings OrgCard). Demo org → "Demo Org"; real users → their org name.
- 🟢 `components/app/StatusBadge.tsx` imports `mock-data` but only `import type { CryptoStatus }` — a type, harmless. (Eventually move shared types out of `mock-data.ts`.)
- `lib/mock-data.ts` stays as the dashboard offline fallback + type source; trim once all screens are wired.

## Backend prerequisites (small)
- Add current-org endpoints `GET /api/assets`, `GET /api/findings` (`Depends(get_current_org)`), mirroring `/api/dashboard` — so the frontend never passes org IDs.
- Return org **name** for the switcher.
- `api.ts`: add `listAssets`, `getAsset`, `listFindings` (+ remediation) methods + DTOs. `authHeaders` already attaches the JWT.

## Fix order (highest demo value first)
1. ~~**Scan page**~~ ✅ done
2. ~~**Assets + Findings**~~ ✅ done
3. ~~**Asset detail + Prioritization**~~ ✅ done
4. ~~**Org switcher** real name~~ ✅ done
5. ~~**Remediation** (real board + preview-labeled gates)~~ ✅ done
6. ~~**Compliance + Settings** (reframed to honest)~~ ✅ done

**All app screens are now wired to the real backend or honestly reframed.**
Remaining product work (not UI-wiring): real verified remediation (differential
test), CBOM/evidence export, GitHub App, monitored-domains scheduler, API keys.
