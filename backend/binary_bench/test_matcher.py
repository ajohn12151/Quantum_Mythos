#!/usr/bin/env python3
"""Focused tests for the QV-API matcher and symbol normalization.

Runnable as a script (python3 test_matcher.py) or under pytest. The critical
property is that the EC* namespaces do NOT bleed into the bare D* families:
  ECDSA_do_sign   must be ECDSA, never DSA
  ECDH_compute_key must be ECDH, never DH
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.scanners.binary.qv_apis import (  # noqa: E402
    looks_like_go,
    match_cng_algorithm_strings,
    match_families,
    match_windows_asym_imports,
)
from app.scanners.binary.tier_a_symbols import normalize  # noqa: E402


def _fams(*names) -> set[str]:
    return set(match_families(set(names)))


def test_ecdsa_not_dsa():
    assert _fams("ECDSA_do_sign", "ECDSA_SIG_new") == {"ECDSA"}


def test_ecdh_not_dh():
    assert _fams("ECDH_compute_key") == {"ECDH"}


def test_bare_dsa():
    assert _fams("DSA_do_sign", "DSA_generate_key") == {"DSA"}


def test_bare_dh():
    assert _fams("DH_generate_key", "DH_compute_key") == {"DH"}


def test_rsa_paths():
    assert _fams("RSA_generate_key_ex") == {"RSA"}
    assert _fams("EVP_PKEY_CTX_set_rsa_keygen_bits") == {"RSA"}


def test_ec_generic():
    assert _fams("EC_KEY_new_by_curve_name", "EC_POINT_mul") == {"ECC"}


def test_symmetric_is_not_asymmetric():
    # AES/SHA/EVP cipher names must yield NO asymmetric family.
    assert _fams("EVP_EncryptInit_ex", "EVP_aes_256_cbc", "SHA256", "AES_encrypt") == set()


def test_no_false_positive_on_common_words():
    # 'EC'/'DH'/'DSA' as substrings of unrelated symbols must not match.
    assert _fams("execve", "fdopen", "update_widths", "decode_header") == set()


def test_go_packages():
    # Go symbol = package path; map to the right family.
    assert _fams("crypto/rsa.GenerateKey") == {"RSA"}
    assert _fams("crypto/ecdsa.(*PrivateKey).Sign") == {"ECDSA"}
    assert _fams("crypto/ed25519.Sign") == {"Ed25519"}
    assert _fams("crypto/elliptic.P256") == {"ECC"}
    assert _fams("crypto/ecdh.(*PrivateKey).ECDH") == {"ECDH"}


def test_go_symmetric_not_flagged():
    # Go symmetric/hash packages must NOT register as asymmetric.
    assert _fams("crypto/aes.newCipher", "crypto/sha256.block",
                 "crypto/hmac.New", "crypto/rand.Read") == set()


def test_looks_like_go():
    assert looks_like_go({"runtime.main", "crypto/rsa.GenerateKey"})
    assert not looks_like_go({"main", "EVP_PKEY_keygen", "RSA_new"})


def test_windows_cng_asym_imports():
    assert match_windows_asym_imports({"BCryptGenerateKeyPair", "BCryptOpenAlgorithmProvider"}) \
        == ["BCryptGenerateKeyPair"]
    assert match_windows_asym_imports({"NCryptSecretAgreement"}) == ["NCryptSecretAgreement"]


def test_windows_cng_symmetric_not_flagged():
    # symmetric CNG operations are not asymmetric-specific imports
    assert match_windows_asym_imports({"BCryptGenerateSymmetricKey", "BCryptEncrypt",
                                       "BCryptHashData"}) == []


def test_cng_algorithm_strings():
    def wide(s):  # null-terminated UTF-16LE, as CNG provider strings are stored
        return s.encode("utf-16-le") + b"\x00\x00"
    assert match_cng_algorithm_strings(wide("RSA")) == {"RSA": ["RSA"]}
    got = match_cng_algorithm_strings(wide("ECDSA_P256"))
    assert set(got) == {"ECDSA", "ECC"}
    assert match_cng_algorithm_strings(wide("AES")) == {}   # symmetric id, no match


def test_normalize():
    assert normalize("_EVP_PKEY_keygen") == "EVP_PKEY_keygen"      # Mach-O underscore
    assert normalize("EVP_PKEY_keygen@OPENSSL_3.0.0") == "EVP_PKEY_keygen"  # ELF version
    assert normalize("_RSA_sign@@OPENSSL_3.0.0") == "RSA_sign"


def test_tier_c_reachability_when_built():
    """Integration: on a static+sym binary, Tier C must reach the right family and
    must NOT reach QV crypto in the symmetric-only control. Skipped if the benchmark
    has not been built (binaries are gitignored)."""
    from app.scanners.binary import tier_c_reachability as tc
    binroot = Path(__file__).resolve().parent / "bin"
    rsa = binroot / "rsa_keygen__elf-x86_64__gcc-O3__static__sym"
    aes = binroot / "ctrl_aes_sha__elf-x86_64__gcc-O3__static__sym"
    if not (rsa.exists() and aes.exists()):
        print("  SKIP test_tier_c_reachability_when_built (run build.py first)")
        return
    r = tc.analyze(str(rsa))
    assert r.ran and "RSA" in r.reachable_families, r.note
    a = tc.analyze(str(aes))
    assert a.ran and not a.reached_qv, f"symmetric control should be unreachable: {a.note}"


def test_gopclntab_recovers_stripped_go():
    """Integration: a `-s -w` stripped Go binary has no symbol table, but the
    gopclntab parser must recover crypto/* function names. Skipped if unbuilt."""
    from app.scanners.binary.go_pclntab import recover_go_funcnames
    from app.scanners.binary import scan_binary
    binroot = Path(__file__).resolve().parent / "bin"
    stripped = binroot / "go_rsa__macho-arm64__go__static__strip"
    if not stripped.exists():
        print("  SKIP test_gopclntab_recovers_stripped_go (run build.py first)")
        return
    names = recover_go_funcnames(str(stripped))
    assert any(n.startswith("crypto/rsa.") for n in names), "no crypto/rsa.* recovered"
    assert "runtime.main" in names
    f = scan_binary(str(stripped))
    assert f.detected and "RSA" in f.families and f.detection_via == "go-pclntab", f.to_dict()


def _run():
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    failed = 0
    for t in tests:
        try:
            t()
            print(f"  PASS {t.__name__}")
        except AssertionError as e:
            failed += 1
            print(f"  FAIL {t.__name__}: {e}")
    print(f"\n{len(tests) - failed}/{len(tests)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(_run())
