export function Progress({ value = 0, label, detail, className = "" }) {
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0));

  return (
    <div className={className}>
      {label || detail ? (
        <div className="mb-2 flex items-center justify-between gap-4 text-xs text-cream-muted">
          <span>{label}</span>
          <span className="font-mono text-[11px] text-cream">{detail}</span>
        </div>
      ) : null}
      <div
        className="h-1.5 overflow-hidden rounded-full bg-roasted/80"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={safeValue}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-brass to-lime transition-[width] duration-500"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
