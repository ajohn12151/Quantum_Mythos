"""Quantum Mythos backend — FastAPI.

The dashboard (Alan's frontend) talks to these endpoints. Black-box scanning is
wired and real; white-box discover/reason/remediate are stubbed for next.
"""
from __future__ import annotations

import asyncio
import json
from contextlib import asynccontextmanager
from uuid import UUID

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from . import db
from .config import CORS_ORIGINS
from .scanners.blackbox.classify import est_time_to_break
from .scanners.blackbox.ct_logs import enumerate_hosts
from .scanners.blackbox.tls import scan_tls
from .scanners.whitebox.discover import discover


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.init_pool()
    yield
    await db.close_pool()


app = FastAPI(title="Quantum Mythos API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware, allow_origins=CORS_ORIGINS, allow_methods=["*"], allow_headers=["*"]
)


# ---------- request models ----------
class ScanRequest(BaseModel):
    org_id: UUID | None = None          # if omitted, the demo org is used/created
    mode: str = "black_box"             # 'black_box' | 'white_box'
    target: str                         # domain (black-box) or repo URL (white-box)


# ---------- helpers ----------
async def _demo_org() -> UUID:
    """For the demo: get-or-create a single org so the flow works without auth."""
    con = db.pool()
    row = await con.fetchrow("SELECT id FROM org ORDER BY created_at LIMIT 1")
    if row:
        return row["id"]
    return await con.fetchval("INSERT INTO org(name) VALUES('Demo Org') RETURNING id")


MAX_HOSTS = 20          # cap fan-out so a scan stays demo-fast
SCAN_CONCURRENCY = 8


async def _persist_asset(con, scan_id, org_id, host, facts, source) -> None:
    asset_id = await con.fetchval(
        """INSERT INTO crypto_asset
           (org_id, scan_id, source, host, pubkey_algo, key_bits, curve, sig_algo,
            tls_version, category, forward_secrecy, est_time_to_break, hndl_risk)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id""",
        org_id, scan_id, source, host, facts.pubkey_algo, facts.key_bits, facts.curve,
        facts.sig_algo, facts.tls_version, facts.category, facts.forward_secrecy,
        facts.est_time_to_break, facts.hndl_risk,
    )
    await con.execute(
        "INSERT INTO remediation(asset_id, state) VALUES($1,'discovered') "
        "ON CONFLICT (asset_id) DO NOTHING",
        asset_id,
    )


async def _run_blackbox_scan(scan_id: UUID, org_id: UUID, target: str) -> None:
    con = db.pool()
    apex = target.lower().lstrip("*.").rstrip(".")
    requested = {apex, f"www.{apex}"}

    # 1) scan the apex + www first (fast) to harvest SANs as a discovery source.
    seed_facts = {h: await asyncio.to_thread(scan_tls, h) for h in requested}
    sans = {s for f in seed_facts.values() if f.san for s in f.san
            if s.endswith(apex) and "*" not in s}

    # 2) Certificate Transparency enumeration (best-effort; SANs cover us if it's down).
    ct_hosts = set(await enumerate_hosts(apex))

    # 3) union all discovery sources, cap the fan-out.
    discovered = (sans | ct_hosts) - requested
    candidates = list(requested) + sorted(discovered)
    candidates = candidates[:MAX_HOSTS]

    # 4) scan everything concurrently (reuse seed results for apex/www).
    sem = asyncio.Semaphore(SCAN_CONCURRENCY)

    async def scan_one(host):
        if host in seed_facts:
            return host, seed_facts[host]
        async with sem:
            return host, await asyncio.to_thread(scan_tls, host)

    results = await asyncio.gather(*(scan_one(h) for h in candidates))

    found = 0
    for host, facts in results:
        if facts.error:
            continue
        source = "tls" if host in requested else "ct_log"   # 'ct_log' = shadow find
        await _persist_asset(con, scan_id, org_id, host, facts, source)
        found += 1

    await con.execute(
        "UPDATE scan SET status='done', finished_at=now(), summary_json=$2::jsonb WHERE id=$1",
        scan_id,
        json.dumps({
            "assets_found": found,
            "hosts_scanned": len(candidates),
            "shadow_hosts_discovered": len(discovered),
            "ct_log_hits": len(ct_hosts),
            "discovery_sources": {"ct_logs": len(ct_hosts), "cert_sans": len(sans)},
        }),
    )


