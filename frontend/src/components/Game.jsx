import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/react";
import {
  AlertCircle,
  Clock3,
  Flag,
  LoaderCircle,
  Shield,
  Swords,
  TimerReset,
  Users,
  Wifi
} from "lucide-react";
import { io } from "socket.io-client";
import { ChessBoard } from "./ChessBoard";
import { clearConfetti, initConfetti } from "./confetti";
import { PlayModeGrid } from "./PlayModeGrid";
import { Timer } from "./Timer";
import { VictoryScreen } from "./VictoryScreen";
import { Button, OpponentDisconnectToast } from "./ui";

const VARIANT_TIMES = {
  "1s": 1000,
  "3s": 3000,
  "5s": 5000
};

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL?.trim() || "http://localhost:8081";
const GUEST_TOKEN_KEY = "checkless.guestToken";

async function getGuestToken() {
  const existing = window.localStorage.getItem(GUEST_TOKEN_KEY);
  if (existing) return existing;
  const response = await fetch(`${SOCKET_URL}/api/guest`, { method: "POST" });
  if (!response.ok) throw new Error("GUEST_TOKEN_UNAVAILABLE");
  const data = await response.json();
  window.localStorage.setItem(GUEST_TOKEN_KEY, data.token);
  return data.token;
}

const emptyVictoryState = () => ({
  show: false,
  winner: "white",
  capturedPiece: "",
  capturedBy: ""
});

function SurfaceCard({ title, eyebrow, className, children }) {
  return (
    <section
      className={`rounded-[2rem] border border-white/10 bg-mocha p-6 shadow-tactile bg-tactile-gradient sm:p-7 ${
        className ?? ""
      }`}
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
    text: "Both players move independently with separate timers."
  },
  {
    icon: Clock3,
    text: "You can only move when your own timer reaches zero."
  },
  {
    icon: TimerReset,
    text: "Your timer resets immediately after a legal move lands."
  },
  {
    icon: Shield,
    text: "There is no checkmate sequence. Capture the king to win."
  }
];

const LATENCY_SAMPLE_INTERVAL = 4000;
const LATENCY_LOG_INTERVAL = 15000;

function createClientMoveId() {
  return window.crypto.randomUUID();
}

function getPingAppearance(pingMs) {
  if (pingMs === null) {
    return {
      value: "--",
      tone: "Syncing",
      dotClass: "bg-cream-muted/70",
      textClass: "text-cream-muted"
    };
  }

  if (pingMs < 90) {
    return {
      value: `${pingMs}ms`,
      tone: "Strong",
      dotClass: "bg-lime",
      textClass: "text-lime"
    };
  }

  if (pingMs < 180) {
    return {
      value: `${pingMs}ms`,
      tone: "Stable",
      dotClass: "bg-cream",
      textClass: "text-cream"
    };
  }

  return {
    value: `${pingMs}ms`,
    tone: "High",
    dotClass: "bg-danger",
    textClass: "text-danger"
  };
}

function getTransportLabel(transportName) {
  if (transportName === "websocket") return "WS";
  if (transportName === "polling") return "Polling";
  if (transportName === "offline") return "Offline";
  if (transportName === "connecting") return "Connecting";
  return "Unknown";
}

