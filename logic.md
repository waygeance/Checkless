# Simultaneous Chess - Current Code Snapshot

Last updated: 2026-04-14

This file is a direct snapshot of the current implementation used for matchmaking, timers, move validation, and board interaction.

## server.js

```javascript
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { Chess } = require("chess.js");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000", credentials: true },
});

const games = new Map();
const waitingPlayers = [];
const TICK_INTERVAL = 100;
const VARIANT_TIMES = { "1s": 1000, "3s": 3000, "5s": 5000 };

function forceTurnInFen(fen, turn) {
  const fenParts = fen.split(" ");
  if (fenParts.length < 2) return fen;
  fenParts[1] = turn;
  return fenParts.join(" ");
}

function normalizeMoveInput(move) {
  if (!move || typeof move !== "object") return null;
  if (typeof move.from !== "string" || typeof move.to !== "string") return null;

  const from = move.from.toLowerCase();
  const to = move.to.toLowerCase();

  if (!/^[a-h][1-8]$/.test(from) || !/^[a-h][1-8]$/.test(to)) return null;

  const promotion =
    typeof move.promotion === "string" ? move.promotion.toLowerCase() : undefined;
  const normalizedPromotion =
    promotion && /^[qrbn]$/.test(promotion) ? promotion : undefined;

  return { from, to, promotion: normalizedPromotion };
}

function maybeAddAutoQueenPromotion(chess, move, movingColor) {
  if (move.promotion) return move;

  const movingPiece = chess.get(move.from);
  if (!movingPiece || movingPiece.type !== "p" || movingPiece.color !== movingColor) {
    return move;
  }

  const promotionRank = movingColor === "w" ? "8" : "1";
  if (move.to[1] === promotionRank) {
    return { ...move, promotion: "q" };
  }

  return move;
}

function createGame(player1, player2, variant) {
  const safeVariant = VARIANT_TIMES[variant] ? variant : "3s";
  const variantTime = VARIANT_TIMES[safeVariant];

  return {
    id: `game_${Date.now()}`,
    variant: safeVariant,
    variantTime,
    players: {
      white: {
        socketId: player1,
        timerValue: variantTime,
        canMove: false,
        lastMoveAt: null,
      },
      black: {
        socketId: player2,
        timerValue: variantTime,
        canMove: false,
        lastMoveAt: null,
      },
    },
    chess: new Chess(),
    moveHistory: [],
    status: "active",
  };
}

setInterval(() => {
  games.forEach((game, gameId) => {
    if (game.status !== "active") return;

    let updated = false;

    ["white", "black"].forEach((color) => {
      const player = game.players[color];
      if (player.timerValue > 0) {
        player.timerValue = Math.max(0, player.timerValue - TICK_INTERVAL);
        updated = true;

        if (player.timerValue === 0) {
          player.canMove = true;
        }
      }
    });

    if (updated) {
      io.to(gameId).emit("timer_update", {
        white: game.players.white.timerValue,
        black: game.players.black.timerValue,
        whiteCanMove: game.players.white.canMove,
        blackCanMove: game.players.black.canMove,
      });
    }
  });
}, TICK_INTERVAL);

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("find_game", ({ variant }) => {
    const safeVariant = VARIANT_TIMES[variant] ? variant : "3s";
    const waiting = waitingPlayers.find((p) => p.variant === safeVariant);

    if (waiting) {
      const game = createGame(waiting.socketId, socket.id, safeVariant);
      games.set(game.id, game);

      io.sockets.sockets.get(waiting.socketId)?.join(game.id);
      socket.join(game.id);

      io.to(waiting.socketId).emit("game_start", {
        gameId: game.id,
        color: "white",
        variant: game.variant,
        fen: game.chess.fen(),
      });

      io.to(socket.id).emit("game_start", {
        gameId: game.id,
        color: "black",
        variant: game.variant,
        fen: game.chess.fen(),
      });

      waitingPlayers.splice(waitingPlayers.indexOf(waiting), 1);
      return;
    }

    waitingPlayers.push({ socketId: socket.id, variant: safeVariant });
    socket.emit("waiting", { message: "Searching for opponent..." });
  });

  socket.on("make_move", ({ gameId, move }) => {
    const game = games.get(gameId);
    if (!game || game.status !== "active") return;

    const playerColor =
      game.players.white.socketId === socket.id
        ? "white"
        : game.players.black.socketId === socket.id
          ? "black"
          : null;
    if (!playerColor) return;

    const player = game.players[playerColor];
    if (!player.canMove) {
      socket.emit("move_rejected", {
        reason: "TIMER_NOT_READY",
        message: "Wait for your timer to reach 0",
      });
      return;
    }

    const normalizedMove = normalizeMoveInput(move);
    if (!normalizedMove) {
      socket.emit("move_rejected", {
        reason: "INVALID_MOVE",
        message: "Malformed move payload",
      });
      return;
    }

    const movingColor = playerColor === "white" ? "w" : "b";

    try {
      const validationBoard = new Chess(forceTurnInFen(game.chess.fen(), movingColor));
      const moveWithPromotion = maybeAddAutoQueenPromotion(
        validationBoard,
        normalizedMove,
        movingColor,
      );

      const validationResult = validationBoard.move(moveWithPromotion);
      if (!validationResult) {
        socket.emit("move_rejected", {
          reason: "ILLEGAL_MOVE",
          message: "Invalid move for selected piece",
        });
        return;
      }

      game.chess = validationBoard;
      player.timerValue = game.variantTime;
      player.canMove = false;
      player.lastMoveAt = Date.now();

      game.moveHistory.push({
        move: validationResult.san,
        color: playerColor,
        timestamp: Date.now(),
      });

      if (validationResult.captured === "k") {
        game.status = "finished";
        io.to(gameId).emit("game_over", {
          reason: "KING_CAPTURED",
          winner: playerColor,
          fen: game.chess.fen(),
        });
        games.delete(gameId);
        return;
      }

      io.to(gameId).emit("timer_update", {
        white: game.players.white.timerValue,
        black: game.players.black.timerValue,
        whiteCanMove: game.players.white.canMove,
        blackCanMove: game.players.black.canMove,
      });

      io.to(gameId).emit("move_made", {
        move: validationResult,
        fen: game.chess.fen(),
        pgn: game.chess.pgn(),
        movedBy: playerColor,
        timers: {
          white: game.players.white.timerValue,
          black: game.players.black.timerValue,
        },
        whiteCanMove: game.players.white.canMove,
        blackCanMove: game.players.black.canMove,
      });
    } catch (error) {
      socket.emit("move_rejected", {
        reason: "ERROR",
        message: error?.message ?? "Unexpected server error",
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);

    const waitingIndex = waitingPlayers.findIndex((p) => p.socketId === socket.id);
    if (waitingIndex !== -1) {
      waitingPlayers.splice(waitingIndex, 1);
    }

    games.forEach((game, gameId) => {
      if (
        game.players.white.socketId === socket.id ||
        game.players.black.socketId === socket.id
      ) {
        const winner =
          game.players.white.socketId === socket.id ? "black" : "white";

        io.to(gameId).emit("game_over", {
          reason: "opponent_disconnected",
          winner,
        });

        games.delete(gameId);
      }
    });
  });
});

server.listen(8081, () => {
  console.log("WebSocket server running on port 8081");
});

```

