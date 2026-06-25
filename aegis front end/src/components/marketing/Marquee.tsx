import type { CSSProperties, ReactNode } from "react";

/**
 * Infinite horizontal ticker. Renders its children twice and translates by
 * -50% for a seamless loop. Pauses on hover; the global reduced-motion guard
 * freezes the animation, leaving the content statically visible.
 */
export function Marquee({
  children,
  durationSec = 32,
  className = "",
}: {
  children: ReactNode;
  durationSec?: number;
  className?: string;
}) {
  return (
    <div
      className={`group relative overflow-hidden ${className}`}
      style={{ "--marquee-duration": `${durationSec}s` } as CSSProperties}
    >
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
      <div className="flex w-max animate-marquee items-center gap-3 group-hover:[animation-play-state:paused]">
        <div className="flex shrink-0 items-center gap-3" aria-hidden={false}>
          {children}
        </div>
        <div className="flex shrink-0 items-center gap-3" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
