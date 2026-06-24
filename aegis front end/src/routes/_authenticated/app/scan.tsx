import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, GitBranch, Globe, Loader2, Play, Square, Terminal } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";

export const Route = createFileRoute("/_authenticated/app/scan")({ component: ScanPage });

type Mode = "domain" | "repo";

const DOMAIN_SCRIPT: Line[] = [
  { kind: "cmd",   text: "$ aegis scan acme.com --depth=subdomains+ct" },
  { kind: "info",  text: "→ Resolving DNS, CT logs, passive sources…" },
  { kind: "info",  text: "→ 412 subdomains discovered (crt.sh, ctlogs.io, internal)" },
  { kind: "info",  text: "→ Probing TLS on 412 endpoints (parallel=32)" },
  { kind: "tls",   host: "api.acme.com",          algo: "RSA-2048",   status: "broken" },
  { kind: "tls",   host: "checkout.acme.com",     algo: "ECDSA-P256", status: "broken" },
  { kind: "tls",   host: "admin.acme.com",        algo: "X25519MLKEM768", status: "safe" },
  { kind: "tls",   host: "vault.acme.internal",   algo: "RSA-4096",   status: "broken" },
  { kind: "tls",   host: "edi.acme.com",          algo: "DH-2048",    status: "broken" },
  { kind: "tls",   host: "otel.acme.internal",    algo: "AES-128",    status: "weakened" },
  { kind: "tls",   host: "legacy-sso.acme.com",   algo: "SHA-1",      status: "broken" },
  { kind: "info",  text: "→ Probing SSH banners on 27 bastions…" },
  { kind: "tls",   host: "git-bastion-01",        algo: "Ed25519",    status: "broken" },
  { kind: "info",  text: "→ Mining MX & SMTP TLS profiles…" },
  { kind: "info",  text: "→ Cross-referencing against CT log historical issuance" },
  { kind: "ok",    text: "✓ Scan scn_92 complete in 47.3s — 27 findings written to inventory" },
];

const REPO_SCRIPT: Line[] = [
  { kind: "cmd",   text: "$ aegis scan --repo github.com/acme/payments-svc" },
  { kind: "info",  text: "→ Cloning shallow @ HEAD (depth=1) …" },
  { kind: "info",  text: "→ Parsing Go AST + go.sum (1,284 files, 312 deps)" },
  { kind: "tls",   host: "internal/jwt/sign.go:42",    algo: "ECDSA-P256", status: "broken" },
  { kind: "tls",   host: "vendor/crypto-tls:openssl",  algo: "RSA-2048",   status: "broken" },
  { kind: "tls",   host: "internal/storage/aead.go",   algo: "AES-256",    status: "safe" },
  { kind: "tls",   host: "cmd/sign/release.go:88",     algo: "ML-DSA-65",  status: "safe" },
  { kind: "info",  text: "→ Resolving call graph for crypto/* usages" },
  { kind: "info",  text: "→ 14 sinks reach external surfaces (TLS, JWT, JWS)" },
  { kind: "ok",    text: "✓ Scan scn_93 complete — 14 findings, 2 require dependency bumps" },
];

type Line =
  | { kind: "cmd"; text: string }
  | { kind: "info"; text: string }
  | { kind: "ok"; text: string }
  | { kind: "tls"; host: string; algo: string; status: "broken" | "weakened" | "safe" };

