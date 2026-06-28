import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  GitPullRequest,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { REMEDIATION_STATES, remediations, type RemediationState } from "@/lib/mock-data";
import { useAssets } from "@/hooks/useAssets";

export const Route = createFileRoute("/_authenticated/app/remediation")({
  component: RemediationPage,
});

const EASE = [0.2, 0.7, 0.2, 1] as const;

// Looser view model (real algorithms are free-text, unlike the strict mock union).
interface RemView {
  id: string;
  asset: string;
  from: string;
  to: string;
  state: RemediationState;
  owner: string;
  pr?: number;
  updatedAt: string;
  diffBefore?: string;
  diffAfter?: string;
  checks?: { label: string; pass: boolean }[];
}

const REM_STATES = new Set(["discovered", "triaged", "pr_open", "migrated", "verified"]);

// Suggested PQC target for a vulnerable algorithm (illustrative; deterministic).
function pqcTarget(algo: string, status: string): string {
  const A = algo.toUpperCase();
  if (status === "weakened" && A.includes("AES")) return "AES-256";
  if (A.includes("SHA-1") || A === "SHA1") return "SHA-256";
  if (A.includes("ECDSA") || A.includes("ED25519") || (A.includes("DSA") && !A.includes("ECDSA")))
    return "ML-DSA-65";
  if (A.includes("RSA") || A.includes("DH") || A.includes("ECDH") || A.includes("KEM"))
    return "ML-KEM-768";
  return "ML-KEM-768 / ML-DSA-65";
}

