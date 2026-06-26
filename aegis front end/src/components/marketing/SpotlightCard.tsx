import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * SpotlightCard — a frosted `glass` card with a cursor-following slate-blue
 * spotlight + hover lift. The pointer position is written to CSS vars on the
 * element (no React re-render per move), so the radial highlight tracks the
 * cursor cheaply. Reduced-motion users still get the glass + static styling.
 */
export function SpotlightCard({
  children,
  className,
  innerClassName,
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={cn("group/spot glass lift relative overflow-hidden", className)}
    >
      {/* Cursor-following spotlight (fades in on hover) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{
          background:
            "radial-gradient(240px circle at var(--mx, 50%) var(--my, 0%), color-mix(in oklab, var(--quantum-violet) 22%, transparent), transparent 72%)",
        }}
      />
      <div className={cn("relative", innerClassName)}>{children}</div>
    </div>
  );
}
