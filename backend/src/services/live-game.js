const { EventEmitter } = require("node:events");

const { SimultaneousChess } = require("../engine/chess");
const { formatCmnMove } = require("../utils/cmn");
const { getDatabaseColor, getVariantTime } = require("../utils/game");
const { MoveWriteBuffer } = require("./move-write-buffer");

class LiveGameService extends EventEmitter {
  constructor({
    persistence,
    moveBatchSize,
    moveFlushIntervalMs,
    logger = console
  }) {
    super();
    this.persistence = persistence;
    this.moveBatchSize = moveBatchSize;
    this.moveFlushIntervalMs = moveFlushIntervalMs;
    this.logger = logger;
    this.games = new Map();
  }

  async startCasualGame({ whitePlayer, blackPlayer, variant }) {
    const chess = new SimultaneousChess();
    const storedGame = await this.persistence.createCasualGame({
      whiteUser: whitePlayer.user,
      blackUser: blackPlayer.user,
      variant,
      initialFen: chess.fen()
    });
    const participants = new Map(
      storedGame.participants.map((participant) => [
        participant.color,
        participant
      ])
    );
    const variantTime = getVariantTime(variant);

    const game = {
      id: storedGame.id,
      variant,
      variantTime,
      startedAt: storedGame.startedAt,
      players: {
        white: this.createLivePlayer(
          whitePlayer,
          participants.get("WHITE"),
          variantTime
        ),
        black: this.createLivePlayer(
          blackPlayer,
          participants.get("BLACK"),
          variantTime
        )
      },
      chess,
      moveHistory: [],
      acceptedClientMoves: new Map(),
      lastSequence: 0,
      status: "active",
      persistenceFailureHandled: false
    };

    game.moveBuffer = new MoveWriteBuffer({
      batchSize: this.moveBatchSize,
      flushIntervalMs: this.moveFlushIntervalMs,
      persistBatch: (moves, { expectedLastSequence }) =>
        this.persistence.persistMoveBatch(game.id, moves, expectedLastSequence),
      onError: (error) => this.handlePersistenceFailure(game, error)
    });

    this.games.set(game.id, game);
    return game;
  }

  createLivePlayer(player, participant, variantTime) {
    if (!participant) {
      throw new Error("Persisted game is missing a participant");
    }

    return {
      socketId: player.socketId,
      userId: player.user.id,
      participantId: participant.id,
      timerValue: variantTime,
      canMove: false,
      lastMoveAt: null
    };
  }

  findGameBySocketId(socketId) {
    for (const game of this.games.values()) {
      if (game.status !== "active") continue;
      if (
        game.players.white.socketId === socketId ||
        game.players.black.socketId === socketId
      ) {
        return game;
      }
    }
    return null;
  }

  findGameByUserId(userId) {
    for (const game of this.games.values()) {
      if (game.status !== "active") continue;
      if (
        game.players.white.userId === userId ||
        game.players.black.userId === userId
      ) {
        return game;
      }
    }
    return null;
  }

  getGame(gameId) {
    return this.games.get(gameId) || null;
  }

  tick(elapsedMs) {
    const updates = [];

    for (const game of this.games.values()) {
      if (game.status !== "active") continue;

      for (const color of ["white", "black"]) {
        const player = game.players[color];
        if (player.timerValue > 0) {
          player.timerValue = Math.max(0, player.timerValue - elapsedMs);
          if (player.timerValue === 0) player.canMove = true;
        }
      }

      updates.push({
        gameId: game.id,
        white: game.players.white.timerValue,
        black: game.players.black.timerValue,
        whiteCanMove: game.players.white.canMove,
        blackCanMove: game.players.black.canMove
      });
    }

    return updates;
  }

