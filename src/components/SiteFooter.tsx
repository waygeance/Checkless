"use client";

import Link from "next/link";

const productLinks = [
  { label: "Home", href: "/" },
  { label: "Play", href: "/play" },
  { label: "Features", href: "/#features" },
  { label: "Rules", href: "/#rules" },
] as const;

const statusItems = [
  "Casual queue live",
  "Ranked accounts soon",
  "Friend rooms in progress",
] as const;

const stackItems = ["Next.js 16", "React 19", "Socket.io live play"] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/5 bg-espresso">
      <div className="mx-auto max-w-7xl px-6 pb-10 pt-16">
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
          <div className="max-w-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lime shadow-tactile-lime">
                <div className="h-4 w-4 rounded-sm bg-espresso" />
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.26em] text-cream-muted/70">
                  Simultaneous Chess
                </div>
                <div className="font-display text-2xl font-bold text-cream">
                  CHECKLESS
                </div>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-cream-muted/85">
              A tactile espresso interface for simultaneous chess: no turns, no
              waiting, just fast king-hunt pressure.
            </p>
          </div>

          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.26em] text-cream">
              Product
            </h4>
            <div className="mt-5 space-y-3">
              {productLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="block text-sm text-cream-muted transition-colors hover:text-lime"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.26em] text-cream">
              Status
            </h4>
            <div className="mt-5 space-y-3">
              {statusItems.map((item) => (
                <div key={item} className="text-sm text-cream-muted">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.26em] text-cream">
              Stack
            </h4>
            <div className="mt-5 flex flex-wrap gap-2">
              {stackItems.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-mocha/80 px-3 py-1.5 text-xs font-medium text-cream-muted"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/5 pt-6 text-sm text-cream-muted/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Checkless. Built for sharp moves and responsive play.</p>
          <p className="font-mono text-xs uppercase tracking-[0.18em]">
            GSoC Theme Refresh
          </p>
        </div>
      </div>
    </footer>
  );
}
