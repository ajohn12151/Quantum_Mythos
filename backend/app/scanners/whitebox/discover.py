"""White-box DISCOVER layer: run our crypto-focused Semgrep rules over a repo.

Two kinds of finding (from rule metadata `qm_kind`):
  - pqc_vulnerable -> a quantum-vulnerable algorithm used in source (the inventory)
  - misuse         -> a classical crypto bug exploitable today

We drive the bundled `semgrep-core` binary DIRECTLY rather than the `semgrep`
(pysemgrep/osemgrep) CLI wrapper. The wrapper imports thousands of Python
modules at startup and on hosts with a slow filesystem (EDR/AV intercepting
every `stat`) that startup can take minutes or never complete -- it produced no
output, which surfaced downstream as a confusing failure. `semgrep-core` is a
single compiled binary: it starts instantly and scans offline. We hand it a
targets file (the same JSON the CLI generates internally) and parse its JSON.
"""
from __future__ import annotations

import fnmatch
import functools
import importlib.util
import json
import os
import pathlib
import re
import subprocess
import time
from dataclasses import dataclass

_RULES = pathlib.Path(__file__).resolve().parent / "rules" / "crypto.yaml"


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
    context: str | None = None     # surrounding code, so the triage LLM can judge reachability


_SEV = {"ERROR": "high", "WARNING": "medium", "INFO": "low"}

# File extension -> the semgrep analyzer that parses it. Must cover every
# language our rules target (crypto.yaml). Every file is ALSO scanned with the
# `generic` analyzer so the regex/secret rules (languages: [generic]) run on it.
_LANG_BY_EXT = {
    ".py": "python",
    ".js": "javascript", ".jsx": "javascript", ".mjs": "javascript", ".cjs": "javascript",
    ".ts": "typescript", ".tsx": "typescript",
    ".go": "go",
}

# Skip non-production code so findings reflect real source, not test/doc noise.
_EXCLUDE_DIRS = {"tests", "test", "testing", "testdata", "__tests__", "docs", "doc",
                 "benchmark", "benchmarks", "vendor", "node_modules", "fixtures",
                 "deps", "third_party", "third-party",   # vendored deps aren't the project's code
                 ".git", ".hg", ".svn"}
_EXCLUDE_GLOBS = ["*.min.js", "*_test.py", "test_*.py", "*.test.js", "*.rsa.key", "*.pem"]

_MAX_FILE_BYTES = 2_000_000     # skip generated/data blobs; real source is far smaller


@functools.lru_cache(maxsize=1)
def _semgrep_core() -> str:
    """Locate the bundled semgrep-core binary without importing the (slow,
    sometimes-hanging) semgrep package -- find_spec only reads metadata."""
    spec = importlib.util.find_spec("semgrep")
    if spec and spec.origin:
        core = pathlib.Path(spec.origin).parent / "bin" / "semgrep-core"
        if core.exists():
            return str(core)
    raise RuntimeError("semgrep-core binary not found; is `semgrep` installed in this venv?")


@functools.lru_cache(maxsize=4)
def _rule_severity(rules_path: str) -> dict[str, str]:
    """Map rule id -> declared severity (ERROR/WARNING/INFO). semgrep-core's
    match output omits severity (it lives in the rule), so we read it here.
    Tiny line scanner -- avoids importing PyYAML, which is also slow on this host."""
    sev: dict[str, str] = {}
    rid = None
    for line in pathlib.Path(rules_path).read_text().splitlines():
        m = re.match(r"\s*-?\s*id:\s*(\S+)", line)
        if m:
            rid = m.group(1).strip().strip("'\"")
            continue
        m = re.match(r"\s*severity:\s*(\S+)", line)
        if m and rid:
            sev[rid] = m.group(1).strip().strip("'\"")
    return sev


def _read_context(abs_path: str, line: int, radius: int = 14) -> str | None:
    """Return the lines around `line` (the enclosing region), the matched line marked."""
    try:
        lines = pathlib.Path(abs_path).read_text(errors="replace").splitlines()
    except Exception:
        return None
    lo, hi = max(0, line - radius), min(len(lines), line + radius)
    out = []
    for i in range(lo, hi):
        out.append(f"{'>>' if i + 1 == line else '  '} {lines[i]}")
    return "\n".join(out)[:1800] or None


def _matched_line(context: str | None) -> str | None:
    """Pull the matched line (marked `>>`) out of a context block as the snippet."""
    if not context:
        return None
    for ln in context.splitlines():
        if ln.startswith(">>"):
            return ln[2:].strip()[:200] or None
    return None


