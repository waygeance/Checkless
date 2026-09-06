class SocialService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async searchUsers(query, viewerId) {
    const q = String(query || "")
      .trim()
      .toLowerCase();
    if (!q) return [];
    const users = await this.prisma.user.findMany({
      where: {
        normalizedUsername: { contains: q },
        ...(viewerId ? { id: { not: viewerId } } : {})
      },
      select: { username: true, displayName: true, avatarUrl: true },
      take: 20,
      orderBy: { normalizedUsername: "asc" }
    });
    return users;
  }

  async listFriends(userId) {
    const rows = await this.prisma.friendship.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      include: {
        userA: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        },
        userB: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      }
    });
    return rows.map((row) => (row.userA.id === userId ? row.userB : row.userA));
  }

  async listRequests(userId) {
    return this.prisma.friendRequest.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: { username: true, displayName: true, avatarUrl: true }
        },
        receiver: {
          select: { username: true, displayName: true, avatarUrl: true }
        }
      }
    });
  }

  async sendRequest(senderId, username) {
    const receiver = await this.prisma.user.findUnique({
      where: { normalizedUsername: String(username).toLowerCase() }
    });
    if (!receiver || receiver.id === senderId)
      throw this.error("INVALID_TARGET");
    return this.prisma.$transaction(async (tx) => {
      const blocked = await tx.userBlock.findFirst({
        where: {
          OR: [
            { blockerId: senderId, blockedId: receiver.id },
            { blockerId: receiver.id, blockedId: senderId }
          ]
        }
      });
      if (blocked) throw this.error("BLOCKED");
      const a = senderId < receiver.id ? senderId : receiver.id;
      const b = senderId < receiver.id ? receiver.id : senderId;
      if (
        await tx.friendship.findUnique({
          where: { userAId_userBId: { userAId: a, userBId: b } }
        })
      )
        throw this.error("ALREADY_FRIENDS");
      const existing = await tx.friendRequest.findUnique({
        where: { senderId_receiverId: { senderId, receiverId: receiver.id } }
      });
      if (existing?.status === "PENDING") throw this.error("ALREADY_PENDING");
      return tx.friendRequest.upsert({
        where: { senderId_receiverId: { senderId, receiverId: receiver.id } },
        create: { senderId, receiverId: receiver.id },
        update: { status: "PENDING", respondedAt: null }
      });
    });
  }

  async respond(userId, requestId, action) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.friendRequest.findUnique({
        where: { id: requestId }
      });
      if (
        !request ||
        request.receiverId !== userId ||
        request.status !== "PENDING"
      )
        throw this.error("REQUEST_NOT_PENDING");
      if (action !== "accept")
        return tx.friendRequest.update({
          where: { id: requestId },
          data: {
            status: action === "decline" ? "DECLINED" : "CANCELED",
            respondedAt: new Date()
          }
        });
      const blocked = await tx.userBlock.findFirst({
        where: {
          OR: [
            { blockerId: request.senderId, blockedId: userId },
            { blockerId: userId, blockedId: request.senderId }
          ]
        }
      });
      if (blocked) throw this.error("BLOCKED");
      const userAId = request.senderId < userId ? request.senderId : userId;
      const userBId = request.senderId < userId ? userId : request.senderId;
      await tx.friendship.create({ data: { userAId, userBId } });
      return tx.friendRequest.update({
        where: { id: requestId },
        data: { status: "ACCEPTED", respondedAt: new Date() }
      });
    });
  }

  async cancel(userId, requestId) {
    return this.prisma.friendRequest.updateMany({
      where: { id: requestId, senderId: userId, status: "PENDING" },
      data: { status: "CANCELED", respondedAt: new Date() }
    });
  }

  async removeFriend(userId, otherId) {
    const userAId = userId < otherId ? userId : otherId;
    const userBId = userId < otherId ? otherId : userId;
    return this.prisma.friendship.deleteMany({ where: { userAId, userBId } });
  }

  async listBlocks(userId) {
    return this.prisma.userBlock.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: { username: true, displayName: true, avatarUrl: true }
        }
      }
    });
  }

  async block(userId, username) {
    const blocked = await this.prisma.user.findUnique({
      where: { normalizedUsername: String(username).toLowerCase() }
    });
    if (!blocked || blocked.id === userId) throw this.error("INVALID_TARGET");
    const [blockerId, blockedId] = [userId, blocked.id];
    return this.prisma.$transaction(async (tx) => {
      const a = blockerId < blockedId ? blockerId : blockedId;
      const b = blockerId < blockedId ? blockedId : blockerId;
      await tx.friendship.deleteMany({ where: { userAId: a, userBId: b } });
      await tx.friendRequest.updateMany({
        where: {
          OR: [
            { senderId: blockerId, receiverId: blockedId },
            { senderId: blockedId, receiverId: blockerId }
          ],
          status: "PENDING"
        },
        data: { status: "CANCELED", respondedAt: new Date() }
      });
      return tx.userBlock.upsert({
        where: { blockerId_blockedId: { blockerId, blockedId } },
        create: { blockerId, blockedId },
        update: {}
      });
    });
  }

  async unblock(userId, otherId) {
    return this.prisma.userBlock.deleteMany({
      where: { blockerId: userId, blockedId: otherId }
    });
  }
  error(code) {
    const error = new Error(code);
    error.code = code;
    return error;
  }
}

module.exports = { SocialService };
