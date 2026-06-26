import { createFileRoute, Link } from "@tanstack/react-router";
import { MotionConfig } from "framer-motion";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Reveal, Stagger, StaggerItem } from "@/components/marketing/Reveal";
import { Check, Minus } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Aegis" },
      {
        name: "description",
        content:
          "Free external scans, continuous monitoring for teams, and full white-box quantum migration for enterprise.",
      },
      { property: "og:title", content: "Aegis Pricing" },
      {
        property: "og:description",
        content: "Free wedge, team monitoring, and enterprise white-box migration.",
      },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-background">
        <MarketingHeader />
        <main className="mx-auto max-w-7xl px-6 pt-36 pb-28">
          <Reveal className="text-center">
            <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <span className="h-px w-6 bg-border" />
              Pricing
              <span className="h-px w-6 bg-border" />
            </div>
            <h1 className="mx-auto mt-5 max-w-3xl text-balance text-4xl font-semibold leading-[1.08] tracking-tight md:text-5xl">
              Start free. Move to continuous when you're ready.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Every tier ships with the same reasoning engine. You choose the surface.
            </p>
          </Reveal>

          <Stagger className="mt-16 grid items-start gap-6 lg:grid-cols-3">
            <StaggerItem>
              <Tier
                name="Free wedge"
                price="$0"
                sub="Single domain · on-demand"
                cta="Run a scan"
                href="/signup"
                features={[
                  "Type a domain → external quantum-risk report",
                  "TLS / SSH / mail crypto inventory",
                  "CT-log subdomain enumeration",
                  "Shareable read-only report",
                ]}
              />
            </StaggerItem>
            <StaggerItem>
              <Tier
                name="Team"
                price="$1,500"
                unit="/mo"
                sub="Continuous external monitoring"
                cta="Start trial"
                href="/signup"
                highlight
                features={[
                  "Up to 25 monitored domains",
                  "Continuous re-scanning + change alerts",
                  "Full dashboard, posture-over-time, HNDL spotlight",
                  "Slack / email / webhook notifications",
                  "CSV + CBOM export",
                ]}
              />
            </StaggerItem>
            <StaggerItem>
              <Tier
                name="Enterprise"
                price="Custom"
                sub="White-box + remediation pipeline"
                cta="Contact us"
                href="#"
                features={[
                  "White-box repo scanning & CBOM (CycloneDX)",
                  "Reasoning engine + migration PRs",
                  "Compliance & audit module",
                  "SSO (SAML), API access, audit log",
                  "Dedicated post-quantum migration architect",
                ]}
              />
            </StaggerItem>
          </Stagger>

          <ComparisonTable />
        </main>
        <MarketingFooter />
      </div>
    </MotionConfig>
  );
}

function Tier({
  name,
  price,
  unit,
  sub,
  features,
  cta,
  href,
  highlight,
}: {
  name: string;
  price: string;
  unit?: string;
  sub: string;
  features: string[];
  cta: string;
  href: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`lift relative flex flex-col p-8 ${
        highlight
          ? "gradient-border rounded-xl shadow-[var(--shadow-card-lg)] lg:-mt-4 lg:mb-4"
          : "card-premium"
      }`}
    >
      {highlight && (
        <div className="absolute -top-3 left-8 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-primary-foreground shadow-[var(--shadow-sm)]">
          Most popular
        </div>
      )}
      <div>
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {name}
        </div>
        <div className="mt-4 flex items-baseline gap-1.5">
          <span className="text-4xl font-semibold tracking-tight">{price}</span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
        <div className="mt-2 text-sm text-muted-foreground">{sub}</div>
      </div>
      <ul className="mt-7 flex-1 space-y-3">
        {features.map((f) => (
          <li
            key={f}
            className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/90"
          >
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-pqc" />
            {f}
          </li>
        ))}
      </ul>
      <Link
        to={href}
        className={`mt-8 inline-flex h-11 items-center justify-center rounded-md text-sm font-medium transition-colors ${
          highlight
            ? "bg-primary text-primary-foreground shadow-[var(--shadow-sm)] hover:bg-primary/90"
            : "border border-border bg-elevated-2 text-foreground hover:bg-muted"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}

function ComparisonTable() {
  const rows: Array<[string, boolean | string, boolean | string, boolean | string]> = [
    ["Black-box domain scan", true, true, true],
    ["CT-log subdomain enumeration", true, true, true],
    ["Continuous re-scanning", false, true, true],
    ["Change alerts (Slack / email)", false, true, true],
    ["Posture-over-time dashboard", false, true, true],
    ["White-box repo scanning", false, false, true],
    ["Migration PRs (differential-tested)", false, false, true],
    ["CBOM export (CycloneDX)", false, true, true],
    ["Compliance & audit module", false, false, true],
    ["SSO (SAML)", false, false, true],
    ["API access", false, "Read", "Full"],
    ["Dedicated migration architect", false, false, true],
  ];
  return (
    <Reveal className="mt-28">
      <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Compare every tier</h2>
      <div className="surface mt-8 overflow-hidden">
        <div className="grid grid-cols-[1.6fr_0.8fr_0.8fr_0.8fr] border-b border-border bg-elevated-2 px-5 py-3.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          <div>Feature</div>
          <div>Free</div>
          <div>Team</div>
          <div>Enterprise</div>
        </div>
        {rows.map(([label, a, b, c]) => (
          <div
            key={label}
            className="grid grid-cols-[1.6fr_0.8fr_0.8fr_0.8fr] items-center border-b border-border px-5 py-3.5 last:border-b-0"
          >
            <div className="text-sm">{label}</div>
            <Cell v={a} />
            <Cell v={b} />
            <Cell v={c} />
          </div>
        ))}
      </div>
    </Reveal>
  );
}

function Cell({ v }: { v: boolean | string }) {
  if (typeof v === "string") return <div className="font-mono text-xs text-foreground/90">{v}</div>;
  return v ? (
    <Check className="h-4 w-4 text-pqc" />
  ) : (
    <Minus className="h-4 w-4 text-muted-foreground/50" />
  );
}
