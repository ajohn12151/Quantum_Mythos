/**
 * AuroraBackground — a living frosted aurora in ONE consistent blue
 * (`--blue-electric`): a slowly-rotating single-hue conic "mesh" plus drifting
 * blobs of the same blue. The color stays uniform across the whole animation —
 * only intensity/position move, never the hue. Pointer-events-none, and
 * `prefers-reduced-motion` safe (the global rule freezes all `motion-safe:*`).
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
      {/* Rotating conic mesh — single hue: blue/transparent wedges of the SAME
          blue, so rotating it never shifts color, only intensity. */}
      <div
        className="motion-safe:animate-conic-spin absolute left-1/2 top-1/2 h-[160%] w-[160%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px]"
        style={{
          background:
            "conic-gradient(from 0deg, transparent, var(--blue-electric) 14%, transparent 28%, transparent 50%, var(--blue-electric) 64%, transparent 78%, transparent)",
          opacity: 0.34 * o,
          animationDuration: "26s",
        }}
      />
      <div
        className="motion-safe:animate-conic-spin absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px]"
        style={{
          background:
            "conic-gradient(from 140deg, transparent, var(--blue-electric) 18%, transparent 40%, transparent 70%, var(--blue-electric) 86%, transparent)",
          opacity: 0.21 * o,
          animationDirection: "reverse",
          animationDuration: "38s",
        }}
      />
      {/* Drifting blobs — all the same blue */}
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
          background: "radial-gradient(circle, var(--blue-electric) 0%, transparent 62%)",
          opacity: 0.62 * o,
          animationDelay: "-7s",
          animationDuration: "18s",
        }}
      />
      <div
        className="motion-safe:animate-aurora absolute bottom-[-30%] left-[26%] h-[46rem] w-[46rem] rounded-full blur-[140px]"
        style={{
          background: "radial-gradient(circle, var(--blue-electric) 0%, transparent 68%)",
          opacity: 0.5 * o,
          animationDelay: "-14s",
          animationDuration: "22s",
        }}
      />
    </div>
  );
}
