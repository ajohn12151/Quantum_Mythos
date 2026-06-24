# Quantum Mythos — Moat Roadmap

> **Thesis:** Detection is the *wedge*, not the moat. Scanning for quantum-vulnerable
> crypto commoditizes (Semgrep is open-source, CBOMkit is free, we rebuilt the core in
> 3 hours, and LLM triage is becoming table stakes). The durable moat is everything
> *downstream* of the finding — **distribution / switching-cost, trust & compliance,
> a data flywheel, correct remediation at scale, and coverage completeness** — and it
> **compounds**. This roadmap sequences features by *what accrues defensibility over
> time*, not by what's technically interesting.

> **The tailwind that makes timing everything:** NIST deprecates RSA/ECDSA after **2030**,
> disallows them after **2035**; M-23-02 mandates annual crypto inventories; CNSA 2.0 and
> the EU roadmap set hard deadlines. Every regulated org *must* migrate this decade. The
> company that becomes the **system-of-record during the migration window** wins. The moat
> is *being first and sticky*, not being cleverest.

---

## Phase 0 — The Wedge ✅ (built — the hackathon)

*Goal: maximum-friction-removal entry point that lands users and starts the funnel.*

- ✅ Black-box: paste a domain → quantum exposure in seconds, zero access (TLS/SSH/mail + CT/SAN shadow-subdomain discovery + no-forward-secrecy detection).
- ✅ White-box: paste a repo → quantum-vulnerable crypto in Python/JS/Go → real fix PR (auto-fork) → re-verify red→green.
- ✅ Aurora lifecycle DB (the seed of the system-of-record).
- **Moat role:** *distribution.* This is the door, not the lock. Keep it free and viral.

---

## Phase 1 — Credibility (0–3 months) — *table stakes, not a moat*

*Goal: make findings trustworthy enough that a buyer acts on them. Without this the wedge doesn't convert.*

- **Hybrid triage engine** (SAST → LLM): kill false positives (the md5-cache, test-cert, password-field noise we hit) — research shows ~91% FP reduction. Local model first ($0), cloud later.
- **Reachability + data-sensitivity** (pragmatic, LLM-reasoned): "reachable from a public entry point AND protects long-lived sensitive data" — the unfilled "Gap G1."
- **Resource-estimation `time-to-break`** grounded in real fault-tolerance estimates — the expert credibility no competitor replicates cheaply.
- **Moat role:** *credibility that converts the wedge.* The technique commoditizes; only the accumulated FP-labeling data (Phase 6) is durable.

---

## Phase 2 — System-of-Record (0–6 months) — *the moat seed: switching cost*

*Goal: stop being a one-shot scan; become the continuous record orgs run their migration in.*

- **Continuous monitoring** + change alerts (re-scan on schedule, diff over time).
- **Persistent org inventory** + **migration-progress tracking** (the lifecycle, over months — where the data and stickiness live).
- **CI/CD integration:** GitHub App / GitLab / CI plugin — findings + fix PRs in the dev workflow (Snyk's actual moat was distribution + integration, not its scanner).
- **Ticketing/workflow:** Jira/ServiceNow sync; ownership, SLAs.
- **CBOM export** (CycloneDX / ECMA-424 standard) — interoperable, becomes their source of truth.
- **Moat role:** *switching cost.* Once you hold the inventory + the workflow + the history, ripping you out is painful.

---

## Phase 3 — Trust & Compliance (3–12 months) — *the moat: regulatory acceptance*

*Goal: become the vendor auditors and regulators accept. Slow to earn, very sticky, unlocks enterprise budget.*

- **Auditor-ready compliance reporting:** M-23-02, NIST IR 8547, CNSA 2.0, EU PQC roadmap — mapped, exportable, attestable.
- **Policy engine:** define crypto policy, gate CI on it, prove conformance.
- **Enterprise trust:** SSO/SAML, RBAC, audit logs, SOC 2 / FedRAMP path.
- **Third-party / supply-chain risk:** assess *vendors'* quantum posture (black-box needs no cooperation) — a separate budget line.
- **Moat role:** *trust moat.* In compliance-driven markets, being the accepted system-of-record is a durable advantage.

---

## Phase 4 — Correct Remediation at Scale (6–18 months) — *the moat: value, not just visibility*

*Goal: move from stub PRs to mergeable, tested migrations. Hard, dangerous to get wrong, deeply defensible.*

- **Crypto-agility refactoring:** abstract crypto behind swappable providers (the mechanical, high-value transform).
- **Real PQC integration:** wire verified libraries (liboqs, ML-KEM/ML-DSA) — never author primitives (LLMs produce broken crypto ~57% of the time).
- **Differential + size-assertion testing:** auto-generate classical-vs-PQC equivalence tests; reason about the 4–50× key/sig size blowup that breaks TLS packets/buffers.
- **Interop / migration ordering:** the "can't migrate one end of TLS without the other" problem.
- **Moat role:** *value moat.* Closing the loop *correctly* is what inventory tools can't do and what justifies premium pricing.

---

## Phase 5 — Coverage Completeness (6–24+ months) — *the moat: the hard long tail*

*Goal: find ALL the crypto, not the easy 30%. Years of work; this is where Binarly-class defensibility lives.*

- **More languages:** Java/JCA, C#, Rust, C/C++ source (FP-prone — gated behind the triage engine).
- **Dependency / SBOM crypto:** "you ship OpenSSL 1.1.1 → RSA/ECDSA" + reachability (the `implements` vs `uses` distinction).
- **Config & runtime:** TLS configs, `java.security`, OpenSSL cipher policy, KMS key types, negotiated-in-prod reconciliation.
- **Binary / firmware analysis:** the genuine research frontier (constant signatures + ML on disassembly + reachability). Roadmap, not a quick build — cite Where's-Crypto? / FoC / QED.
- **Moat role:** *technical coverage moat.* Comprehensiveness is slow and compounds.

---

## Phase 6 — Data Flywheel (compounds throughout) — *the moat: uncopyable at scale*

*Goal: every scan across every customer makes the product better. The one moat a 3-hour clone can never have.*

- **Cross-customer FP-filtering models** (the accumulated "what's a real finding" labels behind Phase 1).
- **Crypto-posture benchmarks / threat intel** ("you're in the bottom 20% of fintechs for quantum readiness").
- **Migration-pattern library:** learned, proven fixes across codebases feed Phase 4.
- **Moat role:** *data moat.* Compounds with every customer; cannot be replicated without scale.

---

## Cross-cutting / business moats (start now, mature over years)

- **Distribution:** keep the free domain-scan wedge viral; GitHub Marketplace app; "quantum exposure score" as shareable lead-gen.
- **Partnerships:** CAs, cloud providers, compliance frameworks, PQC library vendors.
- **Category ownership:** be *the* name for "quantum cryptographic posture management" before incumbents (SandboxAQ, IBM, Keyfactor, Binarly) reach the long tail.

---

## Honest summary

| Layer | Durable moat? |
|---|---|
| Detection / inventory | ❌ commoditized (the wedge) |
| Triage / accuracy (technique) | ❌ table stakes; only the *data* behind it (Phase 6) is durable |
| System-of-record + switching cost | ✅ |
| Trust / compliance acceptance | ✅ |
| Correct remediation at scale | ✅ |
| Coverage completeness (binary/firmware) | ✅ (slow) |
| Data flywheel | ✅ (compounds) |

**Build order = wedge → credibility → system-of-record → trust → correct-remediation → coverage, with the data flywheel turning the whole time.** You don't *build* the moat in a sprint; you build the wedge that earns the right to it, and design it to compound from day one.
