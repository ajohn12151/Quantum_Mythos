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
        <Loop />
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
  const [domain, setDomain] = useState("");
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

            <motion.form
              variants={heroItem}
              onSubmit={(e) => {
                e.preventDefault();
                window.location.href = `/signup?domain=${encodeURIComponent(domain)}`;
              }}
              className="mt-9 flex max-w-lg flex-col gap-3 sm:flex-row"
            >
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="yourdomain.com"
                  className="h-12 w-full rounded-md border border-border bg-card pl-10 pr-3 font-mono text-sm text-foreground shadow-[var(--shadow-xs)] transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Domain to scan"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-sm)] transition-colors hover:bg-primary/90"
              >
                Run a free external scan
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.form>
            <motion.div
              variants={heroItem}
              className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground"
            >
              <button
                type="button"
                onClick={startDemo}
                className="group inline-flex items-center gap-1.5 font-medium text-primary transition-colors hover:text-primary/80"
              >
                <Play className="h-3.5 w-3.5" /> Explore the live demo
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </button>
              <Link
                to="/how-it-works"
                className="inline-flex items-center gap-1 font-medium text-foreground transition-colors hover:text-primary"
              >
                See how it works <ArrowRight className="h-3 w-3" />
              </Link>
              <span className="font-mono">No integration · results in ~10s</span>
            </motion.div>
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
  const cards = [
    {
      icon: Lock,
      title: "Shor breaks asymmetric crypto",
      body: "RSA, ECDSA, ECDH, EdDSA — the math under every TLS handshake, SSH key, and code-signing certificate.",
    },
    {
      icon: Clock,
      title: "Harvest now, decrypt later",
      body: "Adversaries record encrypted traffic today and decrypt it once a quantum computer exists. Long-secrecy data is already at risk.",
    },
    {
      icon: Activity,
      title: "It announces itself",
      body: "Cryptography is broadcast in every handshake. Aegis measures your exposure from the outside, in seconds, with zero integration.",
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
          {cards.map((c) => (
            <StaggerItem key={c.title}>
              <SpotlightCard className="h-full rounded-xl p-7">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-quantum-soft text-quantum-violet">
                  <c.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-6 text-lg font-semibold tracking-tight">{c.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
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

/* ----------------------------- The 4-step loop --------------------------- */

const LOOP_STEPS = [
  {
    icon: Search,
    title: "Discover",
    body: "Externally, then in source. TLS, SSH, mail, CT logs, and code.",
  },
  {
    icon: ListChecks,
    title: "Prioritize",
    body: "Rank by reachability × secrecy lifetime × time-to-break.",
  },
  {
    icon: GitPullRequest,
    title: "Remediate",
    body: "Open safely-bounded migration pull requests.",
  },
  { icon: ShieldCheck, title: "Verify", body: "Re-scan. Watch red flip to green. Audit-ready." },
];

function Loop() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const i = Math.min(LOOP_STEPS.length - 1, Math.max(0, Math.floor(p * LOOP_STEPS.length)));
    setActive(i);
  });

  return (
    <section ref={ref} className="relative border-t border-border" style={{ height: "320vh" }}>
      <div className="sticky top-0 flex min-h-screen items-center overflow-hidden py-24">
        <div className="mx-auto w-full max-w-7xl px-6">
          <Reveal>
            <SectionEyebrow>How it works</SectionEyebrow>
            <h2 className="mt-4 max-w-3xl text-balance text-3xl font-semibold leading-[1.12] tracking-tight md:text-4xl">
              A closed loop, not a one-shot report.
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Crypto debt accrues continuously — so Aegis does too. Scroll the loop.
            </p>
          </Reveal>

          <div className="mt-12 grid items-center gap-10 lg:grid-cols-2">
            <ol className="relative space-y-3">
              {/* Animated beam rail flowing through the step nodes */}
              <div className="pointer-events-none absolute bottom-7 left-[2.6rem] top-7 w-0.5 -translate-x-1/2">
                <div className="absolute inset-0 rounded-full bg-border" />
                <div
                  className="animate-beam-glow absolute inset-x-0 top-0 rounded-full bg-gradient-to-b from-[var(--blue-electric)] to-[var(--quantum-cyan)] shadow-[0_0_18px_3px_var(--blue-electric)] transition-[height] duration-500 ease-out"
                  style={{ height: `${(active / (LOOP_STEPS.length - 1)) * 100}%` }}
                />
                <div className="absolute inset-0 overflow-hidden rounded-full">
                  <div
                    className="animate-beam-travel absolute inset-x-0 h-16"
                    style={{
                      background:
                        "linear-gradient(to bottom, transparent, var(--blue-electric), transparent)",
                    }}
                  />
                </div>
              </div>
              {LOOP_STEPS.map((s, i) => {
                const on = i === active;
                return (
                  <li key={s.title}>
                    <div
                      className={`relative flex gap-4 rounded-xl border p-5 transition-all duration-300 ${
                        on
                          ? "glass border-primary/40 shadow-[var(--shadow-card)]"
                          : "border-transparent opacity-45"
                      }`}
                    >
                      <div
                        className={`relative z-10 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md transition-colors ${
                          on
                            ? "bg-primary text-primary-foreground shadow-glow"
                            : "bg-secondary text-primary"
                        }`}
                      >
                        <s.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold tabular-nums text-muted-foreground/60">
                            0{i + 1}
                          </span>
                          <h3 className="text-lg font-semibold tracking-tight">{s.title}</h3>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {s.body}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="relative lg:pl-4">
              <AppWindow
                title={`aegis · ${LOOP_STEPS[active].title.toLowerCase()}`}
                live={active === 0}
              >
                <div className="min-h-[280px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={active}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
                    >
                      <LoopMedia step={active} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </AppWindow>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LoopMedia({ step }: { step: number }) {
  if (step === 0) {
    return (
      <div className="space-y-1.5 p-5 font-mono text-[12.5px] leading-relaxed">
        <div className="text-muted-foreground">$ aegis scan acme.com --ct --tls</div>
        <div className="text-foreground/80">→ 412 subdomains via CT logs</div>
        <div className="text-foreground/80">→ probing TLS · SSH · STARTTLS …</div>
        <div className="mt-3 space-y-2">
          <FindingRow
            host="checkout.acme.com"
            algo="ECDSA P-256"
            status="shor"
            label="Shor-broken"
          />
          <FindingRow host="vault.acme.com" algo="RSA-4096" status="shor" label="Shor-broken" />
        </div>
      </div>
    );
  }
  if (step === 1) {
    const rows = [
      { host: "legacy-sso.acme.com", score: 98, sev: "shor" as const },
      { host: "checkout.acme.com", score: 91, sev: "shor" as const },
      { host: "otel.acme.internal", score: 44, sev: "grover" as const },
    ];
    return (
      <div className="space-y-2.5 p-5">
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Ranked by reachability × lifetime × time-to-break
        </div>
        {rows.map((r, i) => (
          <div key={r.host} className="flex items-center gap-3">
            <span className="font-mono text-sm font-semibold tabular-nums text-muted-foreground/60">
              0{i + 1}
            </span>
            <span className="flex-1 truncate font-mono text-[12.5px]">{r.host}</span>
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-elevated-2">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${r.score}%`,
                  background: r.sev === "shor" ? "var(--shor)" : "var(--grover)",
                }}
              />
            </div>
            <span className="w-7 text-right font-mono text-xs tabular-nums">{r.score}</span>
          </div>
        ))}
      </div>
    );
  }
  if (step === 2) {
    return (
      <div className="p-5 font-mono text-[12px] leading-relaxed">
        <div className="mb-3 flex items-center gap-2 text-muted-foreground">
          <GitPullRequest className="h-3.5 w-3.5 text-primary" />
          PR #1284 · crypto-agility: jwt signing
        </div>
        <div className="space-y-0.5 rounded-md border border-border bg-elevated-2/60 p-3">
          <div className="text-shor">- signer := ecdsa.New(P256, key)</div>
          <div className="text-pqc">+ signer := pqc.Hybrid(ML_DSA_65, ecdsaKey)</div>
          <div className="mt-2 text-muted-foreground">✓ differential test · round-trip ok</div>
          <div className="text-muted-foreground">✓ size assertion · 3309 B within budget</div>
        </div>
        <div className="mt-3 text-pqc">awaiting human review →</div>
      </div>
    );
  }
  return <VerifyBars />;
}

function VerifyBars() {
  const reduce = useReducedMotion();
  const [fixed, setFixed] = useState(false);
  useEffect(() => {
    if (reduce) {
      setFixed(true);
      return;
    }
    const id = setTimeout(() => setFixed(true), 350);
    return () => clearTimeout(id);
  }, [reduce]);
  const rows = ["legacy-sso.acme.com", "checkout.acme.com", "api.acme.com", "vault.acme.com"];
  return (
    <div className="space-y-3 p-5">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>Re-scan after migration</span>
        <span className="tabular-nums">
          broken <span className={fixed ? "text-pqc" : "text-shor"}>{fixed ? "0" : "27"}</span> / 27
        </span>
      </div>
      {rows.map((host, i) => (
        <div key={host} className="flex items-center gap-3">
          <span className="flex-1 truncate font-mono text-[12.5px]">{host}</span>
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-elevated-2">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: fixed ? "100%" : "82%",
                background: fixed ? "var(--pqc)" : "var(--shor)",
                transitionDelay: `${i * 90}ms`,
              }}
            />
          </div>
          <span
            className={`w-16 text-right font-mono text-[10px] uppercase tracking-wider transition-colors duration-500 ${
              fixed ? "text-pqc" : "text-shor"
            }`}
            style={{ transitionDelay: `${i * 90}ms` }}
          >
            {fixed ? "PQC" : "broken"}
          </span>
        </div>
      ))}
    </div>
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
          </StaggerItem>
          <StaggerItem>
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
        <span className="rounded-full border border-border bg-elevated-2 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
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
          <div className="grid grid-cols-[1.6fr_1.2fr_0.8fr_0.7fr_0.9fr_0.7fr] gap-4 border-b border-border bg-elevated-2 px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
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
              className="glass inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 font-mono text-xs text-foreground/85"
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
  const [domain, setDomain] = useState("");
  return (
    <section className="relative isolate overflow-hidden border-t border-border py-28">
      <AuroraBackground />
      <Reveal className="mx-auto max-w-5xl px-6 text-center">
        <h2 className="mx-auto max-w-3xl text-balance text-4xl font-semibold leading-[1.08] tracking-tight md:text-5xl">
          Find out what quantum will break in your stack.
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = `/signup?domain=${encodeURIComponent(domain)}`;
          }}
          className="mx-auto mt-10 flex max-w-xl flex-col gap-3 sm:flex-row"
        >
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="yourdomain.com"
            className="h-12 flex-1 rounded-md border border-border bg-card px-4 font-mono text-sm shadow-[var(--shadow-xs)] transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Domain to scan"
          />
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-sm)] transition-colors hover:bg-primary/90"
          >
            Run free scan <ArrowRight className="h-4 w-4" />
          </button>
        </form>
        <div className="mt-5">
          <a
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            href="#"
          >
            or talk to us →
          </a>
        </div>
      </Reveal>
    </section>
  );
}

/* --------------------------------- Stats --------------------------------- */

function Stats() {
  const stats = [
    { to: 47, suffix: "", label: "shadow subdomains a first scan typically surfaces", mono: true },
    { to: 10, suffix: "s", label: "to a full external posture report", mono: false },
    { to: 100, suffix: "%", label: "of asymmetric crypto Shor breaks outright", mono: false },
    { to: 2030, suffix: "", label: "NIST deadline for high-risk systems", mono: true },
  ];
  return (
    <section className="relative border-t border-border py-16">
      <div className="mx-auto max-w-7xl px-6">
        <Stagger className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {stats.map((s) => (
            <StaggerItem key={s.label} className="text-center lg:text-left">
              <div className="font-display text-4xl font-semibold tracking-tight tabular-nums text-foreground md:text-5xl">
                <CountUpOnView to={s.to} className="" />
                {s.suffix && <span className="text-gradient">{s.suffix}</span>}
              </div>
              <div className="mx-auto mt-3 max-w-[15rem] text-sm leading-snug text-muted-foreground lg:mx-0">
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
    a: "Inventory is table stakes. Aegis's product is the reasoning: it ranks every finding by reachability × data-confidentiality-lifetime × quantum time-to-break, so you fix what actually matters first — then opens safely-bounded migration PRs and verifies the fix.",
  },
  {
    q: "Do you let an AI rewrite my cryptography?",
    a: "Never. Migration PRs only swap call-sites to verified post-quantum libraries. The AI does the agility refactor; the primitive comes from a vetted library, and every PR is gated by an automatic differential test and human review.",
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
    <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-primary">
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
