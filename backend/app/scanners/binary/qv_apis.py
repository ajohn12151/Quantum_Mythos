"""Quantum-vulnerable (QV) asymmetric-crypto API dictionaries.

Reused/extended from QED (arXiv:2409.07852), which keys detection on the names of
quantum-vulnerable APIs exported by known crypto libraries. We map a symbol name
seen in a binary's import/symbol tables to the asymmetric primitive *family* it
implies. All families here are Shor-broken (RSA/ECC/ECDSA/ECDH/DH/DSA).

Matching is by REGEX with token boundaries, NOT bare substring, because the API
namespaces overlap as substrings and would cross-contaminate:
    "ECDSA_do_sign"  contains the substring "DSA_"  -> must NOT count as DSA
    "ECDH_compute_key" contains the substring "DH_" -> must NOT count as DH
A leading (^|_) boundary fixes both: the char before D is 'C', so the bare-DSA /
bare-DH patterns don't fire on the EC* names.

Symbol names are normalized before matching (see tier_a_symbols.normalize):
  - Mach-O leading underscore stripped:  _EVP_PKEY_keygen -> EVP_PKEY_keygen
  - ELF version suffix stripped:         EVP_PKEY_keygen@OPENSSL_3.0.0 -> EVP_PKEY_keygen
"""
from __future__ import annotations

import re

# Family -> list of regex patterns over a normalized symbol name.
# Patterns are intentionally specific (prefix + underscore) to keep precision high;
# a bare token like "EC" or "DH" without a boundary would false-positive on EXEC,
# WIDTH, etc.
_FAMILY_PATTERNS: dict[str, list[str]] = {
    "RSA": [
        r"(?:^|_)RSA_",                 # RSA_new, RSA_generate_key_ex, RSA_sign...
        r"EVP_PKEY_CTX_set_rsa_",       # EVP keygen path: set_rsa_keygen_bits
        r"EVP_PKEY_(?:get[01]|assign|set1)_RSA\b",
        r"(?:i2d|d2i)_RSA",             # serialization
        r"\bPEM_(?:read|write)\w*RSA",
        # mbedTLS / wolfSSL
        r"(?:^|_)mbedtls_rsa_",
        r"(?:^|_)wc_Rsa",
        # Go std lib (symbol = package path; matched on defined symbols, see note)
        r"\bcrypto/rsa\.",
    ],
    "ECDSA": [
        r"(?:^|_)ECDSA_",               # ECDSA_do_sign, ECDSA_sign, ECDSA_SIG_*
        r"(?:^|_)mbedtls_ecdsa_",
        r"(?:^|_)wc_ecc_(?:sign|verify)",
        r"\bcrypto/ecdsa\.",            # Go
    ],
    "ECDH": [
        r"(?:^|_)ECDH_",                # ECDH_compute_key
        r"EVP_PKEY_derive\b",           # generic ECDH/DH derive (ambiguous; see note)
        r"(?:^|_)mbedtls_ecdh_",
        r"\bcrypto/ecdh\.",             # Go (incl. X25519)
        r"golang\.org/x/crypto/curve25519",
    ],
    "ECC": [
        # Generic elliptic-curve machinery: present for EC keygen and any EC scheme.
        r"(?:^|_)EC_KEY_",
        r"(?:^|_)EC_POINT_",
        r"(?:^|_)EC_GROUP_",
        r"EVP_PKEY_CTX_set_ec_",
        r"(?:i2d|d2i|o2i)_EC",
        r"(?:^|_)mbedtls_ecp_",
        r"(?:^|_)wc_ecc_",
        # Go elliptic-curve machinery
        r"\bcrypto/elliptic\.",
        r"\bcrypto/internal/(?:fips140/)?nistec\b",
    ],
    "DH": [
        r"(?:^|_)DH_",                  # DH_new, DH_generate_key, DH_compute_key
        r"EVP_PKEY_CTX_set_dh_",
        r"(?:^|_)mbedtls_dhm_",
        r"(?:^|_)wc_DhAgree",
    ],
    "DSA": [
        r"(?:^|_)DSA_",                 # DSA_new, DSA_do_sign, DSA_generate_key
        r"EVP_PKEY_CTX_set_dsa_",
        r"\bcrypto/dsa\.",              # Go
    ],
    "Ed25519": [
        # EdDSA over edwards25519 — Shor-broken like the rest.
        r"\bcrypto/ed25519\.",                              # Go
        r"\bcrypto/internal/(?:fips140/)?edwards25519\b",   # Go internal
        r"golang\.org/x/crypto/ed25519",
        r"EVP_PKEY_ED25519",                                # OpenSSL EVP id
        r"(?:^|_)ED25519_(?:sign|verify|keypair)",          # BoringSSL/OpenSSL
    ],
}

