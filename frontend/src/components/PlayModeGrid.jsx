import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  Flame,
  Gamepad2,
  HelpCircle,
  Radio,
  Shield,
  Swords,
  TimerReset,
  Trophy,
  Users,
  Wifi,
  Zap
} from "lucide-react";
import { Button } from "./ui";

const VARIANTS = [
  {
    value: "1s",
    label: "1s",
    title: "Lightning",
    subtitle: "1 sec cooldown",
    desc: "Pure reflex & instinct",
    icon: Zap,
    tag: null
  },
  {
    value: "3s",
    label: "3s",
    title: "House Blend",
    subtitle: "3 sec cooldown",
    desc: "Balanced tactical pace",
    icon: Swords,
    tag: "Popular"
  },
  {
    value: "5s",
    label: "5s",
    title: "Slow Pour",
    subtitle: "5 sec cooldown",
    desc: "Calculation & planning",
    icon: Flame,
    tag: null
  }
];

const RULES = [
  {
    icon: Zap,
    title: "No Turn Waiting",
    desc: "Both players move independently and simultaneously. No turns."
  },
  {
    icon: TimerReset,
    title: "Move Cooldown",
    desc: "Your timer resets immediately after a legal move lands on board."
  },
  {
    icon: Shield,
    title: "Capture The King",
    desc: "No checks or checkmates. First to capture the enemy king wins."
  },
  {
    icon: Swords,
    title: "Atomic Clashes",
    desc: "When two pieces contest the same square, fair collision applies."
  }
];

