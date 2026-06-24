"""Open a real PR with the crypto-agility fixes via the GitHub REST API.

Uses the Contents API (no local git push): create a branch, commit each patched
file onto it, then open the PR. Needs a token with `repo` scope and write access
to the target repo.
"""
from __future__ import annotations

import asyncio
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


async def _ensure_fork(c: httpx.AsyncClient, owner: str, repo: str) -> str:
    """Return the owner to operate on. If we don't own `owner/repo`, fork it under
    the authenticated user (never touches upstream) and wait until it's ready."""
    me = (await c.get("/user")).raise_for_status().json()["login"]
    if me == owner:
        return owner
    if (await c.get(f"/repos/{me}/{repo}")).status_code == 200:
        return me                                   # fork already exists
    (await c.post(f"/repos/{owner}/{repo}/forks")).raise_for_status()
    for _ in range(30):                             # forking is async on GitHub's side
        if (await c.get(f"/repos/{me}/{repo}")).status_code == 200:
            return me
        await asyncio.sleep(2)
    raise RuntimeError("fork did not become ready in time")


async def open_pr(repo_url: str, token: str, files: dict[str, str], *,
                  title: str, body: str) -> dict:
    """Fork the target if needed, commit `files` to a fresh branch on the fork, and
    open a PR there (fork -> fork). Returns {pr_url, fork}."""
    owner, repo = parse_repo(repo_url)
    headers = {"Authorization": f"Bearer {token}",
               "Accept": "application/vnd.github+json",
               "X-GitHub-Api-Version": "2022-11-28"}
    branch = f"quantum-mythos/crypto-agility-{uuid.uuid4().hex[:8]}"

    async with httpx.AsyncClient(base_url=_GH, headers=headers, timeout=60) as c:
        fork = await _ensure_fork(c, owner, repo)   # the repo we actually write to

        meta = (await c.get(f"/repos/{fork}/{repo}")).raise_for_status().json()
        base = meta["default_branch"]
        ref = (await c.get(f"/repos/{fork}/{repo}/git/ref/heads/{base}")).raise_for_status().json()
        base_sha = ref["object"]["sha"]

        (await c.post(f"/repos/{fork}/{repo}/git/refs",
                      json={"ref": f"refs/heads/{branch}", "sha": base_sha})).raise_for_status()

        for path, content in files.items():
            existing = await c.get(f"/repos/{fork}/{repo}/contents/{path}", params={"ref": branch})
            payload = {
                "message": f"Quantum Mythos: crypto-agility fix for {path}",
                "content": base64.b64encode(content.encode()).decode(),
                "branch": branch,
            }
            if existing.status_code == 200:
                payload["sha"] = existing.json()["sha"]
            (await c.put(f"/repos/{fork}/{repo}/contents/{path}", json=payload)).raise_for_status()

        pr = (await c.post(f"/repos/{fork}/{repo}/pulls",
                           json={"title": title, "head": branch, "base": base, "body": body})
              ).raise_for_status().json()
        return {"pr_url": pr["html_url"], "fork": f"{fork}/{repo}"}
