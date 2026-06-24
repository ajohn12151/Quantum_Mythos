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
| Callgraph reachability (entry → QV-API) "static trace" | QED Phase 3 | **REUSE — Tier C, built** (direct-call graph, BFS from `main`) |
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
- **Tier C — call-graph reachability (capstone).** When static linkage leaves Tier
  A/B at "present but is it used?", build a **direct-call graph** (x86-64 `call`,
  arm64 `bl`, tail branches into known function heads) from the symbol table and BFS
  from `main`. A QV API *reachable* from `main` → **upgrade to HIGH confidence with
  the precise reachable family**; QV machinery present but *not reachable* → treat as
  **not used** (this is what removes the static over-linking false positives). Lazy
  BFS with a function cap keeps it ~2 s even against a statically linked libcrypto
  (~16k functions). Needs symbols, so it runs on static-unstripped (and, by accident
  of `strip -x`, Mach-O "stripped" — see limitations); it cannot run on a fully
  symbol-stripped binary. Conservative: indirect dispatch (`call rax`/`blr`, provider
  function pointers) is unresolved, so a negative result downgrades rather than
  asserts safety.
- **Fusion (`scan.py`)** → HIGH (Tier A imports, or Tier C proven-reachable) / LOW
  (static presence when Tier C can't run) / NONE (incl. Tier C proven-unreachable).

## Measured results (this machine, 99-binary matrix)

Two operating policies — STRICT counts only HIGH-confidence (import) detections;
OPERATIONAL also counts LOW-confidence static-presence flags:

| Policy | Precision | Recall | F1 |
|---|---|---|---|
| STRICT | **1.00** | 0.909 | 0.952 |
| OPERATIONAL | 0.985 | **1.00** | 0.992 |

Per cell (where the honest story lives):

| Cell | Strict recall | Operational recall | Operational precision |
|---|---|---|---|
| dynamic / symbols | 1.00 | 1.00 | 1.00 |
| dynamic / **stripped** | **1.00** | 1.00 | 1.00 |
| static / symbols | **1.00** | 1.00 | **1.00** |
| static / **stripped** | 0.50 | 1.00 | 0.923 |

Tier C is what moved static/symbols from (strict R 0.00, oper P 0.857) to
(1.00, 1.00): proven-reachable RSA/EC/… upgrade to HIGH with the correct family,
and the symmetric-only `aes_sha` static binaries are proven *unreachable* and
dropped. Strict recall rose 0.636 → 0.909 overall; the only positives still below
HIGH confidence are the 6 fully-symbol-stripped **ELF** static binaries.

- **Family attribution on the high-confidence subset: 60/60 = 100%** (now incl.
  static binaries resolved by Tier C reachability).
- **Real-world:** `openssl`, `ssh` → high-confidence correct; `ls`, `true` → clean
  negatives; **Go static `docker` → false negative (expected, see below).**

### Reading these numbers honestly

1. **Dynamic linkage is solved** — P=R=1.0 including stripped. Stripping does not
   defeat Tier A because dynamic imports survive it. This is the common case
   (most software dynamically links its TLS/crypto library).
2. **Static linkage was presence-not-use until Tier C.** A symmetric-only program
   that statically links libcrypto carries all the asymmetric machinery + curve
   tables, unused. Symbol/constant presence (Tier A/B) cannot tell use from presence;
   **Tier C reachability can**, and does — it removed 3 of the 4 `ctrl_aes_sha` false
   positives (those with symbols to anchor a call graph). The **one** remaining
   operational FP is `ctrl_aes_sha` ELF static **fully stripped**: no symbols, so Tier
   C cannot run and only Tier B's curve-constant presence remains. That single FP is
   the irreducible static+stripped limitation.
3. **`strip -x` on Mach-O is only a partial strip.** It removes *local* symbols but
   keeps *external* ones, so Tier C still runs on our Mach-O "stripped" static
   binaries (hence static/stripped strict recall 0.50, not 0.00 — the Mach-O half is
   recovered, the ELF half is not). A *fully* stripped Mach-O (no exported symbols)
   would defeat Tier C exactly like stripped ELF. The honest worst case is ELF
   `strip`, which removes the whole symbol table.
4. **The static/stripped recall of 1.00 is partly an artifact** and we say so: our
   RSA-only static binary is "caught" only because OpenSSL unconditionally links its
   EC curve tables, which Tier B matches. A static+stripped RSA binary built against
   a curve-free RSA library would be **missed**. Genuine RSA-in-static-stripped
   remains unsolved by Tiers A/B.
5. **The Go binary is the honest boundary.** `docker` provably contains
   `crypto/ecdsa`, `crypto/rsa`, `crypto/elliptic/nistec_p256`, TLS_ECDHE_ECDSA — but
   ships no crypto dylib, no OpenSSL symbols, and stores P-256 in a non-OpenSSL
   representation, so all three tiers miss it. This is the case for a
   Where's-Crypto-style structural detector — explicitly future work.

## Limitations / blind spots (summary)

- Fully symbol-stripped + statically-linked + non-OpenSSL crypto (e.g. Go, Rust):
  **not detected.** Tier C needs symbols; constants are OpenSSL-shaped. Needs
  structural/decompiler analysis (the invent-later DFG/LLM tiers).
- Tier C resolves direct calls only; crypto reached purely through indirect dispatch
  (function pointers, `dlopen`) can be missed — negatives are conservative, not proofs.
- Curve constants are curve-specific; custom/non-standard curves embed nothing.
- ELF `strip` removes the whole symbol table (worst case for Tier C); Mach-O
  `strip -x` keeps external symbols, so Tier C still works there.
- PE / Windows and ARM64-ELF not in this build matrix (LIEF/capstone support them;
  the corpus build was scoped to x86-64 ELF + arm64 Mach-O).
