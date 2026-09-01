import { LoaderCircle } from "lucide-react";
import { Link } from "react-router-dom";

const SIZE_CLASSES = {
  small: "min-h-9 px-3.5 text-xs",
  medium: "min-h-11 px-5 text-sm",
  large: "min-h-14 px-7 text-base"
};

const VARIANT_CLASSES = {
  primary:
    "border-lime bg-lime text-roasted shadow-tactile-btn hover:bg-lime-hover hover:border-lime-hover",
  secondary:
    "border-brass/35 bg-walnut/80 text-cream hover:border-brass/70 hover:bg-coffee-leather",
  outline:
    "border-cream/15 bg-transparent text-cream hover:border-lime/55 hover:text-lime",
  ghost:
    "border-transparent bg-transparent text-cream-muted hover:bg-white/[0.06] hover:text-cream",
  danger:
    "border-danger/40 bg-danger/10 text-danger hover:border-danger/70 hover:bg-danger/15"
};

export function Button({
  children,
  className = "",
  size = "medium",
  variant = "primary",
  icon: Icon,
  iconPosition = "left",
  to,
  href,
  loading = false,
  disabled = false,
  type = "button",
  ...props
}) {
  const classes = [
    "ui-button inline-flex items-center justify-center gap-2 rounded-xl border font-sans font-semibold tracking-[0.02em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/70 focus-visible:ring-offset-2 focus-visible:ring-offset-roasted active:translate-y-px disabled:pointer-events-none disabled:opacity-45",
    SIZE_CLASSES[size] ?? SIZE_CLASSES.medium,
    VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary,
    className
  ].join(" ");

  const content = (
    <>
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      {!loading && Icon && iconPosition === "left" ? (
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      ) : null}
      <span>{children}</span>
      {!loading && Icon && iconPosition === "right" ? (
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      ) : null}
    </>
  );

  if (to) {
    return (
      <Link className={classes} to={to} {...props}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a className={classes} href={href} {...props}>
        {content}
      </a>
    );
  }

  return (
    <button
      className={classes}
      type={type}
      disabled={disabled || loading}
      {...props}
    >
      {content}
    </button>
  );
}
