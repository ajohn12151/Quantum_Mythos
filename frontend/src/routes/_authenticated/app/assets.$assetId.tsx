import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Cpu,
  Search,
  Server,
  Shield,
  Wrench,
} from "lucide-react";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Reveal, Stagger, StaggerItem } from "@/components/marketing/Reveal";
import { algorithmMeta, getAsset as getMockAsset } from "@/lib/mock-data";
import { api, type AssetDTO } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/app/assets/$assetId")({
  component: AssetDetail,
});

// How the asset was discovered, from its source kind.
const DETECTION: Record<string, string> = {
  tls: "TLS handshake",
  ssh: "SSH host key",
  certificate: "Certificate (CT log)",
  library: "Binary / dependency",
  code: "Source code",
  secret: "Secret scan",
};

// Map any backend algorithm string -> a family + plain-English note. Exact mock
// entries win (RSA-2048, X25519MLKEM768, …); otherwise infer from the name so we
// never crash on free-text algorithms like "ECDSA/EC" or "asymmetric".
function algoMeta(algorithm: string, status: string): { family: string; note: string } {
  const exact = (algorithmMeta as Record<string, { family: string; note: string }>)[algorithm];
  if (exact) return { family: exact.family, note: exact.note };
  const A = algorithm.toUpperCase();
  const f = (family: string, note: string) => ({ family, note });
  if (A.includes("ML-KEM") || A.includes("KYBER"))
    return f("PQC", "NIST FIPS 203 post-quantum KEM — quantum-safe.");
  if (A.includes("ML-DSA") || A.includes("DILITHIUM") || A.includes("FALCON") || A.includes("SLH-DSA"))
    return f("PQC", "NIST post-quantum signature — quantum-safe.");
  if (A.includes("ED25519")) return f("ECC", "Edwards-curve signatures, broken by Shor's algorithm.");
  if (A.includes("ECDH")) return f("ECC", "Elliptic-curve key exchange, broken by Shor's algorithm.");
  if (A.includes("ECDSA")) return f("ECC", "Elliptic-curve signatures, broken by Shor's algorithm.");
  if (A.includes("RSA")) return f("RSA", "Broken by Shor's algorithm once a CRQC exists.");
  if (A.includes("CURVE") || A.includes("P256") || A.includes("P384") || A.includes("P521") || /\bEC\b/.test(A) || A.includes("ECC"))
    return f("ECC", "Elliptic-curve cryptography, broken by Shor's algorithm.");
  if (A.startsWith("DH") || A.includes("DIFFIE")) return f("DH", "Discrete-log key exchange, broken by Shor's algorithm.");
  if (A.includes("DSA")) return f("DH", "Discrete-log signatures, broken by Shor's algorithm.");
  if (A.includes("AES")) return f("AES", "Symmetric cipher; Grover halves effective security — prefer AES-256.");
  if (A.includes("CHACHA")) return f("Symmetric", "Symmetric stream cipher; only Grover-weakened.");
  if (A.includes("SHA")) return f("Hash", "Hash function; only Grover-weakened.");
  return status === "safe"
    ? f("PQC", "Considered quantum-safe.")
    : f("Asymmetric", "Quantum-vulnerable cryptography.");
}

interface DetailView {
  id: string;
  name: string;
  kind: string;
  host: string | null;
  algorithm: string;
  status: "broken" | "weakened" | "safe" | "unknown";
  exposure: string;
  environment: string;
  owner: string;
  hndlRisk: number;
  discoveredAt: string | null;
  recommendedFix: string | null;
  rationale: string | null;
  remediationState: string | null;
}

function fromDTO(a: AssetDTO): DetailView {
  return {
    id: a.id,
    name: a.name,
    kind: a.kind,
    host: a.host,
    algorithm: a.algorithm,
    status: a.status,
    exposure: a.exposure,
    environment: a.environment ?? "—",
    owner: a.owner ?? "—",
    hndlRisk: a.hndlRisk,
    discoveredAt: a.discoveredAt,
    recommendedFix: a.recommendedFix,
    rationale: a.rationale,
    remediationState: a.remediationState,
  };
}

