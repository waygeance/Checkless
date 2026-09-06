const assert = require("node:assert/strict");
const test = require("node:test");

const {
  assertCmnMatchesMove,
  formatCmnMove,
  parseCmnMove
} = require("../src/utils/cmn");

test("formats and parses canonical CMN", () => {
  const notation = formatCmnMove({
    sequence: 17,
    color: "BLACK",
    fromSquare: "f6",
    toSquare: "g4",
    capturedPiece: "K"
  });

  assert.equal(notation, "(17)B:f6xg4#");
  assert.deepEqual(parseCmnMove(notation), {
    sequence: 17,
    color: "BLACK",
    fromSquare: "f6",
    toSquare: "g4",
    isCapture: true,
    promotionPiece: null,
    isKingCapture: true
  });
});

test("supports consecutive colors, captures, and every promotion", () => {
  assert.equal(
    formatCmnMove({
      sequence: 2,
      color: "WHITE",
      fromSquare: "e4",
      toSquare: "e5"
    }),
    "(2)W:e4_e5"
  );
  assert.equal(
    formatCmnMove({
      sequence: 3,
      color: "BLACK",
      fromSquare: "f6",
      toSquare: "g4",
      capturedPiece: "P"
    }),
    "(3)B:f6xg4"
  );

  for (const promotionPiece of ["Q", "R", "B", "N"]) {
    assert.equal(
      formatCmnMove({
        sequence: 4,
        color: "W",
        fromSquare: "f7",
        toSquare: "f8",
        promotionPiece
      }),
      `(4)W:f7_f8_${promotionPiece}`
    );
  }
});

test("rejects malformed notation and structured-data disagreement", () => {
  for (const token of [
    "(0)W:e2_e4",
    "(1)w:e2_e4",
    "(1)W:e9_e4",
    "(1)W:e2-e4",
    "(1)W:e2_e4#"
  ]) {
    assert.throws(() => parseCmnMove(token));
  }

  assert.throws(() =>
    assertCmnMatchesMove("(3)B:f6_g4", {
      sequence: 3,
      color: "BLACK",
      fromSquare: "f6",
      toSquare: "g4",
      capturedPiece: "P"
    })
  );
});
