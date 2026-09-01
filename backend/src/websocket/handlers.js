/**
 * Socket.io event handlers for the Checkless game server.
 *
 * Manages matchmaking, game lifecycle, move processing,
 * timer ticks, and disconnection cleanup.
 */

const { SimultaneousChess } = require("../engine/chess");
const {
  makeMovePayloadSchema,
  findGamePayloadSchema,
  abortMatchPayloadSchema,
  validateSocketPayload
} = require("../validators/move");

const TICK_INTERVAL = 100;
const VARIANT_TIMES = { "1s": 1000, "3s": 3000, "5s": 5000 };

const games = new Map();
const waitingPlayers = [];

let lastTimerTickAt = Date.now();

// ── Game Helpers ────────────────────────────────────

function createGame(player1, player2, variant) {
  const variantTime = VARIANT_TIMES[variant];

  return {
    id: `game_${Date.now()}`,
    variant,
    variantTime,
    players: {
      white: {
        socketId: player1,
        timerValue: variantTime,
        canMove: false,
        lastMoveAt: null
      },
      black: {
        socketId: player2,
        timerValue: variantTime,
        canMove: false,
        lastMoveAt: null
      }
    },
    chess: new SimultaneousChess(),
    moveHistory: [],
    status: "active"
  };
}

function removeWaitingPlayer(socketId) {
  const index = waitingPlayers.findIndex((p) => p.socketId === socketId);
  if (index === -1) return null;
  return waitingPlayers.splice(index, 1)[0];
}

function findGameBySocketId(socketId) {
  for (const [gameId, game] of games.entries()) {
    if (game.status !== "active") continue;

    if (
      game.players.white.socketId === socketId ||
      game.players.black.socketId === socketId
    ) {
      return { gameId, game };
    }
  }

  return null;
}

// ── Timer Tick ──────────────────────────────────────

function startTimerTick(io) {
  setInterval(() => {
    const now = Date.now();
    const elapsed = Math.max(1, now - lastTimerTickAt);
    lastTimerTickAt = now;

    games.forEach((game) => {
      if (game.status !== "active") return;

      ["white", "black"].forEach((color) => {
        const player = game.players[color];

        if (player.timerValue > 0) {
          player.timerValue = Math.max(0, player.timerValue - elapsed);
          if (player.timerValue === 0) player.canMove = true;
        }
      });

      io.to(game.id).volatile.emit("timer_update", {
        white: game.players.white.timerValue,
        black: game.players.black.timerValue,
        whiteCanMove: game.players.white.canMove,
        blackCanMove: game.players.black.canMove
      });
    });
  }, TICK_INTERVAL);
}

// ── Connection Handler ──────────────────────────────

