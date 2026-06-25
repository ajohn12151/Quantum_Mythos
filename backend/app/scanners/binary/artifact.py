"""Scan a filesystem path (a binary, or a directory/tree of them) for quantum-
vulnerable crypto. The product-facing front door to the binary tier: point it at a
release artifact, an unpacked container layer, or a build output directory.

Keeps it dependency-light: a file is treated as a candidate binary if LIEF can
parse it (ELF/PE/Mach-O); everything else is skipped. Designed so a future
container-image walker just feeds the unpacked layer roots in here.
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

import lief

from .scan import BinaryFinding, scan_binary

try:
    lief.logging.disable()
except Exception:
    pass

# Skip obviously-not-a-binary files cheaply before handing them to LIEF.
_SKIP_SUFFIXES = {".txt", ".md", ".json", ".yaml", ".yml", ".toml", ".html", ".css",
                  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".pdf", ".csv", ".log",
                  ".c", ".h", ".py", ".rs", ".go", ".js", ".ts", ".lock"}
_MAX_BYTES = 512 * 1024 * 1024   # don't read absurdly large files


@dataclass
class ArtifactScan:
    target: str
    findings: list[BinaryFinding]          # one per parseable binary (detected or not)

    @property
    def detected(self) -> list[BinaryFinding]:
        return [f for f in self.findings if f.detected]

    def summary(self) -> dict:
        det = self.detected
        fams: dict[str, int] = {}
        for f in det:
            for fam in f.families or ["(indeterminate)"]:
                fams[fam] = fams.get(fam, 0) + 1
        return {
            "binaries_scanned": len(self.findings),
            "vulnerable_binaries": len(det),
            "high_confidence": sum(f.confidence == "high" for f in det),
            "low_confidence": sum(f.confidence == "low" for f in det),
            "families": dict(sorted(fams.items())),
        }


def _looks_like_binary(path: Path) -> bool:
    if path.suffix.lower() in _SKIP_SUFFIXES:
        return False
    try:
        if path.stat().st_size == 0 or path.stat().st_size > _MAX_BYTES:
            return False
        with path.open("rb") as fh:
            magic = fh.read(4)
    except OSError:
        return False
    # ELF \x7fELF | PE 'MZ' | Mach-O (32/64, both endians) | fat Mach-O
    return (magic[:4] == b"\x7fELF"
            or magic[:2] == b"MZ"
            or magic[:4] in (b"\xfe\xed\xfa\xce", b"\xfe\xed\xfa\xcf",
                             b"\xce\xfa\xed\xfe", b"\xcf\xfa\xed\xfe",
                             b"\xca\xfe\xba\xbe", b"\xbe\xba\xfe\xca"))


def iter_binaries(root: str):
    """Yield candidate binary paths under a file or directory root."""
    p = Path(root)
    if p.is_file():
        if _looks_like_binary(p):
            yield str(p)
        return
    for dirpath, _dirs, files in os.walk(root):
        for name in files:
            fp = Path(dirpath) / name
            if fp.is_file() and not fp.is_symlink() and _looks_like_binary(fp):
                yield str(fp)


def scan_path(root: str) -> ArtifactScan:
    """Scan a file or directory tree; return a finding per parseable binary."""
    findings = [scan_binary(b) for b in iter_binaries(root)]
    return ArtifactScan(target=root, findings=findings)
