import type { ReactNode } from "react";
import { Terminal } from "lucide-react";

/**
 * A cinematic app/browser chrome frame for product mockups — title bar with
 * traffic-light dots, an optional live indicator, layered shadow + glow.
 * Inherits theme tokens, so it renders correctly inside `.section-dark` too.
 */
export function AppWindow({
  title = "aegis",
  icon = true,
  live = false,
  glow = false,
  className = "",
  bodyClassName = "",
  children,
}: {
  title?: string;
  icon?: boolean;
  live?: boolean;
  glow?: boolean;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className={`relative ${className}`}>
      {glow && (
        <div className="pointer-events-none absolute -inset-8 -z-10 bg-quantum-soft opacity-60 blur-3xl" />
      )}
      <div className="glass overflow-hidden rounded-xl">
        <div className="flex items-center gap-2 border-b border-border bg-foreground/[0.035] px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-shor/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-grover/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-pqc/70" />
          </div>
          <div className="ml-2 inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            {icon && <Terminal className="h-3 w-3" />}
            {title}
          </div>
          {live && (
            <div className="ml-auto inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-pqc" /> live
            </div>
          )}
        </div>
        <div className={bodyClassName}>{children}</div>
      </div>
    </div>
  );
}
