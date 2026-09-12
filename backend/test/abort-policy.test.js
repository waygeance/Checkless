const assert = require("node:assert/strict");
const test = require("node:test");

const { LiveGameService } = require("../src/services/live-game");

function createMockPersistence() {
  const finalizations = [];
  return {
    finalizations,
    async createCasualGame() {
      return {
        id: "game-test-abort",
        startedAt: new Date(),
        participants: [
          { id: "white-participant", color: "WHITE" },
          { id: "black-participant", color: "BLACK" }
        ]
      };
    },
    async persistMoveBatch() {},
    async finalizeGame(input) {
      finalizations.push(input);
      return input;
    },
    async markGameInterrupted() {}
  };
}

test("pre-play abort finalizes as ABORTED with winner null", async () => {
  const persistence = createMockPersistence();
  const service = new LiveGameService({ persistence });

  const game = await service.startCasualGame({
    whitePlayer: { socketId: "w-sock", user: { id: "w-user" } },
    blackPlayer: { socketId: "b-sock", user: { id: "b-user" } },
    variant: "3s",
    mode: "RANKED",
    rated: true
  });

  assert.equal(game.moveHistory.length, 0);
  assert.equal(game.lastSequence, 0);

  // Pre-play abort
  await service.abortGame(game.id);

  assert.equal(persistence.finalizations.length, 1);
  assert.equal(persistence.finalizations[0].status, "ABORTED");
  assert.equal(persistence.finalizations[0].endReason, "ABORTED");
  assert.equal(persistence.finalizations[0].winnerColor, undefined);
});

test("post-move abort settles as RESIGNATION awarding win to opponent", async () => {
  const persistence = createMockPersistence();
  const service = new LiveGameService({ persistence });

  const game = await service.startCasualGame({
    whitePlayer: { socketId: "w-sock", user: { id: "w-user" } },
    blackPlayer: { socketId: "b-sock", user: { id: "b-user" } },
    variant: "3s",
    mode: "RANKED",
    rated: true
  });

  // Simulate White making a move
  game.players.white.canMove = true;
  service.acceptMove({
    gameId: game.id,
    socketId: "w-sock",
    clientMoveId: "11111111-1111-4111-8111-111111111111",
    move: { from: "e2", to: "e4" }
  });

  assert.equal(game.moveHistory.length, 1);
  assert.equal(game.lastSequence, 1);

  // Post-move abort is settled as resignation
  const result = await service.resignGame(game.id, "w-sock");

  assert.ok(result);
  assert.equal(result.winnerColor, "black");
  assert.equal(persistence.finalizations.length, 1);
  assert.equal(persistence.finalizations[0].status, "COMPLETED");
  assert.equal(persistence.finalizations[0].endReason, "RESIGNATION");
  assert.equal(persistence.finalizations[0].winnerColor, "BLACK");
});
