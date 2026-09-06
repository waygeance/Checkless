/**
 * Checkless — API client helper
 *
 * Wraps fetch with:
 *   - Base URL from VITE_API_URL (falls back to same-origin via Vite proxy)
 *   - Optional Clerk Bearer token injection
 *   - JSON parsing + structured error throwing
 */

export const API_BASE = import.meta.env.VITE_API_URL || "";

/**
 * Core fetch helper.
 *
 * @param {string} path — e.g. "/api/games"
 * @param {object} options
 * @param {string} [options.token] — Clerk JWT token (for protected routes)
 * @param {string} [options.method]
 * @param {object} [options.body]
 * @param {Record<string,string>} [options.params] — query string params
 */
export async function apiFetch(path, { token, method = "GET", body, params, signal } = {}) {
  let url = `${API_BASE}${path}`;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
    ).toString();
    if (qs) url += `?${qs}`;
  }

  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal
  });

  if (!res.ok) {
    let errorCode = `HTTP_${res.status}`;
    try {
      const json = await res.json();
      errorCode = json.error || errorCode;
    } catch {
      // ignore parse failure
    }
    const err = new Error(errorCode);
    err.status = res.status;
    err.code = errorCode;
    throw err;
  }

  return res.json();
}
