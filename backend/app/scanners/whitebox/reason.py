"""REASON layer (the moat) — rank a finding by BUSINESS risk, not just algorithm.

Pure heuristic, zero API cost. Combines: quantum category, severity, HNDL risk,
forward secrecy, and a data-sensitivity inference from where the crypto lives
(host or file path). This is the data-lifetime x quantum-horizon prioritization
that a generic code agent doesn't do. An LLM (local Ollama / Bedrock) can later
enrich the rationale, but the ranking stands on its own.
"""
from __future__ import annotations

# Tokens in a host/filepath that imply the crypto guards sensitive, long-lived data.
_SENSITIVE = (
    "payment", "pay", "billing", "card", "pan", "checkout", "auth", "login",
    "credential", "secret", "token", "password", "passwd", "patient", "health",
    "medical", "pii", "ssn", "account", "customer", "identity", "bank", "wallet",
)
_INTERNAL = ("api", "admin", "internal", "service", "gateway")
_REACHABLE = ("route", "handler", "controller", "server", "api", "main", "app", "endpoint", "view")

_CAT_W = {"shor_broken": 1.0, "grover_weakened": 0.5, "pqc": 0.0, "unknown": 0.3}
_SEV_W = {"critical": 1.0, "high": 0.8, "medium": 0.5, "low": 0.3}
_HNDL_W = {"high": 1.0, "medium": 0.6, "low": 0.3}
_SENS_W = {"pii": 1.0, "secrets": 1.0, "internal": 0.6, "public": 0.3, "unknown": 0.4}


def infer_data_sensitivity(locus: str | None) -> str:
    l = (locus or "").lower()
    if any(t in l for t in _SENSITIVE):
        return "pii"
    if any(t in l for t in _INTERNAL):
        return "internal"
    return "unknown"


def _rationale(category, data_sensitivity, hndl_risk, forward_secrecy) -> str:
    parts = []
    if category == "shor_broken":
        parts.append("Shor-breakable asymmetric crypto")
    elif category == "grover_weakened":
        parts.append("Grover-weakened crypto")
    if data_sensitivity in ("pii", "secrets"):
        parts.append("guarding likely-sensitive, long-lived data")
    if forward_secrecy is False:
        parts.append("NO forward secrecy (one key-break decrypts all past sessions)")
    if hndl_risk == "high":
        parts.append("high harvest-now-decrypt-later exposure")
    return "; ".join(parts) + "." if parts else "Lower-priority crypto exposure."


def prioritize(*, category: str, severity: str | None = None, hndl_risk: str | None = None,
               forward_secrecy: bool | None = None, source: str | None = None,
               locus: str | None = None) -> dict:
    """Return {priority_score 0-100, data_sensitivity, reachable_from_public, rationale}."""
    data_sensitivity = infer_data_sensitivity(locus)
    cat_w = _CAT_W.get(category, 0.3)
    sev_w = _SEV_W.get(severity or "", 0.5)
    hndl_w = _HNDL_W.get(hndl_risk or "", 0.5)
    sens_w = _SENS_W.get(data_sensitivity, 0.4)
    fs_bump = 0.2 if forward_secrecy is False else 0.0

    score = 100 * (0.35 * cat_w + 0.20 * sev_w + 0.20 * hndl_w + 0.25 * sens_w) + 100 * fs_bump
    score = min(100.0, round(score, 1))
    if category == "pqc":          # already quantum-safe -> ranks lowest
        score = min(score, 5.0)

    reachable = source in ("tls", "ssh", "mail", "ct_log") or bool(
        locus and any(t in locus.lower() for t in _REACHABLE)
    )
    return {
        "priority_score": score,
        "data_sensitivity": data_sensitivity,
        "reachable_from_public": reachable,
        "rationale": _rationale(category, data_sensitivity, hndl_risk, forward_secrecy),
    }


if __name__ == "__main__":
    for case in [
        dict(category="shor_broken", hndl_risk="high", forward_secrecy=False, source="tls",
             locus="legacy-payments.bank.com"),
        dict(category="shor_broken", source="code_dep", locus="payments.py"),
        dict(category="grover_weakened", severity="high", source="code_dep", locus="util/test_helpers.py"),
        dict(category="pqc", source="tls", locus="api.example.com"),
    ]:
        r = prioritize(**case)
        print(f"{r['priority_score']:>5}  {r['data_sensitivity']:<9} {case.get('locus')}\n        {r['rationale']}")
