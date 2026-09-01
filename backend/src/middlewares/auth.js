/**
 * middlewares/auth.js
 *
 * Clerk client factory and config loader.
 * Used by both the socket auth middleware and future REST auth middleware.
 */

const { createClerkClient } = require("@clerk/express");

function getClerkConfig() {
  const publishableKey =
    process.env.CLERK_PUBLISHABLE_KEY ||
    process.env.VITE_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (!publishableKey || !secretKey) {
    throw new Error(
      "Clerk is not configured. Set CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY."
    );
  }

  return { publishableKey, secretKey };
}

function createAppClerkClient() {
  return createClerkClient(getClerkConfig());
}

module.exports = { createAppClerkClient, getClerkConfig };
