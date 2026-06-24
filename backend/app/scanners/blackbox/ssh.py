"""Black-box SSH host-key inspection via ssh-keyscan. No auth, no exploit — the
server advertises its host-key algorithms on connect. All of ssh-rsa / ecdsa /
ed25519 are Shor-breakable.
"""
from __future__ import annotations

import subprocess
from dataclasses import asdict, dataclass

from .classify import classify_pubkey, est_time_to_break, hndl_risk

_ALGO = {
    "ssh-rsa": "RSA",
    "rsa-sha2-256": "RSA",
    "rsa-sha2-512": "RSA",
    "ssh-ed25519": "Ed25519",
    "ecdsa-sha2-nistp256": "ECDSA/EC",
    "ecdsa-sha2-nistp384": "ECDSA/EC",
    "ecdsa-sha2-nistp521": "ECDSA/EC",
    "ssh-dss": "DSA",
}


@dataclass
class SshKeyFacts:
    host: str
    port: int
    key_type: str
    pubkey_algo: str
    category: str
    est_time_to_break: str
    hndl_risk: str
    # null fields so this reuses the same DB-persist path as TLS facts
    key_bits: int | None = None
    curve: str | None = None
    sig_algo: str | None = None
    tls_version: str | None = None
    forward_secrecy: bool | None = None
    san: list[str] | None = None

    def to_dict(self) -> dict:
        return asdict(self)


def scan_ssh(host: str, port: int = 22, timeout: int = 8) -> list[SshKeyFacts]:
    try:
        proc = subprocess.run(
            ["ssh-keyscan", "-T", str(timeout), "-p", str(port), host],
            capture_output=True, text=True, timeout=timeout + 5,
        )
    except Exception:
        return []
    out, seen = [], set()
    for line in proc.stdout.splitlines():
        parts = line.split()
        if len(parts) < 2 or parts[1] not in _ALGO or parts[1] in seen:
            continue
        seen.add(parts[1])
        algo = _ALGO[parts[1]]
        cat = classify_pubkey(algo)
        out.append(SshKeyFacts(
            host=host, port=port, key_type=parts[1], pubkey_algo=algo, category=cat,
            est_time_to_break=est_time_to_break(algo, None), hndl_risk=hndl_risk(cat, None),
        ))
    return out


if __name__ == "__main__":
    import json
    import sys

    for f in scan_ssh(sys.argv[1] if len(sys.argv) > 1 else "github.com"):
        print(json.dumps(f.to_dict()))
