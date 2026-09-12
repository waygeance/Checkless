const { EventEmitter } = require("node:events");

/**
 * Owns ephemeral casual and ranked matchmaking state.
 * Queue membership and socket IDs are deliberately never persisted to PostgreSQL.
 *
 * Emits "match" events when compatible players are paired, whether immediately
 * on join or through periodic rating-window expansion passes.
 */
class MatchmakingService extends EventEmitter {
  constructor(gameService, prisma) {
    super();
    this.gameService = gameService;
    this.prisma = prisma;
    this.waitingPlayers = [];
    this.matchingSocketIds = new Set();
    this.cancelledMatchingSocketIds = new Set();
  }

  async join({ socketId, user, identity, variant, mode = "CASUAL" }) {
    if (mode === "RANKED" && user.kind !== "HUMAN") {
      return { status: "ranked-auth-required" };
    }
    if (
      this.gameService.findGameBySocketId(socketId) ||
      this.gameService.findGameByUserId(user.id)
    ) {
      return { status: "already-playing" };
    }
    if (this.matchingSocketIds.has(socketId)) {
      return { status: "matching" };
    }

    this.leave(socketId);
    if (mode === "RANKED" && this.prisma) {
      const stats = await this.prisma.playerVariantStats.findUnique({
        where: {
          userId_variant: {
            userId: user.id,
            variant: {
              "1s": "ONE_SECOND",
              "3s": "THREE_SECONDS",
              "5s": "FIVE_SECONDS"
            }[variant]
          }
        }
      });
      user = { ...user, rating: stats?.rating ?? 1200 };
    }

    if (
      this.waitingPlayers.some((candidate) => candidate.user.id === user.id)
    ) {
      return { status: "already-queued" };
    }

    const waitingIndex = this.waitingPlayers.findIndex(
      (candidate) =>
        candidate.variant === variant &&
        candidate.mode === mode &&
        candidate.socketId !== socketId &&
        candidate.user.id !== user.id &&
        !this.matchingSocketIds.has(candidate.socketId) &&
        (mode !== "RANKED" || this.ratingCompatible(candidate, { user }))
    );

    if (waitingIndex === -1) {
      this.waitingPlayers.push({
        socketId,
        user,
        identity,
        variant,
        mode,
        queuedAt: Date.now()
      });
      return { status: "waiting" };
    }

    const [whitePlayer] = this.waitingPlayers.splice(waitingIndex, 1);
    const blackPlayer = { socketId, user, identity, variant, mode, queuedAt: Date.now() };
    return this.startMatch(whitePlayer, blackPlayer);
  }

  /**
   * Starts a game for two paired players and publishes the match outcome.
   * Used both for immediate join matches and for matches found during queue scans.
   */
  async startMatch(whitePlayer, blackPlayer) {
    this.matchingSocketIds.add(whitePlayer.socketId);
    this.matchingSocketIds.add(blackPlayer.socketId);

    try {
      const game = await this.gameService.startCasualGame({
        whitePlayer,
        blackPlayer,
        variant: whitePlayer.variant,
        mode: whitePlayer.mode,
        rated: whitePlayer.mode === "RANKED"
      });

      const wasCancelled =
        this.cancelledMatchingSocketIds.has(whitePlayer.socketId) ||
        this.cancelledMatchingSocketIds.has(blackPlayer.socketId);

      const result = wasCancelled
        ? { status: "cancelled", game, whitePlayer, blackPlayer }
        : { status: "matched", game, whitePlayer, blackPlayer };

      this.emit("match", result);
      return result;
    } catch (error) {
      const errorResult = { status: "error", error, whitePlayer, blackPlayer };
      this.emit("match", errorResult);
      return errorResult;
    } finally {
      this.matchingSocketIds.delete(whitePlayer.socketId);
      this.matchingSocketIds.delete(blackPlayer.socketId);
      this.cancelledMatchingSocketIds.delete(whitePlayer.socketId);
      this.cancelledMatchingSocketIds.delete(blackPlayer.socketId);
    }
  }

  /**
   * Periodic matchmaking pass that scans all waiting players and matches them
   * as their rating windows expand over elapsed queue time.
   */
  async checkWaitingMatches() {
    if (this.waitingPlayers.length < 2) return [];

    const matches = [];

    for (let i = 0; i < this.waitingPlayers.length; i++) {
      const first = this.waitingPlayers[i];
      if (!first || this.matchingSocketIds.has(first.socketId)) continue;

      for (let j = i + 1; j < this.waitingPlayers.length; j++) {
        const second = this.waitingPlayers[j];
        if (!second || this.matchingSocketIds.has(second.socketId)) continue;

        if (
          first.variant === second.variant &&
          first.mode === second.mode &&
          first.user.id !== second.user.id &&
          (first.mode !== "RANKED" || this.ratingCompatible(first, second))
        ) {
          // Remove second first to preserve earlier index
          this.waitingPlayers.splice(j, 1);
          this.waitingPlayers.splice(i, 1);
          i--;

          const matchResult = await this.startMatch(first, second);
          matches.push(matchResult);
          break;
        }
      }
    }

    return matches;
  }

  /**
   * Evaluates rating compatibility between two players.
   * Window expands by 50 Elo per second of wait time, capped at 400 Elo.
   * Evaluates the maximum elapsed time between the two waiting players.
   */
  ratingCompatible(first, second) {
    const elapsedFirst = first.queuedAt
      ? Math.floor((Date.now() - first.queuedAt) / 1000)
      : 0;
    const elapsedSecond = second.queuedAt
      ? Math.floor((Date.now() - second.queuedAt) / 1000)
      : 0;
    const maxElapsed = Math.max(elapsedFirst, elapsedSecond);
    const window = Math.min(400, 100 + maxElapsed * 50);

    return (
      Math.abs((first.user.rating || 1200) - (second.user.rating || 1200)) <=
      window
    );
  }

  leave(socketId) {
    const index = this.waitingPlayers.findIndex(
      (candidate) => candidate.socketId === socketId
    );
    if (index === -1) {
      if (this.matchingSocketIds.has(socketId)) {
        this.cancelledMatchingSocketIds.add(socketId);
        return { socketId, pendingMatch: true };
      }
      return null;
    }
    return this.waitingPlayers.splice(index, 1)[0];
  }
}

module.exports = { MatchmakingService };