export function PlayModeGrid({
  connectionReady,
  selectedVariant,
  onSelectVariant,
  onStartGame,
  pingMs
}) {
  const [mode, setMode] = useState("CASUAL");
  const currentVariant =
    VARIANTS.find((v) => v.value === selectedVariant) ?? VARIANTS[1];

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Top Header Row */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-brass-light">
            <span>Arena</span>
            <span>·</span>
            <span>Live Matchmaking</span>
          </div>
          <h1 className="mt-0.5 font-display text-2xl font-bold tracking-tight text-cream sm:text-3xl">
            Choose Your Table
          </h1>
        </div>

        {/* Server & Ping Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2.5 rounded-xl border border-cream/[0.08] bg-espresso/70 px-3 py-1.5 font-mono text-xs text-cream-muted shadow-sm backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                  connectionReady ? "bg-lime" : "bg-wine-light"
                }`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  connectionReady ? "bg-lime" : "bg-wine-light"
                }`}
              />
            </span>
            <span className={connectionReady ? "text-cream" : "text-cream-muted"}>
              {connectionReady ? "Server Online" : "Connecting..."}
            </span>
            {pingMs != null && (
              <>
                <span className="opacity-30">|</span>
                <span className="text-lime">{pingMs}ms</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main 2-Column Dashboard (Compact & fit to viewport) */}
      <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        {/* Left Column: Queue Setup */}
        <div className="flex flex-col justify-between rounded-2xl border border-cream/[0.1] bg-gradient-to-b from-espresso/90 to-roasted/90 p-5 shadow-tactile sm:p-6">
          <div>
            {/* Mode Segmented Switcher */}
            <div className="flex items-center justify-between gap-2 border-b border-cream/[0.08] pb-3.5">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream-muted">
                  Game Mode
                </span>
                <div className="text-xs text-cream-muted/70">
                  {mode === "CASUAL"
                    ? "Instant matchmaking with any player"
                    : "Ranked ladder with Elo ratings"}
                </div>
              </div>

              <div className="flex rounded-xl border border-cream/[0.08] bg-roasted/90 p-1">
                <button
                  type="button"
                  onClick={() => setMode("CASUAL")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    mode === "CASUAL"
                      ? "bg-lime text-roasted shadow-tactile-lime"
                      : "text-cream-muted hover:text-cream"
                  }`}
                >
                  <Swords className="h-3.5 w-3.5" />
                  <span>Casual</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("RANKED")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    mode === "RANKED"
                      ? "bg-lime text-roasted shadow-tactile-lime"
                      : "text-cream-muted hover:text-cream"
                  }`}
                >
                  <Trophy className="h-3.5 w-3.5" />
                  <span>Ranked</span>
                </button>
              </div>
            </div>

            {/* Variant / Cooldown Cards */}
            <div className="mt-4">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream-muted">
                  Select Cooldown
                </span>
                <span className="font-mono text-xs text-brass-light">
                  {currentVariant.title} ({currentVariant.value})
                </span>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-3">
                {VARIANTS.map((v) => {
                  const Icon = v.icon;
                  const isSelected = selectedVariant === v.value;
                  return (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => onSelectVariant(v.value)}
                      className={`group relative flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all duration-200 ${
                        isSelected
                          ? "border-lime bg-lime/10 text-cream shadow-[0_0_18px_rgba(195,232,141,0.18)] ring-1 ring-lime/40"
                          : "border-cream/[0.08] bg-roasted/40 text-cream-muted hover:border-cream/20 hover:bg-roasted/70 hover:text-cream"
                      }`}
                    >
                      {v.tag && (
                        <span className="absolute -top-2 right-2 rounded-full border border-lime/40 bg-lime px-2 py-0.2 font-mono text-[9px] font-bold uppercase tracking-wider text-roasted">
                          {v.tag}
                        </span>
                      )}
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-display text-2xl font-bold ${
                            isSelected ? "text-lime" : "text-cream"
                          }`}
                        >
                          {v.label}
                        </span>
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                            isSelected
                              ? "border-lime/40 bg-lime/20 text-lime"
                              : "border-cream/10 bg-white/5 text-cream-muted group-hover:text-cream"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <div className="mt-2.5">
                        <div className="text-xs font-semibold text-cream">
                          {v.title}
                        </div>
                        <div className="mt-0.5 text-[10.5px] leading-tight text-cream-muted/70">
                          {v.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action CTA & Shortcuts */}
          <div className="mt-5">
            <Button
              onClick={() => onStartGame(mode, selectedVariant)}
              disabled={!connectionReady}
              size="large"
              className="w-full !py-3 !text-sm sm:!text-base shadow-tactile-lime"
              icon={ChevronRight}
              iconPosition="right"
            >
              {connectionReady
                ? `Find ${selectedVariant.toUpperCase()} ${
                    mode === "RANKED" ? "Ranked" : "Casual"
                  } Match`
                : "Connecting to Server..."}
            </Button>

            <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-cream/[0.08] pt-2.5 text-xs text-cream-muted">
              <span className="hidden sm:inline text-cream-muted/60 text-[11px]">
                Or play privately:
              </span>
              <div className="flex flex-1 items-center justify-end gap-2">
                <Link
                  to="/challenges"
                  className="flex items-center gap-1.5 rounded-lg border border-cream/[0.08] bg-roasted/50 px-3 py-1.5 text-xs text-cream-muted transition hover:border-cream/20 hover:bg-roasted hover:text-cream"
                >
                  <Gamepad2 className="h-3.5 w-3.5 text-brass-light" />
                  <span>Challenge Code</span>
                </Link>
                <Link
                  to="/friends"
                  className="flex items-center gap-1.5 rounded-lg border border-cream/[0.08] bg-roasted/50 px-3 py-1.5 text-xs text-cream-muted transition hover:border-cream/20 hover:bg-roasted hover:text-cream"
                >
                  <Users className="h-3.5 w-3.5 text-brass-light" />
                  <span>Invite Friends</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Rules & Live Format Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-cream/[0.1] bg-gradient-to-b from-espresso/90 to-roasted/90 p-5 shadow-tactile sm:p-6">
          <div>
            <div className="flex items-center justify-between border-b border-cream/[0.08] pb-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-brass-light">
                  Rules of the Table
                </div>
                <h2 className="mt-0.5 font-display text-base font-bold text-cream">
                  Simultaneous Play
                </h2>
              </div>
              <span className="rounded-full border border-lime/30 bg-lime/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-lime">
                Live Format
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              {RULES.map((rule) => {
                const Icon = rule.icon;
                return (
                  <div
                    key={rule.title}
                    className="flex items-start gap-2.5 rounded-xl border border-cream/[0.06] bg-roasted/35 p-2.5 transition hover:border-cream/15"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-lime/25 bg-lime/10 text-lime">
                      <Icon className="h-3 w-3" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-cream">
                        {rule.title}
                      </div>
                      <div className="mt-0.5 text-[11px] leading-relaxed text-cream-muted/75">
                        {rule.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pro Tip Footer */}
          <div className="mt-3.5 rounded-xl border border-brass/20 bg-brass/[0.06] p-2.5 text-[11px] leading-relaxed text-cream-muted">
            <span className="font-semibold text-brass-light">💡 Pro Tip:</span>{" "}
            You can queue pre-moves while your timer counts down. They execute instantly when cooldown reaches zero.
          </div>
        </div>
      </div>
    </div>
  );
}
