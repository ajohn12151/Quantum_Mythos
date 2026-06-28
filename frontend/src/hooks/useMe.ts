// Current org identity for the topbar org switcher. Falls back to "Demo Org"
// while loading or when the backend is unreachable.
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useMe(): { orgName: string; plan: string } {
  const { data } = useQuery({ queryKey: ["me"], queryFn: api.me, retry: 0 });
  return { orgName: data?.orgName ?? "Demo Org", plan: data?.plan ?? "free" };
}
