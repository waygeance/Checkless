"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { Api } from "chessground/api";
import type { Color, Key } from "chessground/types";

// Import Chessground styles
import "chessground/assets/chessground.base.css";
import "chessground/assets/chessground.brown.css";
import "chessground/assets/chessground.cburnett.css";

// Simple chess engine for legal moves (client-side)
const algebraicToIndices = (sq: string) => {
  if (!sq || sq.length !== 2) return null;
  const col = sq.charCodeAt(0) - 97;
  const row = 8 - parseInt(sq[1]);
  if (col < 0 || col > 7 || row < 0 || row > 7) return null;
  return { row, col };
};

const indicesToAlgebraic = (row: number, col: number) => {
  return String.fromCharCode(97 + col) + (8 - row).toString();
};

const isOwnPiece = (piece: string, color: "w" | "b") => {
  if (!piece) return false;
  return color === "w"
    ? piece === piece.toUpperCase()
    : piece === piece.toLowerCase();
};

const isEnemyPiece = (piece: string, color: "w" | "b") => {
  if (!piece) return false;
  return color === "w"
    ? piece === piece.toLowerCase()
    : piece === piece.toUpperCase();
};

const isPathClear = (
  board: string[][],
  fr: number,
  fc: number,
  tr: number,
  tc: number,
) => {
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

const isLegalMove = (
  board: string[][],
  from: string,
  to: string,
  color: "w" | "b",
) => {
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
      // Regular king move
      if (ard <= 1 && acd <= 1 && ard + acd > 0) return true;

      // Castling (kingside and queenside)
      if (ard === 0 && acd === 2) {
        const kingside = ti.col > fi.col;
        const backRank = color === "w" ? 7 : 0;
        if (fi.row !== backRank || ti.row !== backRank) return false;

        // Check if path is clear
        if (kingside) {
          // Kingside: check f and g files (columns 5 and 6)
          if (board[backRank][5] || board[backRank][6]) return false;
        } else {
          // Queenside: check b, c, d files (columns 1, 2, 3)
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

const parseFen = (fen: string): string[][] => {
  const board: string[][] = Array(8)
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

const getLegalMoves = (
  fen: string,
  color: "w" | "b",
): Map<string, string[]> => {
  const board = parseFen(fen);
  const moves = new Map<string, string[]>();
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const from = indicesToAlgebraic(row, col);
      const piece = board[row][col];
      if (piece && isOwnPiece(piece, color)) {
        const pieceMoves: string[] = [];
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

const getBoardTurnColor = (
  orientation: "white" | "black",
  canMove: boolean,
): Color => {
  if (canMove) return orientation;
  return orientation === "white" ? "black" : "white";
};

type PremoveSelection = {
  from: string;
  to: string;
};

type ChessgroundSquareElement = HTMLElement & {
  cgKey?: Key;
};

const playSound = (sound: "move" | "capture") => {
  const audio = new Audio(`/sounds/${sound}.mp3`);
  audio.volume = 0.5;
  audio.play().catch(() => {});
};

interface ChessBoardProps {
  fen: string;
  orientation: "white" | "black";
  onMove: (from: string, to: string) => void;
  onPremoveChange?: (premove: PremoveSelection | null) => void;
  canMove: boolean;
  lastMove?: [string, string];
  syncToken: number;
  capturedPiece?: string;
  premove?: PremoveSelection | null;
}

export function ChessBoardPure({
  fen,
  orientation,
  onMove,
  onPremoveChange,
  canMove,
  lastMove,
  syncToken,
  capturedPiece,
  premove,
}: ChessBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);
  const fenRef = useRef(fen);
  const orientationRef = useRef(orientation);
  const canMoveRef = useRef(canMove);
  const premoveRef = useRef(premove);
  const lastPlayedMoveRef = useRef<string | null>(null);
  const [dests, setDests] = useState<Map<Key, Key[]>>(new Map());
  const handleMove = useEffectEvent((orig: Key, dest: Key) => {
    onMove(orig, dest);
  });
  const handlePremoveSet = useEffectEvent((orig: Key, dest: Key) => {
    onPremoveChange?.({ from: orig, to: dest });
  });
  const handlePremoveUnset = useEffectEvent(() => {
    onPremoveChange?.(null);
  });
  const syncPremoveHighlight = useEffectEvent(
    (nextPremove: PremoveSelection | null | undefined) => {
      const boardElement = boardRef.current;
      const api = cgRef.current;

      if (!boardElement || !api) return;

      api.state.premovable.current = nextPremove
        ? [nextPremove.from as Key, nextPremove.to as Key]
        : undefined;
      api.state.dom.redraw();

      const pieces = boardElement.querySelectorAll("cg-board piece");

      pieces.forEach((piece) => {
        piece.classList.remove("premove-piece");
      });

      if (!nextPremove) return;

      pieces.forEach((piece) => {
        const pieceElement = piece as ChessgroundSquareElement;

        if (pieceElement.cgKey === nextPremove.from) {
          pieceElement.classList.add("premove-piece");
        }
      });
    },
  );

  useEffect(() => {
    fenRef.current = fen;
    orientationRef.current = orientation;
    canMoveRef.current = canMove;
    premoveRef.current = premove;
    // Always calculate legal moves for premoves
    const engineColor = orientation === "white" ? "w" : "b";
    setDests(getLegalMoves(fen, engineColor) as Map<Key, Key[]>);
  }, [fen, orientation, canMove, premove]);

  useEffect(() => {
    const boardElement = boardRef.current;

    if (!boardElement) return;

    let disposed = false;

    // Dynamically import chessground to avoid SSR issues
    void import("chessground").then(({ Chessground }) => {
      if (disposed) return;

      const currentOrientation = orientationRef.current;
      const turnColor = getBoardTurnColor(
        currentOrientation,
        canMoveRef.current,
      );

      cgRef.current = Chessground(boardElement, {
        fen: fenRef.current,
        orientation: currentOrientation,
        turnColor: turnColor,
        coordinates: true,
        movable: {
          free: false,
          color: currentOrientation,
          showDests: true,
          dests: getLegalMoves(
            fenRef.current,
            currentOrientation === "white" ? "w" : "b",
          ) as Map<Key, Key[]>,
          events: {
            after: (orig: Key, dest: Key) => {
              handleMove(orig, dest);
            },
          },
        },
        premovable: {
          enabled: true,
          showDests: true,
          castle: true,
          events: {
            set: (orig: Key, dest: Key) => {
              handlePremoveSet(orig, dest);
            },
            unset: () => {
              handlePremoveUnset();
            },
          },
        },
        highlight: {
          lastMove: true,
          check: false,
        },
        animation: {
          enabled: true,
          duration: 200,
        },
        draggable: {
          enabled: true,
          showGhost: true,
        },
      });

      syncPremoveHighlight(premoveRef.current);
    });

    return () => {
      disposed = true;

      if (cgRef.current) {
        cgRef.current.destroy();
        cgRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!cgRef.current) return;

    const turnColor = getBoardTurnColor(orientation, canMove);

    cgRef.current.set({
      fen,
      orientation,
      turnColor: turnColor,
      lastMove: (lastMove as [Key, Key]) || undefined,
      movable: {
        free: false,
        color: orientation,
        showDests: true,
        dests: dests,
      },
      premovable: {
        enabled: true,
        showDests: true,
        castle: true,
      },
      highlight: {
        lastMove: true,
        check: false,
      },
    });
    syncPremoveHighlight(premove);
  }, [fen, canMove, lastMove, orientation, syncToken, dests, premove]);

  useEffect(() => {
    if (!lastMove) return;

    const moveKey = `${lastMove[0]}-${lastMove[1]}-${capturedPiece ?? ""}-${fen}`;

    if (lastPlayedMoveRef.current === moveKey) return;

    lastPlayedMoveRef.current = moveKey;
    playSound(capturedPiece ? "capture" : "move");
  }, [capturedPiece, fen, lastMove]);

  return (
    <div className="relative w-full max-w-[600px]">
      <div
        ref={boardRef}
        className={`cg-wrap aspect-square w-full rounded-lg transition-all duration-300 ${
          !canMove ? "grayscale brightness-95" : ""
        }`}
        style={{
          boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
        }}
      />
    </div>
  );
}
