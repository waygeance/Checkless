import { apiFetch } from "./client";

/** GET /api/admin/users?q= — search users by username or ID */
export function searchAdminUsers(q, token, signal) {
  return apiFetch("/api/admin/users", { params: { q }, token, signal });
}

/** GET /api/admin/games?q= — search games by ID */
export function searchAdminGames(q, token, signal) {
  return apiFetch("/api/admin/games", { params: { q }, token, signal });
}

/** POST /api/admin/users/:userId/suspend — suspend a user (reason required) */
export function suspendUser(userId, reason, token) {
  return apiFetch(`/api/admin/users/${userId}/suspend`, {
    method: "POST",
    body: { reason },
    token
  });
}

/** POST /api/admin/users/:userId/restore — restore a suspended user (reason required) */
export function restoreUser(userId, reason, token) {
  return apiFetch(`/api/admin/users/${userId}/restore`, {
    method: "POST",
    body: { reason },
    token
  });
}
