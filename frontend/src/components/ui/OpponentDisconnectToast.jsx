import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/** Warm, reusable reconnect countdown notification for live games. */
export function OpponentDisconnectToast({ data, onExpired }) {
  const [remainingMs, setRemainingMs] = useState(data?.remainingMs ?? 0);

  useEffect(() => {
    if (!data) return undefined;
    setRemainingMs(Math.max(0, data.deadlineAt - Date.now()));
    const interval = window.setInterval(() => {
      const next = Math.max(0, data.deadlineAt - Date.now());
      setRemainingMs(next);
      if (next === 0) {
        window.clearInterval(interval);
        onExpired?.();
      }
    }, 250);
    return () => window.clearInterval(interval);
  }, [data, onExpired]);

  if (!data || remainingMs <= 0) return null;
  const seconds = Math.ceil(remainingMs / 1000);

  return (
    <aside className="fixed bottom-5 right-5 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-lime/30 bg-mocha/95 p-4 text-cream shadow-tactile backdrop-blur-md">
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-lime/20 bg-lime/10 p-2 text-lime">
          <WifiOff className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-bold">Your opponent left</p>
          <p className="mt-1 text-sm leading-relaxed text-cream-muted">
            They have {seconds} second{seconds === 1 ? "" : "s"} to return. If
            they do not, you win automatically.
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-espresso">
            <div
              className="h-full rounded-full bg-lime transition-[width] duration-200"
              style={{ width: `${(remainingMs / 10000) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
