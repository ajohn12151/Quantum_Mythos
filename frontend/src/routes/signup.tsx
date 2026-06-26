import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { AegisLogo } from "@/components/AegisLogo";
import { Reveal } from "@/components/marketing/Reveal";
import { MotionConfig } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, MailCheck } from "lucide-react";
import { AuthShell } from "./login";

export const Route = createFileRoute("/signup")({
  validateSearch: (s: Record<string, unknown>) => ({
    domain: typeof s.domain === "string" ? s.domain : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Create your Aegis account" },
      { name: "description", content: "Start with a free external quantum-risk scan." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z
      .object({ email: z.string().email(), password: z.string().min(6) })
      .safeParse({ email, password });
    if (!parsed.success)
      return toast.error("Enter a valid email and a password of at least 6 characters.");
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + "/app" },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    // With email confirmation enabled, signUp returns no session — the user must
    // click the link in their inbox before they have one. Show that state instead
    // of routing into the app (which would bounce them back to /login).
    if (!data.session) {
      setSentTo(email);
      toast.success("Check your email to confirm your account.");
      return;
    }
    // Confirmation disabled — session is live, go straight in.
    toast.success("Account created. Welcome to Aegis.");
    navigate({ to: "/app" });
  };

  const onGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) return toast.error(result.error.message ?? "Google sign-in failed.");
    if (result.redirected) return;
    navigate({ to: "/app" });
  };

  if (sentTo) return <CheckEmailNotice email={sentTo} />;

  return (
    <AuthShell
      mode="signup"
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

/* Shown after sign-up when email confirmation is required (no session yet). */
function CheckEmailNotice({ email }: { email: string }) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "var(--gradient-mesh)" }}
        />
        <div className="pointer-events-none absolute inset-0 -z-10 dot-bg opacity-30" />
        <Reveal className="w-full max-w-md" y={16}>
          <Link to="/" className="mb-10 flex justify-center">
            <AegisLogo size={32} />
          </Link>
          <div className="glass rounded-2xl p-8 text-center sm:p-9">
            <div className="mx-auto mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-elevated-2">
              <MailCheck className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Confirm your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a confirmation link to{" "}
              <span className="font-mono text-foreground">{email}</span>. Click it to
              activate your account, then sign in.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              No email after a minute? Check spam, or make sure the address is correct.
            </p>
            <Link
              to="/login"
              search={{ redirect: undefined }}
              className="mt-7 inline-flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground shadow-[var(--shadow-sm)] transition-colors hover:bg-primary/90"
            >
              Go to sign in
            </Link>
          </div>
          <Link
            to="/signup"
            search={{ domain: undefined }}
            className="group mt-4 inline-flex w-full items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => window.location.reload()}
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            Use a different email
          </Link>
        </Reveal>
      </div>
    </MotionConfig>
  );
}
