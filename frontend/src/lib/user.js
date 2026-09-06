/**
 * Derives the database username for a Clerk user.
 *
 * In Clerk, users signing in with Google OAuth or email often don't have
 * an explicit `user.username`. The backend's `syncClerkUser` service creates
 * their username as `player-${clerkUser.id.slice(-8).toLowerCase()}`.
 */
export function getPlayerUsername(user) {
  if (!user) return null;
  if (user.username?.trim()) return user.username.trim();
  if (user.id) return `player-${user.id.slice(-8).toLowerCase()}`;
  return null;
}

export function getPlayerDisplayName(user) {
  if (!user) return "Player";
  if (user.fullName?.trim()) return user.fullName.trim();
  if (user.firstName?.trim()) return user.firstName.trim();
  if (user.username?.trim()) return user.username.trim();
  return "Player";
}
