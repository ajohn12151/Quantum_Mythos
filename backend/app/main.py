"""Quantum Mythos backend — FastAPI.

The dashboard (Alan's frontend) talks to these endpoints. Black-box scanning is
wired and real; white-box discover/reason/remediate are stubbed for next.
"""
from __future__ import annotations

import asyncio
import json
import pathlib
import shutil
import subprocess
import tempfile
from contextlib import asynccontextmanager
from decimal import Decimal
from uuid import UUID

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from . import db
from .config import CORS_ORIGINS, GITHUB_TOKEN
from .scanners.blackbox.classify import est_time_to_break
from .scanners.blackbox.ct_logs import enumerate_hosts
from .scanners.blackbox.mail import scan_mail
from .scanners.blackbox.ssh import scan_ssh
from .scanners.blackbox.tls import scan_tls
from .scanners.binary.artifact import scan_path
from .scanners.binary.cbom import build_cbom
from .scanners.binary.image import scan_image
from .scanners.whitebox.discover import discover, run_semgrep
from .scanners.whitebox.github_pr import open_pr
from .scanners.whitebox.reason import prioritize
from .scanners.whitebox.triage import triage
from .scanners.whitebox.remediate import (
    apply_fixes, prepare_pr_files, remediate as propose_remediation,
)


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


class RemediateRequest(BaseModel):
    target: str                         # repo URL or local path to fix


