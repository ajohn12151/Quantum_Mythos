// Assets list hook. Fetches the live backend DTOs; falls back to mock data when
// the API is unreachable (same ethos as useDashboard). `live` tells the UI which.
import { useQuery } from "@tanstack/react-query";
import { api, type AssetDTO } from "@/lib/api";
import { assets as mockAssets, type CryptoStatus } from "@/lib/mock-data";

export interface AssetView {
  id: string;
  name: string;
  kind: string;
  host: string | null;
  algorithm: string;
  status: CryptoStatus;
  exposure: string;
  owner: string;
  environment: string;
  hndlRisk: number;
  remediationState: string | null;
}

function fromDTO(a: AssetDTO): AssetView {
  return {
    id: a.id,
    name: a.name,
    kind: a.kind,
    host: a.host,
    algorithm: a.algorithm,
    status: a.status,
    exposure: a.exposure,
    owner: a.owner ?? "—", // backend can't know owner — shown as — (never fabricated)
    environment: a.environment ?? "—",
    hndlRisk: a.hndlRisk,
    remediationState: a.remediationState,
  };
}

const MOCK: AssetView[] = mockAssets.map((a) => ({
  id: a.id,
  name: a.name,
  kind: a.kind,
  host: a.host ?? null,
  algorithm: a.algorithm,
  status: a.status,
  exposure: a.exposure,
  owner: a.owner,
  environment: a.environment,
  hndlRisk: a.hndlRisk,
  remediationState: "discovered",
}));

export function useAssets(): { rows: AssetView[]; live: boolean; loading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ["assets"],
    queryFn: api.assets,
    retry: 0,
    refetchInterval: 15_000,
  });
  if (!data) return { rows: MOCK, live: false, loading: isLoading };
  return { rows: data.map(fromDTO), live: true, loading: false };
}