# --- Windows CNG / CAPI -----------------------------------------------------
# Windows binaries do asymmetric crypto via system DLLs (bcrypt/ncrypt = CNG,
# advapi32/crypt32 = legacy CAPI). The IMPORTED function name says "asymmetric
# happening" but usually NOT the family — the family is the algorithm-identifier
# string (e.g. L"RSA", L"ECDSA_P256") passed to BCryptOpenAlgorithmProvider, which
# we recover separately via match_cng_algorithm_strings(). These patterns list ONLY
# asymmetric-specific functions, so symmetric CNG use (BCryptGenerateSymmetricKey /
# BCryptEncrypt with AES) does NOT match — the precision boundary.
_WINDOWS_ASYM_FUNC_PATTERNS = [
    r"^BCryptGenerateKeyPair$", r"^BCryptFinalizeKeyPair$",
    r"^BCryptSecretAgreement$", r"^BCryptSignHash$", r"^BCryptVerifySignature$",
    r"^BCryptImportKeyPair$", r"^BCryptExportKey$",
    r"^NCryptCreatePersistedKey$", r"^NCryptImportKey$", r"^NCryptSignHash$",
    r"^NCryptVerifySignature$", r"^NCryptSecretAgreement$",
    # legacy CAPI, asymmetric-specific (public-key / certificate operations)
    r"^CryptImportPublicKeyInfo", r"^CryptExportPublicKeyInfo",
    r"^CertCreateSelfSignCertificate$", r"^CryptSignCertificate",
    r"^CryptSignAndEncodeCertificate$", r"^CryptSignHash[AW]$",
]
_WINDOWS_ASYM_COMPILED = [re.compile(p) for p in _WINDOWS_ASYM_FUNC_PATTERNS]

# CNG algorithm-identifier strings -> family. Used to attribute the family of a
# detected CNG asymmetric operation by scanning the binary for the (UTF-16LE,
# null-terminated) provider string.
_CNG_ALGORITHM_STRINGS = {
    "RSA": "RSA", "RSA_SIGN": "RSA",
    "DH": "DH", "DSA": "DSA",
    "ECDSA_P256": "ECDSA", "ECDSA_P384": "ECDSA", "ECDSA_P521": "ECDSA", "ECDSA": "ECDSA",
    "ECDH_P256": "ECDH", "ECDH_P384": "ECDH", "ECDH_P521": "ECDH", "ECDH": "ECDH",
}


def match_windows_asym_imports(import_names: set[str]) -> list[str]:
    """Return imported CNG/CAPI asymmetric-operation functions (empty if none)."""
    return sorted(n for n in import_names
                  if any(p.match(n) for p in _WINDOWS_ASYM_COMPILED))


def match_cng_algorithm_strings(data: bytes) -> dict[str, list[str]]:
    """Find CNG algorithm-id provider strings in the image -> {family: [ids]}.

    Matched as null-terminated UTF-16LE (how the provider strings are stored),
    which keeps short ids like "RSA"/"DH" from firing on incidental wide text.
    ECDSA_*/ECDH_* also imply the ECC family.
    """
    hits: dict[str, set[str]] = {}
    for algid, fam in _CNG_ALGORITHM_STRINGS.items():
        wide = algid.encode("utf-16-le") + b"\x00\x00"
        if wide in data:
            hits.setdefault(fam, set()).add(algid)
            if fam in ("ECDSA", "ECDH"):
                hits.setdefault("ECC", set()).add(algid)
    return {fam: sorted(ids) for fam, ids in sorted(hits.items())}


# Distinctive markers that a binary was produced by the Go toolchain. Used by
# Tier A to decide that a retained crypto/* symbol is meaningful: the Go linker
# does function-level dead-code elimination, so a symbol that survived into the
# binary is (very likely) reachable — unlike C static linking, which pulls whole
# object files and leaves dead code behind.
_GO_MARKERS = ("runtime.", "go:", "internal/poll.", "runtime/internal")


def looks_like_go(symbol_names: set[str]) -> bool:
    return any(any(n.startswith(m) for m in _GO_MARKERS) for n in symbol_names)

# Compile once.
_COMPILED: dict[str, list[re.Pattern]] = {
    fam: [re.compile(p) for p in pats] for fam, pats in _FAMILY_PATTERNS.items()
}

# Crypto libraries we recognize by shared-object / dylib name. Used as evidence
# and to flag the "links a crypto lib but no asymmetric symbol surfaced" case
# (e.g. a symmetric-only consumer, or a stripped static binary that hid them).
CRYPTO_LIBRARY_HINTS = (
    "libcrypto", "libssl", "libwolfssl", "libmbedcrypto", "libmbedtls",
    "libgnutls", "libgcrypt", "libsodium", "libnettle",
    "bcrypt", "ncrypt",   # Windows CNG
)

# A few generic EVP names that prove OpenSSL EVP usage but do NOT by themselves
# identify an asymmetric family (symmetric ciphers and hashes use EVP too). We
# never classify on these alone — they only corroborate that crypto is present.
GENERIC_EVP_NONASYM = (
    "EVP_EncryptInit", "EVP_DecryptInit", "EVP_CipherInit",
    "EVP_DigestInit", "EVP_aes_", "EVP_sha", "SHA256", "SHA1", "AES_",
)


def match_families(symbol_names: set[str]) -> dict[str, list[str]]:
    """Return {family: sorted matched symbol names} for every QV family with a hit.

    A name may match multiple families (e.g. ECDSA code also pulls EC_KEY_*); that
    is correct — both are reported, and ECDSA implies ECC anyway. The caller
    collapses families to the shor_broken risk category.
    """
    hits: dict[str, set[str]] = {}
    for name in symbol_names:
        for fam, patterns in _COMPILED.items():
            if any(p.search(name) for p in patterns):
                hits.setdefault(fam, set()).add(name)
    return {fam: sorted(names) for fam, names in sorted(hits.items())}
