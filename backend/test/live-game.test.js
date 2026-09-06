const assert = require("node:assert/strict");
const test = require("node:test");

const { SimultaneousChess } = require("../src/engine/chess");
const { LiveGameService } = require("../src/services/live-game");

function createPersistenceDouble() {
  const calls = { batches: [], finalizations: [] };

  return {
    calls,
    async createCasualGame() {
      return {
        id: "game-1",
        startedAt: new Date(),
        participants: [
          { id: "white-participant", color: "WHITE" },
          { id: "black-participant", color: "BLACK" }
        ]
      };
    },
    async persistMoveBatch(gameId, moves, expectedLastSequence) {
      calls.batches.push({ gameId, moves, expectedLastSequence });
    },
    async finalizeGame(input) {
      calls.finalizations.push(input);
      return input;
    },
    async markGameInterrupted() {}
  };
}

function player(socketId, id, username) {
  return {
    socketId,
    user: { id, username, displayName: null, avatarUrl: null }
  };
}

test("accepts moves in memory and batch-persists structured CMN records", async () => {
  const persistence = createPersistenceDouble();
  const service = new LiveGameService({
    persistence,
    moveBatchSize: 2,
    moveFlushIntervalMs: 60_000
  });
  const game = await service.startCasualGame({
    whitePlayer: player("white-socket", "white-user", "white"),
    blackPlayer: player("black-socket", "black-user", "black"),
    variant: "3s"
  });

  game.players.white.canMove = true;
  const first = service.acceptMove({
    gameId: game.id,
    socketId: "white-socket",
    clientMoveId: "11111111-1111-4111-8111-111111111111",
    move: { from: "e2", to: "e4" }
  });
  game.players.white.canMove = true;
  const second = service.acceptMove({
    gameId: game.id,
    socketId: "white-socket",
    clientMoveId: "22222222-2222-4222-8222-222222222222",
    move: { from: "e4", to: "e5" }
  });
  await game.moveBuffer.flush();

  assert.equal(first.notation, "(1)W:e2_e4");
  assert.equal(second.notation, "(2)W:e4_e5");
  assert.equal(persistence.calls.batches.length, 1);
  assert.deepEqual(
    persistence.calls.batches[0].moves.map((move) => move.sequence),
    [1, 2]
  );
  assert.equal(
    persistence.calls.batches[0].moves[0].participantId,
    "white-participant"
  );
  assert.equal(persistence.calls.batches[0].moves[0].color, "WHITE");
});

test("returns an accepted result without applying a duplicate clientMoveId", async () => {
  const persistence = createPersistenceDouble();
  const service = new LiveGameService({ persistence });
  const game = await service.startCasualGame({
    whitePlayer: player("white-socket", "white-user", "white"),
    blackPlayer: player("black-socket", "black-user", "black"),
    variant: "3s"
  });
  const clientMoveId = "11111111-1111-4111-8111-111111111111";

  game.players.white.canMove = true;
  const accepted = service.acceptMove({
    gameId: game.id,
    socketId: "white-socket",
    clientMoveId,
    move: { from: "e2", to: "e4" }
  });
  const duplicate = service.acceptMove({
    gameId: game.id,
    socketId: "white-socket",
    clientMoveId,
    move: { from: "e2", to: "e4" }
  });

  assert.equal(accepted.ok, true);
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.sequence, accepted.sequence);
  assert.equal(game.moveHistory.length, 1);
  await game.moveBuffer.close("test-cleanup");
});

test("forces the last move to disk before finalizing a king capture", async () => {
  const persistence = createPersistenceDouble();
  const service = new LiveGameService({ persistence });
  const game = await service.startCasualGame({
    whitePlayer: player("white-socket", "white-user", "white"),
    blackPlayer: player("black-socket", "black-user", "black"),
    variant: "3s"
  });
  game.chess = new SimultaneousChess("4k3/4R3/8/8/8/8/8/K7 w - - 0 1");
  game.players.white.canMove = true;

  const accepted = service.acceptMove({
    gameId: game.id,
    socketId: "white-socket",
    clientMoveId: "11111111-1111-4111-8111-111111111111",
    move: { from: "e7", to: "e8" }
  });
  await service.finalizeKingCapture(game.id, "white");

  assert.equal(accepted.notation, "(1)W:e7xe8#");
  assert.equal(persistence.calls.batches.length, 1);
  assert.equal(persistence.calls.finalizations.length, 1);
  assert.equal(persistence.calls.finalizations[0].finalSequence, 1);
  assert.equal(persistence.calls.finalizations[0].winnerColor, "WHITE");
  assert.equal(service.getGame(game.id), null);
});
