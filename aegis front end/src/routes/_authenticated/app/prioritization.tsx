import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Flame, Sparkles, Sliders, Target } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { assets, type Asset } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/app/prioritization")({ component: PrioritizationPage });

// Weighting (0–100). HNDL × exposure × blast radius × effort discount.
type Weights = { hndl: number; exposure: number; blast: number; effort: number };
const DEFAULT_WEIGHTS: Weights = { hndl: 40, exposure: 25, blast: 25, effort: 10 };

const exposureWeight = (e: Asset["exposure"]) => (e === "internet" ? 100 : e === "partner" ? 65 : 30);
const blastByOwner: Record<string, number> = {
  payments: 95, identity: 90, security: 80, platform: 70, data: 75, supply: 55,
};
const effortByKind: Record<Asset["kind"], number> = {
  certificate: 85, tls: 70, secret: 55, library: 40, ssh: 60, code: 35,
};

function scoreOf(a: Asset, w: Weights) {
  const total = w.hndl + w.exposure + w.blast + w.effort || 1;
  const s =
    (a.hndlRisk * w.hndl +
      exposureWeight(a.exposure) * w.exposure +
      (blastByOwner[a.owner] ?? 50) * w.blast +
      effortByKind[a.kind] * w.effort) /
    total;
  return Math.round(s);
}

function PrioritizationPage() {
  const [w, setW] = useState<Weights>(DEFAULT_WEIGHTS);

  const ranked = useMemo(
    () =>
      assets
        .filter((a) => a.status !== "safe")
        .map((a) => ({ asset: a, score: scoreOf(a, w) }))
        .sort((a, b) => b.score - a.score),
    [w]
  );

  return (
    <>
      <PageHeader
        eyebrow="Prioritize"
        title="Where to migrate first"
        description="Aegis ranks every at-risk asset by harvest-now risk, exposure, blast radius, and remediation effort. Tune the weights to match your strategy."
      />
      <div className="grid gap-6 px-8 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-6">
          <div className="surface p-5">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-quantum-cyan" />
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Scoring weights</div>
            </div>
            <div className="mt-5 space-y-5">
              <Slider label="HNDL risk" value={w.hndl} onChange={(v) => setW({ ...w, hndl: v })} accent="text-shor" />
              <Slider label="Exposure" value={w.exposure} onChange={(v) => setW({ ...w, exposure: v })} accent="text-grover" />
              <Slider label="Blast radius" value={w.blast} onChange={(v) => setW({ ...w, blast: v })} accent="text-quantum-cyan" />
              <Slider label="Effort discount" value={w.effort} onChange={(v) => setW({ ...w, effort: v })} accent="text-quantum-violet" />
            </div>
            <button
              onClick={() => setW(DEFAULT_WEIGHTS)}
              className="mt-6 w-full rounded-md border border-border bg-elevated-2 px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Reset to Aegis default
            </button>
          </div>

          <div className="surface relative overflow-hidden p-5">
            <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-quantum-violet/15 blur-3xl" />
            <Sparkles className="h-4 w-4 text-quantum-cyan" />
            <div className="mt-2 text-sm font-medium">Why these four?</div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              HNDL captures harvest-now exposure of long-lived secrets. Exposure & blast
              radius reflect what an attacker actually gains. Effort lets you pick
              wins you can land this sprint.
            </p>
          </div>
        </aside>

        <section className="surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Ranked queue</div>
              <h2 className="mt-1 text-lg font-semibold tracking-tight">{ranked.length} at-risk assets, ordered by priority</h2>
            </div>
            <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
              <Flame className="h-3.5 w-3.5 text-shor" /> Top 3 = quarter goal
            </div>
          </div>
          <ol className="divide-y divide-border">
            {ranked.map((r, i) => (
              <Row key={r.asset.id} rank={i + 1} asset={r.asset} score={r.score} weights={w} />
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}

function Row({ rank, asset, score, weights }: { rank: number; asset: Asset; score: number; weights: Weights }) {
  const breakdown = [
    { label: "HNDL", v: asset.hndlRisk, w: weights.hndl, color: "var(--shor)" },
    { label: "Exposure", v: exposureWeight(asset.exposure), w: weights.exposure, color: "var(--grover)" },
    { label: "Blast", v: blastByOwner[asset.owner] ?? 50, w: weights.blast, color: "var(--quantum-cyan)" },
    { label: "Effort", v: effortByKind[asset.kind], w: weights.effort, color: "var(--quantum-violet)" },
  ];
  const hot = rank <= 3;
  return (
    <li className={`group flex items-center gap-5 px-6 py-4 transition-colors hover:bg-elevated-2/50 ${hot ? "bg-shor/[0.03]" : ""}`}>
      <div className="flex w-10 shrink-0 flex-col items-center">
        <span className={`font-mono text-2xl font-semibold tabular-nums ${hot ? "text-shor" : "text-muted-foreground"}`}>
          {String(rank).padStart(2, "0")}
        </span>
        {hot && <Flame className="mt-0.5 h-3 w-3 text-shor" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link to="/app/assets/$assetId" params={{ assetId: asset.id }} className="truncate text-sm font-medium hover:text-quantum-cyan">
            {asset.name}
          </Link>
          <StatusBadge status={asset.status} compact />
        </div>
        <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
          {asset.algorithm} · {asset.owner} · {asset.exposure}
        </div>
        <div className="mt-2.5 flex gap-3">
          {breakdown.map((b) => (
            <div key={b.label} className="flex-1">
              <div className="mb-1 flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                <span>{b.label}</span><span>{b.v}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-elevated-2">
                <div className="h-full rounded-full" style={{ width: `${b.v}%`, background: b.color, opacity: 0.4 + (b.w / 100) * 0.6 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden w-28 shrink-0 text-right md:block">
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Priority</div>
        <div className={`font-mono text-3xl font-semibold tabular-nums ${score >= 75 ? "text-shor" : score >= 50 ? "text-grover" : "text-muted-foreground"}`}>
          {score}
        </div>
      </div>

      <Target className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </li>
  );
}

function Slider({ label, value, onChange, accent }: { label: string; value: number; onChange: (v: number) => void; accent: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className={`text-xs ${accent}`}>{label}</span>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-elevated-2 accent-[oklch(0.82_0.13_200)]"
      />
    </div>
  );
}
