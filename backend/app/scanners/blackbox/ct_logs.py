"""Certificate Transparency enumeration — find shadow/forgotten subdomains a
domain exposes, with ZERO connection to the target. This is the discovery wow:
"you think you have 3 services; here are 20, and this forgotten one is exposed."

Primary source: crt.sh (public CT log mirror). It rate-limits, so callers should
also union in SANs pulled from the certs they actually fetch (see tls.scan_tls).
"""
from __future__ import annotations

import httpx


def _clean(domain: str) -> str:
    return domain.strip().lower().lstrip("*.").rstrip(".")


async def enumerate_hosts(domain: str, timeout: float = 20.0, limit: int = 50) -> list[str]:
    """Return subdomains of `domain` seen in CT logs (best-effort; [] on failure)."""
    domain = _clean(domain)
    url = f"https://crt.sh/?q=%25.{domain}&output=json"
    names: set[str] = set()
    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            for attempt in range(2):  # crt.sh is flaky; one retry
                resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
                if resp.status_code == 200 and resp.text.strip():
                    for entry in resp.json():
                        for field in ("common_name", "name_value"):
                            for n in str(entry.get(field, "")).split("\n"):
                                n = _clean(n)
                                if n.endswith(domain) and "*" not in n:
                                    names.add(n)
                    break
    except Exception:
        return []  # availability problem, not a validity problem — caller falls back to SANs
    names.discard(domain)
    return sorted(names)[:limit]
