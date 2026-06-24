"""White-box DISCOVER layer: run our crypto-focused Semgrep rules over a repo.

Two kinds of finding (from rule metadata `qm_kind`):
  - pqc_vulnerable -> a quantum-vulnerable algorithm used in source (the inventory)
  - misuse         -> a classical crypto bug exploitable today
"""
from __future__ import annotations

import json
import os
import pathlib
import subprocess
import sys
import tempfile
from dataclasses import dataclass

_RULES = pathlib.Path(__file__).resolve().parent / "rules" / "crypto.yaml"
_SEMGREP = os.path.join(os.path.dirname(sys.executable), "semgrep")


@dataclass
class CodeFinding:
    rule_id: str
    file_path: str
    line: int
    message: str
    severity: str          # critical | high | medium | low
    cwe: str | None
    category: str          # shor_broken | grover_weakened | unknown
    kind: str              # pqc_vulnerable | misuse
    algo: str | None
    snippet: str | None


_SEV = {"ERROR": "high", "WARNING": "medium", "INFO": "low"}


def get_repo(target: str) -> tuple[pathlib.Path, bool]:
    """Return (path, is_temp). Accepts a local path or a git URL (shallow clone)."""
    p = pathlib.Path(target).expanduser()
    if p.exists():
        return p, False
    tmp = pathlib.Path(tempfile.mkdtemp(prefix="qm_repo_"))
    subprocess.run(
        ["git", "clone", "--depth", "1", target, str(tmp)],
        check=True, capture_output=True, timeout=120,
    )
    return tmp, True


# Skip non-production code so findings reflect real source, not test/doc noise.
_EXCLUDE = ["tests", "test", "__tests__", "docs", "doc",
            "benchmark", "benchmarks", "vendor", "node_modules", "fixtures",
            "deps", "third_party", "third-party",   # vendored deps aren't the project's code
            "*.min.js", "*_test.py", "test_*.py", "*.test.js"]


def run_semgrep(path: pathlib.Path) -> list[CodeFinding]:
    cmd = [_SEMGREP, "--config", str(_RULES), "--json", "--metrics=off",
           "--quiet", "--disable-version-check"]
    for pat in _EXCLUDE:
        cmd += ["--exclude", pat]
    cmd.append(str(path))
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if not proc.stdout.strip():
        raise RuntimeError(f"semgrep produced no output: {proc.stderr[:500]}")
    data = json.loads(proc.stdout)
    findings: list[CodeFinding] = []
    for r in data.get("results", []):
        extra = r.get("extra", {})
        meta = extra.get("metadata", {})
        sev = _SEV.get(extra.get("severity", "WARNING"), "medium")
        if meta.get("cwe") == "CWE-798":
            sev = "critical"          # hardcoded secrets
        findings.append(CodeFinding(
            rule_id=r.get("check_id", ""),
            file_path=os.path.relpath(r.get("path", ""), path),
            line=r.get("start", {}).get("line", 0),
            message=extra.get("message", "").strip(),
            severity=sev,
            cwe=meta.get("cwe"),
            category=meta.get("qm_category", "unknown"),
            kind=meta.get("qm_kind", "misuse"),
            algo=meta.get("qm_algo"),
            snippet=(extra.get("lines") or "").strip()[:200] or None,
        ))
    return findings


def discover(target: str) -> list[CodeFinding]:
    path, is_temp = get_repo(target)
    try:
        return run_semgrep(path)
    finally:
        if is_temp:
            subprocess.run(["rm", "-rf", str(path)], check=False)


if __name__ == "__main__":
    import sys as _s
    for f in discover(_s.argv[1] if len(_s.argv) > 1 else str(_RULES.parents[3] / "examples" / "vulnerable-app")):
        print(f"  [{f.severity:<8}] {f.kind:<15} {f.category:<14} {f.file_path}:{f.line}  {f.rule_id}")
