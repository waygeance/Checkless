/**
 * Socket.IO transport handlers.
 *
 * These handlers validate transport payloads and publish service results. Game
 * rules, matchmaking state, buffering, and PostgreSQL mutations live in their
 * dedicated services.
 */

const {
  makeMovePayloadSchema,
  findGamePayloadSchema,
  abortMatchPayloadSchema,
  validateSocketPayload
} = require("../validators/move");

const TICK_INTERVAL_MS = 100;

function startTimerTick(io, gameService) {
  let lastTimerTickAt = Date.now();

  const interval = setInterval(() => {
    const now = Date.now();
    const elapsed = Math.max(1, now - lastTimerTickAt);
    lastTimerTickAt = now;

    for (const update of gameService.tick(elapsed)) {
      io.to(update.gameId).volatile.emit("timer_update", update);
    }
  }, TICK_INTERVAL_MS);

  interval.unref?.();
  return interval;
}

function registerGameServiceEvents(io, gameService) {
  gameService.on("persistence_error", ({ game }) => {
    io.to(game.id).emit("game_over", {
      reason: "SERVER_INTERRUPTED",
      winner: null,
      fen: game.chess.fen()
    });
    io.in(game.id).socketsLeave(game.id);
  });
}

function registerHandlers(io, socket, { gameService, matchmakingService }) {
  console.log("Player connected:", socket.id);

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

  socket.on("find_game", async (payload) => {
    const parsed = validateSocketPayload(findGamePayloadSchema, payload);
    if (parsed.error) {
      socket.emit("matchmaking_error", {
        reason: "INVALID_PAYLOAD",
        message: parsed.error
      });
      return;
    }

    try {
      const match = await matchmakingService.join({
        socketId: socket.id,
        user: socket.data.user,
        variant: parsed.data.variant
      });

      if (match.status === "waiting") {
        socket.emit("waiting", { message: "Searching for opponent..." });
        return;
      }
      if (match.status === "already-queued") {
        socket.emit("matchmaking_error", {
          reason: "ALREADY_QUEUED",
          message: "This account is already searching from another connection"
        });
        return;
      }
      if (match.status === "already-playing") {
        socket.emit("matchmaking_error", {
          reason: "ALREADY_PLAYING",
          message: "This account already has an active game"
        });
        return;
      }
      if (match.status === "error") {
        console.error("Could not create a persisted game", match.error);
        const errorPayload = {
          reason: match.error.code || "GAME_CREATION_FAILED",
          message: "The match could not be started. Please try again."
        };
        io.to(match.whitePlayer.socketId).emit(
          "matchmaking_error",
          errorPayload
        );
        io.to(match.blackPlayer.socketId).emit(
          "matchmaking_error",
          errorPayload
        );
        return;
      }
      if (match.status === "cancelled") {
        await gameService.abortGame(match.game.id);
        return;
      }
      if (match.status !== "matched") return;

      const whiteSocket = io.sockets.sockets.get(match.whitePlayer.socketId);
      const blackSocket = io.sockets.sockets.get(match.blackPlayer.socketId);

      if (!whiteSocket || !blackSocket) {
        await gameService.abortGame(match.game.id);
        const connectedSocket = whiteSocket || blackSocket;
        connectedSocket?.emit("matchmaking_error", {
          reason: "OPPONENT_DISCONNECTED",
          message: "Your opponent disconnected before the game started"
        });
        return;
      }

      whiteSocket.join(match.game.id);
      blackSocket.join(match.game.id);

      const sharedStart = {
        gameId: match.game.id,
        variant: match.game.variant,
        fen: match.game.chess.fen()
      };
      whiteSocket.emit("game_start", { ...sharedStart, color: "white" });
      blackSocket.emit("game_start", { ...sharedStart, color: "black" });
    } catch (error) {
      console.error("Could not create a persisted game", error);
      socket.emit("matchmaking_error", {
        reason: error.code || "GAME_CREATION_FAILED",
        message: "The match could not be started. Please try again."
      });
    }
  });

  socket.on("abort_match", async (payload) => {
    const parsed = validateSocketPayload(abortMatchPayloadSchema, payload);
    if (parsed.error) return;

    const waitingPlayer = matchmakingService.leave(socket.id);
    if (waitingPlayer) {
      socket.emit("match_aborted", {
        message: "Matchmaking cancelled. You are back in the lobby."
      });
      return;
    }

    const game = gameService.findGameBySocketId(socket.id);
    if (!game) {
      socket.emit("match_aborted", { message: "No active match to abort." });
      return;
    }
    if (parsed.data.gameId && parsed.data.gameId !== game.id) return;

    const playerColor =
      game.players.white.socketId === socket.id ? "white" : "black";
    const opponentColor = playerColor === "white" ? "black" : "white";
    const opponentSocketId = game.players[opponentColor].socketId;

    try {
      await gameService.abortGame(game.id);
      socket.leave(game.id);
      io.sockets.sockets.get(opponentSocketId)?.leave(game.id);

      socket.emit("match_aborted", {
        message: "Match aborted. You are back in the lobby."
      });
      io.to(opponentSocketId).emit("game_over", {
        reason: "opponent_aborted",
        winner: opponentColor,
        fen: game.chess.fen()
      });
    } catch (error) {
      console.error(`Could not abort game ${game.id}`, error);
    }
  });

  socket.on("make_move", (payload) => {
    const parsed = validateSocketPayload(makeMovePayloadSchema, payload);
    if (parsed.error) {
      socket.emit("move_rejected", {
        reason: "INVALID_PAYLOAD",
        message: parsed.error
      });
      return;
    }

    const result = gameService.acceptMove({
      socketId: socket.id,
      ...parsed.data
    });
    if (!result.ok) {
      socket.emit("move_rejected", {
        reason: result.reason,
        message: result.message,
        clientMoveId: parsed.data.clientMoveId || null
      });
      return;
    }

    const moveEvent = {
      clientMoveId: result.clientMoveId,
      sequence: result.sequence,
      notation: result.notation,
      move: result.move,
      fen: result.fen,
      movedBy: result.color,
      timers: result.timers,
      ...(result.terminal ? { whiteCanMove: false, blackCanMove: false } : {})
    };

    if (result.duplicate) {
      socket.emit("move_made", moveEvent);
      return;
    }

    io.to(result.game.id).emit("move_made", moveEvent);

    if (result.terminal) {
      io.to(result.game.id).emit("game_over", {
        reason: "KING_CAPTURED",
        winner: result.color,
        capturedPiece: result.move.captured,
        capturedBy: result.move.piece,
        clientMoveId: result.clientMoveId,
        sequence: result.sequence,
        notation: result.notation,
        fen: result.fen,
        move: result.move,
        timers: result.timers
      });

      void gameService
        .finalizeKingCapture(result.game.id, result.color)
        .catch((error) =>
          console.error(`Could not finalize game ${result.game.id}`, error)
        );
    }
  });

  socket.on("disconnect", () => {
    matchmakingService.leave(socket.id);

    const game = gameService.findGameBySocketId(socket.id);
    if (!game) return;

    const winner =
      game.players.white.socketId === socket.id ? "black" : "white";
    const opponentSocketId = game.players[winner].socketId;
    game.status = "finishing";

    io.to(opponentSocketId).emit("game_over", {
      reason: "opponent_disconnected",
      winner,
      fen: game.chess.fen()
    });

    void gameService
      .forfeitDisconnectedPlayer(game.id, winner)
      .catch((error) =>
        console.error(`Could not finalize disconnected game ${game.id}`, error)
      );
  });
}

module.exports = {
  registerGameServiceEvents,
  registerHandlers,
  startTimerTick
};
