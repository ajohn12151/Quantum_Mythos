import { createFileRoute } from "@tanstack/react-router";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
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
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main className="mx-auto max-w-5xl px-6 pt-32 pb-24">
        <div className="font-mono text-xs uppercase tracking-[0.18em] text-quantum-cyan">
          How it works
        </div>
        <h1 className="mt-3 text-balance text-5xl font-semibold leading-tight tracking-tight">
          A continuous loop for quantum cryptographic posture.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Aegis runs four phases continuously across every asset you own — externally exposed, and
          deep in source. Each finding carries a verifiable rationale.
        </p>

        <div className="mt-14 space-y-5">
          <Step
            n="01"
            icon={Search}
            title="Discover"
            body="Black-box reads TLS, SSH, and SMTP STARTTLS handshakes and enumerates Certificate Transparency logs to surface forgotten subdomains. White-box parses your source, dependencies, and lockfiles into a CBOM."
          />
          <Step
            n="02"
            icon={ListChecks}
            title="Prioritize"
            body="Every asset is classified into one of three buckets — Shor-broken (replace), Grover-weakened (increase key size), or PQC-ready (safe) — and scored by reachability × data-confidentiality-lifetime × quantum time-to-break (Mosca / HNDL)."
          />
          <Step
            n="03"
            icon={GitPullRequest}
            title="Remediate"
            body="Aegis pulls vulnerable call-sites behind a swappable CryptoProvider interface and opens a migration PR to a verified post-quantum primitive (ML-KEM / ML-DSA hybrid). Every PR includes a differential test and size assertion."
          />
          <Step
            n="04"
            icon={ShieldCheck}
            title="Verify"
            body="Re-scan, watch the asset flip from red to green, and export auditor-ready proof. The loop never closes — crypto debt accrues continuously, so Aegis scans continuously."
          />
        </div>

        <div className="mt-20 grid gap-5 md:grid-cols-2">
          <BoxCard
            icon={Globe}
            title="Black-box"
            body="Externally observable cryptography. No integration, no agent, no source. Best for first signal and continuous perimeter monitoring."
          />
          <BoxCard
            icon={Code2}
            title="White-box"
            body="Repository, dependency, and runtime context. Best for migration planning, audit, and safely-bounded automated PRs."
          />
        </div>
      </main>
      <MarketingFooter />
    </div>
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
    <div className="surface flex gap-6 p-7">
      <div className="flex flex-col items-center gap-3">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-quantum text-primary-foreground shadow-glow-cyan">
          <Icon className="h-5 w-5" />
        </div>
        <span className="font-mono text-xs text-muted-foreground">{n}</span>
      </div>
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
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
    <div className="surface p-7">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-quantum-soft text-quantum-cyan">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
