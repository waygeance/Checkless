const assert = require("node:assert/strict");
const test = require("node:test");

const {
  GamePersistenceError,
  GamePersistenceService
} = require("../src/services/game-persistence");

test("creates a casual game and both participant snapshots atomically", async () => {
  let createInput;
  const prisma = {
    game: {
      create: async (input) => {
        createInput = input;
        return { id: "game-1", participants: [] };
      }
    }
  };
  const service = new GamePersistenceService(prisma);

  await service.createCasualGame({
    whiteUser: {
      id: "white-user",
      username: "white",
      displayName: "White Player",
      avatarUrl: "white.png"
    },
    blackUser: {
      id: "black-user",
      username: "black",
      displayName: null,
      avatarUrl: null
    },
    variant: "3s",
    initialFen: "initial-fen"
  });

  assert.equal(createInput.data.mode, "CASUAL");
  assert.equal(createInput.data.variant, "THREE_SECONDS");
  assert.equal(createInput.data.rated, false);
  assert.deepEqual(
    createInput.data.participants.create.map((player) => player.color),
    ["WHITE", "BLACK"]
  );
  assert.equal(
    createInput.data.participants.create[0].usernameSnapshot,
    "white"
  );
});

test("persists a contiguous batch and advances lastSequence transactionally", async () => {
  const calls = [];
  const transaction = {
    gameMove: {
      createMany: async ({ data }) => calls.push(["moves", data])
    },
    game: {
      updateMany: async (input) => {
        calls.push(["game", input]);
        return { count: 1 };
      }
    }
  };
  const prisma = { $transaction: async (callback) => callback(transaction) };
  const service = new GamePersistenceService(prisma);
  const moves = [{ sequence: 4 }, { sequence: 5 }];

  const sequence = await service.persistMoveBatch("game-1", moves, 3);

  assert.equal(sequence, 5);
  assert.deepEqual(calls[0], ["moves", moves]);
  assert.equal(calls[1][1].where.lastSequence, 3);
  assert.equal(calls[1][1].data.lastSequence, 5);
});

test("rejects sequence gaps before opening a transaction", async () => {
  const prisma = {
    $transaction: async () => assert.fail("transaction should not run")
  };
  const service = new GamePersistenceService(prisma);

  await assert.rejects(
    service.persistMoveBatch("game-1", [{ sequence: 2 }], 0),
    (error) =>
      error instanceof GamePersistenceError &&
      error.code === "MOVE_SEQUENCE_GAP"
  );
});
