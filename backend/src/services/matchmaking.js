/**
 * Owns ephemeral casual matchmaking state. Queue membership and socket IDs are
 * deliberately never persisted to PostgreSQL.
 */
class MatchmakingService {
  constructor(gameService, prisma) {
    this.gameService = gameService;
    this.prisma = prisma;
    this.waitingPlayers = [];
    this.matchingSocketIds = new Set();
    this.cancelledMatchingSocketIds = new Set();
  }

  async join({ socketId, user, identity, variant, mode = "CASUAL" }) {
    if (mode === "RANKED" && user.kind !== "HUMAN")
      return { status: "ranked-auth-required" };
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
    const blackPlayer = { socketId, user, identity, variant, mode };
    this.matchingSocketIds.add(whitePlayer.socketId);
    this.matchingSocketIds.add(blackPlayer.socketId);

    try {
      const game = await this.gameService.startCasualGame({
        whitePlayer,
        blackPlayer,
        variant,
        mode,
        rated: mode === "RANKED"
      });
      if (
        this.cancelledMatchingSocketIds.has(whitePlayer.socketId) ||
        this.cancelledMatchingSocketIds.has(blackPlayer.socketId)
      ) {
        return { status: "cancelled", game, whitePlayer, blackPlayer };
      }
      return { status: "matched", game, whitePlayer, blackPlayer };
    } catch (error) {
      return { status: "error", error, whitePlayer, blackPlayer };
    } finally {
      this.matchingSocketIds.delete(whitePlayer.socketId);
      this.matchingSocketIds.delete(blackPlayer.socketId);
      this.cancelledMatchingSocketIds.delete(whitePlayer.socketId);
      this.cancelledMatchingSocketIds.delete(blackPlayer.socketId);
    }
  }

  ratingCompatible(first, second) {
    const elapsed = Math.floor((Date.now() - first.queuedAt) / 1000);
    const window = Math.min(400, 100 + elapsed * 50);
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
