/**
 * Checkless Move Notation (CMN) v1.
 *
 * CMN is a readable, deterministic rendering of an accepted move. Structured
 * move fields remain authoritative; clients must never supply CMN as an
 * authorization or game-state fact.
 */

const CMN_PATTERN =
  /^\(([1-9][0-9]*)\)(W|B):([a-h][1-8])([_x])([a-h][1-8])(?:_([QRBN]))?(#)?$/;
const SQUARE_PATTERN = /^[a-h][1-8]$/;
const PIECE_PATTERN = /^[PNBRQK]$/i;
const PROMOTION_PATTERN = /^[QRBN]$/;

function normalizeColor(color) {
  const normalized = String(color).toUpperCase();

  if (normalized === "W" || normalized === "WHITE") return "W";
  if (normalized === "B" || normalized === "BLACK") return "B";

  throw new TypeError("CMN color must be W, B, WHITE, or BLACK");
}

function validateSquare(square, fieldName) {
  if (typeof square !== "string" || !SQUARE_PATTERN.test(square)) {
    throw new TypeError(`${fieldName} must be a lowercase chess square`);
  }
}

function normalizePromotion(promotionPiece) {
  if (promotionPiece == null || promotionPiece === "") return null;

  const normalized = String(promotionPiece).toUpperCase();
  if (!PROMOTION_PATTERN.test(normalized)) {
    throw new TypeError("CMN promotion piece must be Q, R, B, or N");
  }

  return normalized;
}

/**
 * Formats trusted, structured move facts as a canonical CMN token.
 */
function formatCmnMove({
  sequence,
  color,
  fromSquare,
  toSquare,
  capturedPiece = null,
  promotionPiece = null
}) {
  if (!Number.isSafeInteger(sequence) || sequence < 1) {
    throw new TypeError("CMN sequence must be a positive safe integer");
  }

  const colorCode = normalizeColor(color);
  validateSquare(fromSquare, "fromSquare");
  validateSquare(toSquare, "toSquare");

  if (fromSquare === toSquare) {
    throw new TypeError("CMN origin and destination squares must differ");
  }

  if (
    capturedPiece != null &&
    capturedPiece !== "" &&
    (typeof capturedPiece !== "string" || !PIECE_PATTERN.test(capturedPiece))
  ) {
    throw new TypeError("capturedPiece must be a chess piece letter");
  }

  const isCapture = capturedPiece != null && capturedPiece !== "";
  const isKingCapture =
    isCapture && String(capturedPiece).toUpperCase() === "K";
  const promotion = normalizePromotion(promotionPiece);
  const action = isCapture ? "x" : "_";
  const promotionSuffix = promotion ? `_${promotion}` : "";
  const terminalSuffix = isKingCapture ? "#" : "";

  return `(${sequence})${colorCode}:${fromSquare}${action}${toSquare}${promotionSuffix}${terminalSuffix}`;
}

/**
 * Parses one CMN token. This validates syntax and token-local invariants only;
 * board semantics are validated by the chess engine during replay.
 */
function parseCmnMove(notation) {
  if (typeof notation !== "string") {
    throw new TypeError("CMN notation must be a string");
  }

  const match = CMN_PATTERN.exec(notation);
  if (!match) throw new SyntaxError("Invalid CMN v1 token");

  const [
    ,
    sequenceText,
    colorCode,
    fromSquare,
    action,
    toSquare,
    promotion,
    end
  ] = match;
  const sequence = Number(sequenceText);

  if (!Number.isSafeInteger(sequence)) {
    throw new SyntaxError("CMN sequence exceeds the safe integer range");
  }

  const isCapture = action === "x";
  const isKingCapture = end === "#";

  if (isKingCapture && !isCapture) {
    throw new SyntaxError("CMN king capture marker requires a capture");
  }

  return {
    sequence,
    color: colorCode === "W" ? "WHITE" : "BLACK",
    fromSquare,
    toSquare,
    isCapture,
    promotionPiece: promotion || null,
    isKingCapture
  };
}

/**
 * Ensures persisted CMN is the exact canonical rendering of structured data.
 */
function assertCmnMatchesMove(notation, move) {
  const expected = formatCmnMove(move);
  if (notation !== expected) {
    throw new Error(`CMN mismatch: expected ${expected}, received ${notation}`);
  }

  return parseCmnMove(notation);
}

module.exports = {
  CMN_PATTERN,
  assertCmnMatchesMove,
  formatCmnMove,
  parseCmnMove
};
