"""End-to-end smoke test: drives the real API in-process against local Postgres.
Run from backend/:  ./.venv/bin/python scripts/smoke_e2e.py [domain]
"""
import sys
import time

from fastapi.testclient import TestClient

from app.main import app

target = sys.argv[1] if len(sys.argv) > 1 else "github.com"

with TestClient(app) as c:
    assert c.get("/health").json()["ok"]

    r = c.post("/api/scans", json={"mode": "black_box", "target": target})
    r.raise_for_status()
    body = r.json()
    org, scan = body["org_id"], body["scan_id"]
    print(f"scan started for {target}: {body}")

    for _ in range(60):
        s = c.get(f"/api/scans/{scan}").json()
        if s["status"] != "running":
            break
        time.sleep(1)
    print(f"scan status: {s['status']} | summary: {s.get('summary_json')}\n")

    print("=== dashboard ===")
    print(c.get(f"/api/orgs/{org}/dashboard").json(), "\n")

    print("=== assets ===")
    assets = c.get(f"/api/orgs/{org}/assets?sort=recent").json()
    for a in assets:
        tag = "SHADOW" if a["source"] == "ct_log" else "      "
        print(f"  [{tag}] {a['host']:<34} {str(a['pubkey_algo']):<10} "
              f"{str(a['key_bits']):<5} {str(a['category']):<14} "
              f"fs={a['forward_secrecy']} hndl={a['hndl_risk']} state={a['remediation_state']}")
    print(f"\ntotal assets persisted: {len(assets)}")
