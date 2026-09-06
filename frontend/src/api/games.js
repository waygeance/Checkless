import { apiFetch } from "./client";

/** GET /api/games — paginated completed game list */
export function listGames({ limit = 20, cursor } = {}, token, signal) {
  return apiFetch("/api/games", { params: { limit, cursor }, token, signal });
}

/** GET /api/games/:gameId — single game record + participants */
export function getGame(gameId, token, signal) {
  return apiFetch(`/api/games/${gameId}`, { token, signal });
}

/** GET /api/games/:gameId/moves — cursor-paginated move list */
export function getGameMoves(gameId, { limit = 50, cursor } = {}, token, signal) {
  return apiFetch(`/api/games/${gameId}/moves`, { params: { limit, cursor }, token, signal });
}

/** GET /api/games/:gameId/replay — replay frames (all moves + FEN snapshots) */
export function getGameReplay(gameId, token, signal) {
  return apiFetch(`/api/games/${gameId}/replay`, { token, signal });
}
