import { apiFetch } from "./client";

/**
 * POST /api/challenges — create a new open challenge
 * variant: "1s" | "3s" | "5s"
 */
export function createChallenge(variant, token) {
  return apiFetch("/api/challenges", { method: "POST", body: { variant }, token });
}

/** GET /api/challenges/:code — look up a challenge by short code */
export function lookupChallenge(code, token, signal) {
  return apiFetch(`/api/challenges/${code.toUpperCase()}`, { token, signal });
}

/** POST /api/challenges/:code/accept — accept a challenge */
export function acceptChallenge(code, token) {
  return apiFetch(`/api/challenges/${code.toUpperCase()}/accept`, { method: "POST", token });
}

/** DELETE /api/challenges/:id — cancel (only works for host, OPEN status) */
export function cancelChallenge(id, token) {
  return apiFetch(`/api/challenges/${id}`, { method: "DELETE", token });
}