## src/components/Game.tsx

```tsx
"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { ChessBoard } from "./ChessBoard";
import { Timer } from "./Timer";

interface GameState {
  gameId: string;
  color: "white" | "black";
  variant: "1s" | "3s" | "5s";
  fen: string;
  whiteTimer: number;
  blackTimer: number;
  whiteCanMove: boolean;
  blackCanMove: boolean;
  lastMove?: [string, string];
  boardSyncToken: number;
}

export default function Game() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    | "connecting"
    | "connected"
    | "waiting"
    | "playing"
    | "game_over"
    | "disconnected"
  >("connecting");
  const [variant, setVariant] = useState<"1s" | "3s" | "5s">("3s");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Connect to Socket.IO server
    const newSocket = io("http://localhost:8081");

    newSocket.on("connect", () => {
      setSocket(newSocket);
      setConnectionStatus("connected");
      console.log("Connected to game server");
    });

    newSocket.on("disconnect", () => {
      setConnectionStatus("disconnected");
      console.log("Disconnected from game server");
    });

    // Game events
    newSocket.on("waiting", (data) => {
      setConnectionStatus("waiting");
      setMessage(data?.message ?? "Searching for opponent...");
    });

    newSocket.on("game_start", (data) => {
      setGameState({
        gameId: data.gameId,
        color: data.color,
        variant: data.variant,
        fen:
          data.fen ??
          "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        whiteTimer:
          data.variant === "1s" ? 1000 : data.variant === "3s" ? 3000 : 5000,
        blackTimer:
          data.variant === "1s" ? 1000 : data.variant === "3s" ? 3000 : 5000,
        whiteCanMove: false,
        blackCanMove: false,
        boardSyncToken: 0,
      });
      setConnectionStatus("playing");
      setMessage("");
    });

    newSocket.on("timer_update", (data) => {
      setGameState((prev) =>
        prev
          ? {
              ...prev,
              whiteTimer: data.white,
              blackTimer: data.black,
              whiteCanMove: data.whiteCanMove,
              blackCanMove: data.blackCanMove,
            }
          : prev,
      );
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
            }
          : prev,
      );
    });

    newSocket.on("move_rejected", (data) => {
      setGameState((prev) =>
        prev ? { ...prev, boardSyncToken: prev.boardSyncToken + 1 } : prev,
      );
      setMessage(
        `Move rejected: ${data?.message ?? data?.reason ?? "Unknown reason"}`,
      );
      setTimeout(() => setMessage(""), 3000);
    });

    newSocket.on("game_over", (data) => {
      setConnectionStatus("game_over");
      setGameState((prev) =>
        prev ? { ...prev, fen: data.fen ?? prev.fen } : prev,
      );
      const resultMessage =
        data.reason === "KING_CAPTURED"
          ? `${data.winner} wins by capturing the king!`
          : data.reason === "opponent_disconnected"
            ? "Opponent disconnected!"
            : "Game over!";
      setMessage(resultMessage);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const handleFindGame = () => {
    if (socket && connectionStatus === "connected") {
      socket.emit("find_game", { variant });
    }
  };

  const handleMove = (from: string, to: string, promotion?: string) => {
    if (socket && gameState) {
      socket.emit("make_move", {
        gameId: gameState.gameId,
        move: promotion ? { from, to, promotion } : { from, to },
      });
    }
  };

  const handleNewGame = () => {
    setGameState(null);
    setConnectionStatus("connected");
    setMessage("");
  };

  if (connectionStatus === "connecting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-2xl">Connecting to game server...</div>
      </div>
    );
  }

  if (connectionStatus === "disconnected") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-4">
            Disconnected from server
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <div className="bg-gray-800 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-blue-400">
              Simultaneous Chess
            </h1>
            {gameState && (
              <div className="text-sm">
                <span className="text-gray-400">Room:</span>{" "}
                <span className="text-green-400">{gameState.gameId}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {connectionStatus === "connected" && !gameState && (
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">
                Welcome to Simultaneous Chess!
              </h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                In this variant, players move independently with separate
                timers! Each player has a timer that counts down from the
                selected variant. You can only move when your timer reaches 0,
                then it resets after your move.
              </p>
            </div>

            {/* Timer Selection */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Select Timer Variant:</h3>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setVariant("1s")}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    variant === "1s"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  1 Second
                </button>
                <button
                  onClick={() => setVariant("3s")}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    variant === "3s"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  3 Seconds
                </button>
                <button
                  onClick={() => setVariant("5s")}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    variant === "5s"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  5 Seconds
                </button>
              </div>
            </div>

            {/* Find Game Button */}
            <button
              onClick={handleFindGame}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition-all transform hover:scale-105"
            >
              Find Game
            </button>
          </div>
        )}

        {connectionStatus === "waiting" && (
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">Finding Opponent...</h2>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
              <p className="text-gray-300">
                Looking for a player with {variant} timer...
              </p>
            </div>
          </div>
        )}

        {gameState && (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Game Board */}
            <div className="flex-1 flex justify-center">
              <ChessBoard
                fen={gameState.fen}
                orientation={gameState.color}
                onMove={handleMove}
                canMove={
                  connectionStatus === "playing" &&
                  (gameState.color === "white"
                    ? gameState.whiteCanMove
                    : gameState.blackCanMove)
                }
                lastMove={gameState.lastMove}
                syncToken={gameState.boardSyncToken}
              />
            </div>

            {/* Game Info */}
            <div className="lg:w-80 space-y-6">
              {/* Timers */}
              <div className="space-y-4">
                <Timer
                  value={gameState.whiteTimer}
                  maxValue={
                    gameState.variant === "1s"
                      ? 1000
                      : gameState.variant === "3s"
                        ? 3000
                        : 5000
                  }
                  canMove={gameState.whiteCanMove}
                  playerName="White"
                  color="white"
                  isYourTurn={gameState.color === "white"}
                />
                <Timer
                  value={gameState.blackTimer}
                  maxValue={
                    gameState.variant === "1s"
                      ? 1000
                      : gameState.variant === "3s"
                        ? 3000
                        : 5000
                  }
                  canMove={gameState.blackCanMove}
                  playerName="Black"
                  color="black"
                  isYourTurn={gameState.color === "black"}
                />
              </div>

              {/* Player Info */}
              <div className="bg-gray-800 rounded-lg p-6 space-y-4">
                <h3 className="text-xl font-bold text-center">Game Info</h3>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Your Color:</span>
                    <span
                      className={`font-semibold capitalize ${gameState.color === "white" ? "text-gray-200" : "text-gray-800 bg-gray-200 px-2 rounded"}`}
                    >
                      {gameState.color}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Timer:</span>
                    <span className="font-semibold">{gameState.variant}</span>
                  </div>
                </div>
              </div>

              {/* Rules */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-center mb-4">Rules</h3>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li>Each player has an independent timer</li>
                  <li>You can only move when your timer reaches 0</li>
                  <li>Timer resets after you make a move</li>
                  <li>Both players move independently (no turn waiting)</li>
                  <li>Game ends only when a king is captured</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {message && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            {message}
          </div>
        )}

        {/* Game Over Actions */}
        {connectionStatus === "game_over" && gameState && (
          <div className="text-center space-y-4">
            <button
              onClick={handleNewGame}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition-all"
            >
              New Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

```

