import { useEffect, useRef, useState } from "react";
import { Copy, Eye, Flag, RotateCcw, Share2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { getGame, getGameMoves, getGameReplay } from "../api/games";
import { MiniBoard } from "../components/app/MiniBoard";
import { PublicPage } from "../components/app/PublicLayout";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  LoadingState,
  PageHeader
} from "../components/ui";

const VARIANT_LABELS = {
  ONE_SECOND: "1s",
  THREE_SECONDS: "3s",
  FIVE_SECONDS: "5s"
};

const END_REASON_LABELS = {
  king_captured: "White captured the king.",
  disconnect_forfeit: "Opponent disconnected and forfeited.",
  resignation: "Player resigned.",
  aborted: "Game was aborted.",
  server_interrupted: "Server was interrupted.",
  admin_terminated: "Game terminated by admin."
};

function formatMove(move) {
  return `${move.from}–${move.to}`;
}

function formatElapsed(ms) {
  const s = (ms / 1000).toFixed(1);
  return `0:${String(Math.floor(ms / 1000)).padStart(2, "0")}.${String(Math.floor((ms % 1000) / 100))}`;
}

export default function GameDetails() {
  const { gameId } = useParams();

  const [game, setGame] = useState(null);
  const [moves, setMoves] = useState([]);
  const [replayFen, setReplayFen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replayFrame, setReplayFrame] = useState(0);
  const replayFramesRef = useRef([]);

  useEffect(() => {
    if (!gameId) return;
    const controller = new AbortController();
    setLoading(true);

    Promise.all([
      getGame(gameId, undefined, controller.signal),
      getGameMoves(gameId, { limit: 200 }, undefined, controller.signal),
      getGameReplay(gameId, undefined, controller.signal).catch(() => null)
    ])
      .then(([gameRes, movesRes, replayRes]) => {
        setGame(gameRes.game);
        setMoves(movesRes.moves ?? []);
        if (replayRes?.frames) {
          replayFramesRef.current = replayRes.frames;
          setReplayFen(replayRes.frames[0]?.fen ?? null);
          setReplayFrame(0);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [gameId]);

  const white = game?.participants?.find((p) => p.color === "white");
  const black = game?.participants?.find((p) => p.color === "black");
  const winner = game?.winner;
  const isLive = game?.status === "active";

  const stepReplay = (dir) => {
    const frames = replayFramesRef.current;
    if (!frames.length) return;
    const next = Math.max(0, Math.min(frames.length - 1, replayFrame + dir));
    setReplayFrame(next);
    setReplayFen(frames[next]?.fen ?? null);
  };

  const copyId = () => {
    navigator.clipboard.writeText(gameId).catch(() => {});
  };

  const shareGame = () => {
    if (navigator.share) {
      navigator.share({ url: window.location.href, title: "Checkless game" }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
  };

  if (loading) {
    return (
      <PublicPage>
        <LoadingState text="Loading game…" className="py-24" />
      </PublicPage>
    );
  }

  if (error || !game) {
    return (
      <PublicPage>
        <ErrorState error={error ?? { message: "Game not found." }} className="mt-8" />
      </PublicPage>
    );
  }

  return (
    <PublicPage>
      <PageHeader
        eyebrow={isLive ? "Live public table" : "Public game record"}
        title={`${white?.username ?? "?"} vs ${black?.username ?? "?"}`}
        description={`Game ${gameId}. Accepted moves appear in exact server sequence; private identity data is never shown.`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="small" icon={Share2} onClick={shareGame}>
              Share
            </Button>
            <Button variant="ghost" size="small" icon={Copy} onClick={copyId}>
              Copy ID
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <Card className="p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-cream">
                {black?.username ?? "Unknown"}
              </div>
              <div className="mt-1 font-mono text-xs text-cream-muted">
                {black?.ratingBefore ?? "—"} · Black
              </div>
            </div>
            <Badge tone={isLive ? "danger" : "brass"}>
              {isLive ? "Live" : game.status === "completed" ? "Completed" : game.status}
            </Badge>
          </div>
          <MiniBoard
            className="mx-auto w-full max-w-[42rem]"
            fen={replayFen ?? game.finalFen ?? game.initialFen}
          />
          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-cream">
                {white?.username ?? "Unknown"}
              </div>
              <div className="mt-1 font-mono text-xs text-cream-muted">
                {white?.ratingBefore ?? "—"} · White
              </div>
            </div>
            <div className="font-mono text-xl font-semibold text-lime">
              {VARIANT_LABELS[game.variant] ?? game.variant}
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
                <h2 className="mt-1 font-display text-2xl font-semibold">Server order</h2>
              </div>
              <Badge tone="lime">{VARIANT_LABELS[game.variant] ?? game.variant}</Badge>
            </div>
            <div className="mt-5 max-h-64 overflow-y-auto rounded-xl border border-cream/[0.08]">
              {moves.length === 0 ? (
                <p className="p-4 text-xs text-cream-muted/60">No moves recorded.</p>
              ) : (
                moves.map((move) => (
                  <div
                    key={move.sequence}
                    className="grid grid-cols-[2rem_1fr_1fr_auto] gap-2 border-b border-cream/[0.07] px-3 py-3 text-xs last:border-0 cursor-pointer hover:bg-white/5"
                    onClick={() => {
                      const frames = replayFramesRef.current;
                      const idx = frames.findIndex((f) => f.sequence === move.sequence);
                      if (idx !== -1) {
                        setReplayFrame(idx);
                        setReplayFen(frames[idx].fen);
                      }
                    }}
                  >
                    <span className="font-mono text-cream-muted/45">{move.sequence}</span>
                    <span className={`font-mono ${move.color === "white" ? "text-cream" : "text-cream-muted"}`}>
                      {formatMove(move)}
                    </span>
                    <span className="font-mono text-cream-muted/45">
                      {formatElapsed(move.elapsedMs)}
                    </span>
                  </div>
                ))
              )}
            </div>
            {replayFramesRef.current.length > 0 && (
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="small"
                  className="flex-1"
                  icon={RotateCcw}
                  onClick={() => stepReplay(-1)}
                  disabled={replayFrame === 0}
                >
                  Back
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  className="flex-1"
                  icon={Eye}
                  onClick={() => stepReplay(1)}
                  disabled={replayFrame >= replayFramesRef.current.length - 1}
                >
                  Forward
                </Button>
              </div>
            )}
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
                  {winner
                    ? `${winner === "white" ? white?.username : black?.username} won.`
                    : "No result."}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-roasted/65">
                  {END_REASON_LABELS[game.endReason] ?? game.endReason ?? "Game concluded."}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PublicPage>
  );
}
