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
  Play,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { QuantumBackground } from "@/components/marketing/QuantumBackground";
import { AuroraBackground } from "@/components/marketing/AuroraBackground";
import { PageBackdrop } from "@/components/marketing/PageBackdrop";
import { CursorGlow } from "@/components/marketing/CursorGlow";
import { TiltMedia } from "@/components/marketing/TiltMedia";
import { BentoFeatures } from "@/components/marketing/BentoFeatures";
import { AppWindow } from "@/components/marketing/AppWindow";
import { Marquee } from "@/components/marketing/Marquee";
import { Reveal, Stagger, StaggerItem } from "@/components/marketing/Reveal";
import { SpotlightCard } from "@/components/marketing/SpotlightCard";
import { ContactForm } from "@/components/marketing/ContactForm";
import { useCountUp } from "@/hooks/use-count-up";
import { useStartDemo } from "@/lib/demo-auth";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="bg-quantum fixed inset-x-0 top-0 z-[60] h-0.5 origin-left"
      style={{ scaleX: scrollYProgress }}
      aria-hidden
    />
  );
}

function HomePage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen text-foreground">
        <PageBackdrop />
        <ScrollProgress />
        <MarketingHeader />
        <Hero />
        <Stats />
        <Threat />
        <Tiers />
        <BentoFeatures />
        <Differentiator />
        <Migration />
        <Compliance />
        <Safety />
        <FAQ />
        <FinalCTA />
        <MarketingFooter />
      </div>
    </MotionConfig>
  );
}

/* ------------------------------- Sections -------------------------------- */

const HERO_LINES = [
  "$ aegis scan chase.com --ct --tls",
  "→ Resolving DNS                       ok",
  "→ TLS 1.3 handshake                   ok",
  "→ Reading certificate chain           ok",
  "→ Enumerating CT logs … 47 subdomains",
];

const HERO_FINDINGS = [
  { host: "chase.com", algo: "RSA-2048 · sha256WithRSA", status: "shor", label: "Shor-broken" },
  { host: "api.chase.com", algo: "ECDSA P-256 · X25519 KEX", status: "shor", label: "Shor-broken" },
  {
    host: "legacy-api.chase.com",
    algo: "RSA-2048 · no forward secrecy",
    status: "shor",
    label: "Critical · HNDL",
    critical: true,
  },
  { host: "vault.chase.com", algo: "ML-KEM-768 hybrid", status: "pqc", label: "PQC ready" },
] as const;

const heroStagger = {
  hide: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const heroItem = {
  hide: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.2, 0.7, 0.2, 1] as const } },
};

