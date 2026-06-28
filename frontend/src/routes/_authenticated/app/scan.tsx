import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, GitBranch, Globe, Loader2, Play, Square, Terminal } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Reveal } from "@/components/marketing/Reveal";
import { useCountUp } from "@/hooks/use-count-up";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/app/scan")({ component: ScanPage });

type Mode = "domain" | "repo";

type Line =
  | { kind: "cmd"; text: string }
  | { kind: "info"; text: string }
  | { kind: "ok"; text: string }
  | { kind: "err"; text: string }
  | { kind: "tls"; host: string; algo: string; status: "broken" | "weakened" | "safe" };

const POLL_MS = 2000;
const POLL_TIMEOUT_MS = 180_000; // give white-box clones/semgrep room

// Build human progress lines from a scan's real summary_json.
function summaryLines(mode: Mode, s: Record<string, number>): string[] {
  const out: string[] = [];
  if (mode === "domain") {
    if (s.hosts_scanned != null) out.push(`→ Probed ${s.hosts_scanned} endpoints`);
    if (s.shadow_hosts_discovered != null)
      out.push(`→ ${s.shadow_hosts_discovered} shadow hosts surfaced via CT logs`);
    if (s.tls_hosts != null)
      out.push(`→ ${s.tls_hosts} TLS · ${s.ssh_host_keys ?? 0} SSH · ${s.mail_servers ?? 0} mail`);
    if (s.no_forward_secrecy) out.push(`→ ${s.no_forward_secrecy} endpoints without forward secrecy`);
  } else {
    if (s.total != null) out.push(`→ ${s.total} raw findings`);
    if (s.suppressed_false_positives != null)
      out.push(`→ ${s.suppressed_false_positives} false positives suppressed (triage)`);
    if (s.pqc_vulnerable != null) out.push(`→ ${s.pqc_vulnerable} quantum-vulnerable keygens`);
    if (s.misuse_findings != null) out.push(`→ ${s.misuse_findings} classical misuse findings`);
  }
  return out;
}

