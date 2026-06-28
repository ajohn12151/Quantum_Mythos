"""Backend-for-frontend (BFF) mappers: crypto_asset rows -> the exact DTO shapes
Alan's frontend already consumes (see frontend src/lib/mock-data.ts). Keeping the
mapping here (Python) means the frontend swaps a mock import for a fetch and barely
changes. Honest by design: fields the scanner cannot know (owner) are null, not
fabricated — this is a trust product.
"""
from __future__ import annotations

import os
import re

# crypto_asset.category -> frontend Asset.status
_STATUS_BY_CATEGORY = {
    "shor_broken": "broken",
    "grover_weakened": "weakened",
    "pqc": "safe",
    "unknown": "unknown",
}

# crypto_asset.source -> frontend Asset.kind
_KIND_BY_SOURCE = {
    "tls": "tls", "ssh": "ssh", "mail": "tls", "ct_log": "certificate",
    "code_dep": "library", "code_misuse": "code", "binary": "library",
}


def _exposure(reachable_from_public) -> str:
    if reachable_from_public is True:
        return "internet"
    if reachable_from_public is False:
        return "internal"
    return "unknown"


def _environment(host: str | None) -> str | None:
    """Light, safe inference from obvious hostname patterns ONLY. Owner is never
    inferred (unknowable without a CMDB/tags integration) -> stays null."""
    h = (host or "").lower()
    if not h:
        return None
    if h.startswith(("staging.", "stg.", "stage.")) or ".staging." in h:
        return "staging"
    if h.startswith(("dev.", "test.")) or ".dev." in h:
        return "dev"
    if h.endswith(".internal") or ".prod." in h or h.startswith("prod."):
        return "prod"
    return None


def _name(row) -> str:
    if row.get("host"):
        return row["host"]
    fp = row.get("file_path") or ""
    return fp or "(unknown asset)"


def asset_to_dto(row: dict) -> dict:
    """One crypto_asset row -> the frontend Asset DTO. `row` is a dict(asyncpg row)."""
    cat = row.get("category") or "unknown"
    score = row.get("priority_score")
    return {
        "id": str(row["id"]),
        "name": _name(row),
        "kind": _KIND_BY_SOURCE.get(row.get("source"), "code"),
        "host": row.get("host"),
        "filePath": row.get("file_path"),
        "line": row.get("line"),
        "algorithm": row.get("pubkey_algo") or "unknown",
        "status": _STATUS_BY_CATEGORY.get(cat, "unknown"),
        "exposure": _exposure(row.get("reachable_from_public")),
        "owner": None,                                   # not knowable from a scan — never fabricated
        "environment": _environment(row.get("host")),    # only when the hostname makes it obvious
        "hndlRisk": int(score) if score is not None else 0,   # priority_score is already 0-100
        "dataSensitivity": row.get("data_sensitivity"),
        "rationale": row.get("priority_rationale"),
        "remediationState": row.get("remediation_state"),
        "discoveredAt": (row["first_seen"].date().isoformat()
                         if row.get("first_seen") else None),
        "recommendedFix": None,                          # filled by the remediate layer later
    }


# finding.severity (semgrep emits ERROR/WARNING/INFO) -> frontend Finding.severity
_SEVERITY_MAP = {
    "ERROR": "high", "WARNING": "medium", "INFO": "low",
    "critical": "critical", "high": "high", "medium": "medium", "low": "low",
}


def _severity(s) -> str:
    if not s:
        return "medium"
    return _SEVERITY_MAP.get(s) or _SEVERITY_MAP.get(str(s).lower(), "medium")


def finding_to_dto(row: dict) -> dict:
    """One finding row -> the frontend Finding DTO (white-box classical misuse).
    All persisted findings are first-party (discover() drops deps/test/vendor)."""
    fp = row.get("file_path") or ""
    line = row.get("line")
    return {
        "id": str(row["id"]),
        "title": row.get("title") or "Crypto misuse",
        "cwe": row.get("cwe") or "",
        "severity": _severity(row.get("severity")),
        "file": f"{fp}:{line}" if fp and line else (fp or "—"),
        "repo": "source",
        "status": "fixed" if row.get("resolved") else "open",
        "firstParty": True,
        "explanation": row.get("explanation") or "",
        "fix": row.get("suggested_fix") or "",
    }


def risk_score(broken: int, weakened: int, total: int) -> int:
    """0-100 posture score. Broken counts full, weakened half. Deterministic and
    explainable (no model): the share of the estate that is quantum-exposed."""
    if total <= 0:
        return 0
    return round(100 * (broken * 1.0 + weakened * 0.5) / total)


_SCAN_KIND = {"black_box": "domain", "white_box": "repo", "binary": "repo"}


def scan_to_dto(row: dict) -> dict:
    """One scan row -> the frontend recentScans DTO."""
    summary = row.get("summary_json") or {}
    if isinstance(summary, str):
        import json
        try:
            summary = json.loads(summary)
        except Exception:
            summary = {}
    findings = (summary.get("total") or summary.get("assets_persisted")
                or summary.get("hosts_scanned") or 0)
    when = row.get("finished_at") or row.get("started_at")
    return {
        "id": str(row["id"])[:8],
        "kind": _SCAN_KIND.get(row.get("mode"), "repo"),
        "target": row.get("target"),
        "status": row.get("status"),
        "ranAt": when.date().isoformat() if when else None,
        "findings": findings,
    }
