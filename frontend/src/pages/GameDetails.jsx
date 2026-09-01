import { Copy, Eye, Flag, RotateCcw, Share2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { MiniBoard } from "../components/app/MiniBoard";
import { PublicPage } from "../components/app/PublicLayout";
import { Badge, Button, Card, PageHeader } from "../components/ui";

const moves = [
  [1, "e2–e4", "e7–e5", "0:01.2"],
  [2, "g1–f3", "b8–c6", "0:04.5"],
  [3, "f1–c4", "g8–f6", "0:08.0"],
  [4, "d2–d4", "f8–b4", "0:12.4"],
  [5, "b1–c3", "d7–d5", "0:17.9"]
];

export default function GameDetails() {
  const { gameId } = useParams();
  const isLive = gameId?.startsWith("live-");

  return (
    <PublicPage>
      <PageHeader
        eyebrow={isLive ? "Live public table" : "Public game record"}
        title={
          isLive ? "CoffeeGambit vs QuietRook" : "VelvetKnight vs CoffeePlayer"
        }
        description={`Game ${gameId}. Accepted moves appear in exact server sequence; private identity data is never shown.`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="small" icon={Share2}>
              Share
            </Button>
            <Button variant="ghost" size="small" icon={Copy}>
              Copy ID
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <Card className="p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-cream">QuietRook</div>
              <div className="mt-1 font-mono text-xs text-cream-muted">
                1538 · Black
              </div>
            </div>
            <Badge tone={isLive ? "danger" : "brass"}>
              {isLive ? "Live" : "Completed"}
            </Badge>
          </div>
          <MiniBoard className="mx-auto w-full max-w-[42rem]" />
          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-cream">
                CoffeePlayer
              </div>
              <div className="mt-1 font-mono text-xs text-cream-muted">
                1516 · White
              </div>
            </div>
            <div className="font-mono text-xl font-semibold text-lime">
              00.8
            </div>
          </div>
        </Card>

        <div className="grid content-start gap-5">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-brass-light">
                  {isLive ? "Move ledger" : "Replay"}
                </p>
                <h2 className="mt-1 font-display text-2xl font-semibold">
                  Server order
                </h2>
              </div>
              <Badge tone="lime">3s</Badge>
            </div>
            <div className="mt-5 overflow-hidden rounded-xl border border-cream/[0.08]">
              {moves.map(([sequence, white, black, time]) => (
                <div
                  key={sequence}
                  className="grid grid-cols-[2rem_1fr_1fr_auto] gap-2 border-b border-cream/[0.07] px-3 py-3 text-xs last:border-0"
                >
                  <span className="font-mono text-cream-muted/45">
                    {sequence}
                  </span>
                  <span className="font-mono text-cream">{white}</span>
                  <span className="font-mono text-cream-muted">{black}</span>
                  <span className="font-mono text-cream-muted/45">{time}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="small"
                className="flex-1"
                icon={RotateCcw}
              >
                Restart
              </Button>
              <Button
                variant="secondary"
                size="small"
                className="flex-1"
                icon={Eye}
              >
                Follow live
              </Button>
            </div>
          </Card>

          <Card tone="parchment" className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-wine text-parchment">
                <Flag className="h-5 w-5" />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-wine">
                  Result
                </p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-roasted">
                  White captured the king.
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-roasted/65">
                  No check or checkmate was involved. The final accepted move
                  ended the game.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PublicPage>
  );
}
