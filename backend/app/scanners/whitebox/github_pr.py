"""Open a real PR with the crypto-agility fixes via the GitHub REST API.

Uses the Contents API (no local git push): create a branch, commit each patched
file onto it, then open the PR. Needs a token with `repo` scope and write access
to the target repo.
"""
from __future__ import annotations

import base64
import re
import uuid

import httpx

_GH = "https://api.github.com"


def parse_repo(url: str) -> tuple[str, str]:
    m = re.search(r"github\.com[:/]([^/]+)/([^/.\s]+)", url)
    if not m:
        raise ValueError(f"not a GitHub repo URL: {url}")
    return m.group(1), m.group(2)


async def open_pr(repo_url: str, token: str, files: dict[str, str], *,
                  title: str, body: str) -> str:
    """Commit `files` (path -> new content) to a fresh branch and open a PR.
    Returns the PR's html_url."""
    owner, repo = parse_repo(repo_url)
    headers = {"Authorization": f"Bearer {token}",
               "Accept": "application/vnd.github+json",
               "X-GitHub-Api-Version": "2022-11-28"}
    branch = f"quantum-mythos/crypto-agility-{uuid.uuid4().hex[:8]}"

    async with httpx.AsyncClient(base_url=_GH, headers=headers, timeout=30) as c:
        meta = (await c.get(f"/repos/{owner}/{repo}")).raise_for_status().json()
        base = meta["default_branch"]

        ref = (await c.get(f"/repos/{owner}/{repo}/git/ref/heads/{base}")).raise_for_status().json()
        base_sha = ref["object"]["sha"]

        (await c.post(f"/repos/{owner}/{repo}/git/refs",
                      json={"ref": f"refs/heads/{branch}", "sha": base_sha})).raise_for_status()

        for path, content in files.items():
            existing = await c.get(f"/repos/{owner}/{repo}/contents/{path}", params={"ref": branch})
            payload = {
                "message": f"Quantum Mythos: crypto-agility fix for {path}",
                "content": base64.b64encode(content.encode()).decode(),
                "branch": branch,
            }
            if existing.status_code == 200:
                payload["sha"] = existing.json()["sha"]
            (await c.put(f"/repos/{owner}/{repo}/contents/{path}", json=payload)).raise_for_status()

        pr = (await c.post(f"/repos/{owner}/{repo}/pulls",
                           json={"title": title, "head": branch, "base": base, "body": body})
              ).raise_for_status().json()
        return pr["html_url"]
