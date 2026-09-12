const crypto = require("node:crypto");

const EXPIRY_MS = 15 * 60 * 1000;

const DATABASE_TO_SHORT_VARIANT = Object.freeze({
  ONE_SECOND: "1s",
  THREE_SECONDS: "3s",
  FIVE_SECONDS: "5s"
});

/**
 * Manages direct player-to-player challenges.
 * Owns challenge creation, lookup, claim/acceptance, ready-state coordination,
 * cancellation, and expiration.
 */
class ChallengeService {
  constructor(prisma) {
    this.prisma = prisma;
    // Ephemeral readiness registry for accepted challenges waiting to start.
    // challengeId -> Map(userId, { socketId, user, identity })
    this.readyParticipants = new Map();
  }

  /**
   * Generates a new open challenge with a random shareable code.
   */
  async create(hostId, variant) {
    const code = crypto.randomBytes(5).toString("base64url").toUpperCase();
    return this.prisma.challenge.create({
      data: {
        code,
        hostId,
        variant: {
          "1s": "ONE_SECOND",
          "3s": "THREE_SECONDS",
          "5s": "FIVE_SECONDS"
        }[variant],
        expiresAt: new Date(Date.now() + EXPIRY_MS)
      },
      select: {
        id: true,
        code: true,
        variant: true,
        status: true,
        expiresAt: true,
        createdAt: true
      }
    });
  }

  /**
   * Retrieves challenge details by code, expiring stale records lazily.
   */
  async lookup(code) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { code: String(code).toUpperCase() },
      include: {
        host: { select: { username: true, displayName: true, avatarUrl: true } }
      }
    });
    if (!challenge) return null;
    if (challenge.status === "OPEN" && challenge.expiresAt <= new Date()) {
      await this.prisma.challenge.update({
        where: { id: challenge.id },
        data: { status: "EXPIRED" }
      });
      challenge.status = "EXPIRED";
    }
    return {
      id: challenge.id,
      code: challenge.code,
      variant: challenge.variant,
      status: challenge.status,
      expiresAt: challenge.expiresAt,
      host: challenge.host
    };
  }

  /**
   * Atomically claims an open challenge for an opponent.
   */
  async accept(userId, code) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { code: String(code).toUpperCase() }
    });
    if (
      !challenge ||
      challenge.status !== "OPEN" ||
      challenge.expiresAt <= new Date()
    ) {
      throw this.error("CHALLENGE_UNAVAILABLE");
    }
    if (challenge.hostId === userId) {
      throw this.error("SELF_CHALLENGE");
    }

    const claimed = await this.prisma.challenge.updateMany({
      where: {
        id: challenge.id,
        status: "OPEN",
        expiresAt: { gt: new Date() },
        opponentId: null
      },
      data: { opponentId: userId, status: "ACCEPTED", acceptedAt: new Date() }
    });
    if (claimed.count !== 1) {
      throw this.error("CHALLENGE_ALREADY_CLAIMED");
    }

    return this.prisma.challenge.findUnique({
      where: { id: challenge.id },
      select: {
        id: true,
        code: true,
        hostId: true,
        opponentId: true,
        variant: true,
        status: true,
        expiresAt: true
      }
    });
  }

  /**
   * Coordinates live socket readiness for an accepted challenge.
   * When both host and opponent have signaled readiness, creates the live CHALLENGE game,
   * atomically updates status to STARTED, and links gameId.
   */
  async readyParticipant({ code, user, socketId, identity, gameService }) {
    const normalizedCode = String(code).trim().toUpperCase();
    const challenge = await this.prisma.challenge.findUnique({
      where: { code: normalizedCode }
    });

    if (!challenge) {
      throw this.error("CHALLENGE_NOT_FOUND");
    }
    if (challenge.status === "STARTED") {
      throw this.error("CHALLENGE_ALREADY_STARTED");
    }
    if (challenge.status !== "ACCEPTED") {
      throw this.error("CHALLENGE_NOT_ACCEPTED");
    }
    if (challenge.hostId !== user.id && challenge.opponentId !== user.id) {
      throw this.error("NOT_A_CHALLENGE_PARTICIPANT");
    }
    if (gameService.findGameByUserId(user.id)) {
      throw this.error("ALREADY_PLAYING");
    }

    if (!this.readyParticipants.has(challenge.id)) {
      this.readyParticipants.set(challenge.id, new Map());
    }
    const readyMap = this.readyParticipants.get(challenge.id);
    readyMap.set(user.id, {
      socketId,
      user,
      identity: identity || { type: "human", id: user.id }
    });

    // Check if both participants are ready
    if (readyMap.has(challenge.hostId) && readyMap.has(challenge.opponentId)) {
      // Transition challenge to STARTED atomically
      const claimed = await this.prisma.challenge.updateMany({
        where: { id: challenge.id, status: "ACCEPTED" },
        data: { status: "STARTED" }
      });
      if (claimed.count !== 1) {
        throw this.error("CHALLENGE_ALREADY_STARTED");
      }

      const whitePlayer = readyMap.get(challenge.hostId);
      const blackPlayer = readyMap.get(challenge.opponentId);
      this.readyParticipants.delete(challenge.id);

      const shortVariant = DATABASE_TO_SHORT_VARIANT[challenge.variant] || "3s";
      const game = await gameService.startCasualGame({
        whitePlayer,
        blackPlayer,
        variant: shortVariant,
        mode: "CHALLENGE",
        rated: false
      });

      // Atomically link gameId to the challenge record
      await this.prisma.challenge.update({
        where: { id: challenge.id },
        data: { gameId: game.id }
      });

      return {
        status: "started",
        game,
        whitePlayer,
        blackPlayer
      };
    }

    return { status: "waiting", challengeId: challenge.id };
  }

  /**
   * Removes a socket from any pending readiness map upon disconnect.
   */
  unreadyParticipant(socketId) {
    for (const [challengeId, readyMap] of this.readyParticipants.entries()) {
      for (const [userId, participant] of readyMap.entries()) {
        if (participant.socketId === socketId) {
          readyMap.delete(userId);
          if (readyMap.size === 0) {
            this.readyParticipants.delete(challengeId);
          }
          return { challengeId, userId };
        }
      }
    }
    return null;
  }

  /**
   * Cancels a challenge if it has not yet started.
   * Can be initiated by either the host or the accepted opponent.
   */
  async cancel(userId, id) {
    // Clear ephemeral ready state if present
    this.readyParticipants.delete(id);

    return this.prisma.challenge.updateMany({
      where: {
        id,
        status: { in: ["OPEN", "ACCEPTED"] },
        OR: [{ hostId: userId }, { opponentId: userId }]
      },
      data: { status: "CANCELED" }
    });
  }

  /**
   * Expires stale OPEN and ACCEPTED challenges that exceeded expiresAt before starting.
   */
  async expire() {
    return this.prisma.challenge.updateMany({
      where: {
        status: { in: ["OPEN", "ACCEPTED"] },
        expiresAt: { lte: new Date() }
      },
      data: { status: "EXPIRED" }
    });
  }

  error(code) {
    const error = new Error(code);
    error.code = code;
    return error;
  }
}

module.exports = { ChallengeService };
