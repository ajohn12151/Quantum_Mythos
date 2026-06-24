"""Tier A — symbol / import-table analysis (LIEF).

Reuses QED's core idea (arXiv:2409.07852): read a binary's import + symbol tables
and match quantum-vulnerable asymmetric-crypto API names. Works uniformly across
ELF / PE / Mach-O via LIEF's abstract layer.

What the benchmark measured (see binary_bench), and why the confidence policy below:

  - DYNAMIC linkage (stripped OR not): the program's *own* references to libcrypto
    live in the dynamic import table (.dynsym undefined / Mach-O bind opcodes) and
    SURVIVE `strip`. Matching imports gives the exact family with high precision and
    recall. This is the sweet spot.

  - STATIC linkage, UNSTRIPPED: there are no imports; the whole of libcrypto is
    linked in, so the symbol table contains EVERY family's functions regardless of
    what the program calls (measured: a symmetric-only AES/SHA program and an
    RSA-only program both surface RSA+ECC+ECDH+ECDSA+DH+DSA). Symbol *presence* is
    therefore NOT usage and cannot attribute a family. We report this as
    low-confidence "inconclusive (static over-linking)" — distinguishing crypto from
    non-crypto is reliable; the specific primitive is not without reachability
    (Tier C, intentionally out of scope).

  - STATIC linkage, STRIPPED: no imports, no symbol table. Tier A is blind here and
    says so; this is the recall hole Tier B (constants) tries to dent.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

import lief

from .qv_apis import CRYPTO_LIBRARY_HINTS, match_families

# LIEF 0.12 prints "Command 'DYLD_CHAINED_FIXUPS' not parsed!" to stderr for modern
# Mach-O load commands it doesn't model. Those commands are irrelevant to symbol
# extraction, so silence the logger to keep scanner output clean.
try:
    lief.logging.disable()
except Exception:
    pass

_VER_SUFFIX = re.compile(r"@.*$")


def normalize(name: str) -> str:
    """Strip Mach-O's single leading underscore and ELF's @VERSION suffix."""
    if name.startswith("_"):
        name = name[1:]
    return _VER_SUFFIX.sub("", name)


@dataclass
class TierAResult:
    parsed: bool
    fmt: str                                  # elf | pe | macho | unknown
    crypto_libs: list[str] = field(default_factory=list)
    import_families: dict[str, list[str]] = field(default_factory=dict)
    defined_families: dict[str, list[str]] = field(default_factory=dict)
    decision: str = "none"                    # asymmetric | symmetric_or_none | inconclusive_static | none
    confidence: str = "high"                  # high | low
    families: list[str] = field(default_factory=list)
    evidence: list[str] = field(default_factory=list)
    note: str = ""


def _fmt(b) -> str:
    fmt = getattr(b, "format", None)
    name = getattr(fmt, "name", str(fmt)).upper()
    if "ELF" in name:
        return "elf"
    if "PE" in name:
        return "pe"
    if "MACHO" in name or "MACH_O" in name:
        return "macho"
    return "unknown"


def _lib_names(b) -> list[str]:
    out = []
    for lib in (b.libraries or []):
        out.append(lib if isinstance(lib, str) else getattr(lib, "name", str(lib)))
    return out


def _imported_names(b) -> set[str]:
    out: set[str] = set()
    for f in (b.imported_functions or []):
        out.add(normalize(f if isinstance(f, str) else getattr(f, "name", "")))
    out.discard("")
    return out


def _defined_names(b) -> set[str]:
    """All symbol names (imports + defined). Used only for the static presence path."""
    out = {normalize(s.name) for s in b.symbols if getattr(s, "name", "")}
    out.discard("")
    return out


def analyze(path: str) -> TierAResult:
    try:
        b = lief.parse(path)
    except Exception:
        b = None
    if b is None:
        return TierAResult(parsed=False, fmt="unknown",
                           decision="none", confidence="low",
                           note="LIEF failed to parse")

    fmt = _fmt(b)
    libs = _lib_names(b)
    crypto_libs = sorted({l for l in libs
                          if any(h in l.lower() for h in CRYPTO_LIBRARY_HINTS)})

    imported = _imported_names(b)
    import_families = match_families(imported)

    res = TierAResult(parsed=True, fmt=fmt, crypto_libs=crypto_libs,
                      import_families=import_families)

    # --- high-confidence path: the program imports a QV API ------------------
    if import_families:
        res.decision = "asymmetric"
        res.confidence = "high"
        res.families = sorted(import_families)
        ev = [f"import:{n}" for fam in res.families for n in import_families[fam][:2]]
        res.evidence = ev[:6] + [f"lib:{l}" for l in crypto_libs]
        return res

    # No QV imports. Inspect defined symbols for the static-linkage cases.
    defined = _defined_names(b)
    defined_families = match_families(defined)
    res.defined_families = defined_families

    # --- dynamic crypto consumer, but NO asymmetric import -------------------
    # e.g. a program that links libcrypto only for AES/SHA. We can see all of its
    # dynamic imports, and none are asymmetric -> confidently not-asymmetric.
    if crypto_libs and not defined_families:
        res.decision = "symmetric_or_none"
        res.confidence = "high"
        res.note = ("links a crypto library but imports no asymmetric API "
                    "(symmetric/hash use, or not asymmetric)")
        res.evidence = [f"lib:{l}" for l in crypto_libs]
        return res

    # --- static over-linking: asym machinery present, usage unverifiable -----
    if defined_families:
        res.decision = "inconclusive_static"
        res.confidence = "low"
        res.families = sorted(defined_families)  # indeterminate set, reported as-is
        res.note = ("asymmetric crypto machinery is statically linked in but the "
                    "binary has no imports to confirm the program calls it; static "
                    "over-linking surfaces all families. Needs reachability (Tier C).")
        res.evidence = [f"defined:{n}" for fam in res.families
                        for n in defined_families[fam][:1]][:6]
        return res

    # --- nothing crypto-ish visible -----------------------------------------
    # Either genuinely no crypto, or a stripped static binary hiding it (Tier A's
    # blind spot — indistinguishable from a clean control at the symbol level).
    res.decision = "none"
    res.confidence = "high"
    res.note = "no crypto symbols or libraries visible to symbol analysis"
    return res
