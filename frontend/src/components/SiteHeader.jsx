import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui";

const links = [
  { label: "How it works", to: "/#how-it-works" },
  { label: "Watch live", to: "/watch" },
  { label: "Tournaments", to: "/tournaments" }
];

export function SiteHeader({ active = "public" }) {
  const transparent = active === "landing";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl ${transparent ? "border-cream/[0.06] bg-roasted/55" : "border-cream/[0.07] bg-roasted/90"}`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-5 px-5 sm:px-7">
        <Link to="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-lime/35 bg-lime shadow-tactile-lime">
            <img src="/pieces/companion/bK.svg" alt="" className="h-9 w-9" />
          </div>
          <div>
            <span className="block font-display text-xl font-semibold tracking-wide text-cream group-hover:text-lime">
              Checkless
            </span>
            <span className="block font-mono text-[8px] uppercase tracking-[0.26em] text-brass-light">
              Simultaneous chess
            </span>
          </div>
        </Link>

        <nav
          className="ml-auto hidden items-center gap-7 lg:flex"
          aria-label="Public navigation"
        >
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-xs font-semibold uppercase tracking-[0.14em] text-cream-muted transition hover:text-cream"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-5">
          <Show when="signed-out">
            <SignInButton mode="modal" fallbackRedirectUrl="/home">
              <Button
                variant="ghost"
                size="small"
                className="hidden sm:inline-flex"
              >
                Sign in
              </Button>
            </SignInButton>
            <SignUpButton mode="modal" fallbackRedirectUrl="/home">
              <Button size="small" icon={ArrowUpRight} iconPosition="right">
                Join
              </Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Button
              to="/home"
              size="small"
              icon={ArrowUpRight}
              iconPosition="right"
            >
              Dashboard
            </Button>
            <UserButton
              appearance={{
                elements: { avatarBox: "h-9 w-9 ring-1 ring-brass/50" }
              }}
            />
          </Show>
        </div>
      </div>
    </header>
  );
}