function Hero() {
  const startDemo = useStartDemo();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yFront = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const yBack = useTransform(scrollYProgress, [0, 1], [0, -130]);
  const mediaOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);
  const reduce = useReducedMotion();

  return (
    <section ref={ref} className="relative isolate overflow-hidden bg-background pb-40 pt-36">
      {/* Signature "Frosted aura" — drifting aurora + particle field + cursor glow */}
      <AuroraBackground />
      <QuantumBackground />
      <CursorGlow />
      {/* Readability scrim: softens the aurora under the headline/copy column so
          text always keeps its contrast (sits above effects, below content). */}
      <div
        aria-hidden
        className="text-scrim pointer-events-none absolute inset-y-0 left-0 -z-[5] w-full lg:w-[62%]"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-14 lg:grid-cols-[1.04fr_1fr]">
          <motion.div variants={heroStagger} initial={reduce ? "show" : "hide"} animate="show">
            <h1 className="text-balance text-5xl font-semibold leading-[1.02] tracking-tight md:text-[4.25rem]">
              <motion.span variants={heroItem} className="block">
                See the cryptography
              </motion.span>
              <motion.span variants={heroItem} className="text-gradient-animated block">
                quantum will break
              </motion.span>
              <motion.span variants={heroItem} className="block">
                — before someone harvests it.
              </motion.span>
            </h1>
            <motion.p
              variants={heroItem}
              className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground"
            >
              Aegis maps your quantum-vulnerable encryption, ranks it by real business risk, and
              helps you migrate — starting with a single domain, no integration required.
            </motion.p>

            <motion.div
              variants={heroItem}
              className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <button
                type="button"
                onClick={startDemo}
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-[var(--shadow-sm)] transition-colors hover:bg-primary/90"
              >
                <Play className="h-4 w-4" /> Explore the live demo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <Link
                to="/how-it-works"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-border bg-card/70 px-5 text-sm font-medium text-foreground backdrop-blur transition-colors hover:bg-accent/60"
              >
                See how it works
              </Link>
            </motion.div>
            <motion.p variants={heroItem} className="mt-4 text-xs text-muted-foreground">
              Live in your browser · no signup, no integration.
            </motion.p>
          </motion.div>

          {/* Layered, parallaxed product windows */}
          <motion.div style={{ opacity: mediaOpacity }} className="relative">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
              style={{ y: yBack }}
              className="pointer-events-none absolute -right-4 -top-12 hidden w-[78%] opacity-70 blur-[1px] lg:block"
            >
              <AppWindow title="aegis · posture" icon={false}>
                <HeroDashboardSlice />
              </AppWindow>
            </motion.div>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 28, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
              style={{ y: yFront }}
              className="relative"
            >
              <TiltMedia>
                <AppWindow title="aegis · external scan" live glow>
                  <HeroScanDemo />
                </AppWindow>
              </TiltMedia>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HeroScanDemo() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const total = HERO_LINES.length + HERO_FINDINGS.length;

  useEffect(() => {
    if (reduce) {
      setStep(total + 6);
      return;
    }
    const id = setInterval(() => setStep((s) => (s >= total + 6 ? 0 : s + 1)), 650);
    return () => clearInterval(id);
  }, [reduce, total]);

  const linesShown = Math.min(step, HERO_LINES.length);
  const findingsShown = Math.max(0, Math.min(step - HERO_LINES.length, HERO_FINDINGS.length));

  return (
    <>
      <div className="space-y-1 px-4 py-4 font-mono text-[13px] leading-relaxed">
        {HERO_LINES.map((l, i) => {
          const on = i < linesShown;
          return (
            <div
              key={i}
              className={`flex items-center transition-all duration-300 ${
                on ? "opacity-100" : "translate-x-[-6px] opacity-0"
              } ${i === 0 ? "text-muted-foreground" : "text-foreground/80"}`}
            >
              {l}
              {on && i === linesShown - 1 && linesShown < HERO_LINES.length && (
                <span className="ml-1 inline-block h-3.5 w-1.5 animate-pulse bg-quantum-cyan" />
              )}
            </div>
          );
        })}
      </div>
      <div className="border-t border-border px-4 py-4">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Findings
        </div>
        <div className="space-y-2">
          {HERO_FINDINGS.map((f, i) => (
            <div
              key={f.host}
              className={`transition-all duration-500 ${
                i < findingsShown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
              }`}
            >
              <FindingRow
                host={f.host}
                algo={f.algo}
                status={f.status}
                label={f.label}
                critical={"critical" in f ? f.critical : undefined}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function HeroDashboardSlice() {
  const bars = [
    { label: "Shor-broken", v: 72, c: "var(--shor)" },
    { label: "Grover-weakened", v: 18, c: "var(--grover)" },
    { label: "Quantum-safe", v: 41, c: "var(--pqc)" },
  ];
  return (
    <div className="space-y-3 p-5">
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Posture · last 90 days
        </div>
        <div className="font-mono text-2xl font-semibold tabular-nums text-foreground">59</div>
      </div>
      {bars.map((b) => (
        <div key={b.label}>
          <div className="mb-1 flex justify-between font-mono text-[10px] text-muted-foreground">
            <span>{b.label}</span>
            <span className="tabular-nums">{b.v}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-elevated-2">
            <div className="h-full rounded-full" style={{ width: `${b.v}%`, background: b.c }} />
          </div>
        </div>
      ))}
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
  const reduce = useReducedMotion();
  const cards = [
    {
      icon: Lock,
      title: "Shor's algorithm breaks all public-key crypto",
      body: "RSA, ECDSA, ECDH, Diffie–Hellman — the math under every TLS handshake, SSH key, VPN, and code-signing certificate. A quantum computer doesn't weaken it; it breaks it outright.",
    },
    {
      icon: Clock,
      title: "Harvest now, decrypt later",
      body: "Adversaries are recording your encrypted traffic today to decrypt the moment the hardware exists. Anything with a long secrecy lifetime — health, finance, IP, credentials — is already exposed.",
    },
    {
      icon: Activity,
      title: "Your crypto is broadcast on the wire",
      body: "Every handshake advertises its key type and size. Aegis reads that exposure the way an attacker would — from the outside, no agent, no code, no permission — in seconds.",
    },
  ];
  return (
    <section className="relative border-t border-border py-28">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <SectionEyebrow>The threat, stated precisely</SectionEyebrow>
          <h2 className="mt-4 max-w-3xl text-balance text-3xl font-semibold leading-[1.12] tracking-tight md:text-4xl">
            Three facts you can take to the CISO.
          </h2>
        </Reveal>
        <Stagger className="mt-14 grid gap-5 md:grid-cols-3">
          {cards.map((c, i) => (
            <StaggerItem key={c.title}>
              <SpotlightCard className="h-full rounded-xl p-7">
                <div className="flex items-center justify-between">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-quantum-soft text-quantum-violet">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <span className="font-display text-3xl font-semibold tabular-nums text-primary/25">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-semibold tracking-tight">{c.title}</h3>
                <motion.div
                  className="mt-2.5 h-0.5 rounded-full bg-gradient-to-r from-primary to-transparent"
                  initial={reduce ? { width: "2.25rem" } : { width: 0 }}
                  whileInView={{ width: "2.25rem" }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1], delay: 0.1 * i }}
                />
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal className="surface mt-6 p-7" delay={0.1}>
          <div className="flex items-start gap-3.5">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-quantum-violet" />
            <p className="text-sm leading-relaxed text-foreground/85">
              <span className="font-medium text-foreground">Plain language.</span> Breaking the
              crypto means an attacker can decrypt recorded sessions and impersonate your servers —
              it collapses the communications and identity trust layer. It is not a shell into your
              systems. We claim exactly that, and nothing more.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------- Tiers --------------------------------- */

function Tiers() {
  return (
    <section className="relative overflow-hidden border-t border-border py-28">
      <AuroraBackground intensity="ambient" />
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <SectionEyebrow>Two tiers</SectionEyebrow>
          <h2 className="mt-4 max-w-3xl text-balance text-3xl font-semibold leading-[1.12] tracking-tight md:text-4xl">
            Start from the outside. Go all the way to source.
          </h2>
        </Reveal>
        <Stagger className="mt-14 grid items-start gap-6 lg:grid-cols-2">
          <StaggerItem>
            <TierCard
              icon={Globe}
              tag="Live in seconds"
              title="Black-box"
              sub="Perimeter · zero integration"
              body="Point it at a domain. Aegis inspects TLS, SSH, and mail certificates, enumerates Certificate Transparency logs to surface forgotten subdomains, flags everything quantum will break, and catches endpoints with no forward secrecy — in seconds."
              bullets={[
                "TLS / SSH / SMTP STARTTLS handshakes",
                "Certificate Transparency enumeration",
                "Forward-secrecy & HNDL detection",
              ]}
            />
          </StaggerItem>
          <StaggerItem>
            <TierCard
              icon={Code2}
              tag="The reasoning engine"
              title="White-box"
              sub="Repo access · enterprise depth"
              body="Connect a repository. Aegis finds quantum-vulnerable crypto and classical misuse — hardcoded keys, reused nonces, weak RNG — reasons about which findings actually matter, and proposes review-gated migration pull requests you approve."
              bullets={[
                "Source + dependency CBOM (CycloneDX)",
                "Reachability + business-risk reasoning",
                "Differential-tested migration PRs",
              ]}
              accent
            />
          </StaggerItem>
        </Stagger>
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
    <SpotlightCard
      className={`h-full rounded-xl p-8 ${
        accent ? "shadow-[var(--shadow-card-lg)] ring-1 ring-primary/25" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-quantum-soft text-quantum-violet">
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-full border border-border bg-elevated-2 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {tag}
        </span>
      </div>
      <h3 className="mt-7 text-2xl font-semibold tracking-tight">{title}</h3>
      <div className="mt-1.5 text-sm text-muted-foreground">{sub}</div>
      <p className="mt-4 text-sm leading-relaxed text-foreground/85">{body}</p>
      <ul className="mt-6 space-y-2.5">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2.5 text-sm text-foreground/85">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pqc" /> {b}
          </li>
        ))}
      </ul>
    </SpotlightCard>
  );
}

/* ------------------------------ Differentiator --------------------------- */

function Differentiator() {
  const reduce = useReducedMotion();
  const rows = [
    {
      host: "legacy-api.chase.com",
      algo: "RSA-2048 · no FS",
      reach: "Public",
      life: "10y",
      break: "~2032",
      score: 96,
      sev: "shor" as const,
    },
    {
      host: "api.chase.com",
      algo: "ECDSA P-256",
      reach: "Public",
      life: "5y",
      break: "~2033",
      score: 81,
      sev: "shor" as const,
    },
    {
      host: "internal-ci.chase.com",
      algo: "ssh-rsa",
      reach: "VPN",
      life: "3y",
      break: "~2034",
      score: 54,
      sev: "shor" as const,
    },
    {
      host: "vault.chase.com",
      algo: "ML-KEM-768 hybrid",
      reach: "Public",
      life: "10y",
      break: "post-2050",
      score: 8,
      sev: "pqc" as const,
    },
  ];
  return (
    <section className="relative border-t border-border py-28">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <SectionEyebrow>The differentiator</SectionEyebrow>
          <h2 className="mt-4 max-w-3xl text-balance text-3xl font-semibold leading-[1.12] tracking-tight md:text-4xl">
            Inventory is table stakes.{" "}
            <span className="text-gradient">Reasoning is the product.</span>
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Every finding is ranked by{" "}
            <span className="font-mono text-base text-foreground/90">
              reachability × data-confidentiality-lifetime × quantum time-to-break
            </span>{" "}
            (Mosca / HNDL). Time-to-break is grounded in quantum fault-tolerance resource estimation
            — not vibes.
          </p>
        </Reveal>

        <Reveal className="surface mt-12 overflow-hidden" delay={0.05}>
          <div className="grid grid-cols-[1.6fr_1.2fr_0.8fr_0.7fr_0.9fr_0.7fr] gap-4 border-b border-border bg-elevated-2 px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <div>Asset</div>
            <div>Crypto</div>
            <div>Reach</div>
            <div>Life</div>
            <div>TTB</div>
            <div className="text-right">Priority</div>
          </div>
          {rows.map((r) => (
            <div
              key={r.host}
              className="grid grid-cols-[1.6fr_1.2fr_0.8fr_0.7fr_0.9fr_0.7fr] items-center gap-4 border-b border-border px-5 py-3.5 last:border-b-0"
            >
              <div className="truncate font-mono text-sm">{r.host}</div>
              <div className="truncate font-mono text-xs text-muted-foreground">{r.algo}</div>
              <div className="text-xs text-foreground/85">{r.reach}</div>
              <div className="font-mono text-xs text-foreground/85">{r.life}</div>
              <div className="font-mono text-xs text-foreground/85">{r.break}</div>
              <div className="flex items-center justify-end gap-2">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-elevated-2">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background:
                        r.sev === "pqc"
                          ? "var(--pqc)"
                          : r.score > 75
                            ? "var(--shor)"
                            : "var(--grover)",
                    }}
                    initial={reduce ? { width: `${r.score}%` } : { width: 0 }}
                    whileInView={{ width: `${r.score}%` }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
                  />
                </div>
                <CountUpOnView
                  to={r.score}
                  className="w-8 text-right font-mono text-xs tabular-nums"
                />
              </div>
            </div>
          ))}
        </Reveal>
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
    <section className="relative border-t border-border py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <SectionEyebrow>Why migration is hard</SectionEyebrow>
            <h2 className="mt-4 text-balance text-3xl font-semibold leading-[1.12] tracking-tight md:text-4xl">
              PQC keys and signatures are <span className="text-gradient">4–50× larger</span>.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              These sizes silently break deployed TLS, DNSSEC, and PKI. Aegis reasons about the
              breakage before you ship it — handshake-size budgets, MTU edges, certificate-chain
              fragmentation, and protocol negotiation.
            </p>
          </Reveal>
          <Stagger className="surface grid grid-cols-2 gap-px overflow-hidden bg-border">
            {stats.map((s) => (
              <StaggerItem key={s.l} className="bg-elevated p-7">
                <div
                  className="font-mono text-3xl font-semibold tracking-tight"
                  style={{ color: s.c }}
                >
                  {s.v}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{s.l}</div>
              </StaggerItem>
            ))}
          </Stagger>
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
    <section className="relative border-t border-border py-28">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <SectionEyebrow>The mandate</SectionEyebrow>
          <h2 className="mt-4 max-w-3xl text-balance text-3xl font-semibold leading-[1.12] tracking-tight md:text-4xl">
            Every mandate starts with a cryptographic inventory.
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Aegis is the inventory, the prioritization, and the audit-ready proof of migration.
          </p>
        </Reveal>
      </div>
      <Reveal className="mt-12" delay={0.1}>
        <Marquee durationSec={38}>
          {chips.map((c) => (
            <span
              key={c}
              className="glass inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium text-foreground/85"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              {c}
            </span>
          ))}
        </Marquee>
      </Reveal>
    </section>
  );
}

/* --------------------------------- Safety -------------------------------- */

function Safety() {
  return (
    <section className="relative border-t border-border py-28">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="gradient-border relative overflow-hidden rounded-xl p-10 shadow-[var(--shadow-card-lg)] md:p-12">
          <div className="pointer-events-none absolute inset-0 bg-quantum-soft opacity-40" />
          <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:gap-7">
            <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-quantum text-primary-foreground shadow-glow">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <SectionEyebrow>Trust</SectionEyebrow>
              <h3 className="mt-3 text-balance text-2xl font-semibold tracking-tight md:text-3xl">
                Aegis never lets an AI author your cryptography.
              </h3>
              <p className="mt-4 max-w-2xl leading-relaxed text-foreground/85">
                Migration PRs only swap call-sites to verified post-quantum libraries. Every PR is
                gated by an automatic differential test and human review. The AI does the agility
                refactor; the primitive comes from a verified library.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------- Final CTA ----------------------------- */

function FinalCTA() {
  const startDemo = useStartDemo();
  return (
    <section className="relative isolate overflow-hidden border-t border-border py-28">
      <AuroraBackground />
      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
        <Reveal>
          <h2 className="max-w-md text-balance text-4xl font-semibold leading-[1.08] tracking-tight md:text-5xl">
            See your quantum exposure for yourself.
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
            Click through the full product on live demo data — every screen, no signup. Or tell us
            about your stack and we'll take it from there.
          </p>
          <button
            type="button"
            onClick={startDemo}
            className="group mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-[var(--shadow-sm)] transition-colors hover:bg-primary/90"
          >
            <Play className="h-4 w-4" /> Explore the live demo
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </Reveal>
        <Reveal delay={0.08}>
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------- Stats --------------------------------- */

// Real, sourced figures — not illustrative placeholders. Sources in comments.
const STATS: { to?: number; suffix?: string; static?: string; label: string }[] = [
  // NIST IR 8547: RSA/ECDSA/ECDH/DH deprecated after 2030, DISALLOWED after 2035 (federal).
  { to: 2035, label: "the year NIST disallows RSA & ECDSA in federal systems (IR 8547)" },
  // Egele et al. found 88% of Android apps using crypto misuse it; broader studies report 85–99%.
  {
    to: 88,
    suffix: "%",
    label: "of apps that use cryptography misuse it — real, fixable bugs almost everywhere",
  },
  // FIPS 203/204: ML-DSA-65 signature 3,309 B vs ECDSA P-256 ~64 B (~50×); ML-KEM-768 key 1,184 B.
  {
    static: "4–50×",
    label:
      "larger post-quantum keys & signatures — why migration silently breaks TLS, DNSSEC & PKI",
  },
  // No cryptographically-relevant quantum computer exists today; credible estimates land in the 2030s.
  {
    to: 0,
    label:
      "quantum computers can break RSA today — which is exactly why the time to migrate is now",
  },
];

function Stats() {
  return (
    <section className="relative border-t border-border py-16">
      <div className="mx-auto max-w-7xl px-6">
        <Stagger className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {STATS.map((s) => (
            <StaggerItem key={s.label} className="text-center lg:text-left">
              <div className="font-display text-4xl font-semibold tracking-tight tabular-nums text-foreground md:text-5xl">
                {s.static ? (
                  <span>{s.static}</span>
                ) : (
                  <>
                    <CountUpOnView to={s.to ?? 0} />
                    {s.suffix && <span className="text-gradient">{s.suffix}</span>}
                  </>
                )}
              </div>
              <div className="mx-auto mt-3 max-w-[16rem] text-sm leading-snug text-muted-foreground lg:mx-0">
                {s.label}
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ---------------------------------- FAQ ---------------------------------- */

const FAQS = [
  {
    q: "Does Aegis need access to my systems or code?",
    a: "No. The black-box scan reads only what your servers already broadcast — TLS, SSH, and mail certificates, plus public Certificate Transparency logs. Point it at a domain and you get a posture report in seconds, with zero integration. White-box repo analysis is an optional, deeper tier.",
  },
  {
    q: "Can a quantum computer break my encryption today?",
    a: "Not today — no cryptographically-relevant quantum computer exists yet, and credible estimates put one in the 2030s. The urgency is “harvest now, decrypt later”: an adversary records your encrypted traffic now and decrypts it once the hardware arrives. Anything with a long secrecy lifetime is already exposed.",
  },
  {
    q: "What exactly does breaking the crypto let an attacker do?",
    a: "It collapses the communications and identity trust layer — decrypting recorded sessions and impersonating your servers. It is not a shell into your systems or databases; those sit behind separate auth and segmentation. We claim exactly that, and nothing more.",
  },
  {
    q: "Isn't this just another cryptographic inventory?",
    a: "Inventory is table stakes. Aegis's product is the reasoning: it ranks every finding by reachability × data-confidentiality-lifetime × quantum time-to-break, so you fix what actually matters first — then proposes review-gated migration PRs and verifies the fix.",
  },
  {
    q: "How is this different from a general AI coding agent on my repo?",
    a: "A general agent can read your code. What it can't do is model when RSA-2048 becomes a liability, reason about which data flows through a cipher and how long it must stay secret, or act as a continuous system-of-record that proves migration progress to an auditor. Prioritizing your migration by what an adversary is recording today to break in the 2030s isn't a code-reading problem — it's a threat-horizon and data-governance one.",
  },
  {
    q: "Do you let an AI rewrite my cryptography?",
    a: "Never. A migration is always a pull request you review. Aegis only swaps the call-site to a verified post-quantum library — it never authors or alters a cryptographic primitive — and every PR is gated by an automatic differential test plus human approval.",
  },
];

function FAQ() {
  return (
    <section className="relative border-t border-border py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.9fr_1.4fr]">
        <Reveal>
          <SectionEyebrow>Questions</SectionEyebrow>
          <h2 className="mt-4 text-balance text-3xl font-semibold leading-[1.12] tracking-tight md:text-4xl">
            Straight answers, no hype.
          </h2>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-muted-foreground">
            Precision is the product. If a claim can't survive a CISO's scrutiny, we don't make it.
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((f, i) => (
              <AccordionItem key={f.q} value={`faq-${i}`} className="border-border">
                <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
      <span className="h-px w-6 bg-primary/40" />
      {children}
    </div>
  );
}

function CountUpOnView({ to, className }: { to: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const n = useCountUp(to, { start: inView });
  return (
    <span ref={ref} className={className}>
      {n}
    </span>
  );
}
