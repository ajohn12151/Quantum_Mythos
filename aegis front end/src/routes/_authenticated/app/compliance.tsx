import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, Download, FileText, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { Stagger, StaggerItem } from "@/components/marketing/Reveal";
import { useCountUp } from "@/hooks/use-count-up";
import { mandates, type Mandate } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/app/compliance")({
  component: CompliancePage,
});

const statusMeta: Record<Mandate["status"], { label: string; cls: string }> = {
  met: { label: "Met", cls: "status-pqc" },
  on_track: { label: "On track", cls: "status-pqc" },
  at_risk: { label: "At risk", cls: "status-shor" },
};

function CompliancePage() {
  const overall = Math.round(mandates.reduce((s, m) => s + m.progress, 0) / mandates.length);
  return (
    <>
      <PageHeader
        eyebrow="Mandate"
        title="Compliance & audit"
        description="Every mandate starts with a cryptographic inventory. Aegis tracks migration progress against each framework and exports auditor-ready proof on demand."
        action={
          <button
            onClick={() => toast.success("CBOM (CycloneDX) + audit PDF queued for export.")}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[var(--shadow-sm)] transition-colors hover:bg-primary/90"
          >
            <Download className="h-4 w-4" /> Export evidence
          </button>
        }
      />
      <div className="space-y-6 px-8 py-8">
        <Overview overall={overall} />
        <Stagger immediate className="grid gap-5 lg:grid-cols-2">
          {mandates.map((m) => (
            <StaggerItem key={m.id}>
              <MandateCard m={m} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </>
  );
}

function Overview({ overall }: { overall: number }) {
  const n = useCountUp(overall, { duration: 900 });
  const met = mandates.filter((m) => m.status !== "at_risk").length;
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
              Overall readiness
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-4xl font-semibold tabular-nums">{n}%</span>
              <span className="text-sm text-muted-foreground">
                across {mandates.length} mandates · {met} on track
              </span>
            </div>
          </div>
        </div>
        <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted sm:w-64">
          <motion.div
            className="h-full rounded-full bg-quantum"
            initial={{ width: 0 }}
            animate={{ width: `${overall}%` }}
            transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
          />
        </div>
      </div>
    </div>
  );
}

function MandateCard({ m }: { m: Mandate }) {
  const meta = statusMeta[m.status];
  const done = m.controls.filter((c) => c.done).length;
  return (
    <div className="surface flex h-full flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-quantum-cyan" />
            <h3 className="font-display text-lg tracking-tight">{m.name}</h3>
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
            {m.authority} · {m.deadline}
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${meta.cls}`}
        >
          {meta.label}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{m.summary}</p>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
          <span>Migration progress</span>
          <span className="tabular-nums text-foreground">{m.progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full"
            style={{ background: m.status === "at_risk" ? "var(--shor)" : "var(--pqc)" }}
            initial={{ width: 0 }}
            whileInView={{ width: `${m.progress}%` }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
          />
        </div>
      </div>

      <div className="mt-5 space-y-2 border-t border-border pt-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Controls · {done}/{m.controls.length}
        </div>
        {m.controls.map((c) => (
          <div key={c.label} className="flex items-center gap-2.5 text-xs">
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                c.done ? "bg-pqc/15 text-pqc" : "border border-border text-transparent"
              }`}
            >
              <Check className="h-2.5 w-2.5" />
            </span>
            <span className={c.done ? "text-foreground/85" : "text-muted-foreground"}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
