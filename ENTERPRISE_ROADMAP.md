# Quantum Mythos — Enterprise Product Roadmap

> Status as of 2026-06-25. This is the path from "strong prototype" to "enterprise product."
> Companion to `ROADMAP.md` (the moat thesis). Sizing: S ≈ days, M ≈ 1–2 wks,
> L ≈ 3–6 wks, XL ≈ quarter+. "Buy" = adopt commodity infra, don't reinvent it.

## North star

Be the **system of record** for an enterprise's cryptographic posture and PQC
migration: detect everywhere (source, binary, network, cloud, config), prioritize
by real business risk (**reachability × data-lifetime × quantum-horizon**), and
close the loop with **verified** remediation. Detection is the wedge (it
commoditizes); the moat is the downstream lifecycle + the data flywheel.

## Sequencing logic

You cannot sell an enterprise security tool that (a) isn't **accurate** — a missed
vuln is fatal; (b) isn't **safe to run** on customer code/binaries; or (c) they
can't **trust/buy** — auth, tenancy, SOC 2. So:

```
correctness → safe-to-run wedge → buyable platform → compounding moat → scale
```

Long-lead items (SOC 2, design partners) start early even though they finish late.

## Current state (grounded, 2026-06-25)

- ✅ Real black-box scanning (TLS/SSH/mail + CT-log discovery).
- ✅ White-box discover→triage path now runs (discover driven by `semgrep-core`
  directly; the `semgrep` CLI hangs on slow-FS hosts). Languages: Python/JS/TS/Go.
- ✅ Strong, benchmarked binary tier (Go/C/Windows; Rust in-flight in a parallel
  session, uncommitted).
- 🟡 "Moat" layers are stubs: `reason.py` = path-keyword heuristics; `est_time_to_break`
  = literature-range placeholder; remediation PRs are non-compiling stubs and the
  differential test is unimplemented.
- 🟡 Triage LLM (local 7B) over-suppresses true positives (recall risk).
- ❌ No real auth/multi-tenancy/RBAC, no eval harness for source/triage, no CBOM,
  no sandboxing of untrusted inputs, binary tier not wired into the API/state machine.

---

## Phase 0 — Correctness foundation (de-risk the core)

*No customers yet; everything below depends on this. ~4–6 weeks.*

| Workstream | Size | Why |
|---|---|---|
| **Eval harness + labeled corpora** across all surfaces (source/binary/network), measured **precision/recall**, CI gates on regression | L | A scanner lives or dies on recall. `binary_bench` exists; there is nothing for source/triage. Cheapest thing that de-risks every downstream claim. |
| **Fix triage recall** — LLM may only *downgrade with high confidence*; deterministic heuristics are the floor; golden set + measured P/R | M | False negatives are existential. Triage currently hides real vulns (killed the k8s CA key). |
| **Honest moat columns** — implement a defensible `time_to_break` (the QEC edge) or label it a range; mark reachability "heuristic" until Phase 3 | S | Don't ship a fake reachability/horizon to buyers who will probe it. |
| **DB migrations tooling** (Alembic) — replace inline `ALTER TABLE IF EXISTS`; versioned schema | S | Foundation for multi-tenancy and every future column. |

**Exit:** you can quote a real P/R per surface, regressions are caught in CI, and
triage no longer drops true positives.

---

## Phase 1 — Sellable wedge: trustworthy inventory + CBOM, safe to run

*What a design partner needs to point this at their real estate. ~6–10 weeks.*

| Workstream | Size | Why |
|---|---|---|
| **CBOM / CycloneDX** crypto-properties export + **standards mapping** (CNSA 2.0, FIPS 203/204/205, NIST SP 1800-38) | M | The concrete artifact enterprises buy and hand to auditors. Missing today. |
| **Source coverage: Java + .NET** (then C/C++ source) | L | Non-negotiable for enterprise; today only Python/JS/TS/Go. |
| **Config/IaC + key/cert inventory** — TLS configs, k8s Secrets/cert-manager, cloud KMS/ACM, JWT/JWE algs, cert chains/expiry/sizes | L | Crypto risk lives in config and certs, not just code. |
| **Wire the binary tier into the API + state machine** + container-image/artifact scanning | M | Binary tier is excellent but standalone (scan modes are only `black_box`/`white_box`). The other session owns binary *coverage*; this is the *integration* — do it after they land Rust. |
| **Product security to run on customer assets** — sandbox untrusted binary/code parsing (gVisor/Firecracker/locked containers, no network), ephemeral clones + guaranteed deletion, secrets manager (kill the plaintext `.env` token), SSRF protection on scan targets, input hardening | L | You parse hostile binaries (LIEF/capstone) and customer source — RCE surface + data-trust gate. |
| **On-prem / self-hosted / VPC option** — "your code never leaves your perimeter" (local Ollama is a feature here) | M–L | Many enterprises will never send source to a SaaS. Differentiator, not just a checkbox. |
| **Reporting v1** — quantum-readiness score, exec summary, per-asset dossier | M | The output a CISO shows their board. |

