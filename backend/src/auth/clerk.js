const { createClerkClient } = require("@clerk/express");

function getClerkConfig() {
  const publishableKey =
    process.env.CLERK_PUBLISHABLE_KEY ||
    process.env.VITE_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (!publishableKey || !secretKey) {
    throw new Error(
      "Clerk is not configured. Set CLERK_PUBLISHABLE_KEY (or VITE_CLERK_PUBLISHABLE_KEY) and CLERK_SECRET_KEY."
    );
  }

  return { publishableKey, secretKey };
}

function createAppClerkClient() {
  return createClerkClient(getClerkConfig());
}

function getClerkUsername(clerkUser) {
  if (clerkUser.username?.trim()) return clerkUser.username.trim();

  return `player-${clerkUser.id.slice(-8).toLowerCase()}`;
}

function getDisplayName(clerkUser) {
  if (clerkUser.fullName?.trim()) return clerkUser.fullName.trim();
  if (clerkUser.firstName?.trim()) return clerkUser.firstName.trim();
  return null;
}

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
    create: {
      clerkUserId,
      ...profile
    },
    update: profile
  });
}

module.exports = {
  createAppClerkClient,
  getClerkConfig,
  syncClerkUser
};
