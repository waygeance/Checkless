"use client";

import { useEffect, useRef } from "react";
import { Chess } from "chess.js";
import "chessground/assets/chessground.base.css";
import "chessground/assets/chessground.brown.css";
import "chessground/assets/chessground.cburnett.css"; // Piece set

interface ChessBoardProps {
  fen: string;
  orientation: "white" | "black";
  onMove: (from: string, to: string) => void;
  canMove: boolean;
  lastMove?: [string, string];
}

export function ChessBoard({
  fen,
  orientation,
  onMove,
  canMove,
  lastMove,
}: ChessBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<any>(null);

  useEffect(() => {
    if (!boardRef.current) return;

    // Dynamically import chessground to avoid SSR issues
    import("chessground").then(({ Chessground }) => {
      const chess = new Chess(fen);

      cgRef.current = Chessground(boardRef.current!, {
        fen,
        orientation,
        movable: {
          free: false,
          color: canMove ? orientation : undefined,
          dests: getLegalMoves(chess, orientation),
          events: {
            after: (orig: string, dest: string) => {
              onMove(orig, dest);
            },
          },
        },
        lastMove,
        highlight: {
          lastMove: true,
          check: true,
        },
        animation: {
          enabled: true,
          duration: 200,
        },
        drawable: {
          enabled: true,
        },
      });
    });

    return () => {
      if (cgRef.current) {
        cgRef.current.destroy();
      }
    };
  }, []);

  // Update board when fen changes
  useEffect(() => {
    if (!cgRef.current) return;

    import("chessground").then(() => {
      const chess = new Chess(fen);

      cgRef.current.set({
        fen,
        movable: {
          color: canMove ? orientation : undefined,
          dests: getLegalMoves(chess, orientation),
        },
        lastMove,
      });
    });
  }, [fen, canMove, lastMove, orientation]);

  return (
    <div className="relative">
      <div
        ref={boardRef}
        className="cg-wrap"
        style={{ width: "600px", height: "600px" }}
      />

      {!canMove && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
          <div className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold">
            Wait for timer...
          </div>
        </div>
      )}
    </div>
  );
}

function getLegalMoves(chess: Chess, color: "white" | "black") {
  const dests = new Map<string, string[]>();

  if (chess.turn() !== color[0]) return dests;

  // Get all squares
  const squares = [
    "a8",
    "b8",
    "c8",
    "d8",
    "e8",
    "f8",
    "g8",
    "h8",
    "a7",
    "b7",
    "c7",
    "d7",
    "e7",
    "f7",
    "g7",
    "h7",
    "a6",
    "b6",
    "c6",
    "d6",
    "e6",
    "f6",
    "g6",
    "h6",
    "a5",
    "b5",
    "c5",
    "d5",
    "e5",
    "f5",
    "g5",
    "h5",
    "a4",
    "b4",
    "c4",
    "d4",
    "e4",
    "f4",
    "g4",
    "h4",
    "a3",
    "b3",
    "c3",
    "d3",
    "e3",
    "f3",
    "g3",
    "h3",
    "a2",
    "b2",
    "c2",
    "d2",
    "e2",
    "f2",
    "g2",
    "h2",
    "a1",
    "b1",
    "c1",
    "d1",
    "e1",
    "f1",
    "g1",
    "h1",
  ];

  squares.forEach((square: string) => {
    const moves = chess.moves({ square, verbose: true });
    if (moves.length) {
      dests.set(
        square,
        moves.map((m) => m.to),
      );
    }
  });

  return dests;
}