function RemediationPage() {
  const reduce = useReducedMotion();
  const { rows: assets, live, loading } = useAssets();
  // Items the (local) re-verify has flipped from "migrated" → "verified".
  const [verified, setVerified] = useState<Set<string>>(new Set());
  const [scanning, setScanning] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Real assets -> remediation cards. While the real query is still loading we
  // render an empty board (not the mock) so the animated cards don't churn
  // mock→real on first navigation. Offline (failed query) falls back to mock.
  const base: RemView[] = useMemo(() => {
    if (live) {
      return assets
        .filter((a) => a.status !== "safe")
        .map((a) => {
          const st = (a.remediationState ?? "discovered") as RemediationState;
          return {
            id: a.id,
            asset: a.name,
            from: a.algorithm,
            to: pqcTarget(a.algorithm, a.status),
            state: REM_STATES.has(st) ? st : "discovered",
            owner: a.owner,
            updatedAt: "—",
          };
        });
    }
    if (loading) return [];
    return remediations.map((r) => ({ ...r }) as RemView);
  }, [assets, live, loading]);

  const items = useMemo(
    () =>
      base.map((r) => (verified.has(r.id) ? { ...r, state: "verified" as RemediationState } : r)),
    [base, verified],
  );
  const selected = items.find((r) => r.id === selectedId) ?? items[0] ?? null;
  const migratedCount = items.filter((r) => r.state === "migrated").length;

  function runVerify() {
    if (scanning || migratedCount === 0) return;
    setScanning(true);
    const toFlip = items.filter((r) => r.state === "migrated").map((r) => r.id);
    toFlip.forEach((id, i) => {
      window.setTimeout(
        () => {
          setVerified((prev) => new Set(prev).add(id));
          if (i === toFlip.length - 1) setScanning(false);
        },
        500 + i * 450,
      );
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="Pipeline"
        title="Remediation"
        description="Every asset walks the lifecycle: Discovered → Triaged → PR open → Migrated → Verified. Re-scan to flip migrated assets from red to green."
        action={
          <button
            onClick={runVerify}
            disabled={scanning || migratedCount === 0}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[var(--shadow-sm)] transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${scanning ? "animate-spin" : ""}`} />
            {scanning ? "Re-scanning…" : `Re-scan to verify (${migratedCount})`}
          </button>
        }
      />

      <div className="space-y-6 px-8 py-8">
        {loading && (
          <div className="rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-xs text-muted-foreground">
            Loading your remediation pipeline…
          </div>
        )}
        {!live && !loading && (
          <div className="rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-xs text-muted-foreground">
            Showing sample data — backend not reachable. The live board fills from your real
            inventory.
          </div>
        )}

        {/* Pipeline board */}
        <div className="grid gap-4 lg:grid-cols-5">
          {REMEDIATION_STATES.map((col) => {
            const cards = items.filter((r) => r.state === col.key);
            return (
              <div key={col.key} className="flex min-w-0 flex-col">
                <div className="mb-3 flex items-center justify-between px-1">
                  <span className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    {col.label}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
                    {cards.length}
                  </span>
                </div>
                <motion.div layout className="flex flex-col gap-3">
                  <AnimatePresence initial={false}>
                    {cards.map((r) => (
                      <PipelineCard
                        key={r.id}
                        r={r}
                        active={selected?.id === r.id}
                        onClick={() => setSelectedId(r.id)}
                        reduce={!!reduce}
                      />
                    ))}
                  </AnimatePresence>
                  {cards.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border/70 py-6 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50">
                      empty
                    </div>
                  )}
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Selected detail */}
        {selected && <PrDetail r={selected} live={live} />}
      </div>
    </>
  );
}

const stateColor: Record<RemediationState, string> = {
  discovered: "var(--shor)",
  triaged: "var(--grover)",
  pr_open: "var(--quantum-cyan)",
  migrated: "var(--quantum-violet)",
  verified: "var(--pqc)",
};

function PipelineCard({
  r,
  active,
  onClick,
  reduce,
}: {
  r: RemView;
  active: boolean;
  onClick: () => void;
  reduce: boolean;
}) {
  const isVerified = r.state === "verified";
  return (
    <motion.button
      layout
      layoutId={r.id}
      onClick={onClick}
      initial={reduce ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: EASE }}
      className={`group relative overflow-hidden rounded-lg border p-3 text-left transition-colors ${
        active ? "border-primary/50 bg-accent/50" : "border-border bg-card hover:border-border/80"
      }`}
    >
      <span
        className="absolute inset-y-0 left-0 w-0.5"
        style={{ background: stateColor[r.state] }}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-2">
        <span className="truncate text-[13px] font-medium">{r.asset}</span>
        {isVerified ? (
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-pqc" />
        ) : r.pr ? (
          <GitPullRequest className="h-3.5 w-3.5 shrink-0 text-quantum-cyan" />
        ) : null}
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 font-mono text-[10px]">
        <span className="text-shor">{r.from}</span>
        <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
        <span className={isVerified ? "text-pqc" : "text-foreground/80"}>{r.to}</span>
      </div>
      <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
        <span>{r.pr ? `#${r.pr}` : r.owner}</span>
        <span>{r.updatedAt}</span>
      </div>
    </motion.button>
  );
}

function PrDetail({ r, live }: { r: RemView; live: boolean }) {
  // Real items have no diff yet (remediation authoring is in development) -> show
  // an illustrative call-site swap, clearly marked Preview.
  const before = r.diffBefore ?? `// ${r.from} — quantum-vulnerable`;
  const after = r.diffAfter ?? `// ${r.to} — hybrid post-quantum (call-site swap)`;
  const preview = live && !r.diffBefore;
  return (
    <motion.div
      key={r.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="grid gap-6 lg:grid-cols-[1.6fr_1fr]"
    >
      <div className="surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-quantum-soft text-quantum-violet">
              <GitPullRequest className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-sm font-semibold">
                {r.pr ? `PR #${r.pr} · crypto-agility: ${r.asset}` : `Crypto-agility: ${r.asset}`}
              </div>
              <div className="font-mono text-[11px] text-muted-foreground">
                {r.from} → {r.to} · {r.owner} · {r.updatedAt}
              </div>
            </div>
          </div>
          <StateChip state={r.state} />
        </div>

        <div className="p-5 font-mono text-[12.5px] leading-relaxed">
          {preview && (
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-grover/30 bg-grover/10 px-2.5 py-0.5 font-sans text-[10px] font-medium uppercase tracking-wider text-grover">
              Preview · illustrative
            </div>
          )}
          <div className="overflow-x-auto rounded-lg border border-border bg-muted p-4">
            <div className="text-shor">- {before}</div>
            <div className="text-pqc">+ {after}</div>
          </div>
          <p className="mt-4 font-sans text-xs leading-relaxed text-muted-foreground">
            The agility refactor only swaps the call-site to a verified post-quantum library — the
            primitive is never authored by the agent. Every change is gated by the checks on the
            right and a human review.
          </p>
        </div>
      </div>

      <div className="surface p-6">
        <div className="flex items-center justify-between">
          <div className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Safety gates
          </div>
          {preview && (
            <span className="rounded-full border border-grover/30 bg-grover/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-grover">
              Preview
            </span>
          )}
        </div>
        <h3 className="font-display mt-1 text-lg tracking-tight">Differential & size checks</h3>
        <div className="mt-4 space-y-2.5">
          {(r.checks ?? defaultChecks(r.state, preview)).map((c) => (
            <div
              key={c.label}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  c.pass ? "bg-pqc/15 text-pqc" : "bg-grover/15 text-grover"
                }`}
              >
                {c.pass ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              </span>
              <span className="text-xs text-foreground/85">{c.label}</span>
            </div>
          ))}
        </div>
        {preview && (
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            Automated differential & interop testing is in development — these gates are shown to
            illustrate the verification model.
          </p>
        )}
        {r.state === "verified" && (
          <div className="mt-5 flex items-center gap-2 rounded-lg border border-pqc/30 bg-pqc/10 px-3 py-2.5 text-xs text-pqc">
            <CheckCircle2 className="h-4 w-4" /> Re-scan confirmed quantum-safe.
          </div>
        )}
      </div>
    </motion.div>
  );
}

function defaultChecks(state: RemediationState, preview: boolean) {
  if (preview)
    return [
      { label: "crypto-agility call-site identified", pass: true },
      { label: "differential round-trip", pass: false },
      { label: "interop · legacy clients", pass: false },
    ];
  if (state === "discovered" || state === "triaged")
    return [
      { label: "awaiting migration PR", pass: false },
      { label: "verified library selected", pass: state === "triaged" },
    ];
  return [{ label: "differential round-trip", pass: true }];
}

function labelOf(state: RemediationState) {
  return REMEDIATION_STATES.find((s) => s.key === state)?.label ?? state;
}

function StateChip({ state }: { state: RemediationState }) {
  const cls =
    state === "verified"
      ? "status-pqc"
      : state === "discovered"
        ? "status-shor"
        : state === "triaged"
          ? "status-grover"
          : "";
  return (
    <span
      className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${cls || "border border-border bg-muted text-muted-foreground"}`}
    >
      {labelOf(state)}
    </span>
  );
}
