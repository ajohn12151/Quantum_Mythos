// White-box findings hook. Live backend DTOs with mock fallback (see useDashboard).
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { findings as mockFindings, type Finding } from "@/lib/mock-data";

export function useFindings(): { rows: Finding[]; live: boolean } {
  const { data } = useQuery({
    queryKey: ["findings"],
    queryFn: api.findings,
    retry: 0,
    refetchInterval: 15_000,
  });
  if (!data) return { rows: mockFindings, live: false };
  // FindingDTO is structurally identical to the Finding view model.
  return { rows: data as Finding[], live: true };
}
