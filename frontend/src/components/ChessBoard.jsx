import { useEffect, useRef, useState, useCallback } from "react";
import { Crown } from "lucide-react";



// ── Helpers ─────────────────────────────────────────

const algebraicToIndices = (sq) => {
  if (!sq || sq.length !== 2) return null;
  const col = sq.charCodeAt(0) - 97;
  const row = 8 - parseInt(sq[1]);
  if (col < 0 || col > 7 || row < 0 || row > 7) return null;
  return { row, col };
};

const indicesToAlgebraic = (row, col) => {
  return String.fromCharCode(97 + col) + (8 - row).toString();
};

const isOwnPiece = (piece, color) => {
  if (!piece) return false;
  return color === "w"
    ? piece === piece.toUpperCase()
    : piece === piece.toLowerCase();
};

const isEnemyPiece = (piece, color) => {
  if (!piece) return false;
  return color === "w"
    ? piece === piece.toLowerCase()
    : piece === piece.toUpperCase();
};

const isPathClear = (board, fr, fc, tr, tc) => {
  const dr = Math.sign(tr - fr);
  const dc = Math.sign(tc - fc);
  let r = fr + dr;
  let c = fc + dc;
  while (r !== tr || c !== tc) {
    if (r < 0 || r > 7 || c < 0 || c > 7) return false;
    if (board[r][c]) return false;
    r += dr;
    c += dc;
  }
  return true;
};

const isLegalMove = (board, from, to, color) => {
  const fi = algebraicToIndices(from);
  const ti = algebraicToIndices(to);
  if (!fi || !ti) return false;

  const piece = board[fi.row][fi.col];
  if (!piece || !isOwnPiece(piece, color)) return false;
  if (isOwnPiece(board[ti.row][ti.col], color)) return false;

  const type = piece.toUpperCase();
  const rd = ti.row - fi.row;
  const cd = ti.col - fi.col;
  const ard = Math.abs(rd);
  const acd = Math.abs(cd);

  switch (type) {
    case "P": {
      const dir = color === "w" ? -1 : 1;
      const startRow = color === "w" ? 6 : 1;
      if (rd === dir && cd === 0 && !board[ti.row][ti.col]) return true;
      if (rd === dir * 2 && cd === 0 && fi.row === startRow) {
        const midSq = indicesToAlgebraic(fi.row + dir, fi.col);
        const mi = algebraicToIndices(midSq);
        return mi && !board[mi.row][mi.col] && !board[ti.row][ti.col];
      }
      if (rd === dir && acd === 1 && isEnemyPiece(board[ti.row][ti.col], color))
        return true;
      return false;
    }
    case "N":
      return (ard === 2 && acd === 1) || (ard === 1 && acd === 2);
    case "B":
      return (
        ard === acd &&
        ard > 0 &&
        isPathClear(board, fi.row, fi.col, ti.row, ti.col)
      );
    case "R":
      return (
        (rd === 0 || cd === 0) &&
        (rd !== 0 || cd !== 0) &&
        isPathClear(board, fi.row, fi.col, ti.row, ti.col)
      );
    case "Q":
      return (
        (rd === 0 || cd === 0 || (ard === acd && ard > 0)) &&
        (rd !== 0 || cd !== 0) &&
        isPathClear(board, fi.row, fi.col, ti.row, ti.col)
      );
    case "K":
      if (ard <= 1 && acd <= 1 && ard + acd > 0) return true;

      if (ard === 0 && acd === 2) {
        const kingside = ti.col > fi.col;
        const backRank = color === "w" ? 7 : 0;
        if (fi.row !== backRank || ti.row !== backRank) return false;

        if (kingside) {
          if (board[backRank][5] || board[backRank][6]) return false;
        } else {
          if (board[backRank][1] || board[backRank][2] || board[backRank][3])
            return false;
        }

        return true;
      }
      return false;
    default:
      return false;
  }
};

