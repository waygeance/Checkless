const assert = require("node:assert/strict");
const test = require("node:test");

const { MatchmakingService } = require("../src/services/matchmaking");

function player(socketId, userId) {
  return { socketId, user: { id: userId }, variant: "3s" };
}

test("matches different users and never self-matches two account sockets", async () => {
  const gameService = {
    findGameBySocketId: () => null,
    findGameByUserId: () => null,
    startCasualGame: async () => ({ id: "game-1" })
  };
  const matchmaking = new MatchmakingService(gameService);

  assert.equal(
    (await matchmaking.join(player("socket-1", "user-1"))).status,
    "waiting"
  );
  assert.equal(
    (await matchmaking.join(player("socket-2", "user-1"))).status,
    "already-queued"
  );
  const matched = await matchmaking.join(player("socket-3", "user-2"));

  assert.equal(matched.status, "matched");
  assert.equal(matched.whitePlayer.user.id, "user-1");
  assert.equal(matched.blackPlayer.user.id, "user-2");
});

test("cancelling during durable game creation prevents game_start", async () => {
  let releaseCreation;
  const creationGate = new Promise((resolve) => {
    releaseCreation = resolve;
  });
  const gameService = {
    findGameBySocketId: () => null,
    findGameByUserId: () => null,
    startCasualGame: async () => {
      await creationGate;
      return { id: "game-1" };
    }
  };
  const matchmaking = new MatchmakingService(gameService);

  await matchmaking.join(player("white-socket", "white-user"));
  const matching = matchmaking.join(player("black-socket", "black-user"));
  const removed = matchmaking.leave("white-socket");
  releaseCreation();

  assert.equal(removed.pendingMatch, true);
  assert.equal((await matching).status, "cancelled");
});
