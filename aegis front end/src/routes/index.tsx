import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Search,
  ListChecks,
  GitPullRequest,
  ShieldCheck,
  Globe,
  Code2,
  Terminal,
  Activity,
  Lock,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { QuantumBackground } from "@/components/marketing/QuantumBackground";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aegis — Quantum cryptographic posture management" },
      {
        name: "description",
        content:
          "Aegis maps your quantum-vulnerable encryption, ranks it by real business risk, and helps you migrate — starting with a single domain, no integration required.",
      },
      { property: "og:title", content: "Aegis — Quantum cryptographic posture management" },
      {
        property: "og:description",
        content:
          "See the cryptography quantum will break — before someone harvests it. Discover, prioritize, remediate, verify.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <Hero />
      <Threat />
      <Loop />
      <Tiers />
      <Differentiator />
      <Migration />
      <Compliance />
      <Safety />
      <FinalCTA />
      <MarketingFooter />
    </div>
  );
}

/* ------------------------------- Sections -------------------------------- */

function Hero() {
  const [domain, setDomain] = useState("");
  return (
    <section className="relative isolate overflow-hidden pt-32 pb-24">
      <QuantumBackground />
      <div className="absolute inset-0 -z-10 dot-bg opacity-30" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-elevated/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-quantum-cyan shadow-glow-cyan animate-pulse-glow" />
              Post-quantum readiness, measured.
            </div>
            <h1 className="mt-6 text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              See the cryptography{" "}
              <span className="text-gradient">quantum will break</span> — before someone harvests it.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Aegis maps your quantum-vulnerable encryption, ranks it by real business risk, and
              helps you migrate — starting with a single domain, no integration required.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                // Phase 1 — route to signup with intent.
                window.location.href = `/signup?domain=${encodeURIComponent(domain)}`;
              }}
              className="mt-8 flex max-w-lg flex-col gap-3 sm:flex-row"
            >
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="yourdomain.com"
                  className="h-12 w-full rounded-md border border-border bg-elevated/80 pl-10 pr-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-quantum-cyan focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Domain to scan"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-quantum px-5 text-sm font-medium text-primary-foreground shadow-glow transition-transform hover:scale-[1.02]"
              >
                Run a free external scan
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <Link to="/how-it-works" className="inline-flex items-center gap-1 hover:text-foreground">
                See how it works <ArrowRight className="h-3 w-3" />
              </Link>
              <span className="font-mono">No signup required to see results.</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          >
            <HeroScanCard />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HeroScanCard() {
  const lines = [
    { t: "$ aegis scan chase.com", c: "text-muted-foreground" },
    { t: "→ Resolving DNS                              ok", c: "text-foreground/80" },
    { t: "→ TLS 1.3 handshake                          ok", c: "text-foreground/80" },
    { t: "→ Reading certificate chain                  ok", c: "text-foreground/80" },
    { t: "→ Enumerating CT logs (47 subdomains)        ok", c: "text-foreground/80" },
  ];
  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 bg-quantum-soft blur-3xl" />
      <div className="surface overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border bg-elevated-2 px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-shor/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-grover/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-pqc/70" />
          </div>
          <div className="ml-2 inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <Terminal className="h-3 w-3" /> aegis · external scan
          </div>
          <div className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-pqc animate-pulse-glow" /> live
          </div>
        </div>
        <div className="space-y-1 px-4 py-4 font-mono text-[13px] leading-relaxed">
          {lines.map((l, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.18 }}
              className={l.c}
            >
              {l.t}
            </motion.div>
          ))}
        </div>
        <div className="border-t border-border px-4 py-4">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Findings
          </div>
          <div className="space-y-2">
            <FindingRow
              host="chase.com"
              algo="RSA-2048 · sha256WithRSA"
              status="shor"
              label="Shor-broken"
            />
            <FindingRow
              host="api.chase.com"
              algo="ECDSA P-256 · X25519 KEX"
              status="shor"
              label="Shor-broken"
            />
            <FindingRow
              host="legacy-api.chase.com"
              algo="RSA-2048 · no forward secrecy"
              status="shor"
              label="Critical · HNDL"
              critical
            />
            <FindingRow
              host="vault.chase.com"
              algo="ML-KEM-768 hybrid · X25519"
              status="pqc"
              label="PQC ready"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FindingRow({
  host,
  algo,
  status,
  label,
  critical,
}: {
  host: string;
  algo: string;
  status: "shor" | "grover" | "pqc";
  label: string;
  critical?: boolean;
}) {
  const cls =
    status === "shor" ? "status-shor" : status === "grover" ? "status-grover" : "status-pqc";
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-elevated-2/60 px-3 py-2.5">
      <div className="min-w-0">
        <div className="truncate font-mono text-[13px] text-foreground">{host}</div>
        <div className="truncate font-mono text-[11px] text-muted-foreground">{algo}</div>
      </div>
      <div
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider ${cls}`}
      >
        {critical && <AlertTriangle className="h-3 w-3" />}
        {label}
      </div>
    </div>
  );
}

/* --------------------------------- Threat -------------------------------- */

function Threat() {
  const cards = [
    {
      icon: Lock,
      title: "Shor breaks asymmetric crypto",
      body:
        "RSA, ECDSA, ECDH, EdDSA — the math under every TLS handshake, SSH key, and code-signing certificate.",
    },
    {
      icon: Clock,
      title: "Harvest now, decrypt later",
      body:
        "Adversaries record encrypted traffic today and decrypt it once a quantum computer exists. Long-secrecy data is already at risk.",
    },
    {
      icon: Activity,
      title: "It announces itself",
      body:
        "Cryptography is broadcast in every handshake. Aegis measures your exposure from the outside, in seconds, with zero integration.",
    },
  ];
  return (
    <section className="relative border-t border-border py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionEyebrow>The threat, stated precisely</SectionEyebrow>
        <h2 className="mt-3 max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-tight">
          Three facts you can take to the CISO.
        </h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {cards.map((c) => (
            <div key={c.title} className="surface group p-6 transition-all hover:border-quantum-cyan/40">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-quantum-soft text-quantum-cyan">
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>

        <div className="surface mt-8 p-6">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-quantum-cyan" />
            <p className="text-sm leading-relaxed text-foreground/85">
              <span className="font-medium text-foreground">Plain language.</span> Breaking the
              crypto means an attacker can decrypt recorded sessions and impersonate your servers —
              it collapses the communications and identity trust layer. It is not a shell into your
              systems. We claim exactly that, and nothing more.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- The 4-step loop --------------------------- */

function Loop() {
  const steps = [
    { icon: Search, title: "Discover", body: "Externally, then in source. TLS, SSH, mail, CT logs, and code." },
    { icon: ListChecks, title: "Prioritize", body: "Rank by reachability × secrecy lifetime × time-to-break." },
    { icon: GitPullRequest, title: "Remediate", body: "Open safely-bounded migration pull requests." },
    { icon: ShieldCheck, title: "Verify", body: "Re-scan. Watch red flip to green. Audit-ready." },
  ];
  return (
    <section className="relative border-t border-border py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionEyebrow>How it works</SectionEyebrow>
        <h2 className="mt-3 max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-tight">
          A closed loop, not a one-shot report.
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Crypto debt accrues continuously. Aegis runs continuously.
        </p>
        <div className="relative mt-14">
          <div className="absolute left-0 right-0 top-9 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" />
          <ol className="grid gap-6 md:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="relative">
                <div className="surface flex h-full flex-col p-6">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-quantum text-primary-foreground shadow-glow-cyan">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- Tiers --------------------------------- */

function Tiers() {
  return (
    <section className="relative border-t border-border py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionEyebrow>Two tiers</SectionEyebrow>
        <h2 className="mt-3 max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-tight">
          Start from the outside. Go all the way to source.
        </h2>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <TierCard
            icon={Globe}
            tag="Live in 10 seconds"
            title="Black-box"
            sub="Perimeter · zero integration"
            body="Point it at a domain. Aegis inspects TLS, SSH, and mail certificates, enumerates Certificate Transparency logs to surface forgotten subdomains, flags everything quantum will break, and catches endpoints with no forward secrecy — in seconds."
            bullets={[
              "TLS / SSH / SMTP STARTTLS handshakes",
              "Certificate Transparency enumeration",
              "Forward-secrecy & HNDL detection",
            ]}
          />
          <TierCard
            icon={Code2}
            tag="The reasoning engine"
            title="White-box"
            sub="Repo access · enterprise depth"
            body="Connect a repository. Aegis finds quantum-vulnerable crypto and classical misuse — hardcoded keys, reused nonces, weak RNG — reasons about which findings actually matter, and opens safely-bounded migration pull requests."
            bullets={[
              "Source + dependency CBOM (CycloneDX)",
              "Reachability + business-risk reasoning",
              "Differential-tested migration PRs",
            ]}
            accent
          />
        </div>
      </div>
    </section>
  );
}

function TierCard({
  icon: Icon,
  tag,
  title,
  sub,
  body,
  bullets,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  title: string;
  sub: string;
  body: string;
  bullets: string[];
  accent?: boolean;
}) {
  return (
    <div
      className={`surface relative overflow-hidden p-8 ${
        accent ? "border-quantum-violet/35" : ""
      }`}
    >
      {accent && (
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-quantum-violet/15 blur-3xl" />
      )}
      <div className="flex items-center justify-between">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-quantum-soft text-quantum-cyan">
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-full border border-border bg-elevated-2 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {tag}
        </span>
      </div>
      <h3 className="mt-6 text-2xl font-semibold tracking-tight">{title}</h3>
      <div className="mt-1 text-sm text-muted-foreground">{sub}</div>
      <p className="mt-4 text-sm leading-relaxed text-foreground/85">{body}</p>
      <ul className="mt-6 space-y-2">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-foreground/85">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pqc" /> {b}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------ Differentiator --------------------------- */

function Differentiator() {
  const rows = [
    { host: "legacy-api.chase.com", algo: "RSA-2048 · no FS", reach: "Public", life: "10y", break: "~2032", score: 96, sev: "shor" as const },
    { host: "api.chase.com", algo: "ECDSA P-256", reach: "Public", life: "5y", break: "~2033", score: 81, sev: "shor" as const },
    { host: "internal-ci.chase.com", algo: "ssh-rsa", reach: "VPN", life: "3y", break: "~2034", score: 54, sev: "shor" as const },
    { host: "vault.chase.com", algo: "ML-KEM-768 hybrid", reach: "Public", life: "10y", break: "post-2050", score: 8, sev: "pqc" as const },
  ];
  return (
    <section className="relative border-t border-border py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionEyebrow>The differentiator</SectionEyebrow>
        <h2 className="mt-3 max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-tight">
          Inventory is table stakes. <span className="text-gradient">Reasoning is the product.</span>
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Every finding is ranked by{" "}
          <span className="font-mono text-foreground/90">
            reachability × data-confidentiality-lifetime × quantum time-to-break
          </span>{" "}
          (Mosca / HNDL). Time-to-break is grounded in quantum fault-tolerance resource estimation —
          not vibes.
        </p>

        <div className="surface mt-10 overflow-hidden">
          <div className="grid grid-cols-[1.6fr_1.2fr_0.8fr_0.7fr_0.9fr_0.7fr] gap-4 border-b border-border bg-elevated-2 px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <div>Asset</div><div>Crypto</div><div>Reach</div><div>Life</div><div>TTB</div><div className="text-right">Priority</div>
          </div>
          {rows.map((r) => (
            <div key={r.host} className="grid grid-cols-[1.6fr_1.2fr_0.8fr_0.7fr_0.9fr_0.7fr] items-center gap-4 border-b border-border px-5 py-3.5 last:border-b-0">
              <div className="truncate font-mono text-sm">{r.host}</div>
              <div className="truncate font-mono text-xs text-muted-foreground">{r.algo}</div>
              <div className="text-xs text-foreground/85">{r.reach}</div>
              <div className="font-mono text-xs text-foreground/85">{r.life}</div>
              <div className="font-mono text-xs text-foreground/85">{r.break}</div>
              <div className="flex items-center justify-end gap-2">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-elevated-2">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${r.score}%`,
                      background:
                        r.sev === "pqc"
                          ? "var(--pqc)"
                          : r.score > 75
                          ? "var(--shor)"
                          : "var(--grover)",
                    }}
                  />
                </div>
                <span className="w-8 text-right font-mono text-xs tabular-nums">{r.score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- Migration ------------------------------- */

function Migration() {
  const stats = [
    { v: "1,184 B", l: "ML-KEM-768 pubkey", c: "var(--quantum-cyan)" },
    { v: "3,309 B", l: "ML-DSA-65 signature", c: "var(--quantum-violet)" },
    { v: "256 B", l: "RSA-2048 pubkey", c: "var(--muted-foreground)" },
    { v: "64 B", l: "ECDSA P-256 sig", c: "var(--muted-foreground)" },
  ];
  return (
    <section className="relative border-t border-border py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionEyebrow>Why migration is hard</SectionEyebrow>
            <h2 className="mt-3 text-balance text-4xl font-semibold leading-tight tracking-tight">
              PQC keys and signatures are <span className="text-gradient">4–50× larger</span>.
            </h2>
            <p className="mt-4 max-w-xl text-muted-foreground">
              These sizes silently break deployed TLS, DNSSEC, and PKI. Aegis reasons about the
              breakage before you ship it — handshake-size budgets, MTU edges, certificate-chain
              fragmentation, and protocol negotiation.
            </p>
          </div>
          <div className="surface grid grid-cols-2 gap-px overflow-hidden bg-border">
            {stats.map((s) => (
              <div key={s.l} className="bg-elevated p-6">
                <div className="font-mono text-3xl font-semibold tracking-tight" style={{ color: s.c }}>
                  {s.v}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- Compliance ------------------------------ */

function Compliance() {
  const chips = [
    "NIST FIPS 203 (ML-KEM)",
    "NIST FIPS 204 (ML-DSA)",
    "NIST FIPS 205 (SLH-DSA)",
    "NIST IR 8547 — RSA/ECDSA disallowed after 2035",
    "OMB M-23-02",
    "NSA CNSA 2.0",
    "EU PQC roadmap",
  ];
  return (
    <section className="relative border-t border-border py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionEyebrow>The mandate</SectionEyebrow>
        <h2 className="mt-3 max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-tight">
          Every mandate starts with a cryptographic inventory.
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Aegis is the inventory, the prioritization, and the audit-ready proof of migration.
        </p>
        <div className="mt-10 flex flex-wrap gap-2">
          {chips.map((c) => (
            <span
              key={c}
              className="rounded-full border border-border bg-elevated px-3.5 py-1.5 font-mono text-xs text-foreground/85"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- Safety -------------------------------- */

function Safety() {
  return (
    <section className="relative border-t border-border py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="surface relative overflow-hidden p-10">
          <div className="pointer-events-none absolute inset-0 bg-quantum-soft opacity-50" />
          <div className="relative flex items-start gap-5">
            <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-quantum text-primary-foreground shadow-glow">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <SectionEyebrow>Trust</SectionEyebrow>
              <h3 className="mt-2 text-balance text-2xl font-semibold tracking-tight md:text-3xl">
                Aegis never lets an AI author your cryptography.
              </h3>
              <p className="mt-3 max-w-2xl text-foreground/85">
                Migration PRs only swap call-sites to verified post-quantum libraries. Every PR is
                gated by an automatic differential test and human review. The AI does the agility
                refactor; the primitive comes from a verified library.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- Final CTA ----------------------------- */

function FinalCTA() {
  const [domain, setDomain] = useState("");
  return (
    <section className="relative border-t border-border py-24">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <h2 className="mx-auto max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          Find out what quantum will break in your stack.
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = `/signup?domain=${encodeURIComponent(domain)}`;
          }}
          className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"
        >
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="yourdomain.com"
            className="h-12 flex-1 rounded-md border border-border bg-elevated/80 px-4 font-mono text-sm placeholder:text-muted-foreground/60 focus:border-quantum-cyan focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Domain to scan"
          />
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-quantum px-5 text-sm font-medium text-primary-foreground shadow-glow transition-transform hover:scale-[1.02]"
          >
            Run free scan <ArrowRight className="h-4 w-4" />
          </button>
        </form>
        <div className="mt-4">
          <a className="text-sm text-muted-foreground hover:text-foreground" href="#">
            or talk to us →
          </a>
        </div>
      </div>
    </section>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-quantum-cyan">
      <span className="h-px w-6 bg-quantum-cyan/60" />
      {children}
    </div>
  );
}
