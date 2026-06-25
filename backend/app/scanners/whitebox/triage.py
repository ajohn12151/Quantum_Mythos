"""TRIAGE engine (Phase 1 of the moat) — turn a raw inventory into TRUSTWORTHY
findings. Hybrid SAST -> LLM, the architecture the research validates (~91% FP
reduction). Heuristic-first so it works with $0 and no model; the local LLM
(Ollama) is a drop-in upgrade for the hard judgment calls.

For each finding it decides: is_real (kill the FP), reachable, data_sensitivity,
and a rationale you can show.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

from . import llm

# Path segments / filename patterns that mark non-production code (residual after
# the discover-layer dir excludes). Matched on path SEGMENTS, not raw substrings:
# substring matching wrongly suppressed real files like `pkg/attestation/keys.go`
# ("test" ⊂ "attestation") or `internal/latest/` — a missed-vuln, the worst error.
_FP_PATH_SEGMENTS = {"test", "tests", "testing", "testdata", "testcerts", "mock",
                     "mocks", "fixture", "fixtures", "example", "examples", "sample",
                     "samples", "benchmark", "benchmarks", "e2e", "spec", "specs",
                     "__tests__", "__mocks__"}
_FP_FILE_RE = re.compile(r"(^test_|_test\.|\.test\.|\.spec\.|_spec\.|\.fixture\.)")


def _in_test_path(file_path: str) -> bool:
    parts = re.split(r"[\\/]", (file_path or "").lower())
    if any(p in _FP_PATH_SEGMENTS for p in parts):
        return True
    return bool(parts and _FP_FILE_RE.search(parts[-1]))
# Context hints that a hash is NON-security (so md5/sha1 is fine, not a vuln).
_NONSEC_HASH = ("cache", "etag", "checksum", "fingerprint", "unordered",
                "load balancer", "non-security", "not for security", "dedup")


@dataclass
class TriageVerdict:
    is_real: bool
    reachable: str           # external | internal | dead | unknown
    data_sensitivity: str    # pii | secrets | internal | public | none | unknown
    rationale: str
    confidence: float
    method: str              # heuristic | llm


def _heuristic(f) -> TriageVerdict | None:
    if _in_test_path(f.file_path or ""):
        return TriageVerdict(False, "dead", "none",
                             f"In a test/example path ({f.file_path}) — not production crypto.",
                             0.85, "heuristic")
    ctx = (getattr(f, "context", None) or f.snippet or "").lower()
    if f.kind == "misuse" and "hash" in f.rule_id and any(h in ctx for h in _NONSEC_HASH):
        return TriageVerdict(False, "unknown", "none",
                             "Hash used for a non-security purpose (cache/checksum/fingerprint).",
                             0.75, "heuristic")
    return None


_SYS = (
    "You are a security triage engine for quantum-vulnerable cryptography. Given a "
    "static-analysis finding and the surrounding code, decide if it is a REAL, "
    "security-relevant issue (not a test fixture, example, or non-security hash like a "
    "cache key), whether the crypto is reachable from external/public input, and the "
    "sensitivity of the data it protects. Be skeptical; default to is_real=false if it "
    "looks like test/example/non-security code. Reply ONLY with the requested JSON."
)


def _llm(f) -> TriageVerdict | None:
    if not llm.available():
        return None
    user = (
        f"Finding: {f.message}\nRule: {f.rule_id}\nKind: {f.kind}\n"
        f"File: {f.file_path}:{f.line}\nCode:\n{getattr(f, 'context', None) or f.snippet}\n\n"
        'Reply JSON: {"is_real": true/false, "reachable": '
        '"external|internal|dead|unknown", "data_sensitivity": '
        '"pii|secrets|internal|public|none|unknown", "rationale": "<one sentence>"}'
    )
    d = llm.ask_json(_SYS, user)
    if not d:
        return None
    return TriageVerdict(
        is_real=bool(d.get("is_real", True)),
        reachable=str(d.get("reachable", "unknown")),
        data_sensitivity=str(d.get("data_sensitivity", "unknown")),
        rationale=str(d.get("rationale", ""))[:300],
        confidence=0.7,
        method="llm",
    )


def triage(f) -> TriageVerdict:
    """Heuristic first (cheap, certain), then local LLM, then conservative default."""
    return (
        _heuristic(f)
        or _llm(f)
        or TriageVerdict(True, "unknown", "unknown",
                         "No triage model available; kept as real (conservative).",
                         0.5, "heuristic")
    )
