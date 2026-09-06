import { apiFetch } from "./client";

/** GET /api/users/:username — public profile + variant stats */
export function getProfile(username, token, signal) {
  return apiFetch(`/api/users/${encodeURIComponent(username)}`, { token, signal });
}

/** GET /api/users/:username/games — player's completed game history (cursor-paged) */
export function listPlayerGames(username, { limit = 20, cursor } = {}, token, signal) {
  return apiFetch(`/api/users/${encodeURIComponent(username)}/games`, {
    params: { limit, cursor },
    token,
    signal
  });
}
