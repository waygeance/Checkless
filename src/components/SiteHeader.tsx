"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface SiteHeaderProps {
  active?: "home" | "play";
  roomId?: string;
}

const navLinks = [
  { label: "Play", href: "/play", key: "play" },
  { label: "Features", href: "/#features", key: "features" },
  { label: "Rules", href: "/#rules", key: "rules" },
] as const;

export function SiteHeader({ active = "home", roomId }: SiteHeaderProps) {
  const primaryCta =
    active === "play"
      ? { label: "Back Home", href: "/" }
      : { label: "Play Now", href: "/play" };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-espresso/82 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lime shadow-tactile-lime transition-transform duration-300 group-hover:scale-105">
            <Image
              src="/piece/horsey/wK.svg"
              alt="Checkless king logo"
              width={26}
              height={26}
              className="opacity-95 saturate-0"
              priority
            />
          </div>
          <div className="min-w-0">
            <span className="block truncate font-mono text-[10px] uppercase tracking-[0.28em] text-cream-muted/70">
              Simultaneous Chess
            </span>
            <span className="block truncate font-display text-2xl font-bold tracking-tight text-cream transition-colors duration-300 group-hover:text-lime">
              CHECKLESS
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => {
            const isActive = active === "play" && link.key === "play";

            return (
              <Link
                key={link.label}
                href={link.href}
                className={`text-sm font-medium uppercase tracking-[0.18em] transition-colors ${
                  isActive ? "text-lime" : "text-cream-muted hover:text-cream"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {roomId && (
            <div className="hidden rounded-full border border-white/10 bg-mocha/80 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-cream-muted md:flex">
              Room <span className="ml-2 text-lime">{roomId}</span>
            </div>
          )}

          <span className="hidden px-3 py-2 text-sm font-medium text-cream-muted/75 sm:inline-flex">
            Login Soon
          </span>

          <Link
            href={primaryCta.href}
            className="inline-flex items-center gap-2 rounded-full bg-lime px-4 py-2.5 font-display text-sm font-bold uppercase tracking-[0.12em] text-espresso shadow-tactile-btn transition-all duration-300 hover:bg-lime-hover active:translate-y-0.5 active:shadow-tactile-btn-pressed sm:px-6"
          >
            {primaryCta.label}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
