const assert = require("node:assert/strict");
const test = require("node:test");

const { GamePersistenceService } = require("../src/services/game-persistence");

test("unrated game settlement never overwrites player rating", async () => {
  let statsUpsertInput = null;
  const lockedUsers = [];

  const transaction = {
    $executeRaw: async ([query], uid) => {
      lockedUsers.push(uid);
    },
    game: {
      updateMany: async () => ({ count: 1 }),
      findUnique: async () => ({
        id: "game-unrated-1",
        variant: "THREE_SECONDS",
        rated: false,
        endedAt: new Date(),
        participants: [
          { id: "p-1", userId: "user-zebra", color: "WHITE" },
          { id: "p-2", userId: "user-alpha", color: "BLACK" }
        ]
      })
    },
    gameParticipant: {
      updateMany: async () => ({ count: 1 }),
      update: async () => {}
    },
    playerVariantStats: {
      findUnique: async ({ where }) => {
        // user-zebra has current rating 1500
        if (where.userId_variant.userId === "user-zebra") return { rating: 1500 };
        return { rating: 1200 };
      },
      upsert: async (input) => {
        if (input.where.userId_variant.userId === "user-zebra") {
          statsUpsertInput = input;
        }
      }
    }
  };

  const prisma = {
    $transaction: async (cb) => cb(transaction)
  };

  const persistence = new GamePersistenceService(prisma);
  await persistence.finalizeGame({
    gameId: "game-unrated-1",
    status: "COMPLETED",
    endReason: "KING_CAPTURED",
    finalFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    finalSequence: 12,
    winnerColor: "WHITE"
  });

  // Canonical order locks: user-alpha before user-zebra
  assert.deepEqual(lockedUsers, ["user-alpha", "user-zebra"]);

  // In unrated games, rating must NOT be touched in update
  assert.ok(statsUpsertInput);
  assert.equal(statsUpsertInput.update.rating, undefined);
  assert.equal(statsUpsertInput.update.totalWins.increment, 1);
});

test("rated game with winner updates rating under canonical lock", async () => {
  let statsUpsertInput = null;

  const transaction = {
    $executeRaw: async () => {},
    game: {
      updateMany: async () => ({ count: 1 }),
      findUnique: async () => ({
        id: "game-rated-1",
        variant: "THREE_SECONDS",
        rated: true,
        endedAt: new Date(),
        participants: [
          { id: "p-1", userId: "user-1", color: "WHITE" },
          { id: "p-2", userId: "user-2", color: "BLACK" }
        ]
      })
    },
    gameParticipant: {
      updateMany: async () => ({ count: 1 }),
      update: async () => {}
    },
    playerVariantStats: {
      findUnique: async () => ({ rating: 1200 }),
      upsert: async (input) => {
        if (input.where.userId_variant.userId === "user-1") {
          statsUpsertInput = input;
        }
      }
    }
  };

  const prisma = {
    $transaction: async (cb) => cb(transaction)
  };

  const persistence = new GamePersistenceService(prisma);
  await persistence.finalizeGame({
    gameId: "game-rated-1",
    status: "COMPLETED",
    endReason: "KING_CAPTURED",
    finalFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    finalSequence: 12,
    winnerColor: "WHITE"
  });

  // In rated games with a winner, rating must be calculated and updated
  assert.ok(statsUpsertInput);
  assert.equal(typeof statsUpsertInput.update.rating, "number");
  // Expected: 1200 + 32 * (1 - 0.5) = 1216
  assert.equal(statsUpsertInput.update.rating, 1216);
});
