/**
 * CORS origin helpers.
 *
 * Normalises and validates request origins against a configurable
 * allowlist. Localhost origins are always permitted in development.
 */

function normalizeOrigin(origin) {
  if (!origin || typeof origin !== "string") return "";

  const trimmed = origin.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    return `${url.protocol}//${url.host}`;
  } catch {
    return trimmed.replace(/\/+$/, "");
  }
}

function buildAllowedOrigins(envValue) {
  return (envValue || "")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);
}

function isAllowedOrigin(origin, allowedOrigins) {
  if (!origin) return true;

  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;
  if (allowedOrigins.includes(normalized)) return true;

  // Allow any *.vercel.app deploy when at least one vercel origin is configured
  const hasVercel = allowedOrigins.some((o) =>
    /\.vercel\.app$/i.test(o)
  );

  if (hasVercel && /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(normalized)) {
    return true;
  }

  // Always allow localhost in development
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalized)) {
    return true;
  }

  return false;
}

module.exports = {
  normalizeOrigin,
  buildAllowedOrigins,
  isAllowedOrigin
};
