"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Clock3,
  Flag,
  LoaderCircle,
  Shield,
  Swords,
  TimerReset,
  Users,
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { ChessBoardPure } from "./ChessBoard-pure";
import { PlayModeGrid } from "./PlayModeGrid";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { Timer } from "./Timer";
import { VictoryScreen } from "./VictoryScreen";

type Variant = "1s" | "3s" | "5s";

interface GameState {
  gameId: string;
  color: "white" | "black";
  variant: Variant;
  fen: string;
  whiteTimer: number;
  blackTimer: number;
  whiteCanMove: boolean;
  blackCanMove: boolean;
  lastMove?: [string, string];
  boardSyncToken: number;
  capturedPiece?: string;
}

interface VictoryState {
  show: boolean;
  winner: "white" | "black";
  capturedPiece: string;
  capturedBy: string;
}

interface Premove {
  from: string;
  to: string;
}

interface GameProps {
  initialVariant?: Variant;
  autoStart?: boolean;
}

const VARIANT_TIMES: Record<Variant, number> = {
  "1s": 1000,
  "3s": 3000,
  "5s": 5000,
};
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL?.trim() || "http://localhost:8081";

const emptyVictoryState = (): VictoryState => ({
  show: false,
  winner: "white",
  capturedPiece: "",
  capturedBy: "",
});