  acceptMove({ gameId, socketId, clientMoveId, move }) {
    const game = this.games.get(gameId);
    if (!game || game.status !== "active") {
      return this.rejection("GAME_NOT_ACTIVE", "The game is not active");
    }

    const color =
      game.players.white.socketId === socketId
        ? "white"
        : game.players.black.socketId === socketId
          ? "black"
          : null;
    if (!color) {
      return this.rejection(
        "NOT_A_PARTICIPANT",
        "You are not a player in this game"
      );
    }

    const requestSignature = `${move.from}:${move.to}:${move.promotion || ""}`;
    if (clientMoveId) {
      const previous = game.acceptedClientMoves.get(clientMoveId);
      if (previous) {
        if (previous.requestSignature !== requestSignature) {
          return this.rejection(
            "CLIENT_MOVE_ID_REUSED",
            "clientMoveId was already used for a different move"
          );
        }
        return { ok: true, duplicate: true, ...previous.result };
      }
    }

    const player = game.players[color];
    if (!player.canMove) {
      return this.rejection(
        "TIMER_NOT_READY",
        "Wait for your timer to reach 0"
      );
    }

    const result = game.chess.move(move, color === "white" ? "w" : "b");
    if (!result.valid) {
      return this.rejection(
        "ILLEGAL_MOVE",
        result.reason || "Invalid move for your pieces"
      );
    }

    player.timerValue = game.variantTime;
    player.canMove = false;
    player.lastMoveAt = Date.now();

    const sequence = ++game.lastSequence;
    const acceptedAt = new Date();
    const fenAfter = game.chess.fen();
    const notation = formatCmnMove({
      sequence,
      color,
      fromSquare: result.from,
      toSquare: result.to,
      capturedPiece: result.captured,
      promotionPiece: result.promotion
    });
    const publicMove = {
      from: result.from,
      to: result.to,
      piece: result.piece,
      promotion: result.promotion,
      captured: result.captured
    };
    const persistedMove = {
      gameId,
      participantId: player.participantId,
      sequence,
      clientMoveId: clientMoveId || null,
      notation,
      color: getDatabaseColor(color),
      fromSquare: result.from,
      toSquare: result.to,
      piece: result.piece.toUpperCase(),
      capturedPiece: result.captured ? result.captured.toUpperCase() : null,
      promotionPiece: result.promotion ? result.promotion.toUpperCase() : null,
      fenAfter,
      elapsedMs: Math.max(0, acceptedAt.getTime() - game.startedAt.getTime()),
      whiteCooldownMsAfter: game.players.white.timerValue,
      blackCooldownMsAfter: game.players.black.timerValue,
      acceptedAt
    };

    game.moveHistory.push(persistedMove);
    game.moveBuffer.add(persistedMove);

    const accepted = {
      game,
      sequence,
      clientMoveId: clientMoveId || null,
      notation,
      color,
      move: publicMove,
      fen: fenAfter,
      timers: {
        white: game.players.white.timerValue,
        black: game.players.black.timerValue
      },
      terminal: result.kingCapture
    };

    if (clientMoveId) {
      game.acceptedClientMoves.set(clientMoveId, {
        requestSignature,
        result: accepted
      });
    }
    if (result.kingCapture) game.status = "finishing";

    return { ok: true, duplicate: false, ...accepted };
  }

  rejection(reason, message) {
    return { ok: false, reason, message };
  }

  async finalizeKingCapture(gameId, winnerColor) {
    return this.finalize(gameId, {
      status: "COMPLETED",
      endReason: "KING_CAPTURED",
      winnerColor: getDatabaseColor(winnerColor)
    });
  }

  async abortGame(gameId) {
    const game = this.games.get(gameId);
    if (game?.status === "active") game.status = "finishing";
    return this.finalize(gameId, {
      status: "ABORTED",
      endReason: "ABORTED"
    });
  }

  async forfeitDisconnectedPlayer(gameId, winnerColor) {
    const game = this.games.get(gameId);
    if (game?.status === "active") game.status = "finishing";
    return this.finalize(gameId, {
      status: "COMPLETED",
      endReason: "DISCONNECT_FORFEIT",
      winnerColor: getDatabaseColor(winnerColor)
    });
  }

  async finalize(gameId, terminalState) {
    const game = this.games.get(gameId);
    if (!game) return null;

    try {
      const finalSequence = await game.moveBuffer.close("terminal");
      const stored = await this.persistence.finalizeGame({
        gameId,
        ...terminalState,
        finalFen: game.chess.fen(),
        finalSequence
      });

      game.status = "finished";
      this.games.delete(gameId);
      return stored;
    } catch (error) {
      this.handlePersistenceFailure(game, error);
      throw error;
    }
  }

  handlePersistenceFailure(game, error) {
    if (game.persistenceFailureHandled) return;
    game.persistenceFailureHandled = true;
    game.status = "interrupted";
    this.logger.error(`Move persistence failed for game ${game.id}`, error);
    this.emit("persistence_error", { game, error });

    void this.persistence
      .markGameInterrupted(game.id)
      .catch((interruptError) =>
        this.logger.error(
          `Could not mark game ${game.id} interrupted`,
          interruptError
        )
      )
      .finally(() => this.games.delete(game.id));
  }

  async shutdown() {
    const activeGames = [...this.games.values()];

    await Promise.allSettled(
      activeGames.map(async (game) => {
        if (game.status === "active") game.status = "finishing";
        try {
          await game.moveBuffer.close("shutdown");
        } finally {
          await this.persistence.markGameInterrupted(game.id);
          this.games.delete(game.id);
        }
      })
    );
  }
}

module.exports = { LiveGameService };
