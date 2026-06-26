import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import {
  Radar,
  Network,
  Layers,
  ShieldAlert,
  Search,
  Filter,
  Target,
  GitPullRequest,
  ShieldCheck,
  ArrowRight,
  Play,
  Eye,
  Code2,
} from "lucide-react";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AuroraBackground } from "@/components/marketing/AuroraBackground";
import { NetworkScan } from "@/components/marketing/NetworkScan";
import { AppWindow } from "@/components/marketing/AppWindow";
import { Reveal, Stagger, StaggerItem } from "@/components/marketing/Reveal";
import { SpotlightCard } from "@/components/marketing/SpotlightCard";
import { useStartDemo } from "@/lib/demo-auth";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How Aegis works — black-box and white-box quantum crypto scanning" },
      {
        name: "description",
        content:
          "Black-box: point Aegis at a domain and it reads the cryptography you expose to the internet — zero integration. White-box: connect a repo and it discovers, triages, prioritizes, proposes a migration PR, and verifies the fix.",
      },
      { property: "og:title", content: "How Aegis works" },
      {
        property: "og:description",
        content:
          "What the world can see, and what's inside your code — discover, prioritize, migrate, and prove it's fixed.",
      },
    ],
  }),
  component: HowItWorks,
});

const BLACKBOX = [
  {
    icon: Radar,
    title: "Probes your live endpoints",
    body: "TLS (HTTPS), SSH, and mail (SMTP STARTTLS) handshakes — read directly to capture the real key types, sizes, and ciphers actually in use.",
  },
  {
    icon: Network,
    title: "Discovers your shadow surface",
    body: "Enumerates Certificate Transparency logs and certificate SANs to surface forgotten subdomains and endpoints you didn't know were public.",
  },
  {
    icon: Layers,
    title: "Classifies every asset by quantum exposure",
    body: "Shor-broken (RSA, ECDSA, ECDH — fully breakable), Grover-weakened (symmetric crypto that needs larger keys), or already post-quantum-safe.",
  },
  {
    icon: ShieldAlert,
    title: "Flags the urgent stuff",
    body: "Endpoints with no forward secrecy and high Harvest-Now-Decrypt-Later risk — where traffic captured today can be decrypted once quantum hardware arrives.",
  },
];

const WHITEBOX = [
  {
    icon: Search,
    title: "Discover",
    body: "Scans your codebase (Python, JavaScript/TypeScript, Go) for quantum-vulnerable cryptography — e.g. RSA/EC key generation — and classical crypto misuse.",
  },
  {
    icon: Filter,
    title: "Triage",
    body: "Filters out false positives and noise so you see real, reachable risk — not a wall of irrelevant warnings.",
  },
  {
    icon: Target,
    title: "Prioritize",
    body: "Ranks findings by genuine business risk: how reachable the code is, how sensitive the data it protects, and how long that data must stay secret versus the quantum timeline.",
  },
  {
    icon: GitPullRequest,
    title: "Remediate",
    body: "Proposes safe, crypto-agile migration changes as a reviewable pull request — a proposal you approve. Aegis never silently rewrites your cryptography.",
  },
  {
    icon: ShieldCheck,
    title: "Verify",
    body: "Re-scans after the fix to confirm the vulnerability is gone — flipping the finding from red to green.",
  },
];