export default function Game({ initialVariant = "3s", autoStart = false }) {
  const { getToken } = useAuth();
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const autoStartQueuedRef = useRef(false);
  const victorySequenceTimeoutsRef = useRef([]);
  const lastResolvedMoveRef = useRef(null);
  const latestFenRef = useRef("");
  const [gameState, setGameState] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [variant, setVariant] = useState(initialVariant);
  const [message, setMessage] = useState("");
  const [victoryState, setVictoryState] = useState(emptyVictoryState());
  const [victoryAnimation, setVictoryAnimation] = useState(null);
  const [premove, setPremove] = useState(null);
  const [pingMs, setPingMs] = useState(null);
  const [disconnectNotice, setDisconnectNotice] = useState(null);
  const activeGameIdRef = useRef(null);
  const [transportName, setTransportName] = useState("connecting");
  const latencySamplesRef = useRef([]);
  const latencyProbeInFlightRef = useRef(false);
  const latencyProbeTimeoutRef = useRef(null);
  const lastLatencyLogAtRef = useRef(0);

  const clearVictorySequenceTimers = useCallback(() => {
    victorySequenceTimeoutsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    victorySequenceTimeoutsRef.current = [];
  }, []);

  const resetVictoryPresentation = useCallback(() => {
    clearVictorySequenceTimers();
    lastResolvedMoveRef.current = null;
    setVictoryAnimation(null);
    setVictoryState(emptyVictoryState());
  }, [clearVictorySequenceTimers]);

  useEffect(() => {
    return () => {
      clearVictorySequenceTimers();
      clearConfetti();
    };
  }, [clearVictorySequenceTimers]);

  useEffect(() => {
    latestFenRef.current = gameState?.fen ?? "";
  }, [gameState?.fen]);

  useEffect(() => {
    if (!victoryAnimation?.showConfetti) return;
    initConfetti({ cannons: true, fireworks: true });
    return () => {
      clearConfetti();
    };
  }, [victoryAnimation?.showConfetti]);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      auth: (callback) => {
        getToken()
          .then((token) => (token ? token : getGuestToken()))
          .then((token) => callback({ token }))
          .catch(() => callback({ token: null }));
      },
      timeout: 5000,
      transports: ["websocket", "polling"],
      tryAllTransports: true,
      rememberUpgrade: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000
    });
    let latencyIntervalId = null;
    let removeEngineListeners = null;

    const clearLatencyProbeTimeout = () => {
      if (latencyProbeTimeoutRef.current === null) return;
      window.clearTimeout(latencyProbeTimeoutRef.current);
      latencyProbeTimeoutRef.current = null;
    };

    const resetLatencyState = (transport = "connecting") => {
      setPingMs(null);
      setTransportName(transport);
      latencySamplesRef.current = [];
      latencyProbeInFlightRef.current = false;
      clearLatencyProbeTimeout();
    };

    const clearLatencyInterval = () => {
      if (latencyIntervalId === null) return;
      window.clearInterval(latencyIntervalId);
      latencyIntervalId = null;
    };

    const getActiveTransport = () =>
      newSocket.io.engine?.transport?.name ??
      (newSocket.connected ? "unknown" : "connecting");

    const logLatency = (msg, force = false) => {
      const now = Date.now();
      if (!force && now - lastLatencyLogAtRef.current < LATENCY_LOG_INTERVAL) {
        return;
      }
      lastLatencyLogAtRef.current = now;
      console.info(`[realtime] ${msg}`);
    };

    const sampleLatency = () => {
      if (!newSocket.connected || latencyProbeInFlightRef.current) return;

      latencyProbeInFlightRef.current = true;
      const startedAt = performance.now();

      latencyProbeTimeoutRef.current = window.setTimeout(() => {
        latencyProbeInFlightRef.current = false;
        latencyProbeTimeoutRef.current = null;
        console.warn(
          `[realtime] latency probe timed out via ${getActiveTransport()}`
        );
      }, 2500);

      newSocket.emit("latency_ping", { clientAt: Date.now() }, (_response) => {
        if (!latencyProbeInFlightRef.current) return;

        latencyProbeInFlightRef.current = false;
        clearLatencyProbeTimeout();

        const roundTrip = Math.max(
          0,
          Math.round(performance.now() - startedAt)
        );
        const nextSamples = [...latencySamplesRef.current.slice(-5), roundTrip];
        const averageLatency = Math.round(
          nextSamples.reduce((sum, sample) => sum + sample, 0) /
            nextSamples.length
        );

        latencySamplesRef.current = nextSamples;
        setPingMs(averageLatency);

        const transport = getActiveTransport();

        if (roundTrip >= 180 || averageLatency >= 180) {
          console.warn(
            `[realtime] high latency ${roundTrip}ms rtt (${averageLatency}ms avg) via ${transport}`
          );
          lastLatencyLogAtRef.current = Date.now();
          return;
        }

        logLatency(
          `latency ${roundTrip}ms rtt (${averageLatency}ms avg) via ${transport}`
        );
      });
    };

    const attachEngineListeners = () => {
      const engine = newSocket.io.engine;
      if (!engine) return;

      setTransportName(engine.transport.name);

      const handleUpgrade = (transport) => {
        setTransportName(transport.name);
        logLatency(`transport upgraded to ${transport.name}`, true);
        sampleLatency();
      };

      engine.on("upgrade", handleUpgrade);

      removeEngineListeners = () => {
        engine.off("upgrade", handleUpgrade);
      };
    };

    newSocket.on("connect", () => {
      setSocket(newSocket);
      socketRef.current = newSocket;
      setConnectionStatus("connected");
      resetVictoryPresentation();
      setMessage("");
      clearLatencyInterval();
      removeEngineListeners?.();
      attachEngineListeners();
      setTransportName(getActiveTransport());
      logLatency(`connected via ${getActiveTransport()}`, true);
      if (activeGameIdRef.current) {
        newSocket.emit("reconnect_game", { gameId: activeGameIdRef.current });
      }
      sampleLatency();
      latencyIntervalId = window.setInterval(
        sampleLatency,
        LATENCY_SAMPLE_INTERVAL
      );
    });

    newSocket.on("connect_error", (error) => {
      resetVictoryPresentation();
      setConnectionStatus("disconnected");
      setMessage(
        error?.message === "ACCOUNT_SUSPENDED"
          ? "This account is suspended and cannot join games."
          : error?.message === "AUTH_REQUIRED" ||
              error?.message === "AUTH_INVALID"
            ? "Your login session could not be verified. Please sign in again."
            : "Failed to connect to the game server."
      );
      clearLatencyInterval();
      removeEngineListeners?.();
      removeEngineListeners = null;
      resetLatencyState("offline");
    });

    newSocket.on("disconnect", () => {
      resetVictoryPresentation();
      setConnectionStatus("disconnected");
      setMessage("Disconnected from the game server.");
      clearLatencyInterval();
      removeEngineListeners?.();
      removeEngineListeners = null;
      resetLatencyState("offline");
    });

    newSocket.on("waiting", (data) => {
      setConnectionStatus("waiting");
      setMessage(data?.message ?? "Searching for opponent...");
    });

    newSocket.on("match_aborted", (data) => {
      setPremove(null);
      setGameState(null);
      resetVictoryPresentation();
      setConnectionStatus("connected");
      setMessage(data?.message ?? "Match aborted. You are back in the lobby.");
    });

    newSocket.on("game_start", (data) => {
      const activeVariant = data.variant;

      setPremove(null);
      resetVictoryPresentation();
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
        boardSyncToken: 0
      });
      activeGameIdRef.current = data.gameId;
      setDisconnectNotice(null);
      lastResolvedMoveRef.current = null;
      setConnectionStatus("playing");
      setMessage("");
    });

    newSocket.on("opponent_disconnected", (data) => {
      if (!data?.deadlineAt) return;
      setDisconnectNotice(data);
    });

    newSocket.on("opponent_reconnected", () => {
      setDisconnectNotice(null);
    });

    newSocket.on("reconnect_success", (data) => {
      setDisconnectNotice(null);
      setGameState((prev) =>
        prev
          ? {
              ...prev,
              fen: data.fen ?? prev.fen,
              whiteTimer: data.timers?.white ?? prev.whiteTimer,
              blackTimer: data.timers?.black ?? prev.blackTimer,
              whiteCanMove: data.whiteCanMove ?? prev.whiteCanMove,
              blackCanMove: data.blackCanMove ?? prev.blackCanMove
            }
          : prev
      );
      setConnectionStatus("playing");
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
              clientMoveId: createClientMoveId(),
              move: { from: currentPremove.from, to: currentPremove.to }
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
          blackCanMove: data.blackCanMove
        };
      });
    });

    newSocket.on("move_made", (data) => {
      if (data.move?.from && data.move?.to) {
        lastResolvedMoveRef.current = [data.move.from, data.move.to];
      }

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
              capturedPiece: data.move.captured
            }
          : prev
      );
    });

    newSocket.on("move_rejected", () => {
      setGameState((prev) =>
        prev ? { ...prev, boardSyncToken: prev.boardSyncToken + 1 } : prev
      );
    });

    newSocket.on("game_over", (data) => {
      setDisconnectNotice(null);
      clearVictorySequenceTimers();
      setPremove(null);
      setConnectionStatus("game_over");

      const resultMessage =
        data.reason === "KING_CAPTURED"
          ? `${data.winner} wins by capturing the king!`
          : data.reason === "opponent_aborted" || data.reason === "ABORTED"
            ? "Match was aborted."
            : data.reason === "DISCONNECT_FORFEIT"
              ? "Opponent did not return and you win by forfeit."
              : data.reason === "RESIGNATION"
                ? "Opponent resigned."
                : "Game over.";

      setMessage(data.reason === "KING_CAPTURED" ? "" : resultMessage);

      if (data.reason === "KING_CAPTURED") {
        const resolvedMove =
          data.move?.from && data.move?.to
            ? [data.move.from, data.move.to]
            : lastResolvedMoveRef.current;
        const victorySquare = resolvedMove?.[1] ?? null;

        if (resolvedMove) {
          lastResolvedMoveRef.current = resolvedMove;
        }

        setGameState((prev) =>
          prev
            ? {
                ...prev,
                fen: data.fen ?? prev.fen,
                lastMove: resolvedMove ?? prev.lastMove,
                whiteTimer: data.timers?.white ?? prev.whiteTimer,
                blackTimer: data.timers?.black ?? prev.blackTimer,
                whiteCanMove: false,
                blackCanMove: false,
                capturedPiece: data.capturedPiece ?? prev.capturedPiece
              }
            : prev
        );

        setVictoryAnimation({
          square: victorySquare,
          showConfetti: false,
          lockedFen: data.fen ?? latestFenRef.current,
          lockedMove: resolvedMove ?? null
        });

        const confettiTimeout = window.setTimeout(() => {
          setVictoryAnimation((current) =>
            current ? { ...current, showConfetti: true } : current
          );
        }, 650);

        const modalTimeout = window.setTimeout(() => {
          setVictoryState({
            show: true,
            winner: data.winner,
            capturedPiece: data.capturedPiece,
            capturedBy: data.capturedBy
          });
        }, 2650);

        victorySequenceTimeoutsRef.current = [confettiTimeout, modalTimeout];
      } else {
        setVictoryAnimation(null);
        setGameState((prev) =>
          prev ? { ...prev, fen: data.fen ?? prev.fen } : prev
        );
        setVictoryState(emptyVictoryState());
      }
    });

    return () => {
      clearLatencyInterval();
      clearLatencyProbeTimeout();
      removeEngineListeners?.();
      newSocket.close();
    };
  }, [clearVictorySequenceTimers, getToken, resetVictoryPresentation]);

  useEffect(() => {
    if (!autoStart) return;
    if (autoStartQueuedRef.current) return;
    if (!socket || connectionStatus !== "connected" || gameState) return;

    socket.emit("find_game", { mode: "CASUAL", variant });
    autoStartQueuedRef.current = true;
  }, [autoStart, connectionStatus, gameState, socket, variant]);

  const handleSelectVariant = (nextVariant) => {
    setVariant(nextVariant);
    setMessage("");
  };

  const handleStartGame = (mode = "CASUAL", nextVariant = variant) => {
    setVariant(nextVariant);

    if (!socket || connectionStatus !== "connected") {
      setMessage("The server is still connecting. Try again in a second.");
      return;
    }

    autoStartQueuedRef.current = true;
    setMessage("");
    socket.emit("find_game", { mode, variant: nextVariant });
  };

  const handleAbortMatch = () => {
    if (!socket) return;
    socket.emit("abort_match", gameState ? { gameId: gameState.gameId } : {});
  };

  const handleMove = (from, to, promotion) => {
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
      clientMoveId: createClientMoveId(),
      move: promotion ? { from, to, promotion } : { from, to }
    });
  };

  const handleReturnToLobby = () => {
    setPremove(null);
    setGameState(null);
    resetVictoryPresentation();
    setConnectionStatus("connected");
    setMessage("");
    setDisconnectNotice(null);
    activeGameIdRef.current = null;
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
  const showCelebrationConfetti =
    Boolean(victoryAnimation?.showConfetti) || victoryState.show;
  const pingAppearance = getPingAppearance(pingMs);
  const transportLabel = getTransportLabel(transportName);

  return (
    <div className="w-full text-cream">
      {showCelebrationConfetti && (
        <canvas
          id="confetti"
          className="pointer-events-none fixed inset-0 z-40"
          style={{ width: "100%", height: "100%" }}
        />
      )}

      <div className="w-full">
        <div className="mx-auto max-w-[1400px]">
          {connectionStatus === "connecting" && (
            <div className="flex min-h-[65vh] items-center justify-center">
              <SurfaceCard
                title="Connecting"
                eyebrow="Server Status"
                className="max-w-xl text-center"
              >
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-espresso/70 shadow-inner">
                    <LoaderCircle className="h-10 w-10 animate-spin text-lime" />
                  </div>
                  <p className="max-w-md text-base leading-relaxed text-cream-muted">
                    Connecting to the live match server and loading the play
                    hub.
                  </p>
                </div>
              </SurfaceCard>
            </div>
          )}

          {connectionStatus === "disconnected" && (
            <div className="flex min-h-[65vh] items-center justify-center">
              <SurfaceCard
                title="Connection Lost"
                eyebrow="Server Status"
                className="max-w-xl text-center"
              >
                <div className="space-y-5 text-center">
                  <div className="flex justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-danger/30 bg-danger/10">
                      <AlertCircle className="h-10 w-10 text-danger" />
                    </div>
                  </div>
                  <p className="text-base leading-relaxed text-cream-muted">
                    The client is no longer connected to the game server.
                  </p>
                  <Button onClick={() => window.location.reload()} size="large">
                    Reconnect
                  </Button>
                </div>
              </SurfaceCard>
            </div>
          )}

          {connectionStatus === "connected" && !gameState && (
            <PlayModeGrid
              connectionReady={connectionStatus === "connected"}
              selectedVariant={variant}
              onSelectVariant={handleSelectVariant}
              onStartGame={handleStartGame}
              pingMs={pingMs}
            />
          )}

          {connectionStatus === "waiting" && (
            <div className="mx-auto max-w-3xl">
              <SurfaceCard
                title="Finding Opponent"
                eyebrow="Matchmaking"
                className="text-center"
              >
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

                  <Button
                    onClick={handleAbortMatch}
                    variant="danger"
                    size="large"
                  >
                    Abort Match
                  </Button>
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
                      <span className="flex items-center gap-2">
                        <Wifi className="h-3.5 w-3.5 text-lime" />
                        Ping{" "}
                        <span
                          className={`font-bold ${pingAppearance.textClass}`}
                        >
                          {pingAppearance.value}
                        </span>
                        <span className="text-cream-muted/60">
                          {transportLabel}
                        </span>
                      </span>
                    </div>
                    <div className="rounded-full border border-white/10 bg-espresso/80 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-cream-muted">
                      Room <span className="text-lime">{gameState.gameId}</span>
                    </div>
                    <div className="rounded-full border border-white/10 bg-espresso/80 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-cream-muted">
                      Variant{" "}
                      <span className="text-cream">
                        {gameState.variant.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <ChessBoard
                    fen={victoryAnimation?.lockedFen || gameState.fen}
                    orientation={gameState.color}
                    onMove={handleMove}
                    onPremoveChange={(nextPremove) => setPremove(nextPremove)}
                    canMove={
                      connectionStatus === "playing" &&
                      (gameState.color === "white"
                        ? gameState.whiteCanMove
                        : gameState.blackCanMove)
                    }
                    lastMove={
                      victoryAnimation?.lockedMove ?? gameState.lastMove
                    }
                    syncToken={gameState.boardSyncToken}
                    capturedPiece={gameState.capturedPiece}
                    premove={premove}
                    victorySquare={victoryAnimation?.square ?? null}
                    victoryActive={Boolean(victoryAnimation)}
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
                          {connectionStatus === "game_over"
                            ? "Finished"
                            : "Live"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-b border-white/6 pb-4">
                        <span className="text-cream-muted">Ping</span>
                        <span className="flex items-center gap-2 font-mono text-sm font-bold">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${pingAppearance.dotClass}`}
                          />
                          <span className={pingAppearance.textClass}>
                            {pingAppearance.value}
                          </span>
                          <span className="text-cream-muted/70">
                            {pingAppearance.tone} · {transportLabel}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-cream-muted">Premove</span>
                        <span className="font-mono text-sm font-bold text-cream">
                          {premove
                            ? `${premove.from} -> ${premove.to}`
                            : "None"}
                        </span>
                      </div>
                    </div>
                  </SurfaceCard>

                  <SurfaceCard title="Actions" eyebrow="Match Control">
                    <div className="space-y-3">
                      {connectionStatus === "playing" && (
                        <div className="space-y-3">
                          <Button
                            onClick={() =>
                              socket?.emit("resign_game", {
                                gameId: gameState.gameId
                              })
                            }
                            variant="danger"
                            className="w-full"
                            icon={Flag}
                          >
                            Resign Game
                          </Button>
                          <Button
                            onClick={handleAbortMatch}
                            variant="ghost"
                            className="w-full"
                          >
                            Abort Match
                          </Button>
                        </div>
                      )}

                      {connectionStatus === "game_over" && (
                        <Button
                          onClick={handleReturnToLobby}
                          className="w-full"
                          icon={Swords}
                        >
                          Back To Lobby
                        </Button>
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
                <p className="text-sm leading-relaxed text-cream">{message}</p>
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
      </div>
      <OpponentDisconnectToast
        data={disconnectNotice}
        onExpired={() => setDisconnectNotice(null)}
      />
    </div>
  );
}
