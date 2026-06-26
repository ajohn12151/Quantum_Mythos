import type { CryptoStatus } from "@/lib/mock-data";

const label: Record<CryptoStatus, string> = {
  broken: "Shor-broken",
  weakened: "Grover-weakened",
  safe: "Quantum-safe",
  unknown: "Unknown",
};

export function StatusBadge({
  status,
  compact = false,
}: {
  status: CryptoStatus;
  compact?: boolean;
}) {
  const cls =
    status === "broken"
      ? "status-shor"
      : status === "weakened"
        ? "status-grover"
        : status === "safe"
          ? "status-pqc"
          : "bg-muted text-muted-foreground border border-border";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${cls}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {compact ? status : label[status]}
    </span>
  );
}
