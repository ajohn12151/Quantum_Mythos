"""Tier B — curve-constant scan (the FindCrypt/signsrch idea, narrowed to ECC).

The constant-signature paradigm (FindCrypt, signsrch, findcrypt-yara) is
structurally blind to RSA: an RSA key is runtime material and the algorithm is
just big-integer modexp — there is no magic byte string to match (see the brief
and grap, IACR eprint 2017/1119). It is only WEAKLY useful for ECC: standard NIST
/ Bernstein curves embed fixed field primes and base points, which OpenSSL stores
as big-endian byte arrays in ec_curve.c. If those objects survive into a stripped,
statically-linked binary, we can recover an "ECC present" signal that Tier A
(symbol-blind on static+stripped) cannot.

Caveats this tier is honest about:
  - Curve-specific and incomplete: custom / non-standard curves embed nothing.
  - Recovers ECC ONLY. RSA / DH / DSA remain undetectable by constants.
  - Cannot say ECDSA vs ECDH (same curve params) -> family is just "ECC".
  - Subject to the same static over-linking caveat as Tier A: a constant being
    *present* in a statically linked blob is not proof the program *uses* that curve
    (measured against the benchmark in bench.py).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

# name -> big-endian hex of a distinctive, fixed curve parameter.
# Field primes are the primary signature; a base-point X coordinate is added where
# it is especially distinctive. All of these curves are Shor-broken (ECC family).
_CURVE_CONSTANTS: dict[str, str] = {
    # NIST P-256 (secp256r1 / prime256v1)
    "P-256 prime":  "ffffffff00000001000000000000000000000000ffffffffffffffffffffffff",
    "P-256 Gx":     "6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296",
    # NIST P-384 (secp384r1)
    "P-384 prime":  "fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe"
                    "ffffffff0000000000000000ffffffff",
    # NIST P-521 (secp521r1): p = 2^521 - 1
    "P-521 prime":  "01" + "ff" * 65,
    # secp256k1 (Bitcoin/Ethereum) prime = 2^256 - 2^32 - 977
    "secp256k1 prime": "fffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f",
    # Curve25519 / Ed25519 field prime p = 2^255 - 19 (both byte orders)
    "Curve25519 prime BE": "7f" + "ff" * 30 + "ed",
    "Curve25519 prime LE": "ed" + "ff" * 30 + "7f",
}

_PATTERNS: dict[str, bytes] = {name: bytes.fromhex(hexs) for name, hexs in _CURVE_CONSTANTS.items()}


@dataclass
class TierBResult:
    curve_hits: list[str] = field(default_factory=list)   # which constants matched
    decision: str = "none"                                # ecc_present | none
    confidence: str = "low"                               # constants => presence-only
    evidence: list[str] = field(default_factory=list)
    note: str = ""


def analyze(path: str) -> TierBResult:
    try:
        data = Path(path).read_bytes()
    except OSError:
        return TierBResult(note="unreadable")

    hits = [name for name, pat in _PATTERNS.items() if pat in data]
    res = TierBResult(curve_hits=hits)
    if hits:
        res.decision = "ecc_present"
        res.confidence = "low"
        res.evidence = [f"curve-const:{h}" for h in hits]
        res.note = ("standard-curve parameters found in the binary image (ECC). "
                    "Presence, not proven use; constant-blind to RSA/DH/DSA.")
    return res
