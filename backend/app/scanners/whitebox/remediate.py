"""REMEDIATE layer — generate safe, deterministic crypto-agility fixes as unified
diffs. NO LLM, no API cost. Safety rule (from the research): never let automation
*author* a cryptographic primitive. We only do mechanical, correct transforms and
delegate the actual primitive to a verified provider. Diffs are generated locally;
opening the PR (via GitHub token) is a separate, later step.
"""
from __future__ import annotations

import difflib
import pathlib
import re
import subprocess
from dataclasses import dataclass

from .discover import get_repo, run_semgrep


@dataclass
class FileFix:
    file_path: str
    diff: str
    fixes: list[str]
    note: str


def _fix_line(line: str, rule_id: str, rel: str) -> tuple[str | None, str, str | None]:
    """Return (new_line | None, description, import_needed | None)."""
    is_py = rel.endswith(".py")
    is_js = rel.endswith((".js", ".ts", ".jsx", ".tsx"))

    if "weak-hash" in rule_id:
        new = re.sub(r"\bmd5\b", "sha256", line)
        new = re.sub(r"\bsha1\b", "sha256", new)
        return new, "MD5/SHA-1 -> SHA-256 (use a KDF e.g. argon2 for passwords)", None

    if "hardcoded-secret" in rule_id:
        m = re.search(r"([A-Za-z_][A-Za-z0-9_]*)\s*[=:]\s*[\"'][^\"']+[\"']", line)
        if m:
            var = m.group(1)
            if is_py:
                return (re.sub(r"[\"'][^\"']+[\"']", f'os.environ["{var}"]', line, count=1),
                        "Hardcoded secret -> os.environ (remove from source)", "import os")
            if is_js:
                return (re.sub(r"[\"'][^\"']+[\"']", f"process.env.{var}", line, count=1),
                        "Hardcoded secret -> process.env (remove from source)", None)

    if "weak-random" in rule_id and is_py:
        new = line.replace("random.random(", "secrets.SystemRandom().random(")
        new = new.replace("random.randint(", "secrets.SystemRandom().randint(")
        if new != line:
            return new, "Weak RNG -> secrets.SystemRandom", "import secrets"

    if any(k in rule_id for k in ("rsa-keygen", "ec-keygen", "asymmetric-keygen")):
        if is_py:
            new = re.sub(r"(rsa|ec)\.generate_private_key\(.*\)",
                         "crypto_provider.generate_pqc_keypair()", line)
            new = re.sub(r"(RSA|ECC)\.generate\(.*\)",
                         "crypto_provider.generate_pqc_keypair()", new)
            if new != line:
                return new, "RSA/EC -> crypto_provider (PQC ML-KEM via liboqs)", "from . import crypto_provider"
        if is_js:
            new = re.sub(r"crypto\.generateKeyPair(Sync)?\(['\"](rsa|ec)['\"].*\)",
                         "cryptoProvider.generatePqcKeyPair()", line)
            if new != line:
                return new, "RSA/EC -> cryptoProvider (PQC ML-KEM)", "const cryptoProvider = require('./crypto_provider')"

    return None, "", None   # ECB/mode changes etc. are NOT auto-rewritten (unsafe)


def _ensure_imports(lines: list[str], imports: set[str]) -> list[str]:
    existing = "".join(lines)
    add = [imp + "\n" for imp in sorted(imports) if imp not in existing]
    return add + lines if add else lines


_NOTE = ("Deterministic, review-gated. Crypto primitives delegated to a verified "
         "provider, never authored here. Pair with a differential test before merge.")


def _group_by_file(findings) -> dict[str, list]:
    by_file: dict[str, list] = {}
    for f in findings:
        by_file.setdefault(f.file_path, []).append(f)
    return by_file


def _patch_file(path: pathlib.Path, rel: str, fs) -> tuple[list[str], list[str], list[str]]:
    """Return (original_lines, patched_lines, applied_descriptions)."""
    original = path.read_text().splitlines(keepends=True)
    patched = list(original)
    applied: list[str] = []
    imports: set[str] = set()
    for f in fs:
        i = f.line - 1
        if not (0 <= i < len(patched)):
            continue
        new, desc, imp = _fix_line(patched[i], f.rule_id, rel)
        if new and new != patched[i]:
            patched[i] = new
            applied.append(f"{rel}:{f.line}  {desc}")
            if imp:
                imports.add(imp)
    return original, _ensure_imports(patched, imports), applied


def propose_fixes(repo_path: pathlib.Path, findings) -> list[FileFix]:
    out: list[FileFix] = []
    for rel, fs in _group_by_file(findings).items():
        path = repo_path / rel
        if not path.exists():
            continue
        original, patched, applied = _patch_file(path, rel, fs)
        if patched != original:
            diff = "".join(difflib.unified_diff(original, patched,
                                                fromfile=f"a/{rel}", tofile=f"b/{rel}"))
            out.append(FileFix(file_path=rel, diff=diff, fixes=applied, note=_NOTE))
    return out


def apply_fixes(repo_path: pathlib.Path, findings) -> int:
    """Write the fixes to disk (used by the re-verify loop). Returns files changed."""
    changed = 0
    for rel, fs in _group_by_file(findings).items():
        path = repo_path / rel
        if not path.exists():
            continue
        original, patched, _ = _patch_file(path, rel, fs)
        if patched != original:
            path.write_text("".join(patched))
            changed += 1
    return changed


def remediate(target: str) -> list[FileFix]:
    path, is_temp = get_repo(target)
    try:
        findings = run_semgrep(path)
        return propose_fixes(path, findings)
    finally:
        if is_temp:
            subprocess.run(["rm", "-rf", str(path)], check=False)


if __name__ == "__main__":
    import sys
    default = str(pathlib.Path(__file__).resolve().parents[3] / "examples" / "vulnerable-app")
    for fix in remediate(sys.argv[1] if len(sys.argv) > 1 else default):
        print(f"\n### {fix.file_path}")
        for a in fix.fixes:
            print(f"  - {a}")
        print(fix.diff)