function ScanPage() {
  const [mode, setMode] = useState<Mode>("domain");
  const [target, setTarget] = useState("acme.com");
  const [running, setRunning] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [complete, setComplete] = useState(false);
  const timers = useRef<number[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines]);

  function start() {
    cancel();
    setRunning(true);
    setComplete(false);
    setLines([]);
    const script = mode === "domain" ? DOMAIN_SCRIPT : REPO_SCRIPT;
    script.forEach((line, i) => {
      const id = window.setTimeout(() => {
        setLines((prev) => [...prev, line]);
        if (i === script.length - 1) {
          setRunning(false);
          setComplete(true);
        }
      }, 350 + i * 420);
      timers.current.push(id);
    });
  }

  function cancel() {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setRunning(false);
  }

  return (
    <>
      <PageHeader
        eyebrow="Discover"
        title="New scan"
        description="Black-box cryptographic discovery from a single hostname, or white-box from source. Aegis writes results straight into your inventory."
      />
      <div className="grid gap-6 px-8 py-8 lg:grid-cols-[420px_1fr]">
        <aside className="space-y-6">
          <div className="surface p-5">
            <div className="flex gap-1 rounded-md border border-border bg-elevated-2 p-1">
              <ModeBtn active={mode === "domain"} onClick={() => setMode("domain")} icon={Globe} label="Domain" />
              <ModeBtn active={mode === "repo"} onClick={() => setMode("repo")} icon={GitBranch} label="Repository" />
            </div>

            <div className="mt-5 space-y-3">
              <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {mode === "domain" ? "Target domain" : "Repository URL"}
              </label>
              <input
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={mode === "domain" ? "acme.com" : "github.com/acme/payments-svc"}
                className="h-10 w-full rounded-md border border-border bg-elevated-2 px-3 font-mono text-sm focus:border-quantum-cyan focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Toggle label="Probe TLS" defaultOn />
                <Toggle label="CT logs" defaultOn />
                <Toggle label="SSH banners" defaultOn={mode === "domain"} />
                <Toggle label="Dep graph" defaultOn={mode === "repo"} />
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              {!running ? (
                <button
                  onClick={start}
                  disabled={!target}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-quantum px-4 text-sm font-medium text-primary-foreground glow-cyan transition-transform hover:scale-[1.02] disabled:opacity-50"
                >
                  <Play className="h-4 w-4" /> Run scan
                </button>
              ) : (
                <button
                  onClick={cancel}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-border bg-elevated-2 px-4 text-sm text-foreground hover:border-destructive/40 hover:text-destructive"
                >
                  <Square className="h-4 w-4" /> Cancel
                </button>
              )}
            </div>
          </div>

          {complete && (
            <div className="surface animate-fade-in p-5">
              <div className="flex items-center gap-2 text-pqc">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Scan complete</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                Findings have been written to your inventory and the prioritization queue.
              </p>
              <div className="mt-4 flex gap-2">
                <Link to="/app/assets" className="inline-flex h-9 flex-1 items-center justify-center rounded-md bg-quantum px-3 text-xs font-medium text-primary-foreground">View assets</Link>
                <Link to="/app/prioritization" className="inline-flex h-9 flex-1 items-center justify-center rounded-md border border-border bg-elevated-2 px-3 text-xs hover:text-quantum-cyan">Prioritize</Link>
              </div>
            </div>
          )}
        </aside>

        <div className="surface relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-elevated-2/40 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-shor/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-grover/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-pqc/70" />
              </div>
              <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                aegis@scanner — {mode === "domain" ? target : target.replace(/^https?:\/\//, "")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {running ? (<><Loader2 className="h-3 w-3 animate-spin text-quantum-cyan" /> running</>) : (<><Terminal className="h-3 w-3" /> idle</>)}
            </div>
          </div>

          <div
            ref={scrollRef}
            className="relative h-[520px] overflow-auto bg-[oklch(0.10_0.025_265)] p-5 font-mono text-[12.5px] leading-relaxed"
          >
            {running && (
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px animate-scan bg-quantum-cyan/60" />
            )}
            {lines.length === 0 && !running && (
              <div className="text-muted-foreground">
                <span className="text-quantum-cyan">aegis</span> ready. Press <span className="rounded border border-border bg-elevated-2 px-1.5 py-0.5 text-[10px]">Run scan</span> to begin.
              </div>
            )}
            {lines.map((l, i) => (
              <LineRow key={i} line={l} />
            ))}
            {running && (
              <div className="mt-1 inline-block h-4 w-2 animate-pulse bg-quantum-cyan" aria-hidden />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function LineRow({ line }: { line: Line }) {
  if (line.kind === "cmd") return <div className="text-foreground">{line.text}</div>;
  if (line.kind === "info") return <div className="text-muted-foreground">{line.text}</div>;
  if (line.kind === "ok") return <div className="mt-1 text-pqc">{line.text}</div>;
  const color = line.status === "broken" ? "text-shor" : line.status === "weakened" ? "text-grover" : "text-pqc";
  const tag = line.status === "broken" ? "BROKEN" : line.status === "weakened" ? "WEAK  " : "SAFE  ";
  return (
    <div className="animate-fade-in flex gap-3">
      <span className={`${color}`}>[{tag}]</span>
      <span className="text-foreground/90">{line.host}</span>
      <span className="text-muted-foreground">→</span>
      <span className="text-foreground">{line.algo}</span>
    </div>
  );
}

function ModeBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Globe; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
        active ? "bg-quantum text-primary-foreground glow-cyan" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function Toggle({ label, defaultOn }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(!!defaultOn);
  return (
    <button
      onClick={() => setOn(!on)}
      className={`flex items-center justify-between rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
        on ? "border-quantum-cyan/40 bg-quantum-soft text-foreground" : "border-border bg-elevated-2 text-muted-foreground"
      }`}
    >
      <span>{label}</span>
      <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-quantum-cyan" : "bg-muted"}`} />
    </button>
  );
}