class PrRequest(BaseModel):
    target: str                         # GitHub repo URL to open the PR against
    token: str | None = None            # falls back to GITHUB_TOKEN env


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
    p = prioritize(category=facts.category, hndl_risk=facts.hndl_risk,
                   forward_secrecy=facts.forward_secrecy, source=source, locus=host)
    asset_id = await con.fetchval(
        """INSERT INTO crypto_asset
           (org_id, scan_id, source, host, pubkey_algo, key_bits, curve, sig_algo,
            tls_version, category, forward_secrecy, est_time_to_break, hndl_risk,
            priority_score, data_sensitivity, reachable_from_public, priority_rationale)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING id""",
        org_id, scan_id, source, host, facts.pubkey_algo, facts.key_bits, facts.curve,
        facts.sig_algo, facts.tls_version, facts.category, facts.forward_secrecy,
        facts.est_time_to_break, facts.hndl_risk,
        Decimal(str(p["priority_score"])), p["data_sensitivity"], p["reachable_from_public"], p["rationale"],
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

    found = no_fs = 0
    for host, facts in results:
        if facts.error:
            continue
        source = "tls" if host in requested else "ct_log"   # 'ct_log' = shadow find
        await _persist_asset(con, scan_id, org_id, host, facts, source)
        found += 1
        if facts.forward_secrecy is False:
            no_fs += 1

    # SSH host keys on the apex (the server advertises them on connect).
    ssh_found = 0
    for skf in await asyncio.to_thread(scan_ssh, apex):
        await _persist_asset(con, scan_id, org_id, skf.host, skf, "ssh")
        ssh_found += 1

    # Mail servers (MX) via SMTP STARTTLS — same crypto, prime HNDL target.
    mail_found = 0
    for mf in await asyncio.to_thread(scan_mail, apex):
        await _persist_asset(con, scan_id, org_id, mf.host, mf, "mail")
        mail_found += 1

    await con.execute(
        "UPDATE scan SET status='done', finished_at=now(), summary_json=$2::jsonb WHERE id=$1",
        scan_id,
        json.dumps({
            "assets_found": found + ssh_found + mail_found,
            "tls_hosts": found,
            "ssh_host_keys": ssh_found,
            "mail_servers": mail_found,
            "no_forward_secrecy": no_fs,
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
    pqc = misuse = suppressed = 0
    for f in findings:
        v = await asyncio.to_thread(triage, f)      # TRIAGE: kill FPs, judge reachability
        if not v.is_real:
            suppressed += 1                          # false positive — don't persist noise
            continue
        reachable = True if v.reachable == "external" else (None if v.reachable == "unknown" else False)
        if f.kind == "pqc_vulnerable":
            p = prioritize(category=f.category, severity=f.severity,
                           source="code_dep", locus=f.file_path)
            asset_id = await con.fetchval(
                """INSERT INTO crypto_asset
                   (org_id, scan_id, source, file_path, line, pubkey_algo, category,
                    est_time_to_break, hndl_risk,
                    priority_score, data_sensitivity, reachable_from_public, priority_rationale)
                   VALUES ($1,$2,'code_dep',$3,$4,$5,$6,$7,'medium',$8,$9,$10,$11) RETURNING id""",
                org_id, scan_id, f.file_path, f.line, f.algo, f.category,
                est_time_to_break(f.algo, None),
                Decimal(str(p["priority_score"])), v.data_sensitivity, reachable, v.rationale,
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
                org_id, f.cwe, f.message[:140], f.severity, f.file_path, f.line, v.rationale or f.message,
            )
            misuse += 1
    await con.execute(
        "UPDATE scan SET status='done', finished_at=now(), summary_json=$2::jsonb WHERE id=$1",
        scan_id,
        json.dumps({"pqc_vulnerable": pqc, "misuse_findings": misuse,
                    "suppressed_false_positives": suppressed, "total": len(findings)}),
    )


async def _run_binary_scan(scan_id: UUID, org_id: UUID, target: str) -> None:
    """Binary scan: walk a path/artifact, persist each quantum-vulnerable binary as a
    crypto_asset (one row per detected family), then summarize. No source needed."""
    con = db.pool()
    # A target that exists on disk is a path/artifact; otherwise treat it as a
    # container image reference (e.g. "nginx:alpine", "registry/app:1.2").
    if pathlib.Path(target).exists():
        scan = await asyncio.to_thread(scan_path, target)
    else:
        scan = await asyncio.to_thread(scan_image, target)
    persisted = 0
    for f in scan.detected:
        for fam in (f.families or ["asymmetric"]):
            p = prioritize(category=f.risk_category, hndl_risk=f.hndl,
                           source="binary", locus=f.path)
            rationale = f"{f.detection_via} ({f.confidence} confidence). {p['rationale']}"
            asset_id = await con.fetchval(
                """INSERT INTO crypto_asset
                   (org_id, scan_id, source, file_path, pubkey_algo, category,
                    est_time_to_break, hndl_risk,
                    priority_score, data_sensitivity, reachable_from_public, priority_rationale)
                   VALUES ($1,$2,'binary',$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id""",
                org_id, scan_id, f.path, fam, f.risk_category,
                f.time_to_break, f.hndl,
                Decimal(str(p["priority_score"])), p["data_sensitivity"],
                p["reachable_from_public"], rationale,
            )
            await con.execute(
                "INSERT INTO remediation(asset_id, state) VALUES($1,'discovered') "
                "ON CONFLICT (asset_id) DO NOTHING",
                asset_id,
            )
            persisted += 1
    await con.execute(
        "UPDATE scan SET status='done', finished_at=now(), summary_json=$2::jsonb WHERE id=$1",
        scan_id, json.dumps({**scan.summary(), "assets_persisted": persisted}),
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
    elif req.mode == "binary":
        bg.add_task(_run_binary_scan, scan_id, org_id, req.target)
    else:
        bg.add_task(_run_whitebox_scan, scan_id, org_id, req.target)
    return {"scan_id": str(scan_id), "org_id": str(org_id), "status": "running"}


@app.get("/api/scans/{scan_id}")
async def get_scan(scan_id: UUID):
    row = await db.pool().fetchrow("SELECT * FROM scan WHERE id=$1", scan_id)
    if not row:
        raise HTTPException(404, "scan not found")
    return dict(row)


@app.get("/api/scans/{scan_id}/cbom")
async def get_scan_cbom(scan_id: UUID):
    """Cryptographic Bill of Materials (CycloneDX 1.6) for a binary scan."""
    con = db.pool()
    scan = await con.fetchrow("SELECT * FROM scan WHERE id=$1", scan_id)
    if not scan:
        raise HTTPException(404, "scan not found")
    rows = await con.fetch(
        "SELECT pubkey_algo, file_path, est_time_to_break, priority_rationale "
        "FROM crypto_asset WHERE scan_id=$1 AND source='binary'", scan_id)
    by_family: dict[str, list[dict]] = {}
    for r in rows:
        by_family.setdefault(r["pubkey_algo"] or "ECC", []).append({
            "location": r["file_path"],
            "additionalContext": r["priority_rationale"] or "",
        })
    summary = scan["summary_json"] or {}
    if isinstance(summary, str):          # asyncpg returns JSONB as text
        summary = json.loads(summary)
    bom = build_cbom(
        by_family, target=scan["target"],
        scanned=summary.get("binaries_scanned", len(rows)),
        vulnerable=summary.get("vulnerable_binaries", len(by_family)),
        serial_number=f"urn:uuid:{scan_id}",
        timestamp=(scan["finished_at"] or scan["created_at"]).isoformat(),
    )
    return bom


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


@app.post("/api/remediate/preview")
async def remediate_preview(req: RemediateRequest):
    """Generate safe crypto-agility fix diffs for a repo (no PR, no token, $0)."""
    fixes = await asyncio.to_thread(propose_remediation, req.target)
    return [
        {"file_path": f.file_path, "fixes": f.fixes, "diff": f.diff, "note": f.note}
        for f in fixes
    ]


_PR_BODY = (
    "## Quantum Mythos — crypto-agility fixes\n\n"
    "Automated, deterministic remediation of quantum-vulnerable and misused "
    "cryptography. Each change is mechanical; cryptographic primitives are "
    "delegated to a verified provider, never authored by automation. "
    "**Review before merge** and pair with a differential test.\n"
)


@app.post("/api/remediate/pr")
async def remediate_pr(req: PrRequest):
    """Open a real PR with the crypto-agility fixes (needs a GitHub token)."""
    token = req.token or GITHUB_TOKEN
    if not token:
        raise HTTPException(400, "no GitHub token (set GITHUB_TOKEN in .env or pass token)")
    files = await asyncio.to_thread(prepare_pr_files, req.target)
    if not files:
        return {"status": "no_fixes", "detail": "no quantum/crypto findings to fix"}
    files = dict(list(files.items())[:15])   # keep the PR reviewable
    result = await open_pr(req.target, token, files,
                           title="Quantum Mythos: crypto-agility fixes", body=_PR_BODY)
    return {"pr_url": result["pr_url"], "fork": result["fork"],
            "files_changed": list(files.keys())}


def _working_copy(target: str) -> pathlib.Path:
    work = pathlib.Path(tempfile.mkdtemp(prefix="qm_reverify_"))
    p = pathlib.Path(target).expanduser()
    if p.exists():
        shutil.copytree(p, work, dirs_exist_ok=True)
    else:
        subprocess.run(["git", "clone", "--depth", "1", target, str(work)],
                       check=True, capture_output=True, timeout=120)
    return work


def _reverify_compute(target: str) -> list:
    """Apply the fixes to a throwaway copy, re-scan, and return the findings that
    were present before but are GONE after the fix (i.e. genuinely resolved)."""
    # Match by CONTENT (file + rule + snippet), not line — applying fixes inserts
    # imports and shifts line numbers, which would falsely "resolve" untouched findings.
    def sig(f):
        return (f.file_path, f.rule_id, (f.snippet or "").strip())

    work = _working_copy(target)
    try:
        before = run_semgrep(work)
        apply_fixes(work, before)
        after = run_semgrep(work)
        after_sigs = {sig(f) for f in after}
        return [f for f in before if sig(f) not in after_sigs]
    finally:
        shutil.rmtree(work, ignore_errors=True)


@app.post("/api/scans/{scan_id}/reverify")
async def reverify(scan_id: UUID):
    """Closed-loop proof: apply fixes, re-scan, flip resolved rows red->green."""
    con = db.pool()
    scan = await con.fetchrow("SELECT * FROM scan WHERE id=$1", scan_id)
    if not scan:
        raise HTTPException(404, "scan not found")
    if scan["mode"] != "white_box":
        return {"scan_id": str(scan_id), "status": "unsupported",
                "detail": "re-verify currently supports white_box scans"}

    org_id, target = scan["org_id"], scan["target"]
    resolved = await asyncio.to_thread(_reverify_compute, target)

    verified_assets = verified_findings = 0
    for f in resolved:
        if f.kind == "pqc_vulnerable":
            row = await con.fetchrow(
                "SELECT id FROM crypto_asset WHERE org_id=$1 AND file_path=$2 AND line=$3 "
                "AND source='code_dep'",
                org_id, f.file_path, f.line,
            )
            if row:
                await con.execute(
                    "UPDATE remediation SET state='verified', verified_at=now() WHERE asset_id=$1",
                    row["id"],
                )
                verified_assets += 1
        else:
            tag = await con.execute(
                "UPDATE finding SET resolved=true WHERE org_id=$1 AND file_path=$2 AND line=$3 "
                "AND resolved=false",
                org_id, f.file_path, f.line,
            )
            verified_findings += int(tag.split()[-1])

    return {
        "scan_id": str(scan_id),
        "resolved": len(resolved),
        "verified_assets": verified_assets,
        "verified_findings": verified_findings,
    }