def get_repo(target: str) -> tuple[pathlib.Path, bool]:
    """Return (path, is_temp). Accepts a local path or a git URL (shallow clone)."""
    import tempfile
    p = pathlib.Path(target).expanduser()
    if p.exists():
        return p, False
    tmp = pathlib.Path(tempfile.mkdtemp(prefix="qm_repo_"))
    try:
        subprocess.run(
            ["git", "clone", "--depth", "1", target, str(tmp)],
            check=True, capture_output=True, timeout=120,
        )
    except Exception:
        subprocess.run(["rm", "-rf", str(tmp)], check=False)   # don't leak the temp dir
        raise
    return tmp, True


def _is_binary(fp: pathlib.Path) -> bool:
    try:
        with fp.open("rb") as fh:
            return b"\x00" in fh.read(2048)
    except Exception:
        return True


def _iter_targets(repo: pathlib.Path):
    """Yield (abs_path, analyzer) pairs for semgrep-core. Each eligible file is
    scanned under `generic` (for the secret/regex rules) plus its language."""
    for root, dirs, files in os.walk(repo):
        dirs[:] = [d for d in dirs if d.lower() not in _EXCLUDE_DIRS]
        for name in files:
            if any(fnmatch.fnmatch(name, g) for g in _EXCLUDE_GLOBS):
                continue
            fp = pathlib.Path(root) / name
            try:
                if fp.is_symlink() or fp.stat().st_size > _MAX_FILE_BYTES:
                    continue
            except OSError:
                continue
            if _is_binary(fp):
                continue
            abspath = str(fp.resolve())
            lang = _LANG_BY_EXT.get(fp.suffix.lower())
            if lang:
                yield abspath, lang
            yield abspath, "generic"


def _targets_file_json(targets: list[tuple[str, str]], repo: pathlib.Path) -> str:
    """semgrep-core `-targets` schema (matches what the CLI emits internally):
    ["Targets", [["CodeTarget", {"path": {"fpath", "ppath"}, "analyzer", "products"}], ...]]"""
    arr = []
    for abspath, analyzer in targets:
        try:
            rel = os.path.relpath(abspath, repo)
        except ValueError:
            rel = os.path.basename(abspath)
        arr.append(["CodeTarget", {
            "path": {"fpath": abspath, "ppath": "/" + rel},
            "analyzer": analyzer,
            "products": ["sast"],
        }])
    return json.dumps(["Targets", arr])


def run_semgrep(path: pathlib.Path) -> list[CodeFinding]:
    import tempfile
    targets = list(_iter_targets(path))
    if not targets:
        return []
    sev_by_rule = _rule_severity(str(_RULES))

    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as tf:
        tf.write(_targets_file_json(targets, path))
        targets_path = tf.name
    cmd = [
        _semgrep_core(), "-rules", str(_RULES), "-targets", targets_path, "-json",
        "-j", str(min(4, os.cpu_count() or 2)),       # modest parallelism: bounded memory
        "-max_memory", "4000",                        # MB/file cap; skip a blob, don't die
        "-timeout", "5", "-timeout_threshold", "3",   # one slow file can't hang the scan
    ]
    # semgrep-core is occasionally SIGKILLed mid-run under transient memory
    # pressure (e.g. a resident local LLM); it succeeds once pressure eases.
    # Retry with backoff before giving up.
    try:
        proc = None
        for attempt in range(4):
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=600,
                                  stdin=subprocess.DEVNULL)
            if proc.stdout.find("{") >= 0:
                break
            time.sleep(1.5 * (attempt + 1))
    finally:
        os.unlink(targets_path)

    brace = proc.stdout.find("{")          # semgrep-core prints a progress dot before the JSON
    if brace < 0:
        raise RuntimeError(f"semgrep-core produced no JSON (exit {proc.returncode}): "
                           f"{proc.stderr[:500]}")
    data = json.loads(proc.stdout[brace:])

    findings: list[CodeFinding] = []
    for r in data.get("results", []):
        extra = r.get("extra", {})
        meta = extra.get("metadata", {})
        rule_id = r.get("check_id", "")
        sev = _SEV.get(sev_by_rule.get(rule_id, "WARNING"), "medium")
        if meta.get("cwe") == "CWE-798":
            sev = "critical"          # hardcoded secrets
        abspath = r.get("path", "")
        line = r.get("start", {}).get("line", 0)
        context = _read_context(abspath, line)
        findings.append(CodeFinding(
            rule_id=rule_id,
            file_path=os.path.relpath(abspath, path),
            line=line,
            message=extra.get("message", "").strip(),
            severity=sev,
            cwe=meta.get("cwe"),
            category=meta.get("qm_category", "unknown"),
            kind=meta.get("qm_kind", "misuse"),
            algo=meta.get("qm_algo"),
            snippet=_matched_line(context),
            context=context,
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
    for f in discover(_s.argv[1] if len(_s.argv) > 1 else str(_RULES.parents[4] / "examples" / "vulnerable-app")):
        print(f"  [{f.severity:<8}] {f.kind:<15} {f.category:<14} {f.file_path}:{f.line}  {f.rule_id}")
