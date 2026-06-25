"""Emit a Cryptographic Bill of Materials (CBOM) in CycloneDX 1.6 format.

CBOM is the emerging standard for inventorying cryptography in software supply
chains (CycloneDX 1.6 added `cryptoProperties`). Turning a binary scan into a CBOM
is what makes the binary tier a product artifact rather than a one-off report: it
drops into SBOM tooling, CI gates, and compliance workflows.

Each Shor-broken family we detect becomes one `cryptographic-asset` component with
`nistQuantumSecurityLevel: 0` (broken by a CRQC) and `evidence.occurrences` listing
the binaries it was found in. We deliberately do not over-claim: detection
confidence and method are recorded per occurrence so a consumer can weigh
low-confidence (static-presence) hits differently from high-confidence ones.
"""
from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .artifact import ArtifactScan

# family -> (CycloneDX algorithm primitive, well-known OID if any)
_FAMILY_PRIMITIVE = {
    "RSA":     ("pke", "1.2.840.113549.1.1.1"),
    "ECDSA":   ("signature", "1.2.840.10045.4.3.2"),
    "DSA":     ("signature", "1.2.840.10040.4.1"),
    "Ed25519": ("signature", "1.3.101.112"),
    "ECDH":    ("key-agree", None),
    "DH":      ("key-agree", "1.2.840.113549.1.3.1"),
    "ECC":     ("signature", None),
}


def _component(family: str, occurrences: list[dict], ref: str) -> dict:
    primitive, oid = _FAMILY_PRIMITIVE.get(family, ("unknown", None))
    crypto: dict = {
        "assetType": "algorithm",
        "algorithmProperties": {
            "primitive": primitive,
            # 0 = no security against a cryptographically-relevant quantum computer.
            "nistQuantumSecurityLevel": 0,
        },
    }
    if oid:
        crypto["oid"] = oid
    return {
        "type": "cryptographic-asset",
        "bom-ref": ref,
        "name": family,
        "cryptoProperties": crypto,
        "evidence": {"occurrences": occurrences},
    }


def build_cbom(occurrences_by_family: dict[str, list[dict]], *, target: str,
               scanned: int, vulnerable: int, serial_number: str | None = None,
               timestamp: str | None = None) -> dict:
    """Build a CycloneDX 1.6 CBOM from {family: [{location, additionalContext}]}.

    The shared core used by both the CLI (live scan) and the API (persisted assets),
    so both paths emit identical CBOM. serial_number/timestamp are injectable for
    deterministic output in tests.
    """
    components = [
        _component(fam, occ, ref=f"crypto:{fam.lower()}")
        for fam, occ in sorted(occurrences_by_family.items())
    ]
    bom: dict = {
        "bomFormat": "CycloneDX",
        "specVersion": "1.6",
        "version": 1,
        "metadata": {
            "tools": {"components": [{
                "type": "application", "name": "quantum-mythos-binary-tier",
            }]},
            "component": {"type": "application", "name": target},
            "properties": [
                {"name": "qm:binaries_scanned", "value": str(scanned)},
                {"name": "qm:vulnerable_binaries", "value": str(vulnerable)},
            ],
        },
        "components": components,
    }
    if serial_number:
        bom["serialNumber"] = serial_number
    if timestamp:
        bom["metadata"]["timestamp"] = timestamp
    return bom


def to_cbom(scan: "ArtifactScan", *, serial_number: str | None = None,
            timestamp: str | None = None) -> dict:
    """Build a CBOM from a live ArtifactScan."""
    by_family: dict[str, list[dict]] = {}
    for f in scan.detected:
        for fam in (f.families or ["ECC"]):   # indeterminate -> conservative bucket
            by_family.setdefault(fam, []).append({
                "location": f.path,
                "additionalContext": (f"format={f.fmt}; confidence={f.confidence}; "
                                      f"via={f.detection_via}"),
            })
    s = scan.summary()
    return build_cbom(by_family, target=scan.target, scanned=s["binaries_scanned"],
                      vulnerable=s["vulnerable_binaries"],
                      serial_number=serial_number, timestamp=timestamp)
