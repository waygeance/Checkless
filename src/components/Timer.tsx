"use client";

interface TimerProps {
  value: number;
  maxValue: number;
  canMove: boolean;
  playerName: string;
  color: "white" | "black";
  isYourTurn: boolean;
}

export function Timer({
  value,
  maxValue,
  canMove,
  playerName,
  color,
  isYourTurn,
}: TimerProps) {
  const percentage = Math.max(0, Math.min(100, (value / maxValue) * 100));
  const seconds = (value / 1000).toFixed(1);
  const isUrgent = value > 0 && value < 1000;
  const isReady = canMove || value === 0;

  return (
    <div
      className={`relative overflow-hidden rounded-xl transition-all duration-300 border ${
        isYourTurn ? "ring-4 ring-blue-500/80 shadow-2xl" : "shadow-lg"
      } ${isReady ? "bg-gradient-to-r from-emerald-700 to-emerald-600 border-emerald-400/60" : "bg-slate-800 border-slate-700"}`}
    >
      <div
        className={`absolute inset-y-0 left-0 transition-all duration-100 ease-linear ${
          isReady
            ? "bg-emerald-300/55"
            : isUrgent
              ? "bg-rose-500/60 animate-pulse"
              : "bg-blue-500/45"
        }`}
        style={{ width: `${percentage}%` }}
      />

      <div className="relative z-10 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-7 h-7 rounded-full border-2 border-slate-200 ${
              color === "white" ? "bg-white" : "bg-slate-950"
            }`}
          />
          <div>
            <div className="text-white font-bold text-lg leading-tight">
              {playerName}
            </div>
            <div className="text-slate-200/90 text-sm">
              {isReady ? "Ready to move" : "Recharging..."}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`text-3xl font-mono font-bold text-white ${
              isUrgent ? "animate-pulse" : ""
            }`}
          >
            {seconds}s
          </div>
          {isReady && (
            <div className="relative">
              <div className="w-3 h-3 bg-white rounded-full animate-ping absolute" />
              <div className="w-3 h-3 bg-white rounded-full relative" />
            </div>
          )}
        </div>
      </div>

      {isReady && (
        <div className="absolute inset-0 border-2 border-emerald-200/70 rounded-xl animate-pulse pointer-events-none" />
      )}
    </div>
  );
}
