import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Download, FileText, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { Stagger, StaggerItem } from "@/components/marketing/Reveal";
import { useCountUp } from "@/hooks/use-count-up";
import { useDashboard } from "@/hooks/useDashboard";

export const Route = createFileRoute("/_authenticated/app/compliance")({
  component: CompliancePage,
});

// Public PQC-migration frameworks. Per-control tracking is in development; the
// readiness number is derived honestly from the live inventory's quantum-safe share.
const FRAMEWORKS = [
  {
    name: "CNSA 2.0",
    authority: "NSA",
    summary: "Suite of quantum-resistant algorithms; phased adoption through 2033.",
  },
  {
    name: "NIST IR 8547",
    authority: "NIST",
    summary: "Transition to post-quantum cryptography standards across federal systems.",
  },
  {
    name: "FIPS 203 / 204 / 205",
    authority: "NIST (2024)",
    summary: "ML-KEM, ML-DSA, and SLH-DSA — the standardized post-quantum primitives.",
  },
];

function CompliancePage() {
  const { totals, live } = useDashboard();
  const coverage = totals.total > 0 ? Math.round((100 * totals.safe) / totals.total) : 0;
  return (
    <>
      <PageHeader
        eyebrow="Mandate"
        title="Compliance & audit"
        description="Every mandate starts with a cryptographic inventory. Aegis derives migration readiness from your live posture and (soon) exports auditor-ready proof."
        action={
          <button
            onClick={() => toast("Evidence export (CBOM + audit PDF) is coming soon.")}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Download className="h-4 w-4" /> Export evidence
          </button>
        }
      />
      <div className="space-y-6 px-8 py-8">
        {!live && (
          <div className="rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-xs text-muted-foreground">
            Showing sample data — backend not reachable.
          </div>
        )}
        <Overview coverage={coverage} safe={totals.safe} total={totals.total} />
        <Stagger immediate className="grid gap-5 lg:grid-cols-3">
          {FRAMEWORKS.map((f) => (
            <StaggerItem key={f.name}>
              <FrameworkCard f={f} coverage={coverage} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </>
  );
}

function Overview({ coverage, safe, total }: { coverage: number; safe: number; total: number }) {
  const n = useCountUp(coverage, { duration: 900 });
  return (
    <div className="card-premium gradient-border relative overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-quantum-violet/15 blur-3xl" />
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-quantum-soft text-quantum-violet">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Quantum-safe coverage
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-4xl font-semibold tabular-nums">{n}%</span>
              <span className="text-sm text-muted-foreground">
                {safe} of {total} assets quantum-safe
              </span>
            </div>
          </div>
        </div>
        <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted sm:w-64">
          <motion.div
            className="h-full rounded-full bg-quantum"
            initial={{ width: 0 }}
            animate={{ width: `${coverage}%` }}
            transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
          />
        </div>
      </div>
    </div>
  );
}

function FrameworkCard({ f, coverage }: { f: (typeof FRAMEWORKS)[number]; coverage: number }) {
  return (
    <div className="surface flex h-full flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-quantum-cyan" />
            <h3 className="font-display text-lg tracking-tight">{f.name}</h3>
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{f.authority}</div>
        </div>
        <span className="shrink-0 rounded-full border border-border bg-muted px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Tracking soon
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.summary}</p>

      <div className="mt-auto pt-5">
        <div className="mb-1.5 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
          <span>Quantum-safe coverage</span>
          <span className="tabular-nums text-foreground">{coverage}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full"
            style={{ background: coverage >= 50 ? "var(--pqc)" : "var(--shor)" }}
            initial={{ width: 0 }}
            whileInView={{ width: `${coverage}%` }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
          />
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          Readiness derived from your live inventory. Per-control mapping is in development.
        </p>
      </div>
    </div>
  );
}
