"""Closed-loop demo: scan -> fix -> re-scan -> red turns green.
Run from backend/:  ./.venv/bin/python scripts/smoke_reverify.py
"""
import os
import time

from fastapi.testclient import TestClient

from app.main import app

REPO = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                    "examples", "vulnerable-app")


def wait(c, scan):
    for _ in range(60):
        s = c.get(f"/api/scans/{scan}").json()
        if s["status"] != "running":
            return s
        time.sleep(1)


with TestClient(app) as c:
    r = c.post("/api/scans", json={"mode": "white_box", "target": REPO}).json()
    org, scan = r["org_id"], r["scan_id"]
    wait(c, scan)

    d = c.get(f"/api/orgs/{org}/dashboard").json()
    print("BEFORE fix:", d["migration_progress"],
          "| open bugs:", sum(1 for f in c.get(f'/api/orgs/{org}/findings').json() if not f["resolved"]))

    print("\nre-verify (apply fixes -> re-scan -> flip green)...")
    rv = c.post(f"/api/scans/{scan}/reverify").json()
    print("  ", rv)

    d = c.get(f"/api/orgs/{org}/dashboard").json()
    print("\nAFTER fix:", d["migration_progress"],
          "| open bugs:", sum(1 for f in c.get(f'/api/orgs/{org}/findings').json() if not f["resolved"]))
    print("\nstill red (needs human review):")
    for f in c.get(f"/api/orgs/{org}/findings").json():
        if not f["resolved"]:
            print(f"   {f['file_path']}:{f['line']} {f['title'][:60]}")