**Exit:** a design partner safely scans their real source + binaries + network +
cloud, gets a trustworthy CBOM and ranked findings, in their environment.
**Start recruiting 2–3 design partners now (long lead).**

---

## Phase 2 — Buyable platform: multi-tenant, trusted, integrated

*Turn it into something an org can purchase and operate. ~8–12 weeks.*

| Workstream | Size | Build vs buy |
|---|---|---|
| **Real multi-tenancy** — row-level isolation, per-tenant segregation (today: get-or-create demo org) | L | Build |
| **AuthN/AuthZ** — SSO/SAML/OIDC, SCIM, MFA, RBAC (CISO/engineer/auditor), full **audit log** | L | **Buy** identity (WorkOS / Auth0) — don't build SSO/SCIM |
| **SCM integration done right** — GitHub/GitLab **App** (scoped OAuth, in-place PRs), not PAT+fork | M | Build |
| **CI/CD gates** — Actions/GitLab CI/Jenkins, pre-merge policy, **SARIF** output | M | Build |
| **Ticketing + comms** — Jira/ServiceNow, Slack/Teams, webhooks, public API + docs | M | Build |
| **Scale/reliability** — job queue + horizontal scan workers, **incremental (diff-only) scanning**, dedup/caching, LLM serving (per-finding LLM is the bottleneck), observability/SLOs, HA/DR/backups | XL | **Buy/adopt** Temporal + managed inference + managed Postgres |
| **Start SOC 2 Type II clock** + DPA/privacy/sub-processors/legal | M (+ months elapsed) | **Buy** Vanta/Drata |

**Exit:** a customer onboards with SSO, scans in their CI, gets findings into Jira,
and you can pass a security questionnaire. SOC 2 in progress.

---

## Phase 3 — The compounding moat (defensibility vs a generic code agent)

*Why you win and keep winning. ~quarter, overlaps Phase 2.*

| Workstream | Size | Why it's the moat |
|---|---|---|
| **Verified remediation** — real, *compilable*, **differentially-tested** migration PRs (or guided playbooks), hybrid-PQC patterns (X25519+ML-KEM); never author primitives | XL | Today the PR is a non-compiling stub and the differential test is unimplemented. Makes "Remediate→Verify red→green" real. |
| **Real reachability** — call-graph/dataflow on source ("present"→"reachable"); generalize the binary Tier-C idea to source | XL | The "Gap G1." This + data-sensitivity is what a generic code agent can't replicate. |
| **Quantum-horizon / time-to-break model** — the QEC resource-estimation edge, computed not stubbed | L | Your unique technical asset; the column nobody else has. |
| **System-of-record lifecycle** — drift detection, trend-over-time, scheduled re-scans, the design-partner data flywheel | L | Switching cost + compounding data advantage. |

**Exit:** closed-loop find→prioritize→remediate→verify on real customer code, with
reachability and a real horizon model — defensibly better than "Claude reviews my crypto."

---

## Phase 4 — Coverage breadth + GTM scale

*Growth, once the moat is real. Ongoing.*

- More languages/ecosystems (Rust source, Kotlin/Swift/PHP/Ruby), more cloud
  connectors, more protocols (IPsec, S/MIME, code-signing, DNSSEC, mTLS meshes).
- Stripped-Rust binary detection (residual gap flagged by the binary-tier session).
- Billing/metering, self-serve trial, marketplace listings; **FedRAMP** if chasing gov.
- Productized data flywheel (real-world findings corpus → better models → better detection).

---

## Parallel tracks & ownership

- **Core/platform track:** Phase 0 (eval/triage/migrations) → Phase 1 platform-security
  & CBOM → Phase 2/3.
- **Binary-tier coverage track (parallel session):** Rust now, then stripped-Rust,
  container scanning. Plan around it; the only shared touchpoint is Phase 1's
  "wire binary tier into API," done *after* Rust lands to avoid churn.
- **Frontend (Alan):** consumes the API contract; Phase 1/2 reporting work defines it.

## Start-now / long-lead (don't wait for a phase)

1. **Recruit 2–3 design partners** — validate Phase 1+ against real enterprise estates, not the sample app.
2. **Begin SOC 2** (Vanta/Drata) — months of evidence; start the clock before you need it.
3. **Rotate the GitHub token** that was pasted in chat (still in `backend/.env`).

## If you only do the next 3 things

1. **Eval harness + fix triage recall** (Phase 0) — cheapest, de-risks every claim.
2. **CBOM + Java/.NET coverage + safe-to-run hardening** (Phase 1) — the minimum a design partner can adopt.
3. **Recruit design partners + start SOC 2** in parallel — long-lead, gates everything commercial.
