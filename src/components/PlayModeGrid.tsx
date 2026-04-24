"use client";

import { ChevronRight, Lock, Plus, Radio, Swords, Trophy, Users } from "lucide-react";

type Variant = "1s" | "3s" | "5s";

interface PlayModeGridProps {
  connectionReady: boolean;
  selectedVariant: Variant;
  onSelectVariant: (variant: Variant) => void;
  onStartCasual: (variant: Variant) => void;
  onFriendAction: (action: "create" | "join") => void;
}

const variants: Array<{ label: string; value: Variant }> = [
  { label: "1 SEC", value: "1s" },
  { label: "3 SEC", value: "3s" },
  { label: "5 SEC", value: "5s" },
];

const tileClassName =
  "flex min-h-[92px] items-center justify-center rounded-2xl border px-4 text-center font-bold uppercase tracking-[0.18em] transition-all duration-300";

export function PlayModeGrid({
  connectionReady,
  selectedVariant,
  onSelectVariant,
  onStartCasual,
  onFriendAction,
}: PlayModeGridProps) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-mocha p-6 shadow-tactile bg-tactile-gradient sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.26em] text-cream-muted">
            Match Hub
          </div>
          <h2 className="mt-2 font-display text-4xl font-bold text-cream">
            Choose Your Queue
          </h2>
        </div>
        <div className="rounded-full border border-white/10 bg-espresso/80 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-cream-muted">
          {connectionReady ? (
            <span className="text-lime">Server Online</span>
          ) : (
            "Connecting..."
          )}
        </div>
      </div>

      <div className="mt-8 space-y-8">
        <section className="rounded-[1.6rem] border border-white/8 bg-espresso/45 p-5 shadow-inner sm:p-6">
          <div className="mb-4 flex items-center gap-2 font-display text-2xl font-bold text-cream">
            <Swords size={19} className="text-lime" />
            Casual Match
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-cream-muted">
            Pick your cooldown first, then queue into the live matchmaking pool.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {variants.map((variant) => (
              <button
                key={`casual-${variant.value}`}
                onClick={() => onSelectVariant(variant.value)}
                className={`${tileClassName} aspect-square min-h-[112px] rounded-[1.35rem] border font-mono text-3xl ${
                  selectedVariant === variant.value
                    ? "scale-[1.03] border-transparent bg-lime text-espresso shadow-tactile-lime"
                    : "border-lime/25 bg-espresso/60 text-lime hover:border-lime/55 hover:bg-lime/10"
                }`}
              >
                <span className="flex flex-col items-center gap-2">
                  <span>{variant.value}</span>
                  <span className="text-[11px] uppercase tracking-[0.22em]">
                    Cooldown
                  </span>
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={() => onStartCasual(selectedVariant)}
            disabled={!connectionReady}
            className={`mt-6 flex w-full items-center justify-center gap-3 rounded-full px-6 py-4 font-display text-xl font-bold transition-all duration-300 ${
              connectionReady
                ? "bg-lime text-espresso shadow-tactile-btn hover:bg-lime-hover active:translate-y-0.5 active:shadow-tactile-btn-pressed"
                : "cursor-not-allowed bg-cream/12 text-cream-muted"
            }`}
          >
            Play Now
            <ChevronRight className="h-5 w-5" />
          </button>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-[1.6rem] border border-white/8 bg-espresso/45 p-5 shadow-inner">
            <div className="mb-4 flex items-center gap-2 font-display text-2xl font-bold text-cream">
              <Trophy size={19} className="text-lime" />
              Ranked
            </div>
            <p className="text-sm leading-relaxed text-cream-muted">
              Ranked queues stay locked until account-backed ratings and
              identity land.
            </p>
            <div className="mt-5 rounded-[1.25rem] border border-white/10 bg-mocha/70 px-4 py-4 text-sm text-cream-muted">
              <div className="flex items-center gap-2 font-semibold uppercase tracking-[0.16em] text-cream">
                <Lock className="h-4 w-4" />
                Login Required
              </div>
              <div className="mt-2">Competitive ladder is the next major release.</div>
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-white/8 bg-espresso/45 p-5 shadow-inner">
            <div className="mb-4 flex items-center gap-2 font-display text-2xl font-bold text-cream">
              <Users size={19} className="text-lime" />
              Friend Rooms
            </div>
            <p className="text-sm leading-relaxed text-cream-muted">
              Private rooms are staged next. You can still preview the controls.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => onFriendAction("create")}
                className="rounded-[1.2rem] border border-lime/25 bg-espresso/65 px-4 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-lime transition-colors hover:border-lime/60 hover:bg-lime/10"
              >
                <span className="flex items-center justify-center gap-2">
                  <Plus size={16} />
                  Create
                </span>
              </button>
              <button
                onClick={() => onFriendAction("join")}
                className="rounded-[1.2rem] border border-lime/25 bg-espresso/65 px-4 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-lime transition-colors hover:border-lime/60 hover:bg-lime/10"
              >
                <span className="flex items-center justify-center gap-2">
                  <Radio size={16} />
                  Join
                </span>
              </button>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
