const assert = require("node:assert/strict");
const test = require("node:test");

const { MatchmakingService } = require("../src/services/matchmaking");
const { LiveGameService } = require("../src/services/live-game");

test("second socket from same account is rejected while first socket lookup is awaiting", async () => {
  let resolveStats;
  const statsGate = new Promise((resolve) => {
    resolveStats = resolve;
  });

  const prisma = {
    playerVariantStats: {
      findUnique: async () => {
        await statsGate;
        return { rating: 1300 };
      }
    }
  };

  const gameService = {
    findGameBySocketId: () => null,
    findGameByUserId: () => null,
    startCasualGame: async () => ({ id: "game-1" })
  };

  const matchmaking = new MatchmakingService(gameService, prisma);

  // Socket 1 begins ranked join, awaiting Prisma
  const join1Promise = matchmaking.join({
    socketId: "socket-tab-1",
    user: { id: "same-user-id", kind: "HUMAN" },
    identity: { type: "human", id: "same-user-id" },
    variant: "3s",
    mode: "RANKED"
  });

  // Socket 2 tries to join with same user account while socket 1 is awaiting
  const join2Result = await matchmaking.join({
    socketId: "socket-tab-2",
    user: { id: "same-user-id", kind: "HUMAN" },
    identity: { type: "human", id: "same-user-id" },
    variant: "3s",
    mode: "RANKED"
  });

  assert.equal(join2Result.status, "already-queued");

  // Complete socket 1
  resolveStats();
  const join1Result = await join1Promise;
  assert.equal(join1Result.status, "waiting");
  assert.equal(matchmaking.waitingPlayers.length, 1);
});

test("disconnect during ranked rating lookup invalidates work and leaves queue empty", async () => {
  let resolveStats;
  const statsGate = new Promise((resolve) => {
    resolveStats = resolve;
  });

  const prisma = {
    playerVariantStats: {
      findUnique: async () => {
        await statsGate;
        return { rating: 1200 };
      }
    }
  };

  const gameService = {
    findGameBySocketId: () => null,
    findGameByUserId: () => null,
    startCasualGame: async () => ({ id: "game-1" })
  };

  const matchmaking = new MatchmakingService(gameService, prisma);

  const joinPromise = matchmaking.join({
    socketId: "disconnecting-socket",
    user: { id: "user-dc", kind: "HUMAN" },
    identity: { type: "human", id: "user-dc" },
    variant: "3s",
    mode: "RANKED"
  });

  // Socket leaves while DB lookup is still awaiting
  matchmaking.leave("disconnecting-socket");

  // Complete DB lookup
  resolveStats();
  const result = await joinPromise;

  assert.equal(result.status, "cancelled");
  assert.equal(matchmaking.waitingPlayers.length, 0);
  assert.equal(matchmaking.reservedUserIds.has("user-dc"), false);
});

test("finishing game blocks new match until settlement completes", () => {
  const service = new LiveGameService({ persistence: {} });
  service.games.set("g-1", {
    id: "g-1",
    status: "finishing",
    players: {
      white: { socketId: "w-sock", userId: "user-finishing" },
      black: { socketId: "b-sock", userId: "opponent" }
    }
  });

  assert.ok(service.findGameByUserId("user-finishing"));
  assert.ok(service.findGameBySocketId("w-sock"));
});