function AssetDetail() {
  const { assetId } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["asset", assetId],
    queryFn: () => api.asset(assetId),
    retry: 0,
  });

  let asset: DetailView | null = data ? fromDTO(data) : null;
  if (!asset) {
    // Offline / not in backend: fall back to the mock catalogue (mock ids only).
    const m = getMockAsset(assetId);
    if (m)
      asset = {
        id: m.id,
        name: m.name,
        kind: m.kind,
        host: m.host ?? null,
        algorithm: m.algorithm,
        status: m.status,
        exposure: m.exposure,
        environment: m.environment,
        owner: m.owner,
        hndlRisk: m.hndlRisk,
        discoveredAt: m.discoveredAt,
        recommendedFix: m.recommendedFix ?? null,
        rationale: null,
        remediationState: null,
      };
  }

  if (isLoading && !asset)
    return <div className="px-8 py-16 text-center text-sm text-muted-foreground">Loading asset…</div>;

  if (!asset)
    return (
      <div className="px-8 py-16 text-center">
        <h1 className="text-xl font-semibold">Asset not found</h1>
        <Link
          to="/app/assets"
          className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
        >
          ← Back to inventory
        </Link>
      </div>
    );

  const meta = algoMeta(asset.algorithm, asset.status);
  const detection = DETECTION[asset.kind] ?? "Scan";
  const statusWord =
    asset.status === "broken"
      ? "Shor-broken"
      : asset.status === "weakened"
        ? "Grover-weakened"
        : asset.status === "safe"
          ? "quantum-safe"
          : "unclassified";

  const timeline = [
    {
      when: asset.discoveredAt ?? "—",
      label: "Discovered",
      body: `Surfaced via ${detection}. Classified as ${meta.family}.`,
      icon: Cpu,
      accent: "text-primary",
    },
    {
      when: asset.discoveredAt ?? "—",
      label: "Triaged",
      body: `Flagged ${statusWord}. HNDL risk ${asset.hndlRisk}.${
        asset.rationale ? ` ${asset.rationale}` : ""
      }`,
      icon: Shield,
      accent:
        asset.status === "broken"
          ? "text-shor"
          : asset.status === "weakened"
            ? "text-grover"
            : "text-pqc",
    },
    {
      when: "—",
      label:
        asset.remediationState && asset.remediationState !== "discovered"
          ? `Remediation: ${asset.remediationState}`
          : "Remediation pending",
      body:
        asset.recommendedFix ??
        (asset.status === "safe"
          ? "No remediation required — already quantum-safe."
          : "Crypto-agility migration not yet proposed."),
      icon: Wrench,
      accent: "text-muted-foreground",
    },
  ];

  return (
    <div>
      <Reveal className="border-b border-border px-8 py-6">
        <Link
          to="/app/assets"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Assets
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
              {asset.kind} asset
            </div>
            <h1 className="font-display mt-1 text-2xl tracking-tight">{asset.name}</h1>
            {asset.host && (
              <div className="mt-1.5 font-mono text-xs text-muted-foreground">{asset.host}</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={asset.status} />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {asset.environment}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {asset.exposure}
            </span>
          </div>
        </div>
      </Reveal>

      <div className="grid gap-6 px-8 py-8 lg:grid-cols-3">
        <Stagger className="space-y-6 lg:col-span-2">
          <StaggerItem className="surface p-6">
            <div className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Cryptographic profile
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <Detail
                label="Algorithm"
                value={<span className="font-mono">{asset.algorithm}</span>}
              />
              <Detail label="Family" value={<span className="font-mono">{meta.family}</span>} />
              <Detail label="Owner" value={asset.owner} />
              <Detail
                label="HNDL risk"
                value={<span className="font-mono tabular-nums">{asset.hndlRisk} / 100</span>}
              />
            </div>
            <div className="mt-5 rounded-lg border border-border bg-muted/60 p-4 text-sm leading-relaxed text-muted-foreground">
              {meta.note}
            </div>
          </StaggerItem>

          {asset.recommendedFix && (
            <StaggerItem className="card-premium relative overflow-hidden p-6">
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-quantum-violet/12 blur-3xl" />
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                <div className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Recommended fix
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed">{asset.recommendedFix}</p>
              <div className="mt-5 flex gap-2">
                <button className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[var(--shadow-sm)] transition-colors hover:bg-primary/90">
                  <CheckCircle2 className="h-4 w-4" /> Open remediation PR
                </button>
                <button className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent/60">
                  Assign owner
                </button>
              </div>
            </StaggerItem>
          )}

          <StaggerItem className="surface p-6">
            <div className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Lifecycle
            </div>
            <ol className="relative space-y-5 border-l border-border pl-6">
              {timeline.map((t, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background">
                    <t.icon className={`h-3.5 w-3.5 ${t.accent}`} />
                  </span>
                  <div className="flex items-baseline justify-between">
                    <div className="text-sm font-medium">{t.label}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{t.when}</div>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{t.body}</p>
                </li>
              ))}
            </ol>
          </StaggerItem>
        </Stagger>

        <Stagger className="space-y-6">
          <StaggerItem className="surface p-5">
            <div className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Discovery
            </div>
            <ul className="mt-3 space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" /> First seen{" "}
                <span className="ml-auto font-mono text-xs">{asset.discoveredAt ?? "—"}</span>
              </li>
              <li className="flex items-center gap-3">
                <Search className="h-4 w-4 text-muted-foreground" /> Detection{" "}
                <span className="ml-auto font-mono text-xs">{detection}</span>
              </li>
              <li className="flex items-center gap-3">
                <Server className="h-4 w-4 text-muted-foreground" /> Exposure{" "}
                <span className="ml-auto font-mono text-xs">{asset.exposure}</span>
              </li>
            </ul>
          </StaggerItem>
          <StaggerItem className="surface p-5">
            <div className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Compliance
            </div>
            <div className="mt-3 space-y-2 text-xs">
              <Pill ok={asset.status === "safe"} label="NIST IR 8547 — PQC transition" />
              <Pill ok={asset.status === "safe"} label="CNSA 2.0 (NSA, 2024)" />
              <Pill ok label="FIPS 140-3 module" />
            </div>
          </StaggerItem>
        </Stagger>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1">{value}</div>
    </div>
  );
}

function Pill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-3 py-2 ${ok ? "status-pqc" : "status-shor"}`}
    >
      <span className="text-foreground/90">{label}</span>
      <span
        className={`font-mono text-[10px] uppercase tracking-wider ${ok ? "text-pqc" : "text-shor"}`}
      >
        {ok ? "pass" : "gap"}
      </span>
    </div>
  );
}
