const assert = require("node:assert/strict");
const test = require("node:test");

const { MatchmakingService } = require("../src/services/matchmaking");

test("ranked rating-window expansion pairs waiting players across elapsed queue time", async () => {
  let createdGame = null;
  const gameService = {
    findGameBySocketId: () => null,
    findGameByUserId: () => null,
    startCasualGame: async (params) => {
      createdGame = { id: "game-ranked-1", ...params };
      return createdGame;
    }
  };

  const matchmaking = new MatchmakingService(gameService);

  // First player with 1200 rating joins ranked queue
  const firstJoin = await matchmaking.join({
    socketId: "socket-1",
    user: { id: "user-1", kind: "HUMAN", rating: 1200 },
    identity: { type: "human", id: "user-1" },
    variant: "3s",
    mode: "RANKED"
  });
  assert.equal(firstJoin.status, "waiting");

  // Second player with 1500 rating joins ranked queue
  // Rating diff = 300, initial window = 100 -> does not match immediately
  const secondJoin = await matchmaking.join({
    socketId: "socket-2",
    user: { id: "user-2", kind: "HUMAN", rating: 1500 },
    identity: { type: "human", id: "user-2" },
    variant: "3s",
    mode: "RANKED"
  });
  assert.equal(secondJoin.status, "waiting");
  assert.equal(matchmaking.waitingPlayers.length, 2);

  // Advance queuedAt by 10 seconds (simulating 10s wait in queue)
  const tenSecondsAgo = Date.now() - 10_000;
  matchmaking.waitingPlayers[0].queuedAt = tenSecondsAgo;
  matchmaking.waitingPlayers[1].queuedAt = tenSecondsAgo;

  let publishedMatch = null;
  matchmaking.on("match", (match) => {
    publishedMatch = match;
  });

  // Run the periodic matchmaking scan
  const matches = await matchmaking.checkWaitingMatches();

  assert.equal(matches.length, 1);
  assert.equal(matches[0].status, "matched");
  assert.equal(matches[0].whitePlayer.user.id, "user-1");
  assert.equal(matches[0].blackPlayer.user.id, "user-2");
  assert.equal(matchmaking.waitingPlayers.length, 0);

  // Confirm match was broadcast via the shared match event
  assert.ok(publishedMatch);
  assert.equal(publishedMatch.game.id, "game-ranked-1");
  assert.equal(publishedMatch.game.rated, true);
});
