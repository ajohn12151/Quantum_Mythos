import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
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
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main className="mx-auto max-w-7xl px-6 pt-32 pb-24">
        <div className="text-center">
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-quantum-cyan">
            Pricing
          </div>
          <h1 className="mx-auto mt-3 max-w-3xl text-balance text-5xl font-semibold leading-tight tracking-tight">
            Start free. Move to continuous when you're ready.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Every tier ships with the same reasoning engine. You choose the surface.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
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
        </div>

        <ComparisonTable />
      </main>
      <MarketingFooter />
    </div>
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
      className={`surface relative flex flex-col p-7 ${
        highlight ? "border-quantum-cyan/45 glow-cyan" : ""
      }`}
    >
      {highlight && (
        <div className="absolute -top-3 left-7 rounded-full bg-quantum px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary-foreground">
          Most popular
        </div>
      )}
      <div>
        <div className="text-sm font-medium text-muted-foreground">{name}</div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-4xl font-semibold tracking-tight">{price}</span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
        <div className="mt-1 text-sm text-muted-foreground">{sub}</div>
      </div>
      <ul className="mt-6 flex-1 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-foreground/90">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-pqc" />
            {f}
          </li>
        ))}
      </ul>
      <Link
        to={href}
        className={`mt-8 inline-flex h-10 items-center justify-center rounded-md text-sm font-medium transition-transform hover:scale-[1.01] ${
          highlight
            ? "bg-quantum text-primary-foreground shadow-glow"
            : "border border-border bg-elevated-2 text-foreground hover:border-quantum-cyan/40"
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
    <div className="mt-20">
      <h2 className="text-2xl font-semibold tracking-tight">Compare</h2>
      <div className="surface mt-6 overflow-hidden">
        <div className="grid grid-cols-[1.6fr_0.8fr_0.8fr_0.8fr] border-b border-border bg-elevated-2 px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <div>Feature</div><div>Free</div><div>Team</div><div>Enterprise</div>
        </div>
        {rows.map(([label, a, b, c]) => (
          <div
            key={label}
            className="grid grid-cols-[1.6fr_0.8fr_0.8fr_0.8fr] items-center border-b border-border px-5 py-3.5 last:border-b-0"
          >
            <div className="text-sm">{label}</div>
            <Cell v={a} /><Cell v={b} /><Cell v={c} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Cell({ v }: { v: boolean | string }) {
  if (typeof v === "string")
    return <div className="font-mono text-xs text-foreground/90">{v}</div>;
  return v ? (
    <Check className="h-4 w-4 text-pqc" />
  ) : (
    <Minus className="h-4 w-4 text-muted-foreground/50" />
  );
}
