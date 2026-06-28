import { useRef } from "react";
import { useInView } from "framer-motion";
import { GitPullRequest, Globe, ShieldAlert, Timer } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";
import { SpotlightCard } from "@/components/marketing/SpotlightCard";
import { NetworkScan } from "@/components/marketing/NetworkScan";
import { useCountUp } from "@/hooks/use-count-up";

/**
 * BentoFeatures — a glass bento grid of capabilities, each tile with its own
 * micro-animation. The hero tile embeds the live <NetworkScan> showpiece.
 */
export function BentoFeatures() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative border-t border-border py-28">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <span className="h-px w-6 bg-primary/40" />
            One engine, every surface
          </div>
          <h2 className="mt-4 max-w-3xl text-balance text-3xl font-semibold leading-[1.12] tracking-tight md:text-4xl">
            Everything quantum will break — found, ranked, fixed.
          </h2>
        </Reveal>

        <div ref={ref} className="mt-12 grid gap-4 lg:grid-cols-3">
          {/* Live discovery — the NetworkScan showpiece */}
          <SpotlightCard
            className="rounded-2xl p-6 lg:col-span-2"
            innerClassName="flex h-full flex-col"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-quantum-cyan" />
                <span className="text-sm font-semibold">Live external discovery</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-pqc" /> scanning
              </span>
            </div>
            <div className="relative mt-4 min-h-[240px] flex-1 overflow-hidden rounded-xl border border-border bg-foreground/[0.02]">
              <NetworkScan />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <Counter
                to={47}
                start={inView}
                className="font-mono text-2xl font-semibold tabular-nums"
              />
              <span className="text-sm text-muted-foreground">
                shadow subdomains surfaced from CT logs — with zero integration.
              </span>
            </div>
          </SpotlightCard>

          {/* Time-to-break */}
          <SpotlightCard
            className="rounded-2xl p-6"
            innerClassName="flex h-full flex-col justify-between"
          >
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-quantum-violet" />
              <span className="text-sm font-semibold">Quantum time-to-break</span>
            </div>
            <div className="py-6">
              <div className="text-gradient font-display text-5xl font-semibold tracking-tight">
                2030s
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                The credible window for RSA-2048 — an estimated range grounded in quantum
                fault-tolerance resource estimation, not a fixed date or vibes.
              </p>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-quantum transition-[width] duration-1000"
                style={{ width: inView ? "72%" : "0%" }}
              />
            </div>
          </SpotlightCard>

          {/* Forward secrecy */}
          <SpotlightCard
            className="rounded-2xl p-6"
            innerClassName="flex h-full flex-col justify-between"
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-shor" />
              <span className="text-sm font-semibold">Forward-secrecy & HNDL</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The catastrophic find: one future key-break decrypts every session ever recorded.
            </p>
            <div className="mt-4 space-y-2">
              {["legacy-api · no FS", "vault · RSA key-transport"].map((l) => (
                <div
                  key={l}
                  className="status-shor flex items-center justify-between rounded-md px-2.5 py-1.5 font-mono text-[11px]"
                >
                  <span>{l}</span>
                  <span className="animate-pulse-glow uppercase tracking-wider">critical</span>
                </div>
              ))}
            </div>
          </SpotlightCard>

          {/* Auto-PR */}
          <SpotlightCard
            className="rounded-2xl p-6 lg:col-span-2"
            innerClassName="flex h-full flex-col"
          >
            <div className="flex items-center gap-2">
              <GitPullRequest className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Safely-bounded migration PRs</span>
            </div>
            <div className="mt-4 grid flex-1 gap-4 sm:grid-cols-2">
              <div className="overflow-x-auto rounded-lg border border-border bg-foreground/[0.02] p-4 font-mono text-[12px] leading-relaxed">
                <div className="text-shor">- ecdsa.New(P256, key)</div>
                <div className="text-pqc">+ pqc.Hybrid(ML_DSA_65, key)</div>
                <div className="mt-2 text-muted-foreground">✓ differential round-trip</div>
                <div className="text-muted-foreground">✓ size assertion · 3309 B</div>
              </div>
              <p className="self-center text-sm leading-relaxed text-muted-foreground">
                The agent does the agility refactor; the primitive comes from a verified library; a
                human approves. Re-scan flips the row <span className="text-shor">red</span> →{" "}
                <span className="text-pqc">green</span>.
              </p>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </section>
  );
}

function Counter({ to, start, className }: { to: number; start: boolean; className?: string }) {
  const n = useCountUp(to, { start });
  return <span className={className}>{n}</span>;
}
