import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpDown, Filter, Search } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { assets, type CryptoStatus } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/app/assets")({ component: AssetsPage });

const STATUSES: { value: CryptoStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "broken", label: "Broken" },
  { value: "weakened", label: "Weakened" },
  { value: "safe", label: "Safe" },
];

function AssetsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<CryptoStatus | "all">("all");
  const [sortDesc, setSortDesc] = useState(true);

  const rows = useMemo(() => {
    const filtered = assets.filter((a) => {
      if (status !== "all" && a.status !== status) return false;
      if (q && !`${a.name} ${a.algorithm} ${a.owner} ${a.host ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
    return filtered.sort((a, b) => (sortDesc ? b.hndlRisk - a.hndlRisk : a.hndlRisk - b.hndlRisk));
  }, [q, status, sortDesc]);

  return (
    <>
      <PageHeader
        eyebrow="Inventory"
        title="Assets"
        description="Every cryptographic asset Aegis has observed across your perimeter, identity surface, and source."
      />
      <div className="px-8 py-6">
        <div className="surface overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search asset, host, algorithm, owner…"
                className="h-9 w-full rounded-md border border-border bg-elevated-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground/70 focus:border-quantum-cyan focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStatus(s.value)}
                  className={`inline-flex h-8 items-center rounded-md border px-3 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                    status === s.value
                      ? "border-quantum-cyan/50 bg-quantum-soft text-foreground"
                      : "border-border bg-elevated-2 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-elevated-2/40 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-2.5">Asset</th>
                  <th className="px-3 py-2.5">Kind</th>
                  <th className="px-3 py-2.5">Algorithm</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Owner</th>
                  <th className="px-3 py-2.5">Exposure</th>
                  <th className="px-3 py-2.5">
                    <button onClick={() => setSortDesc(!sortDesc)} className="inline-flex items-center gap-1 hover:text-foreground">
                      HNDL <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-5 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className="border-b border-border/60 transition-colors hover:bg-elevated-2/40">
                    <td className="px-5 py-3">
                      <Link to="/app/assets/$assetId" params={{ assetId: a.id }} className="font-medium hover:text-quantum-cyan">
                        {a.name}
                      </Link>
                      {a.host && <div className="font-mono text-[11px] text-muted-foreground">{a.host}</div>}
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{a.kind}</td>
                    <td className="px-3 py-3 font-mono text-xs">{a.algorithm}</td>
                    <td className="px-3 py-3"><StatusBadge status={a.status} compact /></td>
                    <td className="px-3 py-3 text-muted-foreground">{a.owner}</td>
                    <td className="px-3 py-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{a.exposure}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-elevated-2">
                          <div className="h-full rounded-full" style={{ width: `${a.hndlRisk}%`, background: a.hndlRisk > 70 ? "var(--shor)" : a.hndlRisk > 40 ? "var(--grover)" : "var(--pqc)" }} />
                        </div>
                        <span className="font-mono text-xs">{a.hndlRisk}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link to="/app/assets/$assetId" params={{ assetId: a.id }} className="text-xs text-quantum-cyan hover:underline">
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-muted-foreground">No assets match.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-5 py-3 font-mono text-[11px] text-muted-foreground">
            Showing {rows.length} of {assets.length} assets
          </div>
        </div>
      </div>
    </>
  );
}
