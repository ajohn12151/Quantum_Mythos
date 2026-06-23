# Aegis — Quantum Cryptographic Posture Management

> **Working name: "Aegis"** (provisional — Zeus's shield; defensive; no DB-name collision like "Oracle"/"Cassandra"). Rename freely.
>
> **This file is the full operating brief for the project.** Rename it to `CLAUDE.md` at the repo root and Claude Code will auto-load it each session. It is written so a builder (and their Claude Code) who was NOT part of the design conversation has complete context. Read it top to bottom before writing code.

---

## 0. TL;DR — what we're building in one paragraph

A **"Mythos for quantum"**: a cryptographic posture-management platform that finds an organization's quantum-vulnerable cryptography, prioritizes it by *real* business risk, and helps fix it. Two tiers: **(1) Black-box** — point it at a domain and it reads the organization's externally-observable crypto (TLS/SSH/mail certs + Certificate Transparency logs) in seconds, with zero integration, and flags everything a quantum computer will break. **(2) White-box** — with repo access it goes deep: discovers quantum-vulnerable crypto *and* classical crypto misuse in source, **reasons about which findings actually matter** (reachable from a public entry point + protects long-lived sensitive data + quantum time-to-break horizon), and opens *safely-bounded* crypto-agility migration PRs. Everything lives in **AWS Aurora PostgreSQL** as a continuous lifecycle state machine (Discover → Prioritize → Remediate → Verify), deployed on **Vercel**. Built for the **H0 hackathon** (AWS + Vercel), deadline ~June 29–30 2026.

---

## 1. The hackathon (hard constraints — non-negotiable)

- **Event:** H0: "Hack the Zero Stack with Vercel v0 and AWS Databases" — https://h01.devpost.com/
- **Sponsors:** AWS + Vercel. **$80K cash + $80K AWS credits.**
- **Hard requirement #1:** must use one of **Aurora PostgreSQL, Aurora DSQL, or DynamoDB**. → **We use Aurora PostgreSQL** (relational lifecycle/audit workload; see §6).
- **Hard requirement #2:** must **deploy on Vercel or v0.app** (Next.js frontend; scaffold the UI with v0).
- **Tracks:** B2C, B2B, Million-scale, Open Innovation. → **We target B2B** (the buyer is a CISO) and the **Most Original / Best Technical / Most Impactful** special awards ($2K each).
- **Judging criteria (build to these):**
  1. **Technological Implementation** — *especially database integration* (it's the sponsor's product — make Aurora central, not a backing store).
  2. **Design** — intuitive UX; v0 handles the polish.
  3. **Impact & real-world applicability** — see the business case in §3.
  4. **Originality.**
- **DEADLINES (today is 2026-06-23):**
  - ⚠️ **Request AWS + v0 credits by June 26, 12:00pm PT.** Do this on day one.
  - **Submit ~June 29–30** (Devpost). Judging is on a **recorded demo video** — there is no live booth, so the whole thing rides on a tight 2-minute clip.

---

## 2. Why quantum is the threat (the legible story)

A large fault-tolerant quantum computer running **Shor's algorithm** breaks **all widely-deployed asymmetric cryptography** — RSA, ECDSA, ECDH, DH, EdDSA. That's the math under every TLS handshake, code-signing cert, SSH key, and VPN. Symmetric crypto (AES) and hashes are only *weakened* by **Grover's algorithm** (effective key strength halves: AES-256 stays safe, AES-128 → ~64-bit work), **not broken**. So **the entire vulnerability is the asymmetric layer**, which is exactly the layer that announces itself on the wire.

**"Harvest now, decrypt later" (HNDL)** is why this is urgent *today*, not in 2032: adversaries record encrypted traffic now and decrypt it once a cryptographically-relevant quantum computer (CRQC) exists. Any data with a long confidentiality lifetime (PII, health records, credentials, IP, state secrets) is at risk the moment it crosses the wire.

**Honesty discipline (critical — do not overclaim):** breaking the crypto ≠ "hacking into the company." A CRQC lets an attacker **decrypt recorded sessions** and **impersonate the server** (forge certs, MITM) — it collapses the *communications/identity trust layer*. It does **not** hand them a shell, the internal database, or account systems (those sit behind auth, segmentation, fraud detection, etc.). Claim the first precisely; never claim the second. Precision is the credibility that separates us from fear-mongering.

**No CRQC exists today.** Resource estimates: Gidney & Ekerå (2019) ~20M noisy physical qubits / 8h to factor RSA-2048; Gidney (2025) under ~1M physical qubits. Today's hardware is ~hundreds–low-thousands of noisy physical qubits. Timeline: credible CRQC probability in the **2030s+**, deeply uncertain. **One of us has a quantum-error-correction / fault-tolerance resource-estimation background — that is our unfair advantage for the `time-to-break` estimate** (see §5).

---

## 3. Business case (this wins the "Impact" criterion — internalize it)

**Who buys and why — three real drivers:**
1. **It's mandated, and step one of every mandate is "build a cryptographic inventory."** You can't migrate what you can't see, so the inventory *is* the wedge.
   - NIST finalized PQC standards **FIPS 203/204/205** (ML-KEM, ML-DSA, SLH-DSA) on **2024-08-13**.
   - **NIST IR 8547:** RSA/ECDSA/ECDH **deprecated after 2030, disallowed after 2035.**
   - **OMB M-23-02 / NSM-10:** US agencies must produce **annual** cryptographic inventories + migration plans.
   - **NSA CNSA 2.0:** aggressive deadlines for national-security systems (new acquisitions must support PQC from 2027; signing PQC-exclusive by 2030).
   - **EU roadmap:** high-risk by 2030, full by 2035; explicitly calls for "cryptographic asset management" + "dependency maps."
2. **HNDL urgency for long-secret-horizon industries** — healthcare, defense/gov, finance, pharma/genomics, legal. These act *now*.
3. **Third-party / supply-chain risk** — assess *vendors'* quantum exposure. The **black-box scanner needs no cooperation from the target**, which is perfect for continuous third-party risk monitoring (an existing budget line).

**Revenue model (B2B SaaS, land-and-expand, priced like attack-surface management — a proven $50K–$500K/yr enterprise category):**
- **Free wedge:** "type a domain → external quantum-risk report in 10s." Lead-gen + the demo.
- **Team/mid-market:** continuous external monitoring of N domains, change alerts.
- **Enterprise ($50K–$250K+/yr):** white-box (repo + CBOM + the reasoning engine), SSO/API, and the **compliance/migration module** (track remediation, export auditor-ready proof against M-23-02 / CNSA 2.0). This is the money — it's sold against a deadline.
- **Add-on:** per-vendor third-party quantum-risk monitoring.

**Market validation:** SandboxAQ (multi-billion, AQtive Guard), IBM Quantum Safe Explorer, InfoSec Global (now Keyfactor), Binarly, QuSecure. The space is real, budgeted, and **pre-consolidation** (no Gartner MQ / Forrester Wave yet).

**The moat (what we differentiate on — NOT inventory, which is commoditized):** (a) the zero-integration black-box discovery, (b) the **reasoning/prioritization engine** (reachability + data-lifetime + quantum-horizon — see §4 & §5), (c) the **safely-bounded remediation loop** (auto-PR + verify). Inventory is table stakes; reasoning + fixing is the product.

---

## 4. Positioning vs. "Claude Mythos" (read this — it's the core differentiation)

**Claude Mythos** is Anthropic's frontier cyber model (Apr 2026, Project Glasswing): it autonomously reads a codebase, finds *exploitable-today* zero-days, and writes working PoCs (it found a 27-yr-old OpenBSD bug, FreeBSD RCE, etc. — mostly in **open-source** software whose source was already public). A judge *will* ask: "can't a general agent like Mythos just do your white-box analysis?"

**The rebuttal — three things a general code-reading agent structurally does NOT do, and they define our white-box tier:**
1. **No quantum threat-horizon model.** Mythos doesn't know RSA-2048 is a 2032 liability or that the data is harvestable *now*. (Our resource-estimation edge.)
2. **No data-confidentiality-lifetime model.** It doesn't reason about *which* data flows through a cipher and how long it must stay secret. This is **literally the unfilled "Gap G1"** named in the 2026 paper *Toward Quantum-Safe Software Engineering* (arXiv 2602.05759): CBOMs "treat code as an opaque container… rarely capture where crypto sits in the control and data flow." NIST also lists data-lifetime-based prioritization as an **open** problem.
3. **No system-of-record.** Mythos is a one-shot red-team run; we're a continuous Aurora-backed DB that proves migration progress to an auditor against a mandate.

**The line for the demo:** *"A general agent can read your code. It cannot prioritize your quantum migration by what an adversary is recording today to break in 2032 — that's not a code-reading problem, it's a threat-horizon-and-data-governance problem. That's the gap nobody has filled."*

**Asymmetry in our favor:** Mythos's no-permission mode still needs the *source* to be public. Our **black-box** no-permission mode works against *any* internet-facing host, closed-source included — because **cryptography is broadcast in every handshake.** Code bugs hide; crypto announces itself.

---

## 5. Architecture — the two tiers in detail

### Tier 1 — BLACK-BOX (perimeter, zero-integration) — the live demo hero

**Status: the core engine is PROVEN.** We ran it live (see §9 for actual outputs). The vulnerability is *inherent in the observable algorithm* — no exploit, no source, no execution needed. RSA-2048 is Shor-broken by definition; the fact falls out of the handshake in milliseconds.

What it does:
- **TLS handshake inspection** → certificate public-key algorithm (RSA/ECDSA/…), key size, signature algorithm, and the **negotiated key-exchange group** (e.g. X25519). One TLS connect yields all four facts. Extend to **SMTP/IMAP STARTTLS** and **TLS-VPN** endpoints (same analysis).
- **SSH host-key enumeration** (`ssh-keyscan`) → `ssh-rsa` / `ecdsa-sha2-*` / `ssh-ed25519` (all Shor-breakable). No auth, no exploit.
- **Certificate Transparency log enumeration** (crt.sh / CT APIs / Censys) → discover **shadow/forgotten subdomains and certs** with *zero connection to the target*. This is the **discovery wow**: "you think you have 12 services; here are 47, and this forgotten `legacy-api.*` is still live."
- **Forward-secrecy detection** (the catastrophic find): flag endpoints using **RSA key-transport / TLS 1.0–1.2 without ephemeral key exchange** — one future key-break decrypts **every** session ever recorded under that key, retroactively. This is the crypto equivalent of Mythos's 27-year-old bug, found from the outside.

**Classification (three buckets, not binary — be precise):**
- **Shor-broken** (all asymmetric: RSA/ECDSA/ECDH/EdDSA/DH) → must **replace**.
- **Grover-weakened** (AES-128, hashes) → just **increase key size**, not broken.
- **Already-PQC** (hybrid X25519+ML-KEM, ML-DSA) → safe (and detecting who's *already* migrating is itself a signal).

### Tier 2 — WHITE-BOX (repo access) — the depth / enterprise moat

Three layers. **The middle layer is the moat** — it's the part Mythos and the inventory incumbents both lack.

**(a) DISCOVER** — find real findings, not just an inventory:
- **PQC-vulnerable crypto** in source (RSA/ECDSA/ECDH call-sites, hardcoded algorithm strings). Reuse **CBOMkit / sonar-cryptography** (open-source, PQCA/Linux Foundation) and **emit a standard CycloneDX CBOM** — don't reinvent inventory; it's commoditized.
- **Classical crypto MISUSE** (this is what turns inventory into *discovery*): hardcoded keys, ECB mode, IV/nonce reuse, weak RNG, broken cert/hostname validation, MD5/SHA-1, non-constant-time comparisons. **85–99% of crypto-using code misuses the API** (88% of Android apps, 85% of Java repos, 52% of Python) — so we find *real, demonstrable bugs in essentially every repo.* **Unifying PQC-inventory + classical-misuse in one product is itself documented as novel** (only IBM straddles it). Build on **Semgrep (LGPL)** + **Gitleaks (MIT)** → SARIF. **⚠️ Do NOT use CodeQL — its engine is not free for commercial/closed-source code.**

**(b) REASON ← THE MOAT** — convert findings into ranked business risk:
- **Reachability + data-sensitivity:** is this crypto reachable from a public entry point, and what data flows through it? (LLM reasoning over the flagged code + call context; heuristic where full taint isn't feasible.)
- **Data-confidentiality-lifetime × quantum-horizon (Mosca/HNDL):** rank by *how long the data must stay secret* vs. *when the algorithm breaks*. This is the open NIST prioritization problem + Gap G1.
- **`time-to-break` estimate:** grounded in **fault-tolerance resource estimation** (our quantum expertise) — "~X million physical qubits at error rate p, distance-d decoder → ~Y hours; plausibly ~2032." This is the column no competitor can fill credibly and a general agent doesn't carry.
- ⚠️ **Positioning caveat:** *Binarly already ships "Cryptographic Reachability"* — but on **binaries** and only "is it invoked," **not** "does it protect sensitive data." So always position as **source-level + data-sensitivity + quantum-horizon**, never "reachability" generically.

**(c) REMEDIATE** — close the loop, *safely bounded*:
- Open a **crypto-agility refactor PR** (GitHub API): pull inline crypto behind a swappable provider interface (`CryptoProvider.kem()/.sign()`), draft the migration to ML-KEM/ML-DSA or hybrid.
- **⚠️ Hard safety rule — LLMs are demonstrably dangerous at writing crypto:** in a 2026 study, AI-generated crypto compiled only 23% of the time and 57% of *that* was vulnerable (nonce reuse, hardcoded secrets); generic CodeQL caught **0%**. A single bad nonce = full key recovery (how the PS3 master key fell). **Therefore: never let the agent author or alter a cryptographic primitive/parameter/mode/nonce/RNG. Restrict it to call-sites against a *verified library* (liboqs / oqs-python / HACL*), and gate every PR behind an auto-generated *differential test* (classical-vs-PQC round-trip) + a *size-assertion test* + human review.** The pitch is "AI does the agility refactor + interop/size reasoning; the primitive comes from a verified library; a human approves" — not "AI writes your crypto."

**Why migration is genuinely hard (not find-and-replace) — the reasoning the engine must show:** PQC artifacts are **4–50× larger** (ML-DSA-65 sig ≈ 3,309 B vs ECDSA ≈ 64 B; SLH-DSA sig ≈ 17,088 B). These sizes *silently break* deployed stacks: hybrid keyshares push the TLS **ClientHello past the ~1,500 B MTU** (broke Chrome rollouts; Meta downgraded to Kyber512 to stay in one packet); PQC server flights exceed the **~14.6 KB IW10** congestion window (>60% slower handshakes); **DNSSEC** EDNS ~1,232 B limit is blown by every PQC signature. Plus **migration ordering/interop** (you can't upgrade one end of TLS without the other) and **PKI chain migration** (competing transition cert formats). This is the "reasoning" Mythos doesn't do.

---

## 6. Data model — Aurora PostgreSQL as the product (criterion #1)

The DB is **not storage — it's the lifecycle state machine + audit trail**. "Your attack surface is your data." Every asset walks **Discovered → Triaged → PR-open → Migrated → Verified**, and a **re-scan closes the loop** (writes `verified`, flips the dashboard row red→green). That's a query-rich, transactional, auditable workload — exactly what Aurora is for. Starter schema:

```sql
-- one row per discovered cryptographic asset (black-box OR white-box)
crypto_asset(
  id, org_id, source,              -- 'tls' | 'ssh' | 'mail' | 'ct_log' | 'code_dep' | 'code_misuse'
  host, file_path, line,           -- locus (network OR source)
  pubkey_algo, key_bits, sig_algo, kex_group,
  category,                        -- 'shor_broken' | 'grover_weakened' | 'pqc' 
  forward_secrecy bool,
  reachable_from_public bool,      -- white-box reasoning output
  data_sensitivity,               -- e.g. 'pii' | 'secrets' | 'public' | 'unknown'
  confidentiality_lifetime_years,
  est_time_to_break,              -- resource-estimation output (the moat column)
  hndl_risk,                      -- harvest-now-decrypt-later score
  priority_score,                 -- data_lifetime × quantum_horizon ranking
  first_seen, last_seen
)

remediation(
  asset_id, state,                 -- 'discovered'|'triaged'|'pr_open'|'migrated'|'verified'
  pr_url, opened_at, verified_at
)

scan(id, org_id, target, mode,     -- 'black_box' | 'white_box'
     started_at, finished_at, summary_json)

finding(asset_id, cwe, title, severity, explanation, suggested_fix)  -- misuse-discovery output
```

(If we want a "global-scale" narrative for a second track, note Aurora DSQL is the multi-region option — but PostgreSQL is the primary.)

---

## 7. Tech stack

- **Frontend:** Next.js, scaffolded with **v0**, deployed on **Vercel**. The red→green dashboard, the "type a domain → report" flow, the public verify page.
- **DB:** **AWS Aurora PostgreSQL** (§6).
- **Black-box scanner:** Python service — `openssl`/Python `ssl` + `cryptography` for TLS; `ssh-keyscan` for SSH; crt.sh/CT API for enumeration. Writes to Aurora.
- **White-box scanner:** Python orchestrator → subprocess **Semgrep** + **Gitleaks** (+ optional CBOMkit) → parse SARIF → **Claude API** (Anthropic) for the reasoning/triage + prioritization layer → **GitHub API** for remediation PRs.
- **LLM:** Claude (Anthropic API) for the reasoning layer and misuse triage. Use the latest model (e.g. Claude Opus 4.x / Sonnet 4.x) and **prompt-cache the repeated system prompt** to control cost. Hybrid pattern (static localization → LLM reasoning) is the validated architecture — pure rules get evaded by obfuscation, pure LLMs drown in false positives.
- **Demo targets:** seed a controlled repo (with deliberate misuse) + a domain you control for the closed-loop verify.

---

## 8. Demo narrative (the recorded video — what wins)

Judging is a ~2-min video. Structure it as the **closed loop**, every piece real:

1. **Hook (the Mythos setup):** *"Mythos showed the world AI can break your code in hours. Here's the next clock: quantum breaks your encryption — and 'harvest now, decrypt later' means the theft already happened."*
2. **Black-box wow (live, no integration):** type a recognizable domain → CT-log enumeration surfaces forgotten subdomains → dashboard floods red → zoom the kill shot: a forgotten endpoint with **no forward secrecy** + the `est_time_to_break`.
3. **White-box depth (the "Mythos can't do this" beat):** point at a repo → it finds PQC-vulnerable crypto **and** a hardcoded key / reused nonce → the **prioritization screen** ranks them by data-lifetime × quantum-horizon. *This is the screen that proves it's a reasoning engine, not a scanner.*
4. **Remediate + Verify (the kill shot):** open the auto-generated **crypto-agility PR** with its differential test → merge → **re-scan flips the row red→green.** *Find it, fix it, prove it's fixed* — the whole thesis in 60 seconds.
5. **Close (Impact):** the mandate + HNDL business case (§3), one sentence.

---

## 9. Verified technical facts (the black-box engine, proven live 2026-06-23)

Real outputs from `openssl s_client` + `ssh-keyscan` — the engine works:

| Target | Pubkey algo | Key size | Signature | Verdict |
|---|---|---|---|---|
| chase.com | **RSA** | 2048 | sha256WithRSA | Shor-broken |
| github.com | **ECDSA** | 256 (P-256) | ecdsa-SHA256 | Shor-broken |
| rsa2048.badssl.com | RSA | 2048 | sha256WithRSA | Shor-broken |
| ecc256.badssl.com | ECDSA | 256 (P-256) | ecdsa-SHA384 | Shor-broken |

- Negotiated TLS key-exchange group: github.com & cloudflare.com both **X25519** (classical ECDH, Shor-broken; *not yet hybrid PQC* — itself a finding).
- github.com SSH host keys offered: `ssh-rsa`, `ecdsa-sha2-nistp256`, `ssh-ed25519` — all Shor-breakable.
- `badssl.com` provides labeled test endpoints (`rsa2048.`, `ecc256.`, etc.) — use them as deterministic demo fixtures.

**PQC artifact sizes (for the size-assertion tests + migration reasoning):**

| | RSA-2048 | ECDSA P-256 | ML-KEM-768 | ML-DSA-65 |
|---|---|---|---|---|
| Public key | ~256 B | 64 B | 1,184 B | 1,952 B |
| Sig / ciphertext | 256 B | ~64 B | 1,088 B (ct) | 3,309 B |

---

## 10. Build plan & division of labor (2 builders, submit ~June 29)

**Suggested split:**
- **Builder A — Black-box + Frontend + DB:** TLS/SSH/mail probes, CT-log enumeration, forward-secrecy detection → Aurora; v0 dashboard; the red→green closed-loop UI; verify page.
- **Builder B — White-box + Reasoning:** Semgrep/Gitleaks discovery, the Claude-powered reasoning/prioritization layer (the moat), the remediation PR + differential test.
- **Shared:** Aurora schema (agree early — it's the integration contract), demo video, submission writeup.

**Timeline:**
- **June 23 (today):** ⚠️ **request AWS + v0 credits** (deadline June 26 noon PT). Repo up. Aurora PostgreSQL provisioned. Next.js deployed to Vercel (hello-world). Agree the schema (§6). Black-box TLS probe → DB working end-to-end. White-box Semgrep skeleton.
- **June 24–25:** Black-box full (SSH/mail/CT-log/forward-secrecy). White-box discover (PQC + misuse) → reasoning/prioritization layer.
- **June 26:** Integrate both tiers into the dashboard. Remediation PR + re-scan verify loop.
- **June 27–28:** Polish (v0). Seed demo targets. End-to-end closed loop rehearsed.
- **June 29:** Record the 2-min video. Write the Devpost submission (lead with the mandate + HNDL business case for Impact). Submit.

---

## 11. Scope discipline & honest caveats (protect credibility)

- **Do NOT claim** breaking TLS = hacking into the company. It breaks comms/identity; say exactly that (§2).
- **Do NOT claim** any CRQC exists today, or a specific break date as fact — give honest, resource-estimation-grounded ranges.
- **Do NOT let the LLM author crypto primitives.** Verified library + differential test + human review, always (§5c).
- **Do NOT position on "reachability" generically** — Binarly has binary reachability + a patent. Our claim is *source-level + data-sensitivity + quantum-horizon*.
- **Do NOT use CodeQL** for scanning customer/closed-source code (licensing). Semgrep (LGPL) + Gitleaks (MIT) are safe.
- **Inventory is commoditized** (CBOMkit is free). Never pitch inventory as the product; pitch reasoning + fixing.
- **Filter findings to first-party source for the demo** — ~95% of raw crypto findings live in dependencies; reporting 50,000 findings destroys credibility. The LLM triage layer's job is to down-rank noise (benign checksums, dead code).
- **What we are NOT building this week:** whole-repo cross-module migration, full PKI/cert-chain migration, binary/firmware crypto detection, FFI-native crypto. Those are real but multi-quarter; show them as roadmap.

---

## 12. Glossary (for context)

- **PQC** — Post-Quantum Cryptography. **ML-KEM** (Kyber, key exchange) / **ML-DSA** (Dilithium, signatures) / **SLH-DSA** (SPHINCS+, hash-based sigs) — the NIST FIPS 203/204/205 standards.
- **Shor's algorithm** — quantum algorithm that breaks RSA/ECC (factoring & discrete log). **Grover's** — quadratic speedup that only *weakens* symmetric crypto.
- **CRQC** — Cryptographically-Relevant Quantum Computer (doesn't exist yet).
- **HNDL** — Harvest Now, Decrypt Later. **Mosca's theorem** — if (data-secrecy-lifetime + migration-time) > time-to-CRQC, you're already late.
- **CBOM** — Cryptography Bill of Materials (CycloneDX 1.6 / ECMA-424 standard inventory format).
- **Forward secrecy** — ephemeral key exchange so a future key compromise can't decrypt past sessions. Its *absence* is the catastrophic finding.
- **Crypto-agility** — abstracting crypto behind swappable interfaces so algorithm swaps are config changes (NIST CSWP 39, finalized 2025-12).
- **SARIF** — Static Analysis Results Interchange Format (the common output of Semgrep/Gitleaks/CodeQL).
- **SAST** — Static Application Security Testing.

---

## 13. Key sources (for the friend's Claude to ground claims)
- Gap G1 / quantum-safe SE vision: arXiv 2602.05759 · Quantum-Safe Code Auditing: arXiv 2604.00560 · LLM PQC migration: arXiv 2606.07341
- Crypto misuse base rates: CryptoLint (CCS 2013), Java-in-the-wild (arXiv 2009.01101), LICMA Python (arXiv 2109.01109) · MASC (every detector evaded): arXiv 2107.07065 · LLMs-for-misuse: arXiv 2411.09772 · hybrid SAST→LLM: ZeroFalse arXiv 2510.02534, SAST-Genius arXiv 2509.15433
- AI-writes-bad-crypto: arXiv 2604.27001 · Binarly Cryptographic Reachability: helpnetsecurity 2024-09-05 · CBOMkit: github.com/PQCA/cbomkit · CycloneDX CBOM: cyclonedx.org/capabilities/cbom/
- Resource estimates: Gidney & Ekerå 2019; Gidney 2025 (<1M qubits) · NIST mandates: FIPS 203/204/205, IR 8547, CNSA 2.0, OMB M-23-02 · NIST crypto-agility: CSWP 39
- Mythos: anthropic.com/glasswing, red.anthropic.com/2026/mythos-preview/

---
*Last updated 2026-06-23. This brief reflects research across the competitive landscape (SandboxAQ, IBM, Keyfactor/InfoSec, Binarly, QuSecure), automated PQC migration SOTA, and crypto-misuse detection literature. When in doubt, favor precision over hype — that discipline is the product's credibility.*