## src/components/ChessBoard.tsx

```tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import { Chess, type Square } from "chess.js";
import { Chessground } from "chessground";
import type { Api } from "chessground/api";
import type { Key } from "chessground/types";

interface ChessBoardProps {
  fen: string;
  orientation: "white" | "black";
  onMove: (from: string, to: string, promotion?: string) => void;
  canMove: boolean;
  lastMove?: [string, string];
  syncToken?: number;
}

const FILES = "abcdefgh";
const RANKS = "12345678";
const ALL_SQUARES: Square[] = FILES.split("").flatMap((file) =>
  RANKS.split("").map((rank) => `${file}${rank}` as Square),
);

function forceTurnInFen(fen: string, turn: "w" | "b"): string {
  const fenParts = fen.split(" ");
  if (fenParts.length < 2) return fen;
  fenParts[1] = turn;
  return fenParts.join(" ");
}

function getAsyncDests(fen: string, color: "white" | "black"): Map<Key, Key[]> {
  const movingColor = color === "white" ? "w" : "b";
  const chess = new Chess(forceTurnInFen(fen, movingColor));
  const dests = new Map<Key, Key[]>();

  for (const square of ALL_SQUARES) {
    const piece = chess.get(square);
    if (!piece || piece.color !== movingColor) continue;

    const moves = chess.moves({ square, verbose: true });
    if (!moves.length) continue;

    dests.set(
      square as Key,
      moves.map((move) => move.to as Key),
    );
  }

  return dests;
}

function getAutoPromotion(fen: string, from: Key, to: Key): string | undefined {
  const chess = new Chess(fen);
  const piece = chess.get(from as Square);
  if (!piece || piece.type !== "p") return undefined;

  const promotionRank = piece.color === "w" ? "8" : "1";
  return to[1] === promotionRank ? "q" : undefined;
}

export function ChessBoard({
  fen,
  orientation,
  onMove,
  canMove,
  lastMove,
  syncToken,
}: ChessBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const onMoveRef = useRef(onMove);
  const fenRef = useRef(fen);
  const cgRef = useRef<Api | null>(null);
  const dests = useMemo(() => getAsyncDests(fen, orientation), [fen, orientation]);

  useEffect(() => {
    onMoveRef.current = onMove;
  }, [onMove]);

  useEffect(() => {
    fenRef.current = fen;
  }, [fen]);

  useEffect(() => {
    if (!boardRef.current) return;

    cgRef.current = Chessground(boardRef.current, {
      coordinates: true,
      autoCastle: true,
      highlight: {
        lastMove: true,
        check: false,
      },
      animation: {
        enabled: true,
        duration: 180,
      },
      movable: {
        free: false,
        showDests: true,
        events: {
          after: (orig: Key, dest: Key) => {
            const promotion = getAutoPromotion(fenRef.current, orig, dest);
            onMoveRef.current(orig, dest, promotion);
          },
        },
      },
      premovable: {
        enabled: false,
      },
      draggable: {
        enabled: true,
        showGhost: true,
      },
    });

    return () => {
      cgRef.current?.destroy();
      cgRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!cgRef.current) return;

    cgRef.current.set({
      fen,
      orientation,
      lastMove: lastMove ? [lastMove[0] as Key, lastMove[1] as Key] : undefined,
      movable: {
        color: canMove ? orientation : undefined,
        free: false,
        showDests: true,
        dests,
      },
    });
  }, [fen, orientation, canMove, lastMove, dests, syncToken]);

  return (
    <div className="relative">
      <div
        ref={boardRef}
        className="cg-wrap rounded-lg shadow-2xl border-4 border-slate-900"
        style={{
          width: "min(92vw, 600px)",
          height: "min(92vw, 600px)",
        }}
      />

      {!canMove && (
        <div className="absolute inset-0 bg-black/35 flex items-center justify-center pointer-events-none rounded-lg">
          <div className="bg-amber-400 text-slate-900 px-5 py-2 rounded-lg font-bold text-lg shadow-xl">
            Wait for your timer...
          </div>
        </div>
      )}
    </div>
  );
}

```

## src/components/Timer.tsx

```tsx
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

```

## src/app/page.tsx

```tsx
import Game from "@/components/Game";

export default function Home() {
  return <Game />;
}

```

## src/app/layout.tsx

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simultaneous Chess",
  description: "Real-time simultaneous chess with independent timers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

```

## src/app/globals.css

```css
@import "tailwindcss";
@import "chessground/assets/chessground.base.css";
@import "chessground/assets/chessground.brown.css";
@import "chessground/assets/chessground.cburnett.css";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto,
    Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
}

```

## package.json

```json
{
  "name": "simultaneous-chess",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "server": "node server.js",
    "dev:full": "concurrently \"npm run server\" \"npm run dev\""
  },
  "dependencies": {
    "@types/chess.js": "^0.13.7",
    "chess.js": "^1.4.0",
    "chessground": "^8.3.0",
    "concurrently": "^9.2.1",
    "express": "^5.2.1",
    "next": "16.2.3",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "socket.io": "^4.8.3",
    "socket.io-client": "^4.8.3",
    "zustand": "^5.0.12"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.3",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}

```