function HowItWorks() {
  const reduce = useReducedMotion();
  const startDemo = useStartDemo();

  return (
    <div className="relative min-h-screen text-foreground">
      <MarketingHeader />

      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-border bg-background pb-20 pt-36">
        <AuroraBackground />
        <div className="relative z-10 mx-auto max-w-5xl px-6">
          <Reveal>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <span className="h-px w-6 bg-primary/40" />
              How it works
            </div>
            <h1 className="mt-5 max-w-3xl text-balance text-4xl font-semibold leading-[1.06] tracking-tight md:text-5xl">
              Two ways to see your quantum risk — from the outside, and from the source.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Start with a black-box scan that needs nothing but a domain. Go deeper with a
              white-box scan that reads your code and helps you migrate — safely, with proof.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Black-box */}
      <section className="relative border-b border-border py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
            <div>
              <Reveal>
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  <Eye className="h-3.5 w-3.5" /> Black-box
                </div>
                <h2 className="mt-4 text-balance text-3xl font-semibold leading-[1.12] tracking-tight md:text-4xl">
                  Point it at a domain. Zero integration.
                </h2>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                  You give Aegis nothing but a domain name. It looks at your organization the way an
                  attacker would — from the outside — and inventories the cryptography you're
                  actually exposing to the internet.
                </p>
              </Reveal>
              <Stagger className="mt-8 space-y-3">
                {BLACKBOX.map((s) => (
                  <StaggerItem key={s.title}>
                    <Feature icon={s.icon} title={s.title} body={s.body} reduce={!!reduce} />
                  </StaggerItem>
                ))}
              </Stagger>
              <Reveal delay={0.1}>
                <p className="mt-6 text-sm font-medium text-foreground/85">
                  No agents, no code access, no setup — results in seconds. The fastest way to see
                  where you stand.
                </p>
              </Reveal>
            </div>
            <Reveal delay={0.05}>
              <AppWindow title="aegis · external discovery" live>
                <div className="relative h-[340px] overflow-hidden rounded-b-xl bg-foreground/[0.02]">
                  <NetworkScan />
                </div>
              </AppWindow>
            </Reveal>
          </div>
        </div>
      </section>

      {/* White-box */}
      <section className="relative border-b border-border py-24">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <Code2 className="h-3.5 w-3.5" /> White-box
            </div>
            <h2 className="mt-4 max-w-3xl text-balance text-3xl font-semibold leading-[1.12] tracking-tight md:text-4xl">
              Connect a repo. See the crypto in your code — and migrate it.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              When you grant repository access, Aegis goes deeper — into the source itself — and
              runs a closed loop.
            </p>
          </Reveal>

          {/* Animated beam stepper */}
          <div className="relative mt-12">
            <div className="pointer-events-none absolute bottom-8 left-[2.25rem] top-8 w-0.5 -translate-x-1/2 overflow-hidden rounded-full">
              <div className="absolute inset-0 bg-border" />
              <div
                className="motion-safe:animate-beam-travel absolute inset-x-0 h-16"
                style={{
                  background:
                    "linear-gradient(to bottom, transparent, var(--blue-electric), transparent)",
                }}
              />
            </div>
            <Stagger className="space-y-3">
              {WHITEBOX.map((s, i) => (
                <StaggerItem key={s.title}>
                  <div className="relative flex gap-5 rounded-xl p-3">
                    <div className="relative z-10 inline-flex h-12 w-12 shrink-0 items-center justify-center self-start rounded-lg bg-primary text-primary-foreground shadow-glow">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <div className="pt-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-semibold tabular-nums text-primary/50">
                          0{i + 1}
                        </span>
                        <h3 className="text-lg font-semibold tracking-tight">{s.title}</h3>
                      </div>
                      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                        {s.body}
                      </p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>

          <Reveal delay={0.1}>
            <p className="mt-8 text-sm font-medium text-foreground/85">
              The result is a living inventory of your cryptographic posture — discover, prioritize,
              fix, and prove it's fixed.
            </p>
          </Reveal>
        </div>
      </section>

      {/* One-line framing */}
      <section className="relative overflow-hidden py-24">
        <AuroraBackground intensity="ambient" />
        <div className="relative z-10 mx-auto max-w-6xl px-6">
          <Stagger className="grid gap-5 md:grid-cols-2">
            <StaggerItem>
              <SpotlightCard
                className="h-full rounded-2xl p-8"
                innerClassName="flex h-full flex-col"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-quantum-soft text-quantum-violet">
                  <Eye className="h-5 w-5" />
                </div>
                <h3 className="mt-6 text-xl font-semibold tracking-tight">Black-box</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  Shows what the world can see — your externally-exposed crypto, no integration
                  required.
                </p>
              </SpotlightCard>
            </StaggerItem>
            <StaggerItem>
              <SpotlightCard
                className="h-full rounded-2xl p-8 ring-1 ring-primary/25"
                innerClassName="flex h-full flex-col"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-quantum-soft text-quantum-violet">
                  <Code2 className="h-5 w-5" />
                </div>
                <h3 className="mt-6 text-xl font-semibold tracking-tight">White-box</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  Shows what's inside your code — and helps you migrate it, safely, with proof.
                </p>
              </SpotlightCard>
            </StaggerItem>
          </Stagger>

          <Reveal delay={0.1} className="mt-12 text-center">
            <button
              type="button"
              onClick={startDemo}
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-[var(--shadow-sm)] transition-colors hover:bg-primary/90"
            >
              <Play className="h-4 w-4" /> Explore the live demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <p className="mt-4 text-xs text-muted-foreground">
              Migration is always a proposal you review — Aegis never silently rewrites your crypto.
            </p>
          </Reveal>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
  reduce,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  reduce: boolean;
}) {
  return (
    <motion.div
      whileHover={reduce ? undefined : { x: 4 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="flex gap-4 rounded-lg border border-transparent p-3 transition-colors hover:border-border hover:bg-accent/40"
    >
      <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-quantum-soft text-quantum-violet">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </motion.div>
  );
}
