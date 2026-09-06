import { LoaderCircle } from "lucide-react";

/**
 * Inline spinner for async loading states.
 * @param {string} [size="md"] — "sm" | "md" | "lg"
 * @param {string} [className]
 */
export function Spinner({ size = "md", className = "" }) {
  const sizeClass = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : "h-5 w-5";
  return (
    <LoaderCircle
      className={`animate-spin text-lime ${sizeClass} ${className}`}
      aria-label="Loading"
    />
  );
}

/**
 * Full-panel loading skeleton placeholder.
 * Renders `count` animated skeleton bars.
 */
export function SkeletonList({ count = 4, className = "" }) {
  return (
    <div className={`space-y-3 ${className}`} aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-xl bg-cream/[0.06]"
          style={{ opacity: 1 - i * 0.15 }}
        />
      ))}
    </div>
  );
}

/** Centered loading state with spinner and text */
export function LoadingState({ text = "Loading…", className = "" }) {
  return (
    <div className={`flex items-center justify-center gap-3 py-12 text-cream-muted ${className}`}>
      <Spinner />
      <span className="text-sm">{text}</span>
    </div>
  );
}

/** Error state display */
export function ErrorState({ error, onRetry, className = "" }) {
  const message =
    error?.code || error?.message || "Something went wrong. Please try again.";
  return (
    <div className={`rounded-xl border border-danger/20 bg-danger/5 p-5 ${className}`}>
      <p className="text-sm text-danger">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-xs font-semibold text-danger hover:text-danger/80 underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}
