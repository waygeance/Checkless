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
  gameActionPayloadSchema,
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
      if (update.reconnectWarning) {
        io.to(update.gameId).emit("opponent_disconnected", {
          disconnectedColor: update.disconnectedColor,
          remainingMs: update.remainingMs,
          deadlineAt: Date.now() + update.remainingMs
        });
      } else if (update.reconnectExpired) {
        io.to(update.gameId).emit("game_over", {
          reason: "DISCONNECT_FORFEIT",
          winner: update.winnerColor,
          fen: gameService.getGame(update.gameId)?.chess.fen()
        });
        void gameService
          .forfeitDisconnectedPlayer(update.gameId, update.winnerColor)
          .catch((error) =>
            console.error("Could not finalize disconnect forfeit", error)
          );
      } else {
        io.to(update.gameId).volatile.emit("timer_update", update);
      }
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

function registerHandlers(
  io,
  socket,
  { gameService, matchmakingService, presenceService }
) {
  console.log("Player connected:", socket.id);
  const userId = socket.data.user?.id;
  if (userId && presenceService) {
    void presenceService.online(userId, socket.id).then((friends) => {
      for (const friendId of friends) {
        for (const friendSocket of presenceService.socketsFor(friendId)) {
          io.to(friendSocket).emit("friend_presence", { userId, online: true });
        }
      }
    });
  }

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

  socket.on("spectate_game", (payload) => {
    const parsed = validateSocketPayload(gameActionPayloadSchema, payload);
    if (parsed.error) {
      socket.emit("spectate_failed", {
        reason: "INVALID_PAYLOAD",
        message: parsed.error
      });
      return;
    }
    const state = gameService.getSpectatorState(parsed.data.gameId);
    if (!state) {
      socket.emit("spectate_failed", {
        reason: "GAME_NOT_LIVE",
        message: "That game is not currently live"
      });
      return;
    }
    socket.join(state.gameId);
    socket.emit("spectate_started", state);
  });

  socket.on("leave_spectating", (payload) => {
    const parsed = validateSocketPayload(gameActionPayloadSchema, payload);
    if (parsed.error) return;
    socket.leave(parsed.data.gameId);
    socket.emit("spectating_left", { gameId: parsed.data.gameId });
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
        identity: socket.data.identity || {
          type: "human",
          id: socket.data.user.id
        },
        variant: parsed.data.variant,
        mode: parsed.data.mode
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
      if (match.status === "ranked-auth-required") {
        socket.emit("matchmaking_error", {
          reason: "RANKED_AUTH_REQUIRED",
          message: "Ranked matchmaking requires an authenticated human account"
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
        mode: match.game.mode,
        rated: match.game.rated,
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

  socket.on("resign_game", async (payload) => {
    const parsed = validateSocketPayload(gameActionPayloadSchema, payload);
    if (parsed.error)
      return socket.emit("move_rejected", {
        reason: "INVALID_PAYLOAD",
        message: parsed.error
      });
    const result = await gameService.resignGame(parsed.data.gameId, socket.id);
    if (!result)
      return socket.emit("move_rejected", {
        reason: "GAME_NOT_ACTIVE",
        message: "The game is not active"
      });
    io.to(parsed.data.gameId).emit("game_over", {
      reason: "RESIGNATION",
      winner: result.winnerColor,
      fen: result.game.chess.fen()
    });
  });

  socket.on("reconnect_game", (payload) => {
    const parsed = validateSocketPayload(gameActionPayloadSchema, payload);
    if (parsed.error) return;
    const result = gameService.reclaimGame({
      gameId: parsed.data.gameId,
      socketId: socket.id,
      userId: socket.data.user.id
    });
    if (!result.ok)
      return socket.emit("reconnect_failed", { reason: result.reason });
    socket.join(result.game.id);
    socket.emit("reconnect_success", {
      gameId: result.game.id,
      color: result.color,
      fen: result.fen,
      timers: result.timers,
      whiteCanMove: result.whiteCanMove,
      blackCanMove: result.blackCanMove
    });
    socket
      .to(result.game.id)
      .emit("opponent_reconnected", { color: result.color });
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
    if (userId && presenceService) {
      void presenceService.offline(userId, socket.id).then((friends) => {
        for (const friendId of friends) {
          for (const friendSocket of presenceService.socketsFor(friendId)) {
            io.to(friendSocket).emit("friend_presence", {
              userId,
              online: false
            });
          }
        }
      });
    }
    matchmakingService.leave(socket.id);

    const game = gameService.findGameBySocketId(socket.id);
    if (!game) return;

    const disconnectedUserId = socket.data.user?.id;
    const marked = gameService.markDisconnected(game.id, disconnectedUserId);
    if (!marked) return;
    io.to(game.id).emit("opponent_disconnected", {
      disconnectedColor: marked.color,
      remainingMs: 10_000,
      deadlineAt: marked.deadlineAt
    });
  });
}

module.exports = {
  registerGameServiceEvents,
  registerHandlers,
  startTimerTick
};
