import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { assets, postureSeries, recentScans, riskScore, totals } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/app/")({ component: Dashboard });

function useCountUp(target: number, duration = 900) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return n;
}

function Dashboard() {
  return (
    <>
      <PageHeader
        eyebrow="Posture overview"
        title="Quantum cryptographic posture"
        description="What's broken, what's at risk, what's safe — across every asset Aegis can see."
        action={
          <Link
            to="/app/scan"
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-quantum px-4 text-sm font-medium text-primary-foreground glow-cyan transition-transform hover:scale-[1.02]"
          >
            Run new scan <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />
      <div className="space-y-8 px-8 py-8">
        <section className="grid gap-6 lg:grid-cols-3">
          <RiskScoreCard />
          <div className="grid gap-6 sm:grid-cols-3 lg:col-span-2">
            <CountCard label="Shor-broken" value={totals.broken} status="broken" icon={ShieldAlert} delta="-23 this week" />
            <CountCard label="Grover-weakened" value={totals.weakened} status="weakened" icon={Shield} delta="-3 this week" />
            <CountCard label="Quantum-safe" value={totals.safe} status="safe" icon={ShieldCheck} delta="+21 this week" />
            <HndlCard />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <PostureChart />
          <MigrationBoard />
        </section>

        <section className="grid gap-6 lg:grid-cols-5">
          <TopFindings />
          <RecentScans />
        </section>
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function RiskScoreCard() {
  const value = useCountUp(riskScore);
  const r = 64;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const band = value >= 70 ? "text-shor" : value >= 40 ? "text-grover" : "text-pqc";
  return (
    <div className="surface relative overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-quantum-violet/20 blur-3xl" />
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Quantum risk score
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-elevated-2 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3" /> 12w window
        </span>
      </div>
      <div className="mt-4 flex items-center gap-6">
        <div className="relative h-40 w-40 shrink-0">
          <svg viewBox="0 0 160 160" className="h-40 w-40 -rotate-90">
            <defs>
              <linearGradient id="riskGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="oklch(0.82 0.13 200)" />
                <stop offset="100%" stopColor="oklch(0.66 0.23 25)" />
              </linearGradient>
            </defs>
            <circle cx="80" cy="80" r={r} stroke="oklch(1 0 0 / 0.08)" strokeWidth="10" fill="none" />
            <circle
              cx="80" cy="80" r={r}
              stroke="url(#riskGrad)" strokeWidth="10" fill="none"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 900ms cubic-bezier(.2,.7,.2,1)" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`font-mono text-4xl font-semibold tracking-tight ${band}`}>{value}</div>
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">/ 100</div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-base font-medium">
            Elevated exposure
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Your perimeter still leans on Shor-vulnerable RSA & ECC. Migration is on track —
            score is down <span className="text-pqc">14 points</span> since April.
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 text-pqc"><TrendingDown className="h-3.5 w-3.5" /> -14 vs 60d ago</span>
            <span>•</span>
            <span>Target by Q4: <span className="font-mono text-foreground">≤ 30</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CountCard({
  label, value, status, icon: Icon, delta,
}: {
  label: string; value: number; status: "broken" | "weakened" | "safe"; icon: typeof Shield; delta: string;
}) {
  const n = useCountUp(value);
  const accent =
    status === "broken" ? "text-shor" : status === "weakened" ? "text-grover" : "text-pqc";
  return (
    <div className="surface relative overflow-hidden p-5">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
        <Icon className={`h-4 w-4 ${accent}`} />
      </div>
      <div className={`mt-4 font-mono text-3xl font-semibold tracking-tight ${accent}`}>{n}</div>
      <div className="mt-1 text-xs text-muted-foreground">{delta}</div>
    </div>
  );
}

function HndlCard() {
  return (
    <div className="surface relative overflow-hidden p-5 sm:col-span-3">
      <div className="pointer-events-none absolute inset-0 -z-10 dot-bg opacity-40" />
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-quantum-soft">
          <Sparkles className="h-5 w-5 text-quantum-cyan" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">Harvest-now, decrypt-later spotlight</h3>
            <span className="rounded-full border border-shor/40 bg-shor/15 px-2 py-0.5 font-mono text-[10px] uppercase text-shor">
              {totals.hndlExposed} exposed
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Long-lived secrets flowing over Shor-broken channels today can be decrypted
            once a CRQC exists. These {totals.hndlExposed} assets carry the highest HNDL risk.
          </p>
        </div>
        <Link to="/app/prioritization" className="inline-flex items-center gap-1 self-start text-xs text-quantum-cyan hover:underline">
          Prioritize <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function PostureChart() {
  return (
    <div className="surface relative overflow-hidden p-6 xl:col-span-2">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Posture over time</div>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">Red → green migration</h2>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <Legend color="var(--shor)" label="Broken" />
          <Legend color="var(--grover)" label="Weakened" />
          <Legend color="var(--pqc)" label="Safe" />
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={postureSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="gBroken" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.66 0.23 25)" stopOpacity={0.55} />
                <stop offset="100%" stopColor="oklch(0.66 0.23 25)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gWeak" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.78 0.16 75)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="oklch(0.78 0.16 75)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gSafe" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.72 0.16 158)" stopOpacity={0.55} />
                <stop offset="100%" stopColor="oklch(0.72 0.16 158)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
            <XAxis dataKey="week" tick={{ fill: "oklch(0.68 0.025 255)", fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "oklch(0.68 0.025 255)", fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} width={40} />
            <Tooltip
              contentStyle={{
                background: "oklch(0.18 0.03 265)",
                border: "1px solid oklch(1 0 0 / 0.08)",
                borderRadius: 10,
                fontSize: 12,
              }}
              labelStyle={{ color: "oklch(0.97 0.008 250)", fontFamily: "var(--font-mono)" }}
            />
            <Area type="monotone" dataKey="broken" stroke="oklch(0.66 0.23 25)" strokeWidth={2} fill="url(#gBroken)" />
            <Area type="monotone" dataKey="weakened" stroke="oklch(0.78 0.16 75)" strokeWidth={2} fill="url(#gWeak)" />
            <Area type="monotone" dataKey="safe" stroke="oklch(0.72 0.16 158)" strokeWidth={2} fill="url(#gSafe)" />
          </AreaChart>
        </ResponsiveContainer>
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

function MigrationBoard() {
  const cols = [
    { key: "broken" as const, label: "Broken", count: totals.broken, accent: "shor" },
    { key: "weakened" as const, label: "Weakened", count: totals.weakened, accent: "grover" },
    { key: "safe" as const, label: "Safe", count: totals.safe, accent: "pqc" },
  ];
  return (
    <div className="surface relative overflow-hidden p-6">
      <div className="mb-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Migration board</div>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">Cohort flow</h2>
      </div>
      <div className="space-y-4">
        {cols.map((c) => {
          const pct = Math.round((c.count / totals.total) * 100);
          return (
            <div key={c.key}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className={`font-mono uppercase tracking-wider text-${c.accent}`}>{c.label}</span>
                <span className="font-mono text-muted-foreground">{c.count} · {pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-elevated-2">
                <div
                  className={`h-full rounded-full bg-${c.accent} transition-all duration-700`}
                  style={{ width: `${pct}%`, background: `var(--${c.accent})` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 rounded-md border border-border bg-elevated-2/60 p-4 text-xs leading-relaxed text-muted-foreground">
        <span className="text-foreground">21 assets</span> moved into <span className="text-pqc">safe</span> in the last 7 days, mostly TLS edges flipped to <span className="font-mono text-foreground">X25519MLKEM768</span>.
      </div>
    </div>
  );
}

function TopFindings() {
  const top = [...assets].filter((a) => a.status !== "safe").sort((a, b) => b.hndlRisk - a.hndlRisk).slice(0, 6);
  return (
    <div className="surface overflow-hidden lg:col-span-3">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Top priorities</div>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">Highest-risk findings</h2>
        </div>
        <Link to="/app/findings" className="text-xs text-muted-foreground hover:text-quantum-cyan">View all →</Link>
      </div>
      <div className="divide-y divide-border">
        {top.map((a) => (
          <Link
            key={a.id}
            to="/app/assets/$assetId"
            params={{ assetId: a.id }}
            className="group flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-elevated-2/60"
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
                <span>HNDL</span><span>{a.hndlRisk}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-elevated-2">
                <div className="h-full rounded-full" style={{ width: `${a.hndlRisk}%`, background: a.hndlRisk > 70 ? "var(--shor)" : a.hndlRisk > 40 ? "var(--grover)" : "var(--pqc)" }} />
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function RecentScans() {
  return (
    <div className="surface overflow-hidden lg:col-span-2">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Activity</div>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">Recent scans</h2>
        </div>
        <Link to="/app/scan" className="text-xs text-muted-foreground hover:text-quantum-cyan">New scan →</Link>
      </div>
      <ul className="divide-y divide-border">
        {recentScans.map((s) => (
          <li key={s.id} className="flex items-center gap-3 px-6 py-3.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-elevated-2">
              {s.kind === "domain" ? <Globe className="h-4 w-4 text-quantum-cyan" /> : <GitBranch className="h-4 w-4 text-quantum-violet" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm">{s.target}</div>
              <div className="font-mono text-[11px] text-muted-foreground">{s.id} · {s.ranAt}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm">{s.findings}</div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">findings</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function KindIcon({ kind }: { kind: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-elevated-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
      {kind.slice(0, 3)}
    </div>
  );
}
