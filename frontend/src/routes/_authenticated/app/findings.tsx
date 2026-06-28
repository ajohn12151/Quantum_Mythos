import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertOctagon, ChevronRight, Lightbulb, ShieldX } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Stagger, StaggerItem } from "@/components/marketing/Reveal";
import { type Finding, type Severity } from "@/lib/mock-data";
import { useFindings } from "@/hooks/useFindings";

export const Route = createFileRoute("/_authenticated/app/findings")({ component: FindingsPage });

const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low"];
const sevColor: Record<Severity, string> = {
  critical: "var(--shor)",
  high: "var(--grover)",
  medium: "var(--quantum-cyan)",
  low: "var(--muted-foreground)",
};
type Filter = "all" | Severity;

function FindingsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [firstPartyOnly, setFirstPartyOnly] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const { rows: allFindings, live } = useFindings();

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: 0 };
    allFindings.forEach((f) => {
      if (firstPartyOnly && !f.firstParty) return;
      c.all++;
      c[f.severity] = (c[f.severity] ?? 0) + 1;
    });
    return c;
  }, [firstPartyOnly, allFindings]);

  const rows = useMemo(
    () =>
      allFindings
        .filter((f) => (firstPartyOnly ? f.firstParty : true))
        .filter((f) => (filter === "all" ? true : f.severity === filter))
        .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)),
    [filter, firstPartyOnly, allFindings],
  );

  return (
    <>
      <PageHeader
        eyebrow="White-box"
        title="Findings"
        description="Classical crypto misuse from source — CWE-tagged and severity-ranked. Aegis down-ranks dependency noise so you see real, first-party bugs first."
      />
      <div className="space-y-5 px-8 py-8">
        {!live && (
          <div className="rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-xs text-muted-foreground">
            Showing sample data — backend not reachable. Run a white-box (repository) scan once
            connected to populate real findings.
          </div>
        )}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <FilterChip
              label="All"
              active={filter === "all"}
              count={counts.all}
              onClick={() => setFilter("all")}
            />
            {SEVERITY_ORDER.map((s) => (
              <FilterChip
                key={s}
                label={s[0].toUpperCase() + s.slice(1)}
                active={filter === s}
                count={counts[s] ?? 0}
                dot={sevColor[s]}
                onClick={() => setFilter(s)}
              />
            ))}
          </div>
          <button
            onClick={() => setFirstPartyOnly((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              firstPartyOnly
                ? "border-primary/30 bg-accent text-accent-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${firstPartyOnly ? "bg-primary" : "bg-muted-foreground/40"}`}
            />
            First-party only
          </button>
        </div>

        <Stagger immediate className="space-y-3">
          {rows.map((f) => (
            <StaggerItem key={f.id}>
              <FindingRow
                f={f}
                open={open === f.id}
                onToggle={() => setOpen(open === f.id ? null : f.id)}
              />
            </StaggerItem>
          ))}
        </Stagger>
        {rows.length === 0 && (
          <div className="surface px-6 py-16 text-center text-sm text-muted-foreground">
            No findings match this filter.
          </div>
        )}
      </div>
    </>
  );
}

function FindingRow({ f, open, onToggle }: { f: Finding; open: boolean; onToggle: () => void }) {
  const reduce = useReducedMotion();
  return (
    <div className="surface overflow-hidden">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-accent/40"
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: `color-mix(in oklab, ${sevColor[f.severity]} 16%, transparent)`,
            color: sevColor[f.severity],
          }}
        >
          <ShieldX className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{f.title}</span>
            <SeverityBadge severity={f.severity} />
            {!f.firstParty && (
              <span className="rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                dependency
              </span>
            )}
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
            {f.cwe} · {f.repo} · {f.file}
          </div>
        </div>
        <ChevronRight
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
            className="overflow-hidden border-t border-border"
          >
            <div className="grid gap-4 px-5 py-4 md:grid-cols-2">
              <div className="flex gap-3">
                <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0 text-shor" />
                <div>
                  <div className="text-xs font-semibold text-foreground">Why it matters</div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {f.explanation}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-pqc" />
                <div>
                  <div className="text-xs font-semibold text-foreground">Suggested fix</div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{f.fix}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider"
      style={{
        background: `color-mix(in oklab, ${sevColor[severity]} 14%, transparent)`,
        color: sevColor[severity],
        border: `1px solid color-mix(in oklab, ${sevColor[severity]} 30%, transparent)`,
      }}
    >
      {severity}
    </span>
  );
}

function FilterChip({
  label,
  active,
  count,
  dot,
  onClick,
}: {
  label: string;
  active: boolean;
  count: number;
  dot?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-primary/40 bg-accent text-accent-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />}
      {label}
      <span className="font-mono text-[10px] tabular-nums opacity-70">{count}</span>
    </button>
  );
}
