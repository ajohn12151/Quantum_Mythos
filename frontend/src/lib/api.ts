// Backend API client. Base URL from env (set VITE_API_BASE_URL in prod / Vercel);
// falls back to local dev. The backend serves DTOs in the same shape as mock-data,
// so screens swap a mock import for these calls with minimal change.
const BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:8000";

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "content-type": "application/json" },
  });
  if (!res.ok) throw new Error(`API ${res.status} on ${path}`);
  return (await res.json()) as T;
}

export interface AssetDTO {
  id: string;
  name: string;
  kind: string;
  host: string | null;
  filePath: string | null;
  algorithm: string;
  status: "broken" | "weakened" | "safe" | "unknown";
  exposure: string;
  owner: string | null;
  environment: string | null;
  hndlRisk: number;
  dataSensitivity: string | null;
  rationale: string | null;
  remediationState: string | null;
  discoveredAt: string | null;
  recommendedFix: string | null;
}

export interface DashboardDTO {
  orgId: string;
  totals: { broken: number; weakened: number; safe: number; total: number; hndlExposed: number };
  riskScore: number;
  postureSeries: { week: string; broken: number; weakened: number; safe: number }[];
  topFindings: AssetDTO[];
  recentScans: {
    id: string;
    kind: string;
    target: string;
    status: string;
    ranAt: string | null;
    findings: number;
  }[];
}

export interface ScanHandle {
  scan_id: string;
  org_id: string;
  status: string;
}

export const api = {
  dashboard: () => getJSON<DashboardDTO>("/api/dashboard"),
  createScan: (mode: string, target: string) =>
    fetch(`${BASE}/api/scans`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode, target }),
    }).then((r) => {
      if (!r.ok) throw new Error(`API ${r.status} on /api/scans`);
      return r.json() as Promise<ScanHandle>;
    }),
  scanStatus: (id: string) => getJSON<{ status: string; summary_json: unknown }>(`/api/scans/${id}`),
};