const parseFen = (fen) => {
  const board = Array(8)
    .fill(null)
    .map(() => Array(8).fill(""));
  const parts = fen.split(" ");
  const rows = parts[0].split("/");
  for (let row = 0; row < 8 && row < rows.length; row++) {
    let col = 0;
    for (let i = 0; i < rows[row].length; i++) {
      const ch = rows[row][i];
      if (ch >= "1" && ch <= "8") {
        const skip = parseInt(ch);
        for (let s = 0; s < skip; s++) {
          board[row][col++] = "";
        }
      } else {
        board[row][col++] = ch;
      }
    }
  }
  return board;
};

const getLegalMoves = (fen, color) => {
  const board = parseFen(fen);
  const moves = new Map();
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const from = indicesToAlgebraic(row, col);
      const piece = board[row][col];
      if (piece && isOwnPiece(piece, color)) {
        const pieceMoves = [];
        for (let tr = 0; tr < 8; tr++) {
          for (let tc = 0; tc < 8; tc++) {
            const to = indicesToAlgebraic(tr, tc);
            if (isLegalMove(board, from, to, color)) {
              pieceMoves.push(to);
            }
          }
        }
        if (pieceMoves.length > 0) {
          moves.set(from, pieceMoves);
        }
      }
    }
  }
  return moves;
};

const getBoardTurnColor = (orientation, canMove) => {
  if (canMove) return orientation;
  return orientation === "white" ? "black" : "white";
};

const getSquarePosition = (square, orientation) => {
  if (!square || square.length !== 2) return null;

  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]);

  if (file < 0 || file > 7 || Number.isNaN(rank) || rank < 1 || rank > 8) {
    return null;
  }

  const leftIndex = orientation === "white" ? file : 7 - file;
  const topIndex = orientation === "white" ? 8 - rank : rank - 1;

  return {
    left: `${leftIndex * 12.5}%`,
    top: `${topIndex * 12.5}%`
  };
};

const playSound = (sound) => {
  const audio = new Audio(`/sounds/${sound}.mp3`);
  audio.volume = 0.5;
  audio.play().catch(() => {});
};

// ── Component ───────────────────────────────────────

