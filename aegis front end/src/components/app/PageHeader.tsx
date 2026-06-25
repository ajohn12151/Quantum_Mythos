import { motion, useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/marketing/Reveal";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  eyebrow?: string;
}

export function PageHeader({ title, description, action, eyebrow }: PageHeaderProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="flex flex-col gap-4 border-b border-border px-8 py-8 md:flex-row md:items-end md:justify-between"
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        {eyebrow && (
          <div className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-2xl tracking-tight">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </motion.div>
  );
}

export function PlaceholderBody({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-8 py-10">
      <Reveal className="card-premium relative mx-auto max-w-3xl overflow-hidden p-10">
        <div className="pointer-events-none absolute inset-0 -z-10 dot-bg opacity-50" />
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          On the roadmap
        </div>
        <h2 className="font-display mt-5 text-xl tracking-tight">{title}</h2>
        <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-muted-foreground">{body}</p>
      </Reveal>
    </div>
  );
}