function findingsTotal(mode: Mode, s: Record<string, number>): number {
  return mode === "domain"
    ? (s.assets_found ?? 0)
    : (s.pqc_vulnerable ?? 0) + (s.misuse_findings ?? 0);
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function ScanPage() {
  const [mode, setMode] = useState<Mode>("domain");
  const [target, setTarget] = useState("");
  const [running, setRunning] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [complete, setComplete] = useState(false);
  const [findings, setFindings] = useState(0);
  const runId = useRef(0); // bumped per run so stale polls/cancels are ignored
  const pollTimer = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => stopPolling(), []);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines]);

  const push = (line: Line) => setLines((prev) => [...prev, line]);

  function stopPolling() {
    if (pollTimer.current !== null) {
      window.clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  }

  async function start() {
    stopPolling();
    const myRun = ++runId.current;
    setRunning(true);
    setComplete(false);
    setFindings(0);
    setLines([]);

    const scanMode = mode === "domain" ? "black_box" : "white_box";
    const t = target.trim();
    push({ kind: "cmd", text: `$ aegis scan ${t}` });
    push({
      kind: "info",
      text:
        mode === "domain"
          ? "→ Submitting black-box scan (TLS · CT logs · SSH · mail)…"
          : "→ Submitting white-box scan (clone · semgrep · triage)…",
    });

    let handle;
    try {
      handle = await api.createScan(scanMode, t);
    } catch (e) {
      if (myRun !== runId.current) return;
      push({ kind: "err", text: `✗ Could not reach the scanner API — ${(e as Error).message}` });
      setRunning(false);
      return;
    }
    if (myRun !== runId.current) return;
    push({ kind: "info", text: `→ Scan ${handle.scan_id.slice(0, 8)} running on the server…` });

    const startedAt = Date.now();
    const poll = async () => {
      if (myRun !== runId.current) return;
      let status = "running";
      let summaryRaw: unknown = null;
      try {
        const s = await api.scanStatus(handle.scan_id);
        status = s.status;
        summaryRaw = s.summary_json;
      } catch {
        // transient (e.g. Render cold start) — keep polling
      }
      if (myRun !== runId.current) return;

      if (status === "done") {
        await finish(handle.scan_id, summaryRaw, myRun);
      } else if (status === "error") {
        push({ kind: "err", text: "✗ Scan failed on the server. Check the target and try again." });
        setRunning(false);
      } else if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        push({
          kind: "err",
          text: "✗ Scan timed out here — it may still finish on the server; check the dashboard shortly.",
        });
        setRunning(false);
      } else {
        pollTimer.current = window.setTimeout(poll, POLL_MS);
      }
    };
    pollTimer.current = window.setTimeout(poll, POLL_MS);
  }

  async function finish(scanId: string, summaryRaw: unknown, myRun: number) {
    let summary: Record<string, number> = {};
    const parsed = typeof summaryRaw === "string" ? safeParse(summaryRaw) : summaryRaw;
    if (parsed && typeof parsed === "object") summary = parsed as Record<string, number>;

    summaryLines(mode, summary).forEach((text) => push({ kind: "info", text }));

    // Pull the real discovered assets so the terminal shows actual findings.
    let total = findingsTotal(mode, summary);
    try {
      const dash = await api.dashboard();
      if (myRun !== runId.current) return;
      (dash.topFindings ?? []).slice(0, 12).forEach((a) =>
        push({
          kind: "tls",
          host: a.host ?? a.name,
          algo: a.algorithm,
          status: a.status === "weakened" ? "weakened" : a.status === "safe" ? "safe" : "broken",
        }),
      );
      if (!total) total = dash.totals?.total ?? 0;
    } catch {
      // best-effort; summary counts still shown
    }

    push({
      kind: "ok",
      text: `✓ Scan ${scanId.slice(0, 8)} complete — ${total} findings written to inventory`,
    });
    setFindings(total);
    setRunning(false);
    setComplete(true);
  }

  function cancel() {
    stopPolling();
    runId.current++; // invalidate any in-flight poll/finish
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
            <div className="flex gap-1 rounded-lg border border-border bg-muted p-1">
              <ModeBtn
                active={mode === "domain"}
                onClick={() => setMode("domain")}
                icon={Globe}
                label="Domain"
              />
              <ModeBtn
                active={mode === "repo"}
                onClick={() => setMode("repo")}
                icon={GitBranch}
                label="Repository"
              />
            </div>

            <div className="mt-5 space-y-3">
              <label className="block font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {mode === "domain" ? "Target domain" : "Repository URL"}
              </label>
              <input
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && target.trim() && !running) start();
                }}
                placeholder={mode === "domain" ? "github.com" : "https://github.com/owner/repo"}
                className="h-10 w-full rounded-lg border border-border bg-card px-3 font-mono text-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring"
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
                  disabled={!target.trim()}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[var(--shadow-sm)] transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  <Play className="h-4 w-4" /> Run scan
                </button>
              ) : (
                <button
                  onClick={cancel}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm text-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
                >
                  <Square className="h-4 w-4" /> Cancel
                </button>
              )}
            </div>
          </div>

          {complete && (
            <Reveal immediate className="surface animate-fade-in p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-pqc">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-semibold">Scan complete</span>
                </div>
                <FindingsCount target={findings} start={complete} />
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                Findings have been written to your inventory and the prioritization queue.
              </p>
              <div className="mt-4 flex gap-2">
                <Link
                  to="/app/assets"
                  className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  View assets
                </Link>
                <Link
                  to="/app/prioritization"
                  className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent/60"
                >
                  Prioritize
                </Link>
              </div>
            </Reveal>
          )}
        </aside>

        <div className="surface relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-shor/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-grover/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-pqc/70" />
              </div>
              <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                aegis@scanner — {target ? target.replace(/^https?:\/\//, "") : "idle"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {running ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-quantum-cyan" /> running
                </>
              ) : (
                <>
                  <Terminal className="h-3 w-3" /> idle
                </>
              )}
            </div>
          </div>

          <div
            ref={scrollRef}
            className="relative h-[520px] overflow-auto rounded-b-xl bg-muted p-5 font-mono text-[12.5px] leading-relaxed"
          >
            {running && (
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px animate-scan bg-quantum-cyan/60" />
            )}
            {lines.length === 0 && !running && (
              <div className="text-muted-foreground">
                <span className="text-quantum-cyan">aegis</span> ready. Enter a{" "}
                {mode === "domain" ? "domain" : "repository URL"} and press{" "}
                <span className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px]">
                  Run scan
                </span>{" "}
                to begin.
              </div>
            )}
            {lines.map((l, i) => (
              <LineRow key={i} line={l} />
            ))}
            {running && (
              <div
                className="mt-1 inline-block h-4 w-2 animate-pulse bg-quantum-cyan"
                aria-hidden
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function FindingsCount({ target, start }: { target: number; start: boolean }) {
  const n = useCountUp(target, { start, duration: 700 });
  return (
    <span className="inline-flex items-baseline gap-1 font-mono text-xs text-muted-foreground">
      <span className="text-base font-semibold tabular-nums text-foreground">{n}</span>
      findings
    </span>
  );
}

function LineRow({ line }: { line: Line }) {
  if (line.kind === "cmd") return <div className="text-foreground">{line.text}</div>;
  if (line.kind === "info") return <div className="text-muted-foreground">{line.text}</div>;
  if (line.kind === "ok") return <div className="mt-1 text-pqc">{line.text}</div>;
  if (line.kind === "err") return <div className="mt-1 text-shor">{line.text}</div>;
  const color =
    line.status === "broken"
      ? "text-shor"
      : line.status === "weakened"
        ? "text-grover"
        : "text-pqc";
  const tag =
    line.status === "broken" ? "BROKEN" : line.status === "weakened" ? "WEAK  " : "SAFE  ";
  return (
    <div className="animate-fade-in flex gap-3">
      <span className={`${color}`}>[{tag}]</span>
      <span className="text-foreground/90">{line.host}</span>
      <span className="text-muted-foreground">→</span>
      <span className="text-foreground">{line.algo}</span>
    </div>
  );
}

function ModeBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Globe;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
        active
          ? "bg-card text-foreground shadow-[var(--shadow-sm)]"
          : "text-muted-foreground hover:text-foreground"
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
        on
          ? "border-primary/30 bg-accent text-accent-foreground"
          : "border-border bg-muted text-muted-foreground"
      }`}
    >
      <span>{label}</span>
      <span
        className={`h-1.5 w-1.5 rounded-full ${on ? "bg-primary" : "bg-muted-foreground/40"}`}
      />
    </button>
  );
}
