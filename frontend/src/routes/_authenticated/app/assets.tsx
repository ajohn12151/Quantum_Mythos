import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowUpDown, Filter, Search } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Reveal } from "@/components/marketing/Reveal";
import { type CryptoStatus } from "@/lib/mock-data";
import { useAssets } from "@/hooks/useAssets";

const EASE = [0.2, 0.7, 0.2, 1] as const;

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
  const { rows: allAssets, live } = useAssets();

  const rows = useMemo(() => {
    const filtered = allAssets.filter((a) => {
      if (status !== "all" && a.status !== status) return false;
      if (
        q &&
        !`${a.name} ${a.algorithm} ${a.owner} ${a.host ?? ""}`
          .toLowerCase()
          .includes(q.toLowerCase())
      )
        return false;
      return true;
    });
    return filtered.sort((a, b) => (sortDesc ? b.hndlRisk - a.hndlRisk : a.hndlRisk - b.hndlRisk));
  }, [q, status, sortDesc, allAssets]);

  const reduce = useReducedMotion();
  const tableRef = useRef<HTMLTableSectionElement>(null);
  const inView = useInView(tableRef, { once: true, margin: "-60px" });
  const show = reduce || inView;

  return (
    <>
      <PageHeader
        eyebrow="Inventory"
        title="Assets"
        description="Every cryptographic asset Aegis has observed across your perimeter, identity surface, and source."
      />
      <div className="px-8 py-6">
        {!live && (
          <div className="mb-4 rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-xs text-muted-foreground">
            Showing sample data — backend not reachable. Run a scan once connected to populate
            your real inventory.
          </div>
        )}
        <div className="surface overflow-hidden">
          <Reveal className="flex flex-col gap-3 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search asset, host, algorithm, owner…"
                className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground/70 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring"
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
                      ? "border-primary/30 bg-accent text-accent-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Reveal>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-2.5">Asset</th>
                  <th className="px-3 py-2.5">Kind</th>
                  <th className="px-3 py-2.5">Algorithm</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Owner</th>
                  <th className="px-3 py-2.5">Exposure</th>
                  <th className="px-3 py-2.5">
                    <button
                      onClick={() => setSortDesc(!sortDesc)}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      HNDL <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-5 py-2.5"></th>
                </tr>
              </thead>
              <motion.tbody
                ref={tableRef}
                initial={reduce ? false : "hide"}
                animate={show ? "show" : "hide"}
                variants={{
                  hide: {},
                  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
                }}
              >
                {rows.map((a) => (
                  <motion.tr
                    key={a.id}
                    variants={{
                      hide: { opacity: 0, y: 12 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
                    }}
                    className="border-b border-border/60 transition-colors hover:bg-accent/40"
                  >
                    <td className="px-5 py-3">
                      <Link
                        to="/app/assets/$assetId"
                        params={{ assetId: a.id }}
                        className="font-medium transition-colors hover:text-primary"
                      >
                        {a.name}
                      </Link>
                      {a.host && (
                        <div className="font-mono text-[11px] text-muted-foreground">{a.host}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {a.kind}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs">{a.algorithm}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={a.status} compact />
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{a.owner}</td>
                    <td className="px-3 py-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {a.exposure}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
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
                        <span className="font-mono text-xs tabular-nums">{a.hndlRisk}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        to="/app/assets/$assetId"
                        params={{ assetId: a.id }}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Open →
                      </Link>
                    </td>
                  </motion.tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-10 text-center text-sm text-muted-foreground"
                    >
                      No assets match.
                    </td>
                  </tr>
                )}
              </motion.tbody>
            </table>
          </div>
          <div className="border-t border-border px-5 py-3 font-mono text-[11px] text-muted-foreground">
            Showing {rows.length} of {allAssets.length} assets
          </div>
        </div>
      </div>
    </>
  );
}
