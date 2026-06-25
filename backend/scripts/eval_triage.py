"""Triage eval harness — measures the FULL production triage() pipeline
(deterministic heuristics + the configured LLM) on a labeled golden set.

Why this exists: triage decides whether a finding is shown or suppressed. The
unforgivable error for a security tool is suppressing a REAL vulnerability
(a "missed vuln"). This harness pins that down with numbers so we can choose a
model + prompt with KNOWN quality, and catch regressions (or a provider silently
swapping our model) before customers do.

Run (prod path = Groq 70B):
    cd backend
    LLM_PROVIDER=groq GROQ_API_KEY=... PYTHONPATH=. ./.venv/bin/python scripts/eval_triage.py

Run the local model for comparison:
    LLM_PROVIDER=ollama PYTHONPATH=. ./.venv/bin/python scripts/eval_triage.py

Exit code is non-zero if ANY real finding is suppressed (recall < 100%), so this
can gate CI. Grow CASES over time — especially with real, hand-verified findings.
"""
from __future__ import annotations

import os
import sys

from app.scanners.whitebox.discover import CodeFinding
from app.scanners.whitebox.triage import triage
from app.config import GROQ_MODEL, LLM_PROVIDER, OLLAMA_MODEL

# Each case: the fields triage() actually reads + expect_real (the correct verdict).
# real=True  -> a genuine PQC/misuse finding that MUST be kept (recall)
# real=False -> a false positive that MUST be suppressed (precision)
CASES = [
    # ── REAL findings that must be kept (recall) ──────────────────────────────
    dict(id="k8s-clientgo-ca-key", real=True, kind="pqc_vulnerable", rule_id="qm-go-rsa-keygen",
         file_path="staging/src/k8s.io/client-go/util/cert/cert.go", line=173,
         message="Quantum-vulnerable RSA key generation (Shor-breakable).",
         context="// NewSelfSignedCACert builds the cluster's self-signed CA.\n"
                 ">> caKey, err := rsa.GenerateKey(cryptorand.Reader, 2048)"),
    dict(id="k8s-kubeadm-pki", real=True, kind="pqc_vulnerable", rule_id="qm-go-rsa-keygen",
         file_path="cmd/kubeadm/app/util/pkiutil/pki_helpers.go", line=606,
         message="Quantum-vulnerable RSA in use (Shor-breakable).",
         context="// GeneratePrivateKey: default key gen for kubeadm cluster PKI (CA/apiserver/etcd).\n"
                 ">> return rsa.GenerateKey(cryptorand.Reader, rsaKeySize)"),
    dict(id="k8s-kubelet-podcert-ecdsa", real=True, kind="pqc_vulnerable", rule_id="qm-go-ec-keygen",
         file_path="pkg/kubelet/podcertificate/podcertificatemanager.go", line=897,
         message="Quantum-vulnerable elliptic-curve key generation (Shor-breakable).",
         context="// per-pod serving cert key\n>> priv, err := ecdsa.GenerateKey(elliptic.P384(), rand.Reader)"),
    # the substring-bug cases: "test" is a SUBSTRING of these real prod paths.
    dict(id="attestation-real-key", real=True, kind="pqc_vulnerable", rule_id="qm-go-rsa-keygen",
         file_path="pkg/attestation/keys.go", line=40,   # "attestation" ⊃ "test"
         message="Quantum-vulnerable RSA key generation (Shor-breakable).",
         context="// signing key for remote attestation quotes\n>> key, _ := rsa.GenerateKey(rand.Reader, 3072)"),
    dict(id="latest-real-key", real=True, kind="pqc_vulnerable", rule_id="qm-go-ec-keygen",
         file_path="internal/latest/signer.go", line=12,  # "latest" ⊃ "test"
         message="Quantum-vulnerable elliptic-curve key generation (Shor-breakable).",
         context="// rotates the production release-signing key\n>> priv, _ := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)"),
    dict(id="sample-rsa-signing", real=True, kind="pqc_vulnerable", rule_id="qm-py-rsa-keygen",
         file_path="payments/keys.py", line=15,
         message="Quantum-vulnerable RSA in use (Shor-breakable).",
         context="def make_signing_key():\n    # signs customer payment JWTs\n"
                 ">> return rsa.generate_private_key(public_exponent=65537, key_size=2048)"),
    dict(id="md5-password", real=True, kind="misuse", rule_id="qm-weak-hash-md5-sha1",
         file_path="auth/passwords.py", line=25,
         message="Broken hash (MD5/SHA-1) used for security.",
         context="def hash_password(pw):\n    # stores the user's login password\n"
                 ">> return hashlib.md5(pw.encode()).hexdigest()"),
    dict(id="prod-ecdsa-tls", real=True, kind="pqc_vulnerable", rule_id="qm-go-ec-keygen",
         file_path="internal/tlsedge/server.go", line=88,
         message="Quantum-vulnerable elliptic-curve key generation (Shor-breakable).",
         context="// keypair for the public API gateway TLS listener (:443)\n"
                 ">> priv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)"),
    dict(id="real-ecb-pan", real=True, kind="misuse", rule_id="qm-ecb-mode",
         file_path="payments/crypto.py", line=30,
         message="ECB block-cipher mode leaks plaintext structure.",
         context="def encrypt_pan(key, pan):\n    # encrypts card PAN at rest\n"
                 ">> cipher = Cipher(algorithms.AES(key), modes.ECB())"),
    dict(id="ed25519-prod", real=True, kind="pqc_vulnerable", rule_id="qm-go-ec-keygen",
         file_path="cmd/signer/main.go", line=51,
         message="Quantum-vulnerable elliptic-curve key generation (Shor-breakable).",
         context="// long-term identity key for the artifact signer\n>> _, priv, _ := ed25519.GenerateKey(rand.Reader)"),

    # ── False positives that must be suppressed (precision) ───────────────────
    dict(id="hns-sha1-nonsec", real=False, kind="misuse", rule_id="qm-go-weak-hash",
         file_path="pkg/proxy/winkernel/hns.go", line=676,
         message="Broken hash (MD5/SHA-1) for security.",
         context="// We XOR the hashes of endpoints, an unordered set. Collisions are fine\n"
                 "// since we use other keys to identify the load balancer.\n>> hash = xor(hash, sha1.Sum([]byte(id)))"),
    dict(id="md5-cache-key", real=False, kind="misuse", rule_id="qm-weak-hash-md5-sha1",
         file_path="cache.py", line=13,
         message="Broken hash (MD5/SHA-1) used for security.",
         context="def cache_key(url, params):\n    # non-security cache key; only memoizes HTTP responses\n"
                 ">> return hashlib.md5(raw.encode()).hexdigest()"),
    dict(id="md5-etag", real=False, kind="misuse", rule_id="qm-weak-hash-md5-sha1",
         file_path="internal/httpcache/etag.go", line=54,
         message="Broken hash (MD5/SHA-1) used for security.",
         context="// computeETag returns a content fingerprint for HTTP caching.\n>> sum := md5.Sum(body) // etag only"),
    dict(id="testdata-keygen", real=False, kind="pqc_vulnerable", rule_id="qm-go-rsa-keygen",
         file_path="pkg/registry/testdata/gen_certs.go", line=40,
         message="Quantum-vulnerable RSA key generation (Shor-breakable).",
         context="// generates throwaway certs for unit tests\n>> key, _ := rsa.GenerateKey(rand.Reader, 2048)"),
    dict(id="test-file-secret", real=False, kind="misuse", rule_id="qm-hardcoded-secret",
         file_path="billing/stripe_client_test.go", line=12,
         message="Hardcoded live secret/key in source.",
         context="func TestCharge(t *testing.T) {\n    // fake key for the suite\n"
                 '>> client := stripe.New("sk_live_4eC39HqLyjWDarjtT1zdp7dc")'),
    dict(id="examples-keygen", real=False, kind="pqc_vulnerable", rule_id="qm-py-rsa-keygen",
         file_path="examples/quickstart/demo.py", line=8,
         message="Quantum-vulnerable RSA in use (Shor-breakable).",
         context="# quickstart demo\n>> key = rsa.generate_private_key(public_exponent=65537, key_size=2048)"),
    dict(id="mocks-keygen", real=False, kind="pqc_vulnerable", rule_id="qm-go-ec-keygen",
         file_path="internal/mocks/fakeca.go", line=20,
         message="Quantum-vulnerable elliptic-curve key generation (Shor-breakable).",
         context="// fake CA for mocking in unit tests\n>> priv, _ := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)"),
    dict(id="e2e-keygen", real=False, kind="pqc_vulnerable", rule_id="qm-go-rsa-keygen",
         file_path="test/e2e/framework/certs.go", line=15,
         message="Quantum-vulnerable RSA key generation (Shor-breakable).",
         context="// e2e test harness cert\n>> key, _ := rsa.GenerateKey(rand.Reader, 2048)"),
    dict(id="spec-fixture-key", real=False, kind="pqc_vulnerable", rule_id="qm-py-rsa-keygen",
         file_path="spec/fixtures/gen_key.py", line=3,
         message="Quantum-vulnerable RSA in use (Shor-breakable).",
         context=">> key = rsa.generate_private_key(public_exponent=65537, key_size=2048)"),
    # subtle: non-security md5 with NO giveaway keyword -> defers to the LLM's judgment.
    dict(id="md5-shard-key-subtle", real=False, kind="misuse", rule_id="qm-weak-hash-md5-sha1",
         file_path="internal/router/shard.go", line=44,
         message="Broken hash (MD5/SHA-1) used for security.",
         context="// pick a backend shard for this request id\n>> shard := int(md5.Sum([]byte(reqID))[0]) % numShards"),
]


