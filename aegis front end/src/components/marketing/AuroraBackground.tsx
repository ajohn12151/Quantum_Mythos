/**
 * AuroraBackground 2.0 — a dramatic, living frosted aurora: a slowly-rotating
 * conic "mesh" layer plus bigger/brighter drifting blobs (decorative bright
 * blues). Pointer-events-none, colors from CSS vars, and `prefers-reduced-motion`
 * safe — the global reduced-motion rule freezes all `motion-safe:animate-*`.
 */
export function AuroraBackground({
  className = "",
  intensity = "hero",
}: {
  className?: string;
  intensity?: "hero" | "ambient";
}) {
  const o = intensity === "hero" ? 1 : 0.45;
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}
    >
      {/* Rotating conic "living mesh" — two layers at different speeds/directions
          for a richer morph (the brighter is hero-weighted). */}
      <div
        className="motion-safe:animate-conic-spin absolute left-1/2 top-1/2 h-[160%] w-[160%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px]"
        style={{
          background:
            "conic-gradient(from 0deg, transparent, var(--blue-electric), transparent 22%, var(--quantum-cyan), transparent 50%, var(--quantum-violet), transparent 76%, var(--blue-bright), transparent)",
          opacity: 0.34 * o,
          animationDuration: "26s",
        }}
      />
      <div
        className="motion-safe:animate-conic-spin absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px]"
        style={{
          background:
            "conic-gradient(from 140deg, transparent, var(--quantum-cyan), transparent 33%, var(--blue-bright), transparent 66%, var(--blue-electric), transparent)",
          opacity: 0.21 * o,
          animationDirection: "reverse",
          animationDuration: "38s",
        }}
      />
      {/* Drifting blobs */}
      <div
        className="motion-safe:animate-aurora absolute -left-[12%] -top-[24%] h-[50rem] w-[50rem] rounded-full blur-[120px]"
        style={{
          background: "radial-gradient(circle, var(--blue-electric) 0%, transparent 62%)",
          opacity: 0.66 * o,
          animationDuration: "14s",
        }}
      />
      <div
        className="motion-safe:animate-aurora absolute -top-[14%] right-[-12%] h-[44rem] w-[44rem] rounded-full blur-[130px]"
        style={{
          background: "radial-gradient(circle, var(--blue-bright) 0%, transparent 62%)",
          opacity: 0.66 * o,
          animationDelay: "-7s",
          animationDuration: "18s",
        }}
      />
      <div
        className="motion-safe:animate-aurora absolute bottom-[-30%] left-[26%] h-[46rem] w-[46rem] rounded-full blur-[140px]"
        style={{
          background: "radial-gradient(circle, var(--quantum-violet) 0%, transparent 68%)",
          opacity: 0.52 * o,
          animationDelay: "-14s",
          animationDuration: "22s",
        }}
      />
    </div>
  );
}
