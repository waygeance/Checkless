/**
 * validators/move.js
 *
 * Zod schemas for socket payload validation.
 *
 * Two layers of validation are used throughout the backend:
 *
 *   1. Zod schemas (here)  — validates shape and types at the boundary.
 *   2. Chess engine          — validates legality after shape is confirmed.
 *
 * Keep these schemas focused on structure/types only.
 * Chess legality (e.g. "is this move legal for this piece?") belongs in
 * src/engine/chess.js, not here.
 */

const { z } = require("zod");

/** A valid chess square string like "e2", "h8" */
const squareSchema = z
  .string()
  .length(2)
  .regex(/^[a-h][1-8]$/, "Must be a valid chess square (e.g. 'e2')");

/** A valid promotion piece (only when a pawn reaches the back rank) */
const promotionSchema = z.enum(["q", "r", "b", "n"]).optional();

/**
 * Payload sent by the client when making a move.
 * socket.on("make_move", payload => ...)
 */
const makeMovePayloadSchema = z.object({
  gameId: z.string().min(1, "gameId is required"),
  // Optional during the V1 client rollout. New clients always send a UUID.
  clientMoveId: z.string().uuid("clientMoveId must be a UUID").optional(),
  move: z.object({
    from: squareSchema,
    to: squareSchema,
    promotion: promotionSchema
  })
});

/**
 * Payload sent when joining the matchmaking queue.
 * socket.on("find_game", payload => ...)
 */
const findGamePayloadSchema = z.object({
  mode: z.enum(["CASUAL", "RANKED"]).default("CASUAL"),
  variant: z.enum(["1s", "3s", "5s"], {
    errorMap: () => ({ message: "variant must be '1s', '3s', or '5s'" })
  })
});

/**
 * Payload for aborting an active match.
 * socket.on("abort_match", payload => ...)
 */
const abortMatchPayloadSchema = z
  .object({
    gameId: z.string().optional()
  })
  .optional()
  .default({});

const gameActionPayloadSchema = z.object({
  gameId: z.string().min(1, "gameId is required")
});

/**
 * Parses and validates a socket payload against a Zod schema.
 * Returns { data } on success or { error } on failure.
 * Never throws — safe to use directly in socket event handlers.
 *
 * @template T
 * @param {import("zod").ZodSchema<T>} schema
 * @param {unknown} payload
 * @returns {{ data: T } | { error: string }}
 */
function validateSocketPayload(schema, payload) {
  const result = schema.safeParse(payload);
  if (result.success) return { data: result.data };

  const message = result.error.issues
    .map((e) => `${e.path.join(".")}: ${e.message}`)
    .join("; ");

  return { error: message };
}

module.exports = {
  makeMovePayloadSchema,
  findGamePayloadSchema,
  abortMatchPayloadSchema,
  gameActionPayloadSchema,
  validateSocketPayload
};
