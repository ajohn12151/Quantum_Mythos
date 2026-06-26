import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { demoUser, isDemoSession } from "@/lib/demo-auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // Prefer a real Supabase session; fall back to the opt-in demo session.
    let user: { id: string; email?: string } | null = null;
    try {
      const { data } = await supabase.auth.getUser();
      user = data.user ?? null;
    } catch {
      user = null;
    }
    if (user) return { user };
    if (isDemoSession()) return { user: demoUser };
    throw redirect({ to: "/login", search: { redirect: location.href } });
  },
  component: () => <Outlet />,
});
