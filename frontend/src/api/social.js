import { apiFetch } from "./client";

/** GET /api/social/friends — list of friendship records */
export function listFriends(token, signal) {
  return apiFetch("/api/social/friends", { token, signal });
}

/** GET /api/social/requests — incoming + outgoing friend requests */
export function listRequests(token, signal) {
  return apiFetch("/api/social/requests", { token, signal });
}

/** GET /api/social/search?q= — search users by username */
export function searchUsers(q, token, signal) {
  return apiFetch("/api/social/search", { params: { q }, token, signal });
}

/** POST /api/social/requests — send a friend request */
export function sendRequest(username, token) {
  return apiFetch("/api/social/requests", { method: "POST", body: { username }, token });
}

/**
 * POST /api/social/requests/:id/:action
 * action: "accept" | "decline"
 */
export function respondRequest(id, action, token) {
  return apiFetch(`/api/social/requests/${id}/${action}`, { method: "POST", token });
}

/** DELETE /api/social/requests/:id — cancel an outgoing request */
export function cancelRequest(id, token) {
  return apiFetch(`/api/social/requests/${id}`, { method: "DELETE", token });
}

/** DELETE /api/social/friends/:userId — remove a friend */
export function removeFriend(userId, token) {
  return apiFetch(`/api/social/friends/${userId}`, { method: "DELETE", token });
}

/** GET /api/social/blocks — list blocks made by current user */
export function listBlocks(token, signal) {
  return apiFetch("/api/social/blocks", { token, signal });
}

/** POST /api/social/blocks — block a user by username */
export function blockUser(username, token) {
  return apiFetch("/api/social/blocks", { method: "POST", body: { username }, token });
}

/** DELETE /api/social/blocks/:userId — unblock a user */
export function unblockUser(userId, token) {
  return apiFetch(`/api/social/blocks/${userId}`, { method: "DELETE", token });
}
