import { Coffee } from "lucide-react";
import { Button } from "./Button";

export function EmptyState({
  icon: Icon = Coffee,
  title,
  description,
  actionLabel,
  actionTo
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-[1.35rem] border border-dashed border-brass/30 bg-roasted/35 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-brass/30 bg-brass/10 text-brass-light">
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="mt-5 font-display text-2xl font-semibold text-cream">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-cream-muted">
        {description}
      </p>
      {actionLabel && actionTo ? (
        <Button className="mt-6" size="small" to={actionTo}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
