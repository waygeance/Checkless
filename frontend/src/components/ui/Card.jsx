export function Card({
  children,
  className = "",
  tone = "dark",
  as: Tag = "section"
}) {
  const tones = {
    dark: "border-cream/[0.09] bg-walnut/65 text-cream shadow-tactile",
    deep: "border-cream/[0.08] bg-roasted/70 text-cream shadow-inner",
    parchment:
      "border-brass/25 bg-parchment text-roasted shadow-[0_18px_50px_rgba(0,0,0,0.2)]",
    quiet: "border-cream/[0.07] bg-white/[0.025] text-cream"
  };

  return (
    <Tag
      className={`relative overflow-hidden rounded-[1.35rem] border ${tones[tone] ?? tones.dark} ${className}`}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  eyebrow,
  title,
  action,
  children,
  className = ""
}) {
  return (
    <div className={`flex items-start justify-between gap-5 ${className}`}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-brass-light">
            {eyebrow}
          </p>
        ) : null}
        {title ? (
          <h2 className="mt-1 font-display text-2xl font-semibold leading-tight text-inherit">
            {title}
          </h2>
        ) : null}
        {children}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}