def main() -> int:
    model = GROQ_MODEL if LLM_PROVIDER == "groq" else OLLAMA_MODEL
    print(f"Triage eval — provider={LLM_PROVIDER} model={model} — {len(CASES)} cases "
          f"({sum(c['real'] for c in CASES)} real, {sum(not c['real'] for c in CASES)} FP)\n")
    tp = tn = fp = fn = 0
    missed, by_layer = [], {"heuristic": 0, "llm": 0}
    for c in CASES:
        f = CodeFinding(rule_id=c["rule_id"], file_path=c["file_path"], line=c["line"],
                        message=c["message"], severity="medium", cwe=None, category="",
                        kind=c["kind"], algo=None, snippet=c["context"], context=c["context"])
        v = triage(f)
        by_layer[v.method] = by_layer.get(v.method, 0) + 1
        got, exp = v.is_real, c["real"]
        if exp and got: tp += 1; mark = "✓ keep"
        elif not exp and not got: tn += 1; mark = "✓ drop"
        elif not exp and got: fp += 1; mark = "✗ FALSE-KEEP (noise)"
        else: fn += 1; missed.append(c["id"]); mark = "✗✗ MISSED VULN"
        print(f"  {mark:<22} {c['id']:<24} [{v.method:<9}] "
              f"reach={v.reachable:<8} sens={v.data_sensitivity}")
    total = tp + tn + fp + fn
    recall = tp / (tp + fn) if (tp + fn) else 0
    precision = tp / (tp + fp) if (tp + fp) else 0
    print(f"\n  accuracy={(tp+tn)/total:.0%}  recall(keep-real)={recall:.0%}  "
          f"precision={precision:.0%}  | tp={tp} tn={tn} fp={fp} fn={fn}")
    print(f"  decided by: {by_layer}")
    if missed:
        print(f"  ⚠️  SUPPRESSED REAL VULNS: {', '.join(missed)}")
        return 1
    print("  ✅ recall 100% — no real finding suppressed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
