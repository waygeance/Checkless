const assert = require("node:assert/strict");
const test = require("node:test");

const { ChallengeService } = require("../src/services/challenge");
const { GamePersistenceService } = require("../src/services/game-persistence");

test("challenge ready/start flow creates playable game and updates challenge status", async () => {
  const challengeStore = {
    id: "challenge-1",
    code: "TEST1234",
    hostId: "user-host",
    opponentId: "user-opponent",
    variant: "THREE_SECONDS",
    status: "ACCEPTED",
    gameId: null,
    expiresAt: new Date(Date.now() + 60_000)
  };

  const prisma = {
    challenge: {
      findUnique: async ({ where }) => {
        if (where.code === "TEST1234" || where.id === "challenge-1") {
          return { ...challengeStore };
        }
        return null;
      },
      updateMany: async ({ where, data }) => {
        if (where.id === "challenge-1" && where.status === challengeStore.status) {
          Object.assign(challengeStore, data);
          return { count: 1 };
        }
        return { count: 0 };
      },
      update: async ({ where, data }) => {
        if (where.id === "challenge-1") {
          Object.assign(challengeStore, data);
          return { ...challengeStore };
        }
        return null;
      }
    }
  };

  let startedGameParams = null;
  const gameService = {
    findGameByUserId: () => null,
    startCasualGame: async (params) => {
      startedGameParams = params;
      return { id: "game-challenge-1", variant: "3s", mode: "CHALLENGE", rated: false };
    }
  };

  const challengeService = new ChallengeService(prisma);

  // Host readies first
  const hostReady = await challengeService.readyParticipant({
    code: "test1234",
    user: { id: "user-host" },
    socketId: "socket-host",
    identity: { type: "human", id: "user-host" },
    gameService
  });

  assert.equal(hostReady.status, "waiting");
  assert.equal(challengeStore.status, "ACCEPTED");

  // Opponent readies second
  const opponentReady = await challengeService.readyParticipant({
    code: "TEST1234",
    user: { id: "user-opponent" },
    socketId: "socket-opponent",
    identity: { type: "human", id: "user-opponent" },
    gameService
  });

  assert.equal(opponentReady.status, "started");
  assert.equal(opponentReady.game.id, "game-challenge-1");
  assert.equal(challengeStore.status, "STARTED");
  assert.equal(challengeStore.gameId, "game-challenge-1");
  assert.equal(startedGameParams.mode, "CHALLENGE");
  assert.equal(startedGameParams.rated, false);
  assert.equal(startedGameParams.whitePlayer.user.id, "user-host");
  assert.equal(startedGameParams.blackPlayer.user.id, "user-opponent");
});

test("challenge cancel and expire handle accepted-but-unstarted challenges", async () => {
  let challengeStatus = "ACCEPTED";
  const prisma = {
    challenge: {
      updateMany: async ({ where, data }) => {
        challengeStatus = data.status;
        return { count: 1 };
      }
    }
  };

  const challengeService = new ChallengeService(prisma);

  // Host can cancel accepted challenge
  await challengeService.cancel("user-host", "challenge-1");
  assert.equal(challengeStatus, "CANCELED");

  // Expiration sweeps accepted records that passed deadline
  await challengeService.expire();
  assert.equal(challengeStatus, "EXPIRED");
});

test("game persistence settles linked challenge to COMPLETED on game finalization", async () => {
  let challengeSettledStatus = null;
  const transaction = {
    game: {
      updateMany: async () => ({ count: 1 }),
      findUnique: async () => ({ id: "game-1", variant: "THREE_SECONDS", participants: [] })
    },
    gameParticipant: {
      updateMany: async () => ({ count: 1 })
    },
    challenge: {
      updateMany: async ({ where, data }) => {
        if (where.gameId === "game-1") {
          challengeSettledStatus = data.status;
          return { count: 1 };
        }
        return { count: 0 };
      }
    }
  };

  const prisma = {
    $transaction: async (cb) => cb(transaction)
  };

  const persistence = new GamePersistenceService(prisma);
  await persistence.finalizeGame({
    gameId: "game-1",
    status: "COMPLETED",
    endReason: "KING_CAPTURED",
    finalFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    finalSequence: 10,
    winnerColor: "WHITE"
  });

  assert.equal(challengeSettledStatus, "COMPLETED");
});
