import { createFileRoute } from "@tanstack/react-router";
import { MotionConfig } from "framer-motion";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Reveal, Stagger, StaggerItem } from "@/components/marketing/Reveal";
import { Search, ListChecks, GitPullRequest, ShieldCheck, Globe, Code2 } from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How Aegis works — Discover, Prioritize, Remediate, Verify" },
      {
        name: "description",
        content:
          "A closed-loop platform that finds quantum-vulnerable cryptography, ranks it by real business risk, and helps you migrate — black-box from the perimeter and white-box from source.",
      },
      { property: "og:title", content: "How Aegis works" },
      {
        property: "og:description",
        content:
          "Discover, prioritize, remediate, verify. Black-box and white-box quantum cryptographic posture.",
      },
    ],
  }),
  component: HowItWorks,
});

function HowItWorks() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-background">
        <MarketingHeader />
        <main className="mx-auto max-w-5xl px-6 pt-36 pb-28">
          <Reveal>
            <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <span className="h-px w-6 bg-border" />
              How it works
            </div>
            <h1 className="mt-5 max-w-3xl text-balance text-4xl font-semibold leading-[1.08] tracking-tight md:text-5xl">
              A continuous loop for quantum cryptographic posture.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Aegis runs four phases continuously across every asset you own — externally exposed,
              and deep in source. Each finding carries a verifiable rationale.
            </p>
          </Reveal>

          <Stagger className="mt-16 space-y-4">
            <StaggerItem>
              <Step
                n="01"
                icon={Search}
                title="Discover"
                body="Black-box reads TLS, SSH, and SMTP STARTTLS handshakes and enumerates Certificate Transparency logs to surface forgotten subdomains. White-box parses your source, dependencies, and lockfiles into a CBOM."
              />
            </StaggerItem>
            <StaggerItem>
              <Step
                n="02"
                icon={ListChecks}
                title="Prioritize"
                body="Every asset is classified into one of three buckets — Shor-broken (replace), Grover-weakened (increase key size), or PQC-ready (safe) — and scored by reachability × data-confidentiality-lifetime × quantum time-to-break (Mosca / HNDL)."
              />
            </StaggerItem>
            <StaggerItem>
              <Step
                n="03"
                icon={GitPullRequest}
                title="Remediate"
                body="Aegis pulls vulnerable call-sites behind a swappable CryptoProvider interface and opens a migration PR to a verified post-quantum primitive (ML-KEM / ML-DSA hybrid). Every PR includes a differential test and size assertion."
              />
            </StaggerItem>
            <StaggerItem>
              <Step
                n="04"
                icon={ShieldCheck}
                title="Verify"
                body="Re-scan, watch the asset flip from red to green, and export auditor-ready proof. The loop never closes — crypto debt accrues continuously, so Aegis scans continuously."
              />
            </StaggerItem>
          </Stagger>

          <Stagger className="mt-24 grid gap-5 md:grid-cols-2">
            <StaggerItem>
              <BoxCard
                icon={Globe}
                title="Black-box"
                body="Externally observable cryptography. No integration, no agent, no source. Best for first signal and continuous perimeter monitoring."
              />
            </StaggerItem>
            <StaggerItem>
              <BoxCard
                icon={Code2}
                title="White-box"
                body="Repository, dependency, and runtime context. Best for migration planning, audit, and safely-bounded automated PRs."
              />
            </StaggerItem>
          </Stagger>
        </main>
        <MarketingFooter />
      </div>
    </MotionConfig>
  );
}

function Step({
  n,
  icon: Icon,
  title,
  body,
}: {
  n: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="surface flex items-start gap-6 p-7 sm:gap-8">
      <div className="flex shrink-0 flex-col items-center gap-3">
        <span className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-muted-foreground/50">
          {n}
        </span>
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-secondary text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="pt-0.5">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function BoxCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="card-premium lift p-7">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-quantum-soft text-quantum-violet">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-6 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