export function ChessBoard({
  fen,
  orientation,
  onMove,
  onPremoveChange,
  canMove,
  lastMove,
  syncToken,
  capturedPiece,
  premove,
  victorySquare,
  victoryActive = false
}) {
  const boardRef = useRef(null);
  const cgRef = useRef(null);
  const fenRef = useRef(fen);
  const orientationRef = useRef(orientation);
  const canMoveRef = useRef(canMove);
  const premoveRef = useRef(premove);
  const victoryActiveRef = useRef(victoryActive);
  const lastPlayedMoveRef = useRef(null);
  const [dests, setDests] = useState(new Map());

  // Stable callbacks using ref pattern
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const handleMove = useCallback((orig, dest) => {
    onMoveRef.current?.(orig, dest);
  }, []);

  const onPremoveChangeRef = useRef(onPremoveChange);
  onPremoveChangeRef.current = onPremoveChange;
  const handlePremoveSet = useCallback((orig, dest) => {
    onPremoveChangeRef.current?.({ from: orig, to: dest });
  }, []);
  const handlePremoveUnset = useCallback(() => {
    onPremoveChangeRef.current?.(null);
  }, []);

  const syncPremoveHighlight = useCallback((nextPremove) => {
    const boardElement = boardRef.current;
    const api = cgRef.current;

    if (!boardElement || !api) return;

    api.state.premovable.current = nextPremove
      ? [nextPremove.from, nextPremove.to]
      : undefined;
    api.state.dom.redraw();

    const pieces = boardElement.querySelectorAll("cg-board piece");

    pieces.forEach((piece) => {
      piece.classList.remove("premove-piece");
    });

    if (!nextPremove) return;

    pieces.forEach((piece) => {
      if (piece.cgKey === nextPremove.from) {
        piece.classList.add("premove-piece");
      }
    });
  }, []);

  useEffect(() => {
    fenRef.current = fen;
    orientationRef.current = orientation;
    canMoveRef.current = canMove;
    premoveRef.current = premove;
    victoryActiveRef.current = victoryActive;

    const engineColor = orientation === "white" ? "w" : "b";
    setDests(getLegalMoves(fen, engineColor));
  }, [fen, orientation, canMove, premove, victoryActive]);

  useEffect(() => {
    const boardElement = boardRef.current;

    if (!boardElement) return;

    let disposed = false;

    import("chessground").then(({ Chessground }) => {
      if (disposed) return;

      const currentOrientation = orientationRef.current;
      const turnColor = getBoardTurnColor(
        currentOrientation,
        canMoveRef.current
      );
      const locked = victoryActiveRef.current;

      cgRef.current = Chessground(boardElement, {
        fen: fenRef.current,
        orientation: currentOrientation,
        turnColor,
        coordinates: true,
        movable: locked
          ? {
              free: false,
              color: undefined,
              showDests: false,
              dests: new Map()
            }
          : {
              free: false,
              color: currentOrientation,
              showDests: true,
              dests: getLegalMoves(
                fenRef.current,
                currentOrientation === "white" ? "w" : "b"
              ),
              events: {
                after: (orig, dest) => {
                  handleMove(orig, dest);
                }
              }
            },
        premovable: locked
          ? {
              enabled: false,
              showDests: false,
              castle: false
            }
          : {
              enabled: true,
              showDests: true,
              castle: true,
              events: {
                set: (orig, dest) => {
                  handlePremoveSet(orig, dest);
                },
                unset: () => {
                  handlePremoveUnset();
                }
              }
            },
        highlight: {
          lastMove: true,
          check: false
        },
        animation: {
          enabled: !locked,
          duration: locked ? 0 : 200
        },
        draggable: {
          enabled: !locked,
          showGhost: !locked
        }
      });

      syncPremoveHighlight(locked ? null : premoveRef.current);
    });

    return () => {
      disposed = true;

      if (cgRef.current) {
        cgRef.current.destroy();
        cgRef.current = null;
      }
    };
  }, [handleMove, handlePremoveSet, handlePremoveUnset, syncPremoveHighlight]);

  useEffect(() => {
    if (!cgRef.current) return;

    const turnColor = getBoardTurnColor(orientation, canMove);

    cgRef.current.set({
      fen,
      orientation,
      turnColor,
      lastMove: lastMove || undefined,
      movable: victoryActive
        ? {
            free: false,
            color: undefined,
            showDests: false,
            dests: new Map()
          }
        : {
            free: false,
            color: orientation,
            showDests: true,
            dests
          },
      premovable: victoryActive
        ? {
            enabled: false,
            showDests: false,
            castle: false
          }
        : {
            enabled: true,
            showDests: true,
            castle: true
          },
      highlight: {
        lastMove: true,
        check: false
      },
      animation: {
        enabled: !victoryActive,
        duration: victoryActive ? 0 : 200
      },
      draggable: {
        enabled: !victoryActive,
        showGhost: !victoryActive
      }
    });

    syncPremoveHighlight(victoryActive ? null : premove);
  }, [
    fen,
    canMove,
    lastMove,
    orientation,
    syncToken,
    dests,
    premove,
    victoryActive,
    syncPremoveHighlight
  ]);

  useEffect(() => {
    if (!lastMove) return;

    const moveKey = `${lastMove[0]}-${lastMove[1]}-${capturedPiece ?? ""}-${fen}`;

    if (lastPlayedMoveRef.current === moveKey) return;

    lastPlayedMoveRef.current = moveKey;
    playSound(capturedPiece ? "capture" : "move");
  }, [capturedPiece, fen, lastMove]);

  const victorySquarePosition = victorySquare
    ? getSquarePosition(victorySquare, orientation)
    : null;

  const burstParticles = Array.from({ length: 12 }, (_, index) => {
    const angle = (index / 12) * Math.PI * 2;

    return {
      id: index,
      x: Math.cos(angle) * 54,
      y: Math.sin(angle) * 54,
      delay: `${index * 0.045}s`
    };
  });

  return (
    <div className="relative w-full max-w-[720px]">
      <div
        ref={boardRef}
        className={`cg-wrap aspect-square w-full border border-white/10 bg-[#241b19] transition-all duration-300 ${
          !canMove ? "grayscale-[0.12] brightness-95" : ""
        }`}
        style={{
          boxShadow:
            "0 18px 45px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)"
        }}
      />

      {victorySquarePosition && (
        <div className="pointer-events-none absolute inset-0 z-20">
          <div
            className="absolute"
            style={{
              left: victorySquarePosition.left,
              top: victorySquarePosition.top,
              width: "12.5%",
              height: "12.5%"
            }}
          >
            <div
              className="absolute inset-[6%] rounded-[22%] bg-[rgba(230,56,70,0.5)]"
              style={{
                animation:
                  "victory-capture-flash 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards"
              }}
            />
            <div
              className="absolute inset-[8%] rounded-[24%] border border-[rgba(200,255,0,0.55)] bg-[rgba(200,255,0,0.16)]"
              style={{
                animation:
                  "victory-square-glow 2.2s cubic-bezier(0.16, 1, 0.3, 1) forwards"
              }}
            />
          </div>

          <div
            className="absolute flex items-center justify-center"
            style={{
              left: `calc(${victorySquarePosition.left} + 6.25%)`,
              top: `calc(${victorySquarePosition.top} + 6.25%)`,
              transform: "translate(-50%, -50%)"
            }}
          >
            <div className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center sm:h-24 sm:w-24">
              <div
                className="absolute inset-0 rounded-full bg-[rgba(200,255,0,0.24)] blur-md"
                style={{
                  animation:
                    "victory-square-glow 2.2s cubic-bezier(0.16, 1, 0.3, 1) forwards"
                }}
              />
              <div
                className="absolute h-[4.2rem] w-[4.2rem] rounded-full border-2 border-white/70 sm:h-20 sm:w-20"
                style={{
                  animation:
                    "victory-ring-burst 2.1s cubic-bezier(0.16, 1, 0.3, 1) forwards"
                }}
              />

              {burstParticles.map((particle) => (
                <span
                  key={particle.id}
                  className="absolute block rounded-full bg-white"
                  style={{
                    width: particle.id % 3 === 0 ? "10px" : "8px",
                    height: particle.id % 3 === 0 ? "10px" : "8px",
                    animation:
                      "victory-burst-particle 2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                    animationDelay: particle.delay,
                    "--particle-x": `${particle.x}px`,
                    "--particle-y": `${particle.y}px`
                  }}
                />
              ))}

              <span
                className="absolute h-14 w-14 rounded-full border-l-4 border-t-4 border-white/80"
                style={{
                  animation:
                    "victory-arc-sweep 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                  "--arc-rotation": "18deg",
                  transform: "rotate(18deg)"
                }}
              />
              <span
                className="absolute h-16 w-16 rounded-full border-r-4 border-t-4 border-white/80"
                style={{
                  animation:
                    "victory-arc-sweep 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                  animationDelay: "0.12s",
                  "--arc-rotation": "140deg",
                  transform: "rotate(140deg)"
                }}
              />
              <span
                className="absolute h-12 w-12 rounded-full border-b-4 border-r-4 border-white/80"
                style={{
                  animation:
                    "victory-arc-sweep 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                  animationDelay: "0.2s",
                  "--arc-rotation": "250deg",
                  transform: "rotate(250deg)"
                }}
              />

              <div className="absolute inset-3 rounded-full border border-[rgba(200,255,0,0.42)] bg-[rgba(200,255,0,0.12)]" />
              <Crown
                className="relative h-9 w-9 text-lime drop-shadow-[0_0_16px_rgba(200,255,0,0.75)] sm:h-11 sm:w-11"
                style={{
                  animation:
                    "victory-crown-pop 2s cubic-bezier(0.16, 1, 0.3, 1) forwards"
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
