"use client";

import { useEffect, useRef } from "react";
import type { Api } from "chessground/api";
import type { Key } from "chessground/types";

// Import Chessground styles
import "chessground/assets/chessground.base.css";
import "chessground/assets/chessground.brown.css";
import "chessground/assets/chessground.cburnett.css";

interface ChessBoardProps {
  fen: string;
  orientation: "white" | "black";
  onMove: (from: string, to: string) => void;
  canMove: boolean;
  lastMove?: [string, string];
}

export function ChessBoardPure({
  fen,
  orientation,
  onMove,
  canMove,
  lastMove,
}: ChessBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);

  useEffect(() => {
    if (!boardRef.current) return;

    // Dynamically import chessground to avoid SSR issues
    import("chessground").then(({ Chessground }) => {
      cgRef.current = Chessground(boardRef.current!, {
        fen,
        orientation,
        coordinates: true,
        movable: {
          free: true, // Allow free movement - server validates legality
          color: canMove ? orientation : undefined,
          showDests: false,
          events: {
            after: (orig: Key, dest: Key) => {
              onMove(orig, dest);
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
    });

    return () => {
      if (cgRef.current) {
        cgRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!cgRef.current) return;

    import("chessground").then(() => {
      cgRef.current?.set({
        fen,
        orientation,
        lastMove: (lastMove as [Key, Key]) || undefined,
        movable: {
          free: true,
          color: canMove ? orientation : undefined,
          showDests: false,
        },
      });
    });
  }, [fen, canMove, lastMove, orientation]);

  return (
    <div className="relative">
      <div
        ref={boardRef}
        className="cg-wrap"
        style={{
          width: "600px",
          height: "600px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
        }}
      />

      {!canMove && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
          <div className="bg-yellow-400 text-black px-8 py-4 rounded-xl font-bold text-xl shadow-2xl">
            ⏱️ Waiting for timer...
          </div>
        </div>
      )}
    </div>
  );
}
