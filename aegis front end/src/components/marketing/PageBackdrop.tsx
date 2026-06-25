/**
 * PageBackdrop — a single faint, fixed ambient layer behind the whole marketing
 * page (the sections are transparent, so it shows through subtly everywhere):
 * a slowly-drifting dot field + two very soft, slow aurora orbs. Kept low-opacity
 * so text always wins; pointer-events-none and `prefers-reduced-motion` safe.
 */
export function PageBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="dot-bg absolute inset-0 opacity-60" />
      <div
        className="motion-safe:animate-aurora absolute -left-[15%] top-[18%] h-[50rem] w-[50rem] rounded-full blur-[160px]"
        style={{
          background: "radial-gradient(circle, var(--blue-bright) 0%, transparent 65%)",
          opacity: 0.18,
          animationDuration: "34s",
        }}
      />
      <div
        className="motion-safe:animate-aurora absolute right-[-15%] top-[58%] h-[46rem] w-[46rem] rounded-full blur-[170px]"
        style={{
          background: "radial-gradient(circle, var(--blue-electric) 0%, transparent 65%)",
          opacity: 0.18,
          animationDelay: "-12s",
          animationDuration: "40s",
        }}
      />
    </div>
  );
}