function registerHandlers(io, socket) {
  console.log("Player connected:", socket.id);

  // Latency probe
  socket.on("latency_ping", (payload, acknowledge) => {
    if (typeof acknowledge !== "function") return;

    acknowledge({
      clientAt:
        payload &&
        typeof payload === "object" &&
        typeof payload.clientAt === "number"
          ? payload.clientAt
          : null,
      serverAt: Date.now()
    });
  });

  // Matchmaking
  socket.on("find_game", (payload) => {
    const parsed = validateSocketPayload(findGamePayloadSchema, payload);
    if (parsed.error) return;
    const { variant } = parsed.data;
    if (!VARIANT_TIMES[variant]) return;
    if (findGameBySocketId(socket.id)) return;

    removeWaitingPlayer(socket.id);

    const waiting = waitingPlayers.find(
      (p) => p.variant === variant && p.socketId !== socket.id
    );

    if (waiting) {
      const game = createGame(waiting.socketId, socket.id, variant);
      games.set(game.id, game);

      io.sockets.sockets.get(waiting.socketId)?.join(game.id);
      socket.join(game.id);

      io.to(waiting.socketId).emit("game_start", {
        gameId: game.id,
        color: "white",
        variant
      });
      io.to(socket.id).emit("game_start", {
        gameId: game.id,
        color: "black",
        variant
      });

      waitingPlayers.splice(waitingPlayers.indexOf(waiting), 1);
    } else {
      waitingPlayers.push({ socketId: socket.id, variant });
      socket.emit("waiting", { message: "Searching for opponent..." });
    }
  });

  // Abort match
  socket.on("abort_match", (payload) => {
    const parsed = validateSocketPayload(abortMatchPayloadSchema, payload);
    if (parsed.error) return;
    const { gameId } = parsed.data;
    const waitingPlayer = removeWaitingPlayer(socket.id);

    if (waitingPlayer) {
      socket.emit("match_aborted", {
        message: "Matchmaking cancelled. You are back in the lobby."
      });
      return;
    }

    const activeMatch = findGameBySocketId(socket.id);

    if (!activeMatch) {
      socket.emit("match_aborted", {
        message: "No active match to abort."
      });
      return;
    }

    if (gameId && gameId !== activeMatch.gameId) return;

    const { game, gameId: activeGameId } = activeMatch;
    const playerColor =
      game.players.white.socketId === socket.id ? "white" : "black";
    const opponentColor = playerColor === "white" ? "black" : "white";
    const opponentSocketId = game.players[opponentColor].socketId;

    game.status = "finished";
    socket.leave(activeGameId);
    io.sockets.sockets.get(opponentSocketId)?.leave(activeGameId);

    socket.emit("match_aborted", {
      message: "Match aborted. You are back in the lobby."
    });

    io.to(opponentSocketId).emit("game_over", {
      reason: "opponent_aborted",
      winner: opponentColor,
      fen: game.chess.fen()
    });

    games.delete(activeGameId);
  });

  // Make move
  socket.on("make_move", (payload) => {
    const parsed = validateSocketPayload(makeMovePayloadSchema, payload);
    if (parsed.error) {
      return socket.emit("move_rejected", { reason: "INVALID_PAYLOAD", message: parsed.error });
    }
    const { gameId, move } = parsed.data;
    const game = games.get(gameId);
    if (!game || game.status !== "active") return;

    if (
      game.players.white.socketId !== socket.id &&
      game.players.black.socketId !== socket.id
    ) {
      return;
    }

    const playerColor =
      game.players.white.socketId === socket.id ? "white" : "black";
    const player = game.players[playerColor];

    if (!player.canMove) {
      return socket.emit("move_rejected", {
        reason: "TIMER_NOT_READY",
        message: "Wait for your timer to reach 0"
      });
    }

    // move.from/to are already validated squares by Zod; pass directly to engine
    const engineColor = playerColor === "white" ? "w" : "b";
    const result = game.chess.move(move, engineColor);

    if (!result.valid) {
      return socket.emit("move_rejected", {
        reason: "ILLEGAL_MOVE",
        message: result.reason || "Invalid move for your pieces"
      });
    }

    // Move accepted — update state
    player.timerValue = game.variantTime;
    player.canMove = false;
    player.lastMoveAt = Date.now();

    game.moveHistory.push({
      move: result.from + result.to,
      color: playerColor,
      timestamp: Date.now()
    });

    // King captured — game over
    if (result.captured === "k" || result.captured === "K") {
      game.status = "finished";

      const finalMove = {
        from: result.from,
        to: result.to,
        piece: result.piece,
        promotion: result.promotion,
        captured: result.captured
      };

      const finalTimers = {
        white: game.players.white.timerValue,
        black: game.players.black.timerValue
      };

      const finalFen = game.chess.fen();

      io.to(gameId).emit("move_made", {
        move: finalMove,
        fen: finalFen,
        movedBy: playerColor,
        timers: finalTimers,
        whiteCanMove: false,
        blackCanMove: false
      });

      io.to(gameId).emit("game_over", {
        reason: "KING_CAPTURED",
        winner: playerColor,
        capturedPiece: result.captured,
        capturedBy: result.piece,
        fen: finalFen,
        move: finalMove,
        timers: finalTimers
      });

      games.delete(gameId);
      return;
    }

    // Normal move — broadcast
    io.to(gameId).emit("move_made", {
      move: {
        from: result.from,
        to: result.to,
        piece: result.piece,
        promotion: result.promotion,
        captured: result.captured
      },
      fen: game.chess.fen(),
      movedBy: playerColor,
      timers: {
        white: game.players.white.timerValue,
        black: game.players.black.timerValue
      }
    });
  });

  // Disconnect
  socket.on("disconnect", () => {
    removeWaitingPlayer(socket.id);

    const activeMatch = findGameBySocketId(socket.id);
    if (!activeMatch) return;

    const { game, gameId } = activeMatch;
    const winner =
      game.players.white.socketId === socket.id ? "black" : "white";
    const opponentSocketId =
      winner === "white"
        ? game.players.white.socketId
        : game.players.black.socketId;

    game.status = "finished";
    io.sockets.sockets.get(opponentSocketId)?.leave(gameId);

    io.to(opponentSocketId).emit("game_over", {
      reason: "opponent_disconnected",
      winner,
      fen: game.chess.fen()
    });

    games.delete(gameId);
  });
}

module.exports = { startTimerTick, registerHandlers };
