import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  GitBranch,
  Globe,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Reveal, Stagger, StaggerItem } from "@/components/marketing/Reveal";
import { SpotlightCard } from "@/components/marketing/SpotlightCard";
import { useCountUp } from "@/hooks/use-count-up";
import { useDashboard, type DashboardView, type TopFinding } from "@/hooks/useDashboard";

export const Route = createFileRoute("/_authenticated/app/")({ component: Dashboard });

function Dashboard() {
  const view = useDashboard();
  const { totals } = view;
  return (
    <>
      <PageHeader
        eyebrow="Posture overview"
        title="Quantum cryptographic posture"
        description="What's broken, what's at risk, what's safe — across every asset Aegis can see."
        action={
          <Link
            to="/app/scan"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[var(--shadow-sm)] transition-colors hover:bg-primary/90"
          >
            Run new scan <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />
      <div className="space-y-6 px-8 py-8">
        {!view.live && (
          <div className="rounded-lg border border-border bg-muted/50 px-4 py-2 font-mono text-[11px] text-muted-foreground">
            Showing sample data — backend not reachable. Set VITE_API_BASE_URL to see live results.
          </div>
        )}
        <Stagger immediate className="grid gap-6 lg:grid-cols-3">
          <StaggerItem>
            <RiskScoreCard value={view.riskScore} />
          </StaggerItem>
          <StaggerItem className="grid gap-6 sm:grid-cols-3 lg:col-span-2">
            <CountCard
              label="Shor-broken"
              value={totals.broken}
              status="broken"
              icon={ShieldAlert}
              delta="quantum-vulnerable"
            />
            <CountCard
              label="Grover-weakened"
              value={totals.weakened}
              status="weakened"
              icon={Shield}
              delta="needs larger keys"
            />
            <CountCard
              label="Quantum-safe"
              value={totals.safe}
              status="safe"
              icon={ShieldCheck}
              delta="PQC / resistant"
            />
            <HndlCard exposed={totals.hndlExposed} />
          </StaggerItem>
        </Stagger>

        <Reveal as="section" immediate delay={0.1} className="grid gap-6 xl:grid-cols-3">
          <PostureChart data={view.postureSeries} />
          <MigrationBoard totals={totals} />
        </Reveal>

        <Reveal as="section" immediate delay={0.15} className="grid gap-6 lg:grid-cols-5">
          <TopFindings items={view.topFindings} />
          <RecentScans scans={view.recentScans} />
        </Reveal>
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function RiskScoreCard({ value: target }: { value: number }) {
  const value = useCountUp(target, { duration: 900 });
  const r = 64;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const band = value >= 70 ? "text-shor" : value >= 40 ? "text-grover" : "text-pqc";
  return (
    <div className="card-premium gradient-border glow relative overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-quantum-violet/15 blur-3xl" />
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Quantum risk score
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3" /> live
        </span>
      </div>
      <div className="mt-4 flex items-center gap-6">
        <div className="relative h-40 w-40 shrink-0">
          <svg viewBox="0 0 160 160" className="h-40 w-40 -rotate-90">
            <defs>
              <linearGradient id="riskGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--quantum-cyan)" />
                <stop offset="100%" stopColor="var(--shor)" />
              </linearGradient>
            </defs>
            <circle cx="80" cy="80" r={r} stroke="var(--border)" strokeWidth="10" fill="none" />
            <circle
              cx="80"
              cy="80"
              r={r}
              stroke="url(#riskGrad)"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 900ms cubic-bezier(.2,.7,.2,1)" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`font-mono text-4xl font-semibold tracking-tight ${band}`}>{value}</div>
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              / 100
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-base font-medium">
            {value >= 70 ? "Elevated exposure" : value >= 40 ? "Moderate exposure" : "Largely safe"}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Share of your estate still on Shor-vulnerable RSA &amp; ECC, weighted by quantum
            exposure. Drive it toward <span className="font-mono text-foreground">0</span> as assets
            migrate to PQC.
          </p>
        </div>
      </div>
    </div>
  );
}

function CountCard({
  label,
  value,
  status,
  icon: Icon,
  delta,
}: {
  label: string;
  value: number;
  status: "broken" | "weakened" | "safe";
  icon: typeof Shield;
  delta: string;
}) {
  const n = useCountUp(value, { duration: 900 });
  const accent =
    status === "broken" ? "text-shor" : status === "weakened" ? "text-grover" : "text-pqc";
  return (
    <SpotlightCard className="h-full rounded-lg p-5">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </div>
        <Icon className={`h-4 w-4 ${accent}`} />
      </div>
      <div
        className={`mt-4 font-mono text-3xl font-semibold tracking-tight tabular-nums ${accent}`}
      >
        {n}
      </div>
      <div className="mt-1.5 text-xs text-muted-foreground">{delta}</div>
    </SpotlightCard>
  );
}

function HndlCard({ exposed }: { exposed: number }) {
  return (
    <div className="surface relative overflow-hidden p-5 sm:col-span-3">
      <div className="pointer-events-none absolute inset-0 -z-10 dot-bg opacity-40" />
      <div className="flex items-start gap-4">
        <div className="bg-quantum-soft flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          <Sparkles className="h-5 w-5 text-quantum-violet" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Harvest-now, decrypt-later spotlight</h3>
            <span className="status-shor rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider">
              {exposed} exposed
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Long-lived secrets flowing over Shor-broken channels today can be decrypted once a CRQC
            exists. These {exposed} assets carry the highest HNDL risk.
          </p>
        </div>
        <Link
          to="/app/prioritization"
          className="inline-flex items-center gap-1 self-start text-xs font-medium text-primary transition-colors hover:text-primary/80"
        >
          Prioritize <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function PostureChart({ data }: { data: DashboardView["postureSeries"] }) {
  return (
    <div className="surface relative overflow-hidden p-6 xl:col-span-2">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Posture over time
          </div>
          <h2 className="font-display mt-1 text-lg tracking-tight">Red → green migration</h2>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <Legend color="var(--shor)" label="Broken" />
          <Legend color="var(--grover)" label="Weakened" />
          <Legend color="var(--pqc)" label="Safe" />
        </div>
      </div>
      <div className="h-72">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center font-mono text-xs text-muted-foreground">
            No history yet — run scans over time and the red→green trend appears here.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gBroken" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--shor)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="var(--shor)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gWeak" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--grover)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--grover)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gSafe" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--pqc)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="var(--pqc)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{
                  fill: "var(--muted-foreground)",
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fill: "var(--muted-foreground)",
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-card)",
                  borderRadius: 10,
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--foreground)", fontFamily: "var(--font-mono)" }}
              />
              <Area
                type="monotone"
                dataKey="broken"
                stroke="var(--shor)"
                strokeWidth={2}
                fill="url(#gBroken)"
              />
              <Area
                type="monotone"
                dataKey="weakened"
                stroke="var(--grover)"
                strokeWidth={2}
                fill="url(#gWeak)"
              />
              <Area
                type="monotone"
                dataKey="safe"
                stroke="var(--pqc)"
                strokeWidth={2}
                fill="url(#gSafe)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function MigrationBoard({ totals }: { totals: DashboardView["totals"] }) {
  const cols = [
    { key: "broken" as const, label: "Broken", count: totals.broken, accent: "shor" },
    { key: "weakened" as const, label: "Weakened", count: totals.weakened, accent: "grover" },
    { key: "safe" as const, label: "Safe", count: totals.safe, accent: "pqc" },
  ];
  return (
    <div className="surface relative overflow-hidden p-6">
      <div className="mb-5">
        <div className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Migration board
        </div>
        <h2 className="font-display mt-1 text-lg tracking-tight">Cohort flow</h2>
      </div>
      <div className="space-y-4">
        {cols.map((c) => {
          const pct = totals.total ? Math.round((c.count / totals.total) * 100) : 0;
          return (
            <div key={c.key}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className={`font-mono uppercase tracking-wider text-${c.accent}`}>
                  {c.label}
                </span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {c.count} · {pct}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full bg-${c.accent} transition-all duration-700`}
                  style={{ width: `${pct}%`, background: `var(--${c.accent})` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 rounded-lg border border-border bg-muted/60 p-4 text-xs leading-relaxed text-muted-foreground">
        <span className="text-foreground">{totals.safe} assets</span> are quantum-safe of{" "}
        <span className="font-mono text-foreground">{totals.total}</span> total. Migrate{" "}
        <span className="text-shor">broken</span> cohorts to hybrid PQC (e.g.{" "}
        <span className="font-mono text-foreground">X25519MLKEM768</span>).
      </div>
    </div>
  );
}

function TopFindings({ items }: { items: TopFinding[] }) {
  return (
    <div className="surface overflow-hidden lg:col-span-3">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <div className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Top priorities
          </div>
          <h2 className="font-display mt-1 text-lg tracking-tight">Highest-risk findings</h2>
        </div>
        <Link
          to="/app/findings"
          className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
        >
          View all →
        </Link>
      </div>
      <div className="divide-y divide-border">
        {items.length === 0 && (
          <div className="px-6 py-8 text-center font-mono text-xs text-muted-foreground">
            No findings yet — run a scan to populate your inventory.
          </div>
        )}
        {items.map((a) => (
          <Link
            key={a.id}
            to="/app/assets/$assetId"
            params={{ assetId: a.id }}
            className="group flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-accent/50"
          >
            <KindIcon kind={a.kind} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">{a.name}</span>
                <StatusBadge status={a.status} compact />
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                {a.algorithm} · {a.owner} · {a.environment}
              </div>
            </div>
            <div className="hidden w-28 sm:block">
              <div className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>HNDL</span>
                <span className="tabular-nums">{a.hndlRisk}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${a.hndlRisk}%`,
                    background:
                      a.hndlRisk > 70
                        ? "var(--shor)"
                        : a.hndlRisk > 40
                          ? "var(--grover)"
                          : "var(--pqc)",
                  }}
                />
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function RecentScans({ scans }: { scans: DashboardView["recentScans"] }) {
  return (
    <div className="surface overflow-hidden lg:col-span-2">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <div className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Activity
          </div>
          <h2 className="font-display mt-1 text-lg tracking-tight">Recent scans</h2>
        </div>
        <Link
          to="/app/scan"
          className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
        >
          New scan →
        </Link>
      </div>
      <ul className="divide-y divide-border">
        {scans.length === 0 && (
          <li className="px-6 py-8 text-center font-mono text-xs text-muted-foreground">
            No scans yet.
          </li>
        )}
        {scans.map((s) => (
          <li key={s.id} className="flex items-center gap-3 px-6 py-3.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              {s.kind === "domain" ? (
                <Globe className="h-4 w-4 text-quantum-cyan" />
              ) : (
                <GitBranch className="h-4 w-4 text-quantum-violet" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm">{s.target}</div>
              <div className="font-mono text-[11px] text-muted-foreground">
                {s.id} · {s.ranAt}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm">{s.findings}</div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                findings
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function KindIcon({ kind }: { kind: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
      {kind.slice(0, 3)}
    </div>
  );
}
