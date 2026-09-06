const crypto = require("node:crypto");

const EXPIRY_MS = 15 * 60 * 1000;

class ChallengeService {
  constructor(prisma) {
    this.prisma = prisma;
  }
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
  async accept(userId, code) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { code: String(code).toUpperCase() }
    });
    if (
      !challenge ||
      challenge.status !== "OPEN" ||
      challenge.expiresAt <= new Date()
    )
      throw this.error("CHALLENGE_UNAVAILABLE");
    if (challenge.hostId === userId) throw this.error("SELF_CHALLENGE");
    const claimed = await this.prisma.challenge.updateMany({
      where: {
        id: challenge.id,
        status: "OPEN",
        expiresAt: { gt: new Date() },
        opponentId: null
      },
      data: { opponentId: userId, status: "ACCEPTED", acceptedAt: new Date() }
    });
    if (claimed.count !== 1) throw this.error("CHALLENGE_ALREADY_CLAIMED");
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
  async cancel(userId, id) {
    return this.prisma.challenge.updateMany({
      where: { id, hostId: userId, status: "OPEN" },
      data: { status: "CANCELED" }
    });
  }
  async expire() {
    return this.prisma.challenge.updateMany({
      where: { status: "OPEN", expiresAt: { lte: new Date() } },
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
