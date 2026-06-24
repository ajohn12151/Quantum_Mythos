# Binary tier — detecting quantum-vulnerable asymmetric crypto in compiled binaries

Detects **RSA / ECC / ECDSA / ECDH / DH / DSA** (all Shor-broken) inside compiled
**ELF / PE / Mach-O** binaries with no source. Third scanner mode alongside
`blackbox/` (over-the-wire) and `whitebox/` (source). Reports through the shared
`blackbox/classify.py` risk taxonomy (`shor_broken / grover_weakened / pqc`).

Code: `backend/app/scanners/binary/` — entry point `scan_binary(path) -> BinaryFinding`.
Benchmark: this directory.

## Why this is hard (and not pretended otherwise)

Compilation erases algorithm identity. Unlike AES (fixed S-box) or SHA (fixed IVs),
**RSA and ECC have no fixed magic constants** — an RSA key is runtime material and
the algorithm is just big-integer modular exponentiation; ECC is modular curve
arithmetic. So the entire FindCrypt/signsrch constant-signature paradigm is
*structurally blind* to RSA, and only weakly catches ECC via embedded curve
parameters. Static linking + symbol stripping then removes the import table you'd
otherwise read. "Present vs actually-reachable" is undecidable in general.

## Literature grounding — reuse vs invent

| Idea | Source | Verdict |
|---|---|---|
| Import / symbol-table → QV-API name match (per-library dictionaries, cross-format) | **QED**, arXiv:2409.07852 | **REUSE — Tier A backbone** |
| Asymmetric primitive taxonomy (RSA/ECC/ECDSA/ECDH/DH/DSA) | **FoC**, arXiv:2403.18403 | **REUSE** — mapped onto `classify.py` |
| Curve-parameter constants in `.rodata` (P-256/384/521, secp256k1, 25519) | FindCrypt / signsrch / grap (IACR 2017/1119) | **REUSE — Tier B**, narrow ECC-only |
| AES/SHA constant scan | findcrypt-yara | not needed for asymmetric scope (would be symmetric context only) |
| Callgraph reachability (entry → QV-API) "static trace" | QED Phase 3 | **INVENT later — Tier C**, out of scope this pass |
| DFG subgraph-isomorphism on modexp / Montgomery ladder | **Where's Crypto?**, arXiv:2009.04274 | **INVENT later** — weeks of work; never shipped asymmetric sigs |
| LLM over decompiled pseudocode → classify | FoC, arXiv:2403.18403 | **INVENT later** — heavy, IDA/Ghidra-gated |

QED's own stated assumption is dynamic linking; it collapses on static+stripped.
That boundary is exactly what our benchmark measures, rather than asserts.

## Benchmark (built first — every claim is measured)

`corpus/` — 9 tiny C programs: 6 positives (one per family, real OpenSSL calls) +
3 controls. The key control is `ctrl_aes_sha.c`: it **links libcrypto and does real
crypto, but only symmetric (AES) + hash (SHA)** — the precision trap that separates
"links OpenSSL" from "uses asymmetric crypto".

`build.py` compiles a variant matrix — **99 binaries**:
- **ELF x86-64** (54) in Docker (`debian:bookworm` + OpenSSL, `--platform linux/amd64`).
- **Mach-O arm64** (45) natively with host clang + homebrew OpenSSL.
- Axes: gcc/clang × `-O0`/`-O3` × **dynamic/static** × **symbols/stripped**.

`ground_truth.json` is derived from the source (we wrote it), never from a detector.
`realworld/` adds 5 hand-verified real binaries (incl. a stripped static Go binary).

```
python3 build.py            # build matrix + ground truth (needs Docker running)
python3 bench.py            # measured precision/recall, per cell
python3 test_matcher.py     # matcher unit tests
realworld/setup_realworld.sh && python3 run_realworld.py
```

## Tiers

