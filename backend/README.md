# Quantum Mythos — Backend

The engine behind the dashboard. See `../PROJECT_CONTEXT.md` for the full brief.

## Run locally

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # set DATABASE_URL (local Postgres now, Aurora later)

# start a local Postgres (e.g. docker):
# docker run -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=quantum_mythos -p 5432:5432 -d postgres

uvicorn app.main:app --reload --port 8000
```

Schema is auto-applied on startup (`sql/schema.sql`, idempotent).

## Try the black-box scanner standalone (no DB needed)

```bash
python -m app.scanners.blackbox.tls chase.com github.com
```

## API (the contract Alan's dashboard calls)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/scans` | `{org_id?, mode, target}` -> kicks off a scan |
| GET  | `/api/scans/{id}` | scan status + summary |
| GET  | `/api/orgs/{id}/dashboard` | category counts + migration progress |
| GET  | `/api/orgs/{id}/assets` | the red->green asset table (`?category=&sort=priority`) |
| GET  | `/api/assets/{id}` | asset detail + est_time_to_break |
| GET  | `/api/orgs/{id}/findings` | classical crypto-misuse findings |
| POST | `/api/assets/{id}/remediate` | open crypto-agility PR (stub) |
| POST | `/api/scans/{id}/reverify` | re-scan, flip red->green (stub) |

`org_id` is optional in the demo — a single demo org is auto-created.

## Status

- ✅ Black-box TLS scanner (real; validated on chase.com / github.com).
- ✅ Aurora schema + FastAPI skeleton + black-box scan persisted to DB.
- ⬜ Black-box: SSH (`ssh-keyscan`), mail STARTTLS, CT-log shadow-subdomain enumeration, forward-secrecy edge cases.
- ⬜ White-box: Semgrep+Gitleaks discover -> Claude reasoning/prioritization -> crypto-agility PR + differential test.
- ⬜ Re-verify loop (red->green).
