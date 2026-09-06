const { getDatabaseVariant } = require("../utils/game");

class GamePersistenceError extends Error {
  constructor(code, message, cause) {
    super(message, { cause });
    this.name = "GamePersistenceError";
    this.code = code;
  }
}

/**
 * Owns every PostgreSQL mutation for durable games and accepted moves.
 * Socket handlers and the chess engine do not call Prisma directly.
 */
class GamePersistenceService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async createCasualGame({ whiteUser, blackUser, variant, initialFen }) {
    if (!whiteUser?.id || !blackUser?.id) {
      throw new GamePersistenceError(
        "PLAYER_IDENTITY_REQUIRED",
        "Both matched players must have verified local identities"
      );
    }
    if (whiteUser.id === blackUser.id) {
      throw new GamePersistenceError(
        "SELF_MATCH_FORBIDDEN",
        "A user cannot be matched against another socket from the same account"
      );
    }

    return this.prisma.game.create({
      data: {
        mode: "CASUAL",
        variant: getDatabaseVariant(variant),
        rated: false,
        rulesVersion: 1,
        initialFen,
        participants: {
          create: [
            this.createParticipantData(whiteUser, "WHITE"),
            this.createParticipantData(blackUser, "BLACK")
          ]
        }
      },
      include: { participants: true }
    });
  }

  createParticipantData(user, color) {
    return {
      userId: user.id,
      color,
      usernameSnapshot: user.username,
      displayNameSnapshot: user.displayName,
      avatarUrlSnapshot: user.avatarUrl
    };
  }

  async persistMoveBatch(gameId, moves, expectedLastSequence) {
    if (moves.length === 0) return expectedLastSequence;

    const firstSequence = moves[0].sequence;
    const finalSequence = moves[moves.length - 1].sequence;

    if (firstSequence !== expectedLastSequence + 1) {
      throw new GamePersistenceError(
        "MOVE_SEQUENCE_GAP",
        `Expected sequence ${expectedLastSequence + 1}, received ${firstSequence}`
      );
    }

    for (let index = 1; index < moves.length; index += 1) {
      if (moves[index].sequence !== moves[index - 1].sequence + 1) {
        throw new GamePersistenceError(
          "MOVE_SEQUENCE_GAP",
          "A move batch must contain contiguous sequence numbers"
        );
      }
    }

    try {
      await this.prisma.$transaction(async (transaction) => {
        await transaction.gameMove.createMany({ data: moves });

        const updated = await transaction.game.updateMany({
          where: {
            id: gameId,
            status: "ACTIVE",
            lastSequence: expectedLastSequence
          },
          data: { lastSequence: finalSequence }
        });

        if (updated.count !== 1) {
          throw new GamePersistenceError(
            "GAME_SEQUENCE_CONFLICT",
            `Game ${gameId} did not have durable sequence ${expectedLastSequence}`
          );
        }
      });
    } catch (error) {
      if (error instanceof GamePersistenceError) throw error;
      throw new GamePersistenceError(
        "MOVE_BATCH_WRITE_FAILED",
        `Could not persist moves for game ${gameId}`,
        error
      );
    }

    return finalSequence;
  }

  async finalizeGame({
    gameId,
    status,
    endReason,
    finalFen,
    finalSequence,
    winnerColor = null
  }) {
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.game.updateMany({
        where: {
          id: gameId,
          status: "ACTIVE",
          lastSequence: finalSequence
        },
        data: {
          status,
          endReason,
          finalFen,
          winnerColor,
          endedAt: new Date()
        }
      });

      if (updated.count === 0) {
        const stored = await transaction.game.findUnique({
          where: { id: gameId }
        });

        if (stored && stored.status !== "ACTIVE") return stored;
        throw new GamePersistenceError(
          "GAME_FINALIZATION_CONFLICT",
          `Game ${gameId} could not be finalized at sequence ${finalSequence}`
        );
      }

      if (winnerColor) {
        await transaction.gameParticipant.updateMany({
          where: { gameId, color: winnerColor },
          data: { outcome: "WIN" }
        });
        await transaction.gameParticipant.updateMany({
          where: { gameId, color: winnerColor === "WHITE" ? "BLACK" : "WHITE" },
          data: { outcome: "LOSS" }
        });
      }

      return transaction.game.findUnique({ where: { id: gameId } });
    });
  }

  async markGameInterrupted(gameId) {
    return this.prisma.game.updateMany({
      where: { id: gameId, status: "ACTIVE" },
      data: {
        status: "INTERRUPTED",
        endReason: "SERVER_INTERRUPTED",
        endedAt: new Date()
      }
    });
  }

  async recoverInterruptedGames() {
    return this.prisma.game.updateMany({
      where: { status: "ACTIVE" },
      data: {
        status: "INTERRUPTED",
        endReason: "SERVER_INTERRUPTED",
        endedAt: new Date()
      }
    });
  }
}

module.exports = { GamePersistenceError, GamePersistenceService };
