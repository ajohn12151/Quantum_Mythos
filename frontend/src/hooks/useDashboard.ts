// Dashboard data hook. Fetches the live backend DTO; if the API is unreachable
// it falls back to the mock data so the screen still renders (the existing
// "explore the live demo" ethos). `live` tells the UI which it's showing.
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { assets, postureSeries, recentScans, riskScore, totals } from "@/lib/mock-data";

export interface TopFinding {
  id: string;
  name: string;
  kind: string;
  algorithm: string;
  status: "broken" | "weakened" | "safe" | "unknown";
  owner: string;
  environment: string;
  hndlRisk: number;
}

export interface DashboardView {
  totals: { broken: number; weakened: number; safe: number; total: number; hndlExposed: number };
  riskScore: number;
  postureSeries: { week: string; broken: number; weakened: number; safe: number }[];
  recentScans: { id: string; kind: string; target: string; ranAt: string | null; findings: number }[];
  topFindings: TopFinding[];
  live: boolean;
}

const MOCK_VIEW: DashboardView = {
  totals,
  riskScore,
  postureSeries,
  recentScans: recentScans.map((s) => ({
    id: s.id,
    kind: s.kind,
    target: s.target,
    ranAt: s.ranAt,
    findings: s.findings,
  })),
  topFindings: [...assets]
    .filter((a) => a.status !== "safe")
    .sort((a, b) => b.hndlRisk - a.hndlRisk)
    .slice(0, 6)
    .map((a) => ({
      id: a.id,
      name: a.name,
      kind: a.kind,
      algorithm: a.algorithm,
      status: a.status,
      owner: a.owner,
      environment: a.environment,
      hndlRisk: a.hndlRisk,
    })),
  live: false,
};

export function useDashboard(): DashboardView {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.dashboard,
    retry: 0,
    refetchInterval: 15_000,
  });
  if (!data) return MOCK_VIEW;
  return {
    totals: data.totals,
    riskScore: data.riskScore,
    postureSeries: data.postureSeries,
    recentScans: data.recentScans.map((s) => ({
      id: s.id,
      kind: s.kind,
      target: s.target,
      ranAt: s.ranAt,
      findings: s.findings,
    })),
    topFindings: data.topFindings.map((a) => ({
      id: a.id,
      name: a.name,
      kind: a.kind,
      algorithm: a.algorithm,
      status: a.status,
      owner: a.owner ?? "—", // honest: backend can't know owner -> shown as —
      environment: a.environment ?? "—",
      hndlRisk: a.hndlRisk,
    })),
    live: true,
  };
}
