import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * CursorGlow — a soft blue glow that trails the pointer inside its parent
 * (which must be `position: relative`). Pointer-events-none, and disabled under
 * reduced-motion / on devices without a fine pointer (touch).
 */
export function CursorGlow({ size = 700 }: { size?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;

    let raf = 0;
    let cx = 0;
    let cy = 0;
    let tx = 0;
    let ty = 0;
    const onMove = (e: MouseEvent) => {
      const r = parent.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      el.style.opacity = e.clientY >= r.top && e.clientY <= r.bottom ? "1" : "0";
    };
    const loop = () => {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      el.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 -z-10 rounded-full opacity-0 blur-[80px] transition-opacity duration-500"
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle, var(--blue-electric) 0%, transparent 65%)",
        opacity: 0,
      }}
    />
  );
}
