"""End-to-end white-box smoke: scan the sample vulnerable app through the API.
Run from backend/:  ./.venv/bin/python scripts/smoke_whitebox.py
"""
import os
import time

from fastapi.testclient import TestClient

from app.main import app

REPO = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                    "examples", "vulnerable-app")

with TestClient(app) as c:
    r = c.post("/api/scans", json={"mode": "white_box", "target": REPO})
    r.raise_for_status()
    org, scan = r.json()["org_id"], r.json()["scan_id"]
    print(f"white-box scan started on {REPO}")

    for _ in range(60):
        s = c.get(f"/api/scans/{scan}").json()
        if s["status"] != "running":
            break
        time.sleep(1)
    print(f"status: {s['status']} | summary: {s.get('summary_json')}\n")

    print("=== quantum-vulnerable crypto in code (assets) ===")
    for a in c.get(f"/api/orgs/{org}/assets").json():
        if a["source"] == "code_dep":
            print(f"  {a['file_path']}:{a['line']:<4} {a['pubkey_algo']:<10} {a['category']}")

    print("\n=== classical crypto bugs (findings, exploitable today) ===")
    for f in c.get(f"/api/orgs/{org}/findings").json():
        print(f"  [{f['severity']:<8}] {str(f['cwe']):<9} {f['file_path']}:{f['line']:<4} {f['title']}")
