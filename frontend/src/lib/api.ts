// Backend API client. Base URL from env (set VITE_API_BASE_URL in prod / Vercel);
// falls back to local dev. The backend serves DTOs in the same shape as mock-data,
// so screens swap a mock import for these calls with minimal change.
import { supabase } from "@/integrations/supabase/client";

const BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:8000";

// Attach the signed-in user's Supabase access token so the backend scopes the
// request to their org. In the "Explore the live demo" path there's no session,
// so we send no token and the backend resolves the shared demo org instead.
async function authHeaders(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "content-type": "application/json", ...(await authHeaders()) },
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

export interface FindingDTO {
  id: string;
  title: string;
  cwe: string;
  severity: "critical" | "high" | "medium" | "low";
  file: string;
  repo: string;
  status: "open" | "triaged" | "fixed";
  firstParty: boolean;
  explanation: string;
  fix: string;
}

export const api = {
  dashboard: () => getJSON<DashboardDTO>("/api/dashboard"),
  assets: () => getJSON<AssetDTO[]>("/api/assets"),
  asset: (id: string) => getJSON<AssetDTO>(`/api/assets/${id}`),
  findings: () => getJSON<FindingDTO[]>("/api/findings"),
  createScan: async (mode: string, target: string) =>
    fetch(`${BASE}/api/scans`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ mode, target }),
    }).then((r) => {
      if (!r.ok) throw new Error(`API ${r.status} on /api/scans`);
      return r.json() as Promise<ScanHandle>;
    }),
  scanStatus: (id: string) => getJSON<{ status: string; summary_json: unknown }>(`/api/scans/${id}`),
};
