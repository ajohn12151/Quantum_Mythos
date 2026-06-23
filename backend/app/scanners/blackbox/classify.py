"""Map an observed public-key algorithm to its quantum-risk category.

Three buckets (NOT binary):
  - shor_broken    : all asymmetric (RSA/ECDSA/ECDH/EdDSA/DSA/DH) -> must REPLACE
  - grover_weakened: symmetric/hash (AES, SHA-2) -> just larger key, not broken
  - pqc            : already post-quantum (ML-KEM/ML-DSA/SLH-DSA)
"""

_SHOR_TOKENS = ("rsa", "ec", "ecdsa", "ecdh", "dsa", "ed25519", "ed448", "dh", "id-ecpublickey")
_PQC_TOKENS = ("ml-kem", "ml-dsa", "kyber", "dilithium", "sphincs", "slh-dsa", "falcon")
_GROVER_TOKENS = ("aes", "sha", "chacha")


def classify_pubkey(pubkey_algo: str | None) -> str:
    if not pubkey_algo:
        return "unknown"
    a = pubkey_algo.lower()
    if any(t in a for t in _PQC_TOKENS):
        return "pqc"
    if any(t in a for t in _SHOR_TOKENS):
        return "shor_broken"
    if any(t in a for t in _GROVER_TOKENS):
        return "grover_weakened"
    return "unknown"


def est_time_to_break(pubkey_algo: str | None, key_bits: int | None) -> str:
    """Honest, resource-estimation-grounded ranges. PLACEHOLDER for the real
    fault-tolerance model (Sagar's QEC edge) — keep the framing, refine the numbers.

    Grounding: Gidney & Ekeraa 2019 (~20M noisy qubits / 8h for RSA-2048);
    Gidney 2025 (<1M physical qubits). No CRQC exists today; horizon ~2030s+.
    """
    cat = classify_pubkey(pubkey_algo)
    if cat == "pqc":
        return "Not breakable by Shor (post-quantum). Quantum-safe."
    if cat == "grover_weakened":
        return "Grover only halves effective strength; not broken. Increase key size."
    if cat == "shor_broken":
        return (
            "Shor-breakable. No machine can do this today; credible estimates need "
            "~1M+ fault-tolerant physical qubits (plausibly 2030s). Anything recorded "
            "now is decryptable then (harvest-now-decrypt-later)."
        )
    return "Unknown algorithm — manual review required."


def hndl_risk(category: str, forward_secrecy: bool | None) -> str:
    """Harvest-now-decrypt-later risk. Absence of forward secrecy is catastrophic:
    one future key-break decrypts every session ever recorded under that key."""
    if category != "shor_broken":
        return "low"
    if forward_secrecy is False:
        return "high"   # static-RSA / no FS: one key-break -> all past sessions
    return "medium"
