/**
 * services/user.js
 *
 * User sync and profile logic.
 * Responsible for mapping Clerk identity → Prisma User row.
 * Called by the socket auth middleware and any future REST auth guard.
 */

function getClerkUsername(clerkUser) {
  if (clerkUser.username?.trim()) return clerkUser.username.trim();
  return `player-${clerkUser.id.slice(-8).toLowerCase()}`;
}

function getDisplayName(clerkUser) {
  if (clerkUser.fullName?.trim()) return clerkUser.fullName.trim();
  if (clerkUser.firstName?.trim()) return clerkUser.firstName.trim();
  return null;
}

/**
 * Upserts the authenticated Clerk user into our Prisma User table.
 * Also disables self-deletion on Clerk so we don't lose game history.
 *
 * @param {import("@prisma/client").PrismaClient} prisma
 * @param {object} clerkClient
 * @param {string} clerkUserId
 * @returns {Promise<import("@prisma/client").User>}
 */
async function syncClerkUser(prisma, clerkClient, clerkUserId) {
  let clerkUser = await clerkClient.users.getUser(clerkUserId);

  if (clerkUser.deleteSelfEnabled) {
    clerkUser = await clerkClient.users.updateUser(clerkUserId, {
      deleteSelfEnabled: false
    });
  }

  const username = getClerkUsername(clerkUser);
  const normalizedUsername = username.toLowerCase();
  const profile = {
    username,
    normalizedUsername,
    displayName: getDisplayName(clerkUser),
    avatarUrl: clerkUser.imageUrl || null,
    clerkDeletedAt: null,
    lastSeenAt: new Date()
  };

  return prisma.user.upsert({
    where: { clerkUserId },
    create: { clerkUserId, ...profile },
    update: profile
  });
}

module.exports = { syncClerkUser };