async def _run_whitebox_scan(scan_id: UUID, org_id: UUID, target: str) -> None:
    """Code scan: clone/scan a repo -> persist quantum-vulnerable crypto as
    crypto_asset (inventory) and classical-misuse bugs as finding rows."""
    con = db.pool()
    findings = await asyncio.to_thread(discover, target)
    pqc = misuse = 0
    for f in findings:
        if f.kind == "pqc_vulnerable":
            asset_id = await con.fetchval(
                """INSERT INTO crypto_asset
                   (org_id, scan_id, source, file_path, line, pubkey_algo, category,
                    est_time_to_break, hndl_risk)
                   VALUES ($1,$2,'code_dep',$3,$4,$5,$6,$7,'medium') RETURNING id""",
                org_id, scan_id, f.file_path, f.line, f.algo, f.category,
                est_time_to_break(f.algo, None),
            )
            await con.execute(
                "INSERT INTO remediation(asset_id, state) VALUES($1,'discovered') "
                "ON CONFLICT (asset_id) DO NOTHING",
                asset_id,
            )
            pqc += 1
        else:
            await con.execute(
                """INSERT INTO finding
                   (org_id, cwe, title, severity, file_path, line, explanation)
                   VALUES ($1,$2,$3,$4,$5,$6,$7)""",
                org_id, f.cwe, f.message[:140], f.severity, f.file_path, f.line, f.message,
            )
            misuse += 1
    await con.execute(
        "UPDATE scan SET status='done', finished_at=now(), summary_json=$2::jsonb WHERE id=$1",
        scan_id,
        json.dumps({"pqc_vulnerable": pqc, "misuse_findings": misuse, "total": len(findings)}),
    )


# ---------- routes ----------
@app.get("/health")
async def health():
    return {"ok": True}


@app.post("/api/scans")
async def create_scan(req: ScanRequest, bg: BackgroundTasks):
    con = db.pool()
    org_id = req.org_id or await _demo_org()
    scan_id = await con.fetchval(
        "INSERT INTO scan(org_id, mode, target) VALUES($1,$2,$3) RETURNING id",
        org_id, req.mode, req.target,
    )
    if req.mode == "black_box":
        bg.add_task(_run_blackbox_scan, scan_id, org_id, req.target)
    else:
        bg.add_task(_run_whitebox_scan, scan_id, org_id, req.target)
    return {"scan_id": str(scan_id), "org_id": str(org_id), "status": "running"}


@app.get("/api/scans/{scan_id}")
async def get_scan(scan_id: UUID):
    row = await db.pool().fetchrow("SELECT * FROM scan WHERE id=$1", scan_id)
    if not row:
        raise HTTPException(404, "scan not found")
    return dict(row)


@app.get("/api/orgs/{org_id}/assets")
async def list_assets(org_id: UUID, category: str | None = None, sort: str = "priority"):
    order = "priority_score DESC NULLS LAST" if sort == "priority" else "last_seen DESC"
    q = f"""SELECT a.*, r.state AS remediation_state, r.pr_url
            FROM crypto_asset a LEFT JOIN remediation r ON r.asset_id = a.id
            WHERE a.org_id=$1 {'AND a.category=$2' if category else ''}
            ORDER BY {order}"""
    rows = await (db.pool().fetch(q, org_id, category) if category else db.pool().fetch(q, org_id))
    return [dict(r) for r in rows]


@app.get("/api/assets/{asset_id}")
async def get_asset(asset_id: UUID):
    row = await db.pool().fetchrow(
        "SELECT a.*, r.state AS remediation_state, r.pr_url "
        "FROM crypto_asset a LEFT JOIN remediation r ON r.asset_id=a.id WHERE a.id=$1",
        asset_id,
    )
    if not row:
        raise HTTPException(404, "asset not found")
    return dict(row)


@app.get("/api/orgs/{org_id}/dashboard")
async def dashboard(org_id: UUID):
    con = db.pool()
    by_cat = await con.fetch(
        "SELECT category, count(*) FROM crypto_asset WHERE org_id=$1 GROUP BY category", org_id
    )
    progress = await con.fetchrow(
        """SELECT count(*) AS total,
                  count(*) FILTER (WHERE r.state='verified') AS verified
           FROM crypto_asset a LEFT JOIN remediation r ON r.asset_id=a.id
           WHERE a.org_id=$1""",
        org_id,
    )
    return {
        "counts_by_category": {r["category"]: r["count"] for r in by_cat},
        "migration_progress": dict(progress) if progress else {},
    }


@app.get("/api/orgs/{org_id}/findings")
async def list_findings(org_id: UUID):
    rows = await db.pool().fetch("SELECT * FROM finding WHERE org_id=$1", org_id)
    return [dict(r) for r in rows]


@app.post("/api/assets/{asset_id}/remediate")
async def remediate(asset_id: UUID):
    # TODO: real GitHub crypto-agility PR + differential test (white-box).
    pr_url = "https://github.com/ajohn12151/Quantum_Mythos/pull/PLACEHOLDER"
    await db.pool().execute(
        "UPDATE remediation SET state='pr_open', pr_url=$2, opened_at=now() WHERE asset_id=$1",
        asset_id, pr_url,
    )
    return {"asset_id": str(asset_id), "state": "pr_open", "pr_url": pr_url}


@app.post("/api/scans/{scan_id}/reverify")
async def reverify(scan_id: UUID):
    # TODO: re-scan and flip resolved assets to 'verified' (red -> green).
    return {"scan_id": str(scan_id), "status": "not_implemented"}
