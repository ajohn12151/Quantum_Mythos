import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * CodeScan — the white-box showpiece. A self-animating source panel: a scan
 * sweep walks the file line-by-line, flags quantum-vulnerable crypto
 * (Shor-broken), then renders the proposed migration as a red→green diff and
 * confirms it verified. DOM + CSS only (no canvas), so it mounts cleanly under
 * jsdom. `prefers-reduced-motion` renders the resolved (verified) frame and
 * never animates.
 *
 * Honesty: the diff is labeled a *proposed* PR you review — Aegis never
 * silently rewrites cryptography.
 */
type Line =
  | { indent?: boolean; text: string }
  | { indent?: boolean; vuln: string; from: string; to: string };

const LINES: Line[] = [
  { text: "def issue_session(user):" },
  {
    indent: true,
    vuln: "RSA-2048",
    from: "priv = rsa.generate(2048)",
    to: "priv = ml_kem.hybrid(768)",
  },
  {
    indent: true,
    vuln: "ECDSA P-256",
    from: "sig  = ecdsa.sign(priv, user)",
    to: "sig  = ml_dsa.sign(priv, user)",
  },
  { indent: true, text: "return Session(priv, sig)" },
];

const NUM = LINES.length;
const SCAN_DONE = NUM; // all lines swept
const MIGRATE = NUM + 2; // diff appears
const VERIFY = NUM + 5; // verified badge
const TOTAL = NUM + 11; // hold on verified, then loop

function isVuln(l: Line): l is { indent?: boolean; vuln: string; from: string; to: string } {
  return "vuln" in l;
}

export function CodeScan() {
  const reduce = useReducedMotion();
  const [tick, setTick] = useState(reduce ? VERIFY : 0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setTick((t) => (t + 1) % TOTAL), 360);
    return () => clearInterval(id);
  }, [reduce]);

  const scanning = tick < SCAN_DONE;
  const migrated = tick >= MIGRATE;
  const verified = tick >= VERIFY;

  const status = verified
    ? { text: "verified · red → green", tone: "pqc" as const }
    : migrated
      ? { text: "proposed migration PR · review-gated", tone: "primary" as const }
      : scanning
        ? { text: "scanning session.py …", tone: "muted" as const }
        : { text: "2 quantum-vulnerable findings", tone: "shor" as const };

  return (
    <div className="flex h-[340px] flex-col bg-foreground/[0.02] font-mono text-[12.5px] leading-relaxed">
      {/* status strip */}
      <div className="flex items-center gap-2 border-b border-border/70 px-4 py-2.5">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            status.tone === "pqc"
              ? "bg-pqc"
              : status.tone === "shor"
                ? "bg-shor"
                : status.tone === "primary"
                  ? "bg-primary"
                  : "bg-muted-foreground"
          } ${scanning ? "animate-pulse-glow" : ""}`}
        />
        <span
          className={
            status.tone === "pqc"
              ? "text-pqc"
              : status.tone === "shor"
                ? "text-shor"
                : status.tone === "primary"
                  ? "text-primary"
                  : "text-muted-foreground"
          }
        >
          {verified && "✓ "}
          {status.text}
        </span>
        <span className="ml-auto text-[11px] text-muted-foreground/70">auth/session.py</span>
      </div>

      {/* code body */}
      <div className="flex-1 space-y-0.5 px-4 py-4">
        {LINES.map((l, i) => {
          const swept = tick > i;
          const active = tick === i && scanning;

          // Vulnerable line: red when swept (pre-migration), diff when migrated.
          if (isVuln(l)) {
            return (
              <div key={i} className="rounded-sm">
                {migrated ? (
                  <div className="space-y-0.5">
                    <Row indent className="text-shor">
                      <span className="select-none text-shor/70">- </span>
                      {l.from}
                    </Row>
                    <Row indent className="text-pqc">
                      <span className="select-none text-pqc/70">+ </span>
                      {l.to}
                    </Row>
                  </div>
                ) : (
                  <Row
                    indent
                    active={active}
                    className={swept ? "text-shor" : "text-foreground/80"}
                  >
                    {l.from}
                    {swept && (
                      <span className="status-shor ml-2 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                        {l.vuln} · Shor-broken
                      </span>
                    )}
                  </Row>
                )}
              </div>
            );
          }

          return (
            <Row key={i} indent={l.indent} active={active} className="text-foreground/80">
              {l.text}
            </Row>
          );
        })}

        {/* verify line */}
        <div className="pt-3">
          {verified ? (
            <span className="text-pqc">✓ re-scan clean — finding closed</span>
          ) : migrated ? (
            <span className="text-muted-foreground/70">running differential round-trip …</span>
          ) : (
            <span className="text-transparent select-none">.</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  children,
  indent,
  active,
  className = "",
}: {
  children: React.ReactNode;
  indent?: boolean;
  active?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative rounded-sm transition-colors ${active ? "bg-primary/10" : ""} ${
        indent ? "pl-6" : ""
      } ${className}`}
    >
      {active && (
        <span className="absolute -left-1 top-0 h-full w-0.5 rounded-full bg-primary" aria-hidden />
      )}
      {children}
    </div>
  );
}
