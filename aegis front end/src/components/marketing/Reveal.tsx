import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, type ReactNode } from "react";

const EASE = [0.2, 0.7, 0.2, 1] as const; // --ease-out-quant

/**
 * Scroll-triggered fade-up. Uses useInView + `animate` (rather than
 * `whileInView`) so framer's render loop is reliably driven on mount even on
 * pages with no other animation. Under prefers-reduced-motion it renders
 * visible immediately. Element type stays a motion component to avoid SSR
 * hydration mismatches; content is never left stuck invisible.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 34,
  as = "div",
  immediate = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: keyof typeof motion;
  /** Animate on mount instead of on scroll-into-view (use inside the app, where
   *  content should never be gated behind a scroll). */
  immediate?: boolean;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const Comp = motion[as] as typeof motion.div;
  const show = reduce || immediate || inView;

  return (
    <Comp
      ref={ref}
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={reduce ? { duration: 0 } : { duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </Comp>
  );
}

/**
 * Container that staggers its <StaggerItem> children into view. Children read
 * the container's animation state via variants.
 */
export function Stagger({
  children,
  className,
  immediate = false,
}: {
  children: ReactNode;
  className?: string;
  immediate?: boolean;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const show = reduce || immediate || inView;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduce ? false : "hide"}
      animate={show ? "show" : "hide"}
      variants={{
        hide: {},
        show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
      }}
    >
      {children}
    </motion.div>
  );
}

/** A single staggered child. Must live inside <Stagger>. */
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hide: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  );
}
