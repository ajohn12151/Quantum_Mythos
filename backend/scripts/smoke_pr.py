"""Open a real crypto-agility PR. Needs GITHUB_TOKEN in backend/.env.
Run from backend/:  ./.venv/bin/python scripts/smoke_pr.py [github_repo_url]
"""
import sys

from fastapi.testclient import TestClient

from app.main import app

target = sys.argv[1] if len(sys.argv) > 1 else "https://github.com/ajohn12151/Quantum_Mythos"

with TestClient(app) as c:
    r = c.post("/api/remediate/pr", json={"target": target})
    print(r.status_code, r.json())
