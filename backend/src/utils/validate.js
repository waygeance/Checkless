/**
 * Move input validation helpers.
 *
 * Sanitises and validates move payloads received from clients
 * before they reach the chess engine.
 */

function normalizeMoveInput(move) {
  if (!move || typeof move !== "object") return null;
  if (typeof move.from !== "string" || typeof move.to !== "string") return null;

  const from = move.from.toLowerCase();
  const to = move.to.toLowerCase();

  if (from.length !== 2 || to.length !== 2) return null;
  if (from[0] < "a" || from[0] > "h" || to[0] < "a" || to[0] > "h") {
    return null;
  }
  if (from[1] < "1" || from[1] > "8" || to[1] < "1" || to[1] > "8") {
    return null;
  }

  return { from, to };
}

module.exports = { normalizeMoveInput };