function SurfaceCard({
  title,
  eyebrow,
  className,
  children,
}: {
  title: string;
  eyebrow?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`rounded-[2rem] border border-white/10 bg-mocha p-6 shadow-tactile bg-tactile-gradient sm:p-7 ${className ?? ""}`}
    >
      {eyebrow && (
        <div className="font-mono text-[11px] uppercase tracking-[0.26em] text-cream-muted">
          {eyebrow}
        </div>
      )}
      <h2 className="mt-2 font-display text-3xl font-bold text-cream">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

const formatRules = [
  {
    icon: Users,
    text: "Both players move independently with separate timers.",
  },
  {
    icon: Clock3,
    text: "You can only move when your own timer reaches zero.",
  },
  {
    icon: TimerReset,
    text: "Your timer resets immediately after a legal move lands.",
  },
  {
    icon: Shield,
    text: "There is no checkmate sequence. Capture the king to win.",
  },
] as const;

export default function Game({
  initialVariant = "3s",
  autoStart = false,
}: GameProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const autoStartQueuedRef = useRef(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    | "connecting"
    | "connected"
    | "waiting"
    | "playing"
    | "game_over"
    | "disconnected"
  >("connecting");
  const [variant, setVariant] = useState<Variant>(initialVariant);
  const [message, setMessage] = useState("");
  const [victoryState, setVictoryState] = useState<VictoryState>(
    emptyVictoryState(),
  );
  const [premove, setPremove] = useState<Premove | null>(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      setSocket(newSocket);
      socketRef.current = newSocket;
      setConnectionStatus("connected");
      setMessage("");
    });

    newSocket.on("connect_error", () => {
      setConnectionStatus("disconnected");
      setMessage("Failed to connect to the game server.");
    });

    newSocket.on("disconnect", () => {
      setConnectionStatus("disconnected");
      setMessage("Disconnected from the game server.");
    });

    newSocket.on("waiting", (data) => {
      setConnectionStatus("waiting");
      setMessage(data?.message ?? "Searching for opponent...");
    });

    newSocket.on("match_aborted", (data) => {
      setPremove(null);
      setGameState(null);
      setVictoryState(emptyVictoryState());
      setConnectionStatus("connected");
      setMessage(data?.message ?? "Match aborted. You are back in the lobby.");
    });

    newSocket.on("game_start", (data) => {
      const activeVariant = data.variant as Variant;

      setPremove(null);
      setVictoryState(emptyVictoryState());
      setVariant(activeVariant);
      setGameState({
        gameId: data.gameId,
        color: data.color,
        variant: activeVariant,
        fen:
          data.fen ??
          "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        whiteTimer: VARIANT_TIMES[activeVariant],
        blackTimer: VARIANT_TIMES[activeVariant],
        whiteCanMove: false,
        blackCanMove: false,
        boardSyncToken: 0,
      });
      setConnectionStatus("playing");
      setMessage("");
    });

    newSocket.on("timer_update", (data) => {
      setGameState((prev) => {
        if (!prev) return prev;

        const canNowMove =
          prev.color === "white" ? data.whiteCanMove : data.blackCanMove;

        setPremove((currentPremove) => {
          if (canNowMove && currentPremove && socketRef.current) {
            socketRef.current.emit("make_move", {
              gameId: prev.gameId,
              move: { from: currentPremove.from, to: currentPremove.to },
            });
            return null;
          }

          return currentPremove;
        });

        return {
          ...prev,
          whiteTimer: data.white,
          blackTimer: data.black,
          whiteCanMove: data.whiteCanMove,
          blackCanMove: data.blackCanMove,
        };
      });
    });

    newSocket.on("move_made", (data) => {
      setGameState((prev) =>
        prev
          ? {
              ...prev,
              fen: data.fen,
              lastMove: [data.move.from, data.move.to],
              whiteTimer: data.timers.white,
              blackTimer: data.timers.black,
              whiteCanMove:
                typeof data.whiteCanMove === "boolean"
                  ? data.whiteCanMove
                  : prev.whiteCanMove,
              blackCanMove:
                typeof data.blackCanMove === "boolean"
                  ? data.blackCanMove
                  : prev.blackCanMove,
              capturedPiece: data.move.captured,
            }
          : prev,
      );
    });

    newSocket.on("move_rejected", () => {
      setGameState((prev) =>
        prev ? { ...prev, boardSyncToken: prev.boardSyncToken + 1 } : prev,
      );
    });

    newSocket.on("game_over", (data) => {
      setPremove(null);
      setConnectionStatus("game_over");
      setGameState((prev) =>
        prev ? { ...prev, fen: data.fen ?? prev.fen } : prev,
      );

      const resultMessage =
        data.reason === "KING_CAPTURED"
          ? `${data.winner} wins by capturing the king!`
          : data.reason === "opponent_aborted"
            ? "Opponent aborted the match."
            : data.reason === "opponent_disconnected"
              ? "Opponent disconnected."
              : "Game over.";

      setMessage(resultMessage);

      if (data.reason === "KING_CAPTURED") {
        setVictoryState({
          show: true,
          winner: data.winner,
          capturedPiece: data.capturedPiece,
          capturedBy: data.capturedBy,
        });
      } else {
        setVictoryState(emptyVictoryState());
      }
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (!autoStart) return;
    if (autoStartQueuedRef.current) return;
    if (!socket || connectionStatus !== "connected" || gameState) return;

    socket.emit("find_game", { variant });
    autoStartQueuedRef.current = true;
  }, [autoStart, connectionStatus, gameState, socket, variant]);

  const handleSelectVariant = (nextVariant: Variant) => {
    setVariant(nextVariant);
    setMessage("");
  };

  const handleStartCasual = (nextVariant: Variant) => {
    setVariant(nextVariant);

    if (!socket || connectionStatus !== "connected") {
      setMessage("The server is still connecting. Try again in a second.");
      return;
    }

    autoStartQueuedRef.current = true;
    setMessage("");
    socket.emit("find_game", { variant: nextVariant });
  };

  const handleFriendAction = (action: "create" | "join") => {
    setMessage(
      action === "create"
        ? "Private room creation is the next feature on deck."
        : "Private room joining will land with friend match support.",
    );
  };

  const handleAbortMatch = () => {
    if (!socket) return;
    socket.emit("abort_match", gameState ? { gameId: gameState.gameId } : {});
  };

  const handleMove = (from: string, to: string, promotion?: string) => {
    if (!socket || !gameState) return;

    const canMove =
      gameState.color === "white"
        ? gameState.whiteCanMove
        : gameState.blackCanMove;

    if (!canMove) {
      setPremove({ from, to });
      return;
    }

    socket.emit("make_move", {
      gameId: gameState.gameId,
      move: promotion ? { from, to, promotion } : { from, to },
    });
  };

  const handleReturnToLobby = () => {
    setPremove(null);
    setGameState(null);
    setVictoryState(emptyVictoryState());
    setConnectionStatus("connected");
    setMessage("");
  };

  const handleVictoryClose = () => {
    handleReturnToLobby();
  };

  const activeVariant = gameState?.variant ?? variant;
  const maxTimerValue = VARIANT_TIMES[activeVariant];
  const isLiveGame =
    Boolean(gameState) &&
    (connectionStatus === "playing" || connectionStatus === "game_over");
  const waitingMessage = message || "Searching for opponent...";

  return (
    <div className="min-h-screen bg-espresso text-cream">
      <SiteHeader active="play" roomId={gameState?.gameId} />

      <main className="px-4 pb-16 pt-32 sm:px-6">
        <div className="mx-auto max-w-[1400px]">
        {connectionStatus === "connecting" && (
          <div className="flex min-h-[65vh] items-center justify-center">
            <SurfaceCard title="Connecting" eyebrow="Server Status" className="max-w-xl text-center">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-espresso/70 shadow-inner">
                  <LoaderCircle className="h-10 w-10 animate-spin text-lime" />
                </div>
                <p className="max-w-md text-base leading-relaxed text-cream-muted">
                  Connecting to the live match server and loading the play hub.
                </p>
              </div>
            </SurfaceCard>
          </div>
        )}

        {connectionStatus === "disconnected" && (
          <div className="flex min-h-[65vh] items-center justify-center">
            <SurfaceCard title="Connection Lost" eyebrow="Server Status" className="max-w-xl text-center">
              <div className="space-y-5 text-center">
                <div className="flex justify-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-danger/30 bg-danger/10">
                    <AlertCircle className="h-10 w-10 text-danger" />
                  </div>
                </div>
                <p className="text-base leading-relaxed text-cream-muted">
                  The client is no longer connected to the game server.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="rounded-full bg-lime px-6 py-3.5 font-display text-lg font-bold text-espresso shadow-tactile-btn transition-all duration-300 hover:bg-lime-hover active:translate-y-0.5 active:shadow-tactile-btn-pressed"
                >
                  Reconnect
                </button>
              </div>
            </SurfaceCard>
          </div>
        )}

        {connectionStatus === "connected" && !gameState && (
          <div className="space-y-10">
            <section className="text-center">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-mocha/80 px-5 py-2 shadow-tactile backdrop-blur-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-lime" />
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-cream-muted">
                  Match Hub Online
                </span>
              </div>
              <h1 className="mt-6 font-display text-5xl font-bold tracking-tight text-cream sm:text-6xl">
                Step Into The Arena
              </h1>
              <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-cream-muted sm:text-lg">
                The new designer theme now wraps the entire play flow, from
                queue selection to live boards. Casual matches are ready,
                ranked is staged, and friend rooms are next.
              </p>
            </section>

            <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
              <SurfaceCard title="Live Format" eyebrow="Ruleset">
                <div className="space-y-5">
                  {formatRules.map((rule) => {
                    const Icon = rule.icon;

                    return (
                      <div key={rule.text} className="flex items-start gap-3">
                        <Icon className="mt-0.5 h-4 w-4 text-lime" />
                        <p className="text-sm leading-relaxed text-cream-muted">
                          {rule.text}
                        </p>
                      </div>
                    );
                  })}
                  <div className="rounded-[1.4rem] border border-white/10 bg-espresso/70 p-4 shadow-inner">
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-cream-muted">
                      Selected Cooldown
                    </div>
                    <div className="mt-2 font-display text-4xl font-bold text-lime">
                      {variant.toUpperCase()}
                    </div>
                    <p className="mt-2 text-sm text-cream-muted">
                      Use the center panel to queue whenever you are ready.
                    </p>
                  </div>
                </div>
              </SurfaceCard>

              <PlayModeGrid
                connectionReady={connectionStatus === "connected"}
                selectedVariant={variant}
                onSelectVariant={handleSelectVariant}
                onStartCasual={handleStartCasual}
                onFriendAction={handleFriendAction}
              />

              <SurfaceCard title="What Ships Next" eyebrow="Roadmap">
                <div className="space-y-4 text-sm leading-relaxed text-cream-muted">
                  <div className="rounded-[1.4rem] border border-white/10 bg-espresso/70 p-4 shadow-inner">
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-cream-muted">
                      Ranked
                    </div>
                    <p className="mt-2">
                      Account-backed identity, matchmaking history, and ratings.
                    </p>
                  </div>
                  <div className="rounded-[1.4rem] border border-white/10 bg-espresso/70 p-4 shadow-inner">
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-cream-muted">
                      Friend Rooms
                    </div>
                    <p className="mt-2">
                      Create or join private lobbies for direct rematches.
                    </p>
                  </div>
                  <div className="rounded-[1.4rem] border border-white/10 bg-espresso/70 p-4 shadow-inner">
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-cream-muted">
                      Polish
                    </div>
                    <p className="mt-2">
                      More board themes, richer match telemetry, and tighter
                      lobby flows.
                    </p>
                  </div>
                </div>
              </SurfaceCard>
            </div>
          </div>
        )}

        {connectionStatus === "waiting" && (
          <div className="mx-auto max-w-3xl">
            <SurfaceCard title="Finding Opponent" eyebrow="Matchmaking" className="text-center">
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-espresso/70 shadow-inner">
                  <LoaderCircle className="h-11 w-11 animate-spin text-lime" />
                </div>

                <div className="space-y-3">
                  <p className="font-display text-3xl font-bold text-cream">
                    Searching for a {variant.toUpperCase()} casual match.
                  </p>
                  <p className="text-sm leading-relaxed text-cream-muted">
                    {waitingMessage}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <div className="rounded-full border border-white/10 bg-espresso/80 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-lime">
                    Variant {variant.toUpperCase()}
                  </div>
                  <div className="rounded-full border border-white/10 bg-espresso/80 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-cream-muted">
                    Casual Queue
                  </div>
                </div>

                <button
                  onClick={handleAbortMatch}
                  className="rounded-full border border-danger/50 px-6 py-3.5 font-display text-lg font-bold text-danger transition-all duration-300 hover:bg-danger hover:text-white"
                >
                  Abort Match
                </button>
              </div>
            </SurfaceCard>
          </div>
        )}

        {isLiveGame && gameState && (
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="rounded-[2rem] border border-white/10 bg-mocha p-4 shadow-[0_30px_80px_rgba(0,0,0,0.34)] bg-tactile-gradient sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.26em] text-cream-muted">
                    Live Board
                  </div>
                  <h2 className="mt-2 font-display text-4xl font-bold text-cream">
                    {connectionStatus === "game_over"
                      ? "Match Complete"
                      : "Match In Progress"}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-full border border-white/10 bg-espresso/80 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-cream-muted">
                    Room{" "}
                    <span className="text-lime">{gameState.gameId}</span>
                  </div>
                  <div className="rounded-full border border-white/10 bg-espresso/80 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-cream-muted">
                    Variant{" "}
                    <span className="text-cream">{gameState.variant.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <ChessBoardPure
                  fen={gameState.fen}
                  orientation={gameState.color}
                  onMove={handleMove}
                  onPremoveChange={(nextPremove) => setPremove(nextPremove)}
                  canMove={
                    connectionStatus === "playing" &&
                    (gameState.color === "white"
                      ? gameState.whiteCanMove
                      : gameState.blackCanMove)
                  }
                  lastMove={gameState.lastMove}
                  syncToken={gameState.boardSyncToken}
                  capturedPiece={gameState.capturedPiece}
                  premove={premove}
                />
              </div>
            </section>

            <aside className="xl:self-start">
              <div className="flex flex-col gap-5">
                <Timer
                  value={gameState.whiteTimer}
                  maxValue={maxTimerValue}
                  canMove={gameState.whiteCanMove}
                  playerName="White"
                  color="white"
                  isPlayerCard={gameState.color === "white"}
                />
                <Timer
                  value={gameState.blackTimer}
                  maxValue={maxTimerValue}
                  canMove={gameState.blackCanMove}
                  playerName="Black"
                  color="black"
                  isPlayerCard={gameState.color === "black"}
                />

                <SurfaceCard title="Game Info" eyebrow="Live Status">
                  <div className="space-y-4 text-sm">
                    <div className="flex items-center justify-between gap-4 border-b border-white/6 pb-4">
                      <span className="text-cream-muted">Your Color</span>
                      <span className="rounded-full border border-lime/30 bg-lime/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-lime">
                        {gameState.color}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-white/6 pb-4">
                      <span className="text-cream-muted">Variant</span>
                      <span className="font-mono text-sm font-bold text-cream">
                        {gameState.variant.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-white/6 pb-4">
                      <span className="text-cream-muted">Status</span>
                      <span className="font-mono text-sm font-bold text-cream">
                        {connectionStatus === "game_over" ? "Finished" : "Live"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-cream-muted">Premove</span>
                      <span className="font-mono text-sm font-bold text-cream">
                        {premove ? `${premove.from} -> ${premove.to}` : "None"}
                      </span>
                    </div>
                  </div>
                </SurfaceCard>

                <SurfaceCard title="Actions" eyebrow="Match Control">
                  <div className="space-y-3">
                    {connectionStatus === "playing" && (
                      <button
                        onClick={handleAbortMatch}
                        className="flex w-full items-center justify-center gap-2 rounded-full border border-danger/55 px-5 py-3.5 font-display text-lg font-bold text-danger transition-all duration-300 hover:bg-danger hover:text-white"
                      >
                        <Flag className="h-4 w-4" />
                        Abort Match
                      </button>
                    )}

                    {connectionStatus === "game_over" && (
                      <button
                        onClick={handleReturnToLobby}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-lime px-5 py-3.5 font-display text-lg font-bold text-espresso shadow-tactile-btn transition-all duration-300 hover:bg-lime-hover active:translate-y-0.5 active:shadow-tactile-btn-pressed"
                      >
                        <Swords className="h-4 w-4" />
                        Back To Lobby
                      </button>
                    )}
                  </div>
                </SurfaceCard>
              </div>
            </aside>
          </div>
        )}

        {message && connectionStatus !== "waiting" && (
          <div className="pointer-events-none fixed left-4 right-4 top-24 z-40 sm:left-1/2 sm:right-auto sm:w-full sm:max-w-md sm:-translate-x-1/2">
            <div className="flex items-start gap-3 rounded-[1.4rem] border border-white/10 bg-mocha px-4 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
              <AlertCircle className="mt-0.5 h-5 w-5 text-lime" />
              <p className="text-sm leading-relaxed text-cream">
                {message}
              </p>
            </div>
          </div>
        )}

        {victoryState.show && gameState && (
          <VictoryScreen
            winner={victoryState.winner}
            playerColor={gameState.color}
            capturedPiece={victoryState.capturedPiece}
            capturedBy={victoryState.capturedBy}
            onClose={handleVictoryClose}
          />
        )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
