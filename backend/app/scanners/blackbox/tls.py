"""Black-box TLS crypto inspection — pure Python, no exploit, no source.

Opens a TLS connection and reads the four facts that fall out of the handshake:
certificate public-key algorithm, key size, signature algorithm, and TLS version
+ cipher (from which we infer forward secrecy). This replicates the openssl probe
we validated live (chase.com RSA-2048, github.com ECDSA P-256).
"""
from __future__ import annotations

import socket
import ssl
from dataclasses import dataclass, asdict

from cryptography import x509
from cryptography.hazmat.primitives.asymmetric import rsa, ec, dsa, ed25519, ed448
from cryptography.x509.oid import ExtensionOID

from .classify import classify_pubkey, est_time_to_break, hndl_risk


@dataclass
class TlsCryptoFacts:
    host: str
    port: int
    pubkey_algo: str
    key_bits: int | None
    curve: str | None
    sig_algo: str | None
    tls_version: str | None
    cipher: str | None
    forward_secrecy: bool | None
    category: str
    est_time_to_break: str
    hndl_risk: str
    san: list[str] | None = None     # other hostnames listed on the cert (discovery source)
    error: str | None = None

    def to_dict(self) -> dict:
        return asdict(self)


def _describe_key(pub) -> tuple[str, int | None, str | None]:
    if isinstance(pub, rsa.RSAPublicKey):
        return "RSA", pub.key_size, None
    if isinstance(pub, ec.EllipticCurvePublicKey):
        return "ECDSA/EC", pub.key_size, pub.curve.name
    if isinstance(pub, ed25519.Ed25519PublicKey):
        return "Ed25519", 256, "ed25519"
    if isinstance(pub, ed448.Ed448PublicKey):
        return "Ed448", 448, "ed448"
    if isinstance(pub, dsa.DSAPublicKey):
        return "DSA", pub.key_size, None
    return type(pub).__name__, None, None


def _forward_secrecy(tls_version: str | None, cipher_name: str) -> bool | None:
    """TLS 1.3 is always ephemeral (FS). TLS 1.2: FS iff ECDHE/DHE in the suite.
    Static-RSA key transport (e.g. TLS_RSA_WITH_*) has NO forward secrecy."""
    if tls_version == "TLSv1.3":
        return True
    c = cipher_name.upper()
    if "ECDHE" in c or "DHE" in c:
        return True
    if c.startswith("AES") or "RSA" in c:
        return False
    return None


def scan_tls(host: str, port: int = 443, timeout: float = 8.0) -> TlsCryptoFacts:
    ctx = ssl.create_default_context()
    ctx.check_hostname = False          # we inspect crypto, not validate trust
    ctx.verify_mode = ssl.CERT_NONE
    ctx.minimum_version = ssl.TLSVersion.TLSv1_2
    try:                                # a scanner must probe legacy/no-FS ciphers,
        ctx.set_ciphers("ALL:@SECLEVEL=0")   # not just what a modern client offers
    except ssl.SSLError:
        pass
    try:
        with socket.create_connection((host, port), timeout=timeout) as sock:
            with ctx.wrap_socket(sock, server_hostname=host) as ssock:
                der = ssock.getpeercert(binary_form=True)
                tls_version = ssock.version()
                cipher_tuple = ssock.cipher()  # (name, protocol, secret_bits)
        cert = x509.load_der_x509_certificate(der)
        pubkey_algo, key_bits, curve = _describe_key(cert.public_key())
        try:
            sig_algo = cert.signature_algorithm_oid._name
        except Exception:
            sig_algo = None
        cipher_name = cipher_tuple[0] if cipher_tuple else ""
        fs = _forward_secrecy(tls_version, cipher_name)
        category = classify_pubkey(pubkey_algo)
        try:
            ext = cert.extensions.get_extension_for_oid(ExtensionOID.SUBJECT_ALTERNATIVE_NAME)
            san = sorted({n.lower() for n in ext.value.get_values_for_type(x509.DNSName)})
        except Exception:
            san = []
        return TlsCryptoFacts(
            host=host, port=port,
            pubkey_algo=pubkey_algo, key_bits=key_bits, curve=curve, sig_algo=sig_algo,
            tls_version=tls_version, cipher=cipher_name or None, forward_secrecy=fs,
            category=category,
            est_time_to_break=est_time_to_break(pubkey_algo, key_bits),
            hndl_risk=hndl_risk(category, fs),
            san=san,
        )
    except Exception as e:  # failure mode is a recorded error, never a crash
        return TlsCryptoFacts(
            host=host, port=port, pubkey_algo="unknown", key_bits=None, curve=None,
            sig_algo=None, tls_version=None, cipher=None, forward_secrecy=None,
            category="unknown", est_time_to_break="", hndl_risk="low", error=str(e),
        )


if __name__ == "__main__":
    import json
    import sys

    targets = sys.argv[1:] or ["chase.com", "github.com", "rsa2048.badssl.com", "ecc256.badssl.com"]
    for t in targets:
        print(json.dumps(scan_tls(t).to_dict(), indent=2))
