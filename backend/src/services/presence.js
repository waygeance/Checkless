class PresenceService {
  constructor(prisma) {
    this.prisma = prisma;
    this.sockets = new Map();
  }
  async online(userId, socketId) {
    if (!userId) return [];
    const set = this.sockets.get(userId) || new Set();
    set.add(socketId);
    this.sockets.set(userId, set);
    return this.friends(userId);
  }
  async offline(userId, socketId) {
    const set = this.sockets.get(userId);
    if (!set) return [];
    set.delete(socketId);
    if (set.size === 0) this.sockets.delete(userId);
    return this.friends(userId);
  }
  isOnline(userId) {
    return this.sockets.has(userId);
  }
  async friends(userId) {
    const rows = await this.prisma.friendship.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] }
    });
    return rows.map((row) =>
      row.userAId === userId ? row.userBId : row.userAId
    );
  }
  socketsFor(userId) {
    return [...(this.sockets.get(userId) || [])];
  }
}
module.exports = { PresenceService };
