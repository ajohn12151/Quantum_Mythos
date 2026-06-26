/**
 * Demo session — a clearly-labeled, opt-in bypass of the Supabase auth guard so
 * the product is always reachable for a walkthrough (and during local build /
 * the demo video) even without real credentials. It never weakens real auth:
 * the guard always prefers a real Supabase user, and only falls back to this
 * explicit local flag when the visitor chose "Explore the live demo".
 */
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

const KEY = "aegis_demo_session";

export const demoUser = {
  id: "demo-user",
  email: "demo@aegis.app",
  name: "Demo Analyst",
} as const;

export function isDemoSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function startDemoSession(): void {
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    /* storage unavailable — demo simply won't persist */
  }
}

export function endDemoSession(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* no-op */
  }
}

/**
 * Shared handler for every "Explore the live demo" entry point (marketing
 * header, hero, and the auth screens) so they behave identically: start the
 * opt-in demo session and route into the product.
 */
export function useStartDemo() {
  const navigate = useNavigate();
  return () => {
    startDemoSession();
    toast.success("Exploring the live demo.");
    navigate({ to: "/app" });
  };
}
