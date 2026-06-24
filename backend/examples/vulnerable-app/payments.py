"""Deliberately vulnerable sample for Quantum Mythos white-box demo.
Do NOT use any of this. Every line here is a finding on purpose."""
import hashlib
import random

from cryptography.hazmat.primitives.asymmetric import rsa, ec
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

# Hardcoded secret (CWE-798) — invisible on the wire, only a code scan finds it.
STRIPE_SECRET_KEY = "sk_live_4eC39HqLyjWDarjtT1zdp7dc"


def make_signing_key():
    # Quantum-vulnerable RSA (Shor-breakable) — inventory for PQC migration.
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


def make_session_key():
    # Quantum-vulnerable EC (Shor-breakable).
    return ec.generate_private_key(ec.SECP256R1())


def hash_password(pw: str) -> str:
    # Broken hash for passwords (CWE-327).
    return hashlib.md5(pw.encode()).hexdigest()


def encrypt_pan(key: bytes, pan: bytes) -> bytes:
    # ECB leaks plaintext structure (CWE-327).
    cipher = Cipher(algorithms.AES(key), modes.ECB())
    enc = cipher.encryptor()
    return enc.update(pan) + enc.finalize()


def new_reset_token() -> int:
    # Weak RNG for a security token (CWE-330).
    return random.randint(100000, 999999)
