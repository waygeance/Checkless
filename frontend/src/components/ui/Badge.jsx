export function Badge({ children, tone = "neutral", className = "" }) {
  const tones = {
    neutral: "border-cream/10 bg-cream/[0.06] text-cream-muted",
    lime: "border-lime/25 bg-lime/10 text-lime",
    brass: "border-brass/30 bg-brass/10 text-brass-light",
    danger: "border-danger/25 bg-danger/10 text-danger",
    success: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
  };

  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] ${tones[tone] ?? tones.neutral} ${className}`}
    >
      {children}
    </span>
  );
}
