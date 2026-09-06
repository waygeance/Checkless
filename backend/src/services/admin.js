class AdminService {
  constructor(prisma) {
    this.prisma = prisma;
  }
  assertReason(reason) {
    if (typeof reason !== "string" || reason.trim().length < 3) {
      const e = new Error("REASON_REQUIRED");
      e.code = "REASON_REQUIRED";
      throw e;
    }
    return reason.trim();
  }
  async searchUsers(q) {
    const term = String(q || "")
      .trim()
      .toLowerCase();
    return this.prisma.user.findMany({
      where: term
        ? { OR: [{ normalizedUsername: { contains: term } }, { id: term }] }
        : {},
      select: {
        id: true,
        username: true,
        displayName: true,
        status: true,
        role: true,
        kind: true,
        createdAt: true,
        lastSeenAt: true
      },
      take: 50,
      orderBy: { username: "asc" }
    });
  }
  async searchGames(q) {
    return this.prisma.game.findMany({
      where: q ? { id: String(q) } : {},
      include: {
        participants: {
          select: { color: true, usernameSnapshot: true, outcome: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    });
  }
  async suspend(actorId, userId, reason) {
    reason = this.assertReason(reason);
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          status: "SUSPENDED",
          suspensionReason: reason,
          suspendedAt: new Date()
        },
        select: { id: true, username: true, status: true }
      });
      await tx.adminAuditLog.create({
        data: { actorId, targetUserId: userId, action: "SUSPEND_USER", reason }
      });
      return user;
    });
  }
  async restore(actorId, userId, reason) {
    reason = this.assertReason(reason);
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { status: "ACTIVE", suspensionReason: null, suspendedAt: null },
        select: { id: true, username: true, status: true }
      });
      await tx.adminAuditLog.create({
        data: { actorId, targetUserId: userId, action: "RESTORE_USER", reason }
      });
      return user;
    });
  }
}
module.exports = { AdminService };
