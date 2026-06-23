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
from .scanners.blackbox.tls import scan_tls


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


async def _run_blackbox_scan(scan_id: UUID, org_id: UUID, target: str) -> None:
    con = db.pool()
    # naive host expansion; CT-log enumeration of shadow subdomains is the next step.
    hosts = [target, f"www.{target}"] if "." in target and not target.startswith("www.") else [target]
    found = 0
    for host in hosts:
        facts = await asyncio.to_thread(scan_tls, host)
        if facts.error:
            continue
        asset_id = await con.fetchval(
            """INSERT INTO crypto_asset
               (org_id, scan_id, source, host, pubkey_algo, key_bits, curve, sig_algo,
                tls_version, category, forward_secrecy, est_time_to_break, hndl_risk)
               VALUES ($1,$2,'tls',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id""",
            org_id, scan_id, host, facts.pubkey_algo, facts.key_bits, facts.curve,
            facts.sig_algo, facts.tls_version, facts.category, facts.forward_secrecy,
            facts.est_time_to_break, facts.hndl_risk,
        )
        await con.execute(
            "INSERT INTO remediation(asset_id, state) VALUES($1,'discovered') "
            "ON CONFLICT (asset_id) DO NOTHING",
            asset_id,
        )
        found += 1
    await con.execute(
        "UPDATE scan SET status='done', finished_at=now(), summary_json=$2 WHERE id=$1",
        scan_id, json.dumps({"assets_found": found, "hosts": hosts}),
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
        # TODO: white-box discover -> reason -> remediate pipeline.
        await con.execute("UPDATE scan SET status='done', finished_at=now() WHERE id=$1", scan_id)
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
