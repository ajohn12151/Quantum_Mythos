import { useRef, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * TiltMedia — mouse-follow 3D tilt for hero product mockups. Wraps content and
 * applies a perspective rotateX/rotateY toward the cursor (resets on leave).
 * No-ops under reduced motion. Keep it OUTSIDE framer parallax transforms so the
 * two don't fight over `transform` (nest: motion parallax > TiltMedia > window).
 */
export function TiltMedia({
  children,
  className = "",
  max = 7,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1100px) rotateY(${px * max}deg) rotateX(${-py * max}deg)`;
  }
  function onLeave() {
    const el = ref.current;
    if (el) el.style.transform = "perspective(1100px) rotateY(0deg) rotateX(0deg)";
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
      style={{ transition: "transform 0.25s var(--ease-out-quant)", transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}
