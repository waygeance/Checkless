import { useState } from "react";
import { Show, UserButton, useUser } from "@clerk/react";
import {
  Bell,
  BookOpen,
  ChevronRight,
  Coffee,
  Gamepad2,
  History,
  Home,
  Menu,
  Settings,
  Swords,
  Trophy,
  UserRound,
  Users,
  X
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { ratings } from "../../data/platform";
import { Badge, Button, Progress } from "../ui";

const primaryNav = [
  { label: "Home", to: "/home", icon: Home },
  { label: "Play", to: "/play", icon: Swords },
  { label: "My games", to: "/games", icon: History },
  { label: "Friends", to: "/friends", icon: Users },
  { label: "Challenges", to: "/challenges", icon: Gamepad2 },
  { label: "Tournaments", to: "/tournaments", icon: Trophy }
];

const secondaryNav = [
  { label: "Profile", to: "/players/me", icon: UserRound },
  { label: "Settings", to: "/settings", icon: Settings }
];

function SidebarLink({ item, onNavigate }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group flex min-h-11 items-center gap-3 rounded-xl border px-3.5 text-sm font-semibold transition ${
          isActive
            ? "border-lime/25 bg-lime/10 text-lime"
            : "border-transparent text-cream-muted hover:border-cream/[0.08] hover:bg-white/[0.035] hover:text-cream"
        }`
      }
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className="truncate">{item.label}</span>
      <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-0 transition group-hover:opacity-60" />
    </NavLink>
  );
}

function SidebarContent({ onNavigate }) {
  const { user } = useUser();
  const username = user?.username || user?.firstName || "CoffeePlayer";

  return (
    <div className="flex h-full flex-col">
      <NavLink
        to="/home"
        onClick={onNavigate}
        className="flex items-center gap-3 px-3 py-2"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-lime/30 bg-lime text-roasted shadow-tactile-lime">
          <img src="/pieces/companion/bK.svg" alt="" className="h-9 w-9" />
        </div>
        <div>
          <span className="block font-display text-xl font-semibold tracking-wide text-cream">
            Checkless
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-brass-light">
            The coffeehouse
          </span>
        </div>
      </NavLink>

      <div className="mx-1 mt-5 rounded-[1.15rem] border border-brass/20 bg-roasted/55 p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt=""
                className="h-11 w-11 rounded-full border border-brass/35 object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-walnut text-brass-light">
                <UserRound className="h-5 w-5" />
              </div>
            )}
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-roasted bg-lime" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-cream">
              {username}
            </p>
            <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.17em] text-cream-muted/60">
              Level 12 · Regular
            </p>
          </div>
        </div>
        <Progress
          className="mt-4"
          value={64}
          label="Next level"
          detail="640 / 1,000 XP"
        />
        <div className="mt-4 grid grid-cols-3 divide-x divide-cream/[0.08] border-t border-cream/[0.08] pt-3">
          {ratings.map((rating) => (
            <div key={rating.label} className="text-center">
              <div className="font-mono text-[9px] text-cream-muted">
                {rating.label}
              </div>
              <div className="mt-1 text-sm font-bold text-cream">
                {rating.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <nav className="mt-5 space-y-1" aria-label="Main navigation">
        {primaryNav.map((item) => (
          <SidebarLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="my-4 border-t border-cream/[0.07]" />

      <nav className="space-y-1" aria-label="Account navigation">
        {secondaryNav.map((item) => (
          <SidebarLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="mt-auto px-2 pt-6">
        <div className="flex items-center gap-2 rounded-xl border border-brass/15 bg-brass/[0.06] px-3 py-2.5 text-xs text-cream-muted">
          <Coffee className="h-4 w-4 text-brass-light" />
          <span>Tables open</span>
          <Badge tone="lime" className="ml-auto">
            Live
          </Badge>
        </div>
      </div>
    </div>
  );
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-roasted text-cream">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-cream/[0.08] bg-espresso-deep/95 p-3 backdrop-blur-xl lg:block">
        <SidebarContent />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative h-full w-[min(86vw,20rem)] border-r border-cream/10 bg-espresso-deep p-3 shadow-2xl">
            <button
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-2 text-cream-muted hover:bg-white/5 hover:text-cream"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-cream/[0.07] bg-roasted/85 px-4 backdrop-blur-xl sm:px-7">
          <button
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-cream-muted hover:bg-white/5 hover:text-cream lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden items-center gap-2 text-xs text-cream-muted sm:flex">
            <BookOpen className="h-4 w-4 text-brass-light" />
            <span>Season of the Open King</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge tone="brass" className="hidden sm:inline-flex">
              Preview data
            </Badge>
            <Button
              aria-label="Notifications"
              size="small"
              variant="ghost"
              className="!px-2.5"
            >
              <Bell className="h-4 w-4" />
            </Button>
            <Show when="signed-in">
              <UserButton
                appearance={{
                  elements: { avatarBox: "h-9 w-9 ring-1 ring-brass/50" }
                }}
              />
            </Show>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[96rem] px-4 py-7 sm:px-7 sm:py-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
