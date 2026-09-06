/**
 * Owns ephemeral casual matchmaking state. Queue membership and socket IDs are
 * deliberately never persisted to PostgreSQL.
 */
class MatchmakingService {
  constructor(gameService) {
    this.gameService = gameService;
    this.waitingPlayers = [];
    this.matchingSocketIds = new Set();
    this.cancelledMatchingSocketIds = new Set();
  }

  async join({ socketId, user, variant }) {
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

    if (
      this.waitingPlayers.some((candidate) => candidate.user.id === user.id)
    ) {
      return { status: "already-queued" };
    }

    const waitingIndex = this.waitingPlayers.findIndex(
      (candidate) =>
        candidate.variant === variant &&
        candidate.socketId !== socketId &&
        candidate.user.id !== user.id &&
        !this.matchingSocketIds.has(candidate.socketId)
    );

    if (waitingIndex === -1) {
      this.waitingPlayers.push({ socketId, user, variant });
      return { status: "waiting" };
    }

    const [whitePlayer] = this.waitingPlayers.splice(waitingIndex, 1);
    const blackPlayer = { socketId, user, variant };
    this.matchingSocketIds.add(whitePlayer.socketId);
    this.matchingSocketIds.add(blackPlayer.socketId);

    try {
      const game = await this.gameService.startCasualGame({
        whitePlayer,
        blackPlayer,
        variant
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