- **Tier A — symbols/imports (LIEF).** Match QV-API names in import + symbol tables.
  *Imported* symbols = the program's own references → **high confidence**, exact
  family, and they survive `strip` (dynamic imports live in `.dynsym` / Mach-O bind
  opcodes). On static binaries there are no imports; the whole library is linked in,
  so symbol *presence* ≠ use → reported as **low-confidence "inconclusive (static
  over-linking)"**, not a fake detection.
- **Tier B — curve constants.** Scan the image for fixed standard-curve parameters
  (P-256/384/521, secp256k1, Curve25519). Recovers an **ECC-only** signal on
  static+stripped binaries where Tier A is blind. Presence-only; constant-blind to
  RSA/DH/DSA by construction.
- **Fusion (`scan.py`)** → HIGH (Tier A imports) / LOW (static presence: Tier A
  defined symbols and/or Tier B constants) / NONE.

## Measured results (this machine, 99-binary matrix)

Two operating policies — STRICT counts only HIGH-confidence (import) detections;
OPERATIONAL also counts LOW-confidence static-presence flags:

| Policy | Precision | Recall | F1 |
|---|---|---|---|
| STRICT | **1.00** | 0.636 | 0.778 |
| OPERATIONAL | 0.943 | **1.00** | 0.971 |

Per cell (where the honest story lives):

| Cell | Strict recall | Operational recall | Operational precision |
|---|---|---|---|
| dynamic / symbols | 1.00 | 1.00 | 1.00 |
| dynamic / **stripped** | **1.00** | 1.00 | 1.00 |
| static / symbols | 0.00 | 1.00 | 0.857 |
| static / **stripped** | 0.00 | 1.00 | 0.857 |

- **Family attribution on the high-confidence (dynamic) subset: 42/42 = 100%.**
- **Real-world:** `openssl`, `ssh` → high-confidence correct; `ls`, `true` → clean
  negatives; **Go static `docker` → false negative (expected, see below).**

### Reading these numbers honestly

1. **Dynamic linkage is solved** — P=R=1.0 including stripped. Stripping does not
   defeat Tier A because dynamic imports survive it. This is the common case
   (most software dynamically links its TLS/crypto library).
2. **Static linkage is presence-detection, not use-detection.** The 4 operational
   false positives are precisely the `ctrl_aes_sha` static binaries: symmetric-only,
   but they statically link libcrypto, so its asymmetric machinery + curve tables are
   present though unused. No symbol- or constant-level method can tell use from
   presence here — only reachability (Tier C) can. We report these as **low
   confidence**, not as confident detections.
3. **The static/stripped recall of 1.00 is partly an artifact** and we say so: our
   RSA-only static binary is "caught" only because OpenSSL unconditionally links its
   EC curve tables, which Tier B matches. A static+stripped RSA binary built against
   a curve-free RSA library would be **missed**. Genuine RSA-in-static-stripped
   remains unsolved by Tiers A/B.
4. **The Go binary is the honest boundary.** `docker` provably contains
   `crypto/ecdsa`, `crypto/rsa`, `crypto/elliptic/nistec_p256`, TLS_ECDHE_ECDSA — but
   ships no crypto dylib, no OpenSSL symbols, and stores P-256 in a non-OpenSSL
   representation, so both tiers miss it. This is the case for Tier C reachability or
   a Where's-Crypto-style structural detector — explicitly future work.

## Limitations / blind spots (summary)

- Static + stripped + non-OpenSSL crypto (e.g. Go, Rust, BoringSSL custom builds):
  **not detected.** Needs structural/decompiler analysis (invent-later tier).
- No family attribution on static binaries (over-linking surfaces all families).
- Curve constants are curve-specific; custom curves embed nothing.
- No reachability: "linked" ≠ "called". Tier C (QED Phase 3) would address this.
- PE / Windows and ARM64-ELF not in this build matrix (LIEF supports them; the
  corpus build was scoped to x86-64 ELF + arm64 Mach-O).
