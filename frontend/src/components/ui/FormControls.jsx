export function Field({ label, hint, error, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-semibold text-cream">
        {label}
      </span>
      {children}
      {error ? (
        <span className="mt-2 block text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-2 block text-xs leading-relaxed text-cream-muted/70">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

const controlClass =
  "min-h-11 w-full rounded-xl border border-cream/10 bg-roasted/70 px-4 text-sm text-cream outline-none transition placeholder:text-cream-muted/40 focus:border-lime/55 focus:ring-2 focus:ring-lime/10";

export function Input({ className = "", ...props }) {
  return <input className={`${controlClass} ${className}`} {...props} />;
}

export function Select({ className = "", children, ...props }) {
  return (
    <select
      className={`${controlClass} appearance-none ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`${controlClass} min-h-28 resize-y py-3 ${className}`}
      {...props}
    />
  );
}

export function Toggle({ label, description, defaultChecked = false }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-5 rounded-xl border border-cream/[0.08] bg-roasted/40 p-4">
      <span>
        <span className="block text-sm font-semibold text-cream">{label}</span>
        {description ? (
          <span className="mt-1 block text-xs leading-relaxed text-cream-muted/70">
            {description}
          </span>
        ) : null}
      </span>
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-0.5 h-5 w-5 accent-lime"
      />
    </label>
  );
}
