"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { ChessBoardPure } from "./ChessBoard-pure";
import { Timer } from "./Timer";
import { VictoryScreen } from "./VictoryScreen";

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

export default function Game() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
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
  const [victoryState, setVictoryState] = useState<VictoryState>({
    show: false,
    winner: "white",
    capturedPiece: "",
    capturedBy: "",
  });
  const [premove, setPremove] = useState<Premove | null>(null);

  useEffect(() => {
    // Connect to Socket.IO server
    const newSocket = io("http://localhost:8081", {
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      setSocket(newSocket);
      socketRef.current = newSocket;
      setConnectionStatus("connected");
      console.log("Connected to game server");
    });

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setConnectionStatus("disconnected");
      setMessage("Failed to connect to server. Please try again.");
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
      setPremove(null);
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
      setGameState((prev) => {
        if (!prev) return prev;

        const newState = {
          ...prev,
          whiteTimer: data.white,
          blackTimer: data.black,
          whiteCanMove: data.whiteCanMove,
          blackCanMove: data.blackCanMove,
        };

        // Check if player can now move and has a premove
        const canNowMove =
          prev.color === "white" ? data.whiteCanMove : data.blackCanMove;

        // Get current premove from state (not from closure)
        setPremove((currentPremove) => {
          if (canNowMove && currentPremove && socketRef.current) {
            socketRef.current.emit("make_move", {
              gameId: prev.gameId,
              move: { from: currentPremove.from, to: currentPremove.to },
            });
            return null; // Clear premove after sending
          }
          return currentPremove;
        });

        return newState;
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
      // Silently reject moves without showing popup
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

      if (data.reason === "KING_CAPTURED") {
        setVictoryState({
          show: true,
          winner: data.winner,
          capturedPiece: data.capturedPiece,
          capturedBy: data.capturedBy,
        });
      }
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
    if (!socket || !gameState) return;

    const canMove =
      gameState.color === "white"
        ? gameState.whiteCanMove
        : gameState.blackCanMove;

    if (!canMove) {
      // Store as premove
      setPremove({ from, to });
    } else {
      socket.emit("make_move", {
        gameId: gameState.gameId,
        move: promotion ? { from, to, promotion } : { from, to },
      });
    }
  };

  const handleVictoryClose = () => {
    setPremove(null);
    setVictoryState({
      show: false,
      winner: "white",
      capturedPiece: "",
      capturedBy: "",
    });
    setGameState(null);
    setConnectionStatus("connected");
    setMessage("");
  };

  const handleNewGame = () => {
    setPremove(null);
    setGameState(null);
    setConnectionStatus("connected");
    setMessage("");
  };

  if (connectionStatus === "connecting") {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-900 to-gray-800 flex items-center justify-center px-6 text-center">
        <div className="text-white text-xl sm:text-2xl">
          Connecting to game server...
        </div>
      </div>
    );
  }

  if (connectionStatus === "disconnected") {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-900 to-gray-800 flex items-center justify-center px-6">
        <div className="text-center max-w-sm w-full">
          <div className="text-red-500 text-xl sm:text-2xl mb-4">
            Disconnected from server
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-5 rounded"
          >
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <div className="bg-gray-800 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl sm:text-2xl font-bold text-blue-400">
              Simultaneous Chess
            </h1>
            {gameState && (
              <div className="text-sm self-start sm:self-auto break-all">
                <span className="text-gray-400">Room:</span>{" "}
                <span className="text-green-400">{gameState.gameId}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {connectionStatus === "connected" && !gameState && (
          <div className="text-center space-y-6 sm:space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold">
                Welcome to Simultaneous Chess!
              </h2>
              <p className="text-gray-300 max-w-2xl mx-auto text-sm sm:text-base">
                In this variant, players move independently with separate
                timers! Each player has a timer that counts down from the
                selected variant. You can only move when your timer reaches 0,
                then it resets after your move.
              </p>
            </div>

            {/* Timer Selection */}
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold">
                Select Timer Variant:
              </h3>
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 max-w-md mx-auto">
                <button
                  onClick={() => setVariant("1s")}
                  className={`w-full sm:w-auto px-6 py-3 rounded-lg font-semibold transition-all ${
                    variant === "1s"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  1 Second
                </button>
                <button
                  onClick={() => setVariant("3s")}
                  className={`w-full sm:w-auto px-6 py-3 rounded-lg font-semibold transition-all ${
                    variant === "3s"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  3 Seconds
                </button>
                <button
                  onClick={() => setVariant("5s")}
                  className={`w-full sm:w-auto px-6 py-3 rounded-lg font-semibold transition-all ${
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
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg sm:text-xl transition-all transform hover:scale-105"
            >
              Find Game
            </button>
          </div>
        )}

        {connectionStatus === "waiting" && (
          <div className="text-center space-y-6 sm:space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold">
                Finding Opponent...
              </h2>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
              <p className="text-gray-300 text-sm sm:text-base">
                Looking for a player with {variant} timer...
              </p>
            </div>
          </div>
        )}

        {gameState && (
          <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 items-start">
            {/* Game Board */}
            <div className="w-full flex-1 flex justify-center">
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

            {/* Game Info */}
            <div className="w-full xl:w-80 space-y-4 sm:space-y-6">
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
              <div className="bg-gray-800 rounded-lg p-4 sm:p-6 space-y-4">
                <h3 className="text-lg sm:text-xl font-bold text-center">
                  Game Info
                </h3>

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
              <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-center mb-4">
                  Rules
                </h3>
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
          <div className="fixed top-20 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 bg-gray-800 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg z-50 text-center text-sm sm:text-base sm:max-w-md">
            {message}
          </div>
        )}

        {/* Game Over Actions */}
        {connectionStatus === "game_over" && gameState && (
          <div className="text-center space-y-4 pt-6">
            <button
              onClick={handleNewGame}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg sm:text-xl transition-all"
            >
              New Game
            </button>
          </div>
        )}

        {/* Victory/Defeat Screen */}
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
  );
}
