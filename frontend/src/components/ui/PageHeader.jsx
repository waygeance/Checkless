export function PageHeader({ eyebrow, title, description, action, children }) {
  return (
    <header className="mb-7 flex flex-col gap-5 border-b border-cream/[0.08] pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-brass-light">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 font-display text-4xl font-semibold leading-[0.95] tracking-[-0.02em] text-cream sm:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cream-muted sm:text-base">
            {description}
          </p>
        ) : null}
        {children}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
