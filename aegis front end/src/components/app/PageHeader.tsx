interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  eyebrow?: string;
}

export function PageHeader({ title, description, action, eyebrow }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border px-8 py-7 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && (
          <div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-quantum-cyan">
            {eyebrow}
          </div>
        )}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function PlaceholderBody({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-8 py-10">
      <div className="surface relative overflow-hidden p-10">
        <div className="pointer-events-none absolute inset-0 -z-10 dot-bg opacity-40" />
        <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-64 w-64 rounded-full bg-quantum-violet/15 blur-3xl" />
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-elevated-2 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Coming in phase 2
        </div>
        <h2 className="mt-4 text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
