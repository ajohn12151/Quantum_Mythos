import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { AegisLogo } from "@/components/AegisLogo";
import { Reveal } from "@/components/marketing/Reveal";
import { MotionConfig } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useStartDemo } from "@/lib/demo-auth";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Aegis" },
      {
        name: "description",
        content: "Sign in to your Aegis quantum cryptographic posture dashboard.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z
      .object({ email: z.string().email(), password: z.string().min(6) })
      .safeParse({ email, password });
    if (!parsed.success)
      return toast.error("Enter a valid email and a password of at least 6 characters.");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back.");
    navigate({ to: redirect ?? "/app" });
  };

  const onGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) return toast.error(result.error.message ?? "Google sign-in failed.");
    if (result.redirected) return;
    navigate({ to: redirect ?? "/app" });
  };

  return (
    <AuthShell
      mode="login"
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      loading={loading}
      onSubmit={onSubmit}
      onGoogle={onGoogle}
    />
  );
}

/* ---- Shared shell, also used by /signup ---- */
export function AuthShell(props: {
  mode: "login" | "signup";
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onGoogle: () => void;
}) {
  const isLogin = props.mode === "login";
  const onDemo = useStartDemo();
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "var(--gradient-mesh)" }}
        />
        <div className="pointer-events-none absolute inset-0 -z-10 dot-bg opacity-30" />
        <Link
          to="/"
          className="group absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to home
        </Link>
        <Reveal className="w-full max-w-md" y={16}>
          <Link to="/" className="mb-10 flex justify-center">
            <AegisLogo size={32} />
          </Link>
          <div className="glass rounded-2xl p-8 sm:p-9">
            <h1 className="text-2xl font-semibold tracking-tight">
              {isLogin ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isLogin ? "Sign in to your Aegis dashboard." : "Start with a free external scan."}
            </p>

            <button
              type="button"
              onClick={props.onGoogle}
              className="mt-7 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border bg-elevated-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <GoogleIcon /> Continue with Google
            </button>

            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={props.onSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Email
                </span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={props.email}
                  onChange={(e) => props.setEmail(e.target.value)}
                  className="h-11 w-full rounded-md border border-border bg-elevated-2 px-3 font-mono text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Password
                </span>
                <input
                  type="password"
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  value={props.password}
                  onChange={(e) => props.setPassword(e.target.value)}
                  className="h-11 w-full rounded-md border border-border bg-elevated-2 px-3 font-mono text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <button
                type="submit"
                disabled={props.loading}
                className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground shadow-[var(--shadow-sm)] transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {props.loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLogin ? "Sign in" : "Create account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {isLogin ? (
                <>
                  Don't have an account?{" "}
                  <Link
                    to="/signup"
                    search={{ domain: undefined }}
                    className="font-medium text-primary hover:text-primary/80"
                  >
                    Sign up
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    search={{ redirect: undefined }}
                    className="font-medium text-primary hover:text-primary/80"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onDemo}
            className="group mt-4 inline-flex w-full items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Explore the live demo — no account needed
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </Reveal>
      </div>
    </MotionConfig>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.4 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.3-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 16 18.9 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.4 29 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 43.5c5 0 9.5-1.9 12.9-5l-6-4.9c-2 1.5-4.5 2.4-6.9 2.4-5.2 0-9.6-3-11.3-7.5l-6.6 5.1C9.5 39 16.2 43.5 24 43.5z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.4 5.4l6 4.9c-.4.4 6.6-4.8 6.6-14.3 0-1.2-.1-2.4-.3-3.5z"
      />
    </svg>
  );
}
