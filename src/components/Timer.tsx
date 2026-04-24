"use client";

interface TimerProps {
  value: number;
  maxValue: number;
  canMove: boolean;
  playerName: string;
  color: "white" | "black";
  isPlayerCard: boolean;
}

export function Timer({
  value,
  maxValue,
  canMove,
  playerName,
  color,
  isPlayerCard,
}: TimerProps) {
  const percentage = Math.max(0, Math.min(100, (value / maxValue) * 100));
  const seconds = (value / 1000).toFixed(1);
  const isUrgent = value > 0 && value < 1000;
  const isReady = canMove || value === 0;

  return (
    <div
      className={`relative overflow-hidden rounded-[1.5rem] border bg-mocha p-5 shadow-tactile transition-all duration-300 ${
        isPlayerCard
          ? "border-lime/45 shadow-[0_0_0_1px_rgba(200,255,0,0.18),0_22px_50px_rgba(0,0,0,0.34)]"
          : "border-white/10"
      }`}
    >
      <div
        className={`absolute inset-x-0 bottom-0 h-1.5 transition-all duration-150 ${
          isReady ? "bg-lime/25" : "bg-white/8"
        }`}
      >
        <div
          className={`h-full rounded-full transition-all duration-150 ${
            isReady ? "bg-lime" : isUrgent ? "bg-danger" : "bg-cream/40"
          } ${isUrgent ? "animate-pulse" : ""}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`h-5 w-5 rounded-full shadow-inner ${
              color === "white"
                ? "bg-cream"
                : "border-2 border-cream bg-transparent"
            }`}
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-display text-xl font-bold leading-tight text-cream">
                {playerName}
              </div>
              {isPlayerCard && (
                <span className="rounded-full border border-lime/30 bg-lime/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-lime">
                  You
                </span>
              )}
            </div>
            <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-cream-muted/80">
              {isReady ? "Ready to move" : "Recharging"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`font-mono text-4xl font-bold tracking-tight text-cream ${
              isUrgent ? "animate-pulse" : ""
            }`}
          >
            {seconds}
            <span className="ml-1 text-lg text-cream-muted/80">s</span>
          </div>
          {isReady && (
            <div className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-lime" />
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0)_100%)]" />
    </div>
  );
}
