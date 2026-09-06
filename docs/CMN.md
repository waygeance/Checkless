# Checkless Move Notation (CMN) v1

## Purpose

Checkless Move Notation is a compact, color-aware representation of the exact
order in which the server accepted moves. Unlike standard chess notation, CMN
does not assume that White and Black alternate.

Structured `GameMove` columns remain the replay authority. The backend
generates and stores CMN alongside those columns for readable logs and exports.
Clients must not submit authoritative CMN.

## Canonical examples

```text
(1)W:e2_e4
(2)W:e4_e5
(3)B:g8_f6
(4)B:f6xg4
(5)W:g1_f3
(17)B:f6xg4#
```

## Grammar

```regex
^\(([1-9][0-9]*)\)(W|B):([a-h][1-8])([_x])([a-h][1-8])(?:_([QRBN]))?(#)?$
```

The canonical shape is:

```text
(sequence)color:from action to promotion? terminal?
```

| Part                   | Meaning                                                 |
| ---------------------- | ------------------------------------------------------- |
| `(sequence)`           | Global accepted-move sequence, beginning at 1           |
| `W` / `B`              | Moving color; consecutive moves by one color are valid  |
| `from` / `to`          | Lowercase coordinate squares                            |
| `_`                    | Non-capturing move                                      |
| `x`                    | Capture, including en passant                           |
| `_Q`, `_R`, `_B`, `_N` | Optional promotion                                      |
| `#`                    | This move captured the opposing king and ended the game |

CMN is ASCII and case-sensitive. Whitespace may separate tokens in an export,
but it is never part of a token.

## Move forms

```text
(3)B:f6_g4       normal move
(3)B:f6xg4       capture
(3)W:f7_f8_Q     promotion
(3)W:e7xf8_N     capture with promotion
(17)B:f6xg4#     king capture and game end
(17)W:e7xf8_Q#   king capture with promotion
```

Castling is represented by the king's coordinates:

```text
(8)W:e1_g1
(8)B:e8_c8
```

The piece is intentionally omitted because `initialFen` and the preceding
accepted moves identify it without ambiguity.

## Terminal results

The `#` symbol means only king capture. Check and checkmate do not exist in
Checkless. A resignation, disconnect forfeit, abort, server interruption, or
administrative termination does not add `#` to the last move; those outcomes
remain in `Game.endReason`.

## Persistence rules

- Generate CMN only after the authoritative engine accepts the move.
- Never trust notation, sequence, color, or capture facts supplied by a client.
- Store CMN in `GameMove.notation` with the structured move fields.
- Preserve `GameMove.sequence` as the ordering authority.
- Validate that persisted notation is the canonical rendering of its
  structured fields.
- Keep timing and cooldown values in their existing columns; CMN deliberately
  contains no timestamps.

## Current engine compatibility

CMN v1 reserves all standard promotion pieces (`Q`, `R`, `B`, and `N`). The
current engine automatically promotes to a queen; underpromotion support can be
added without changing the notation format.
