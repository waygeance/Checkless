"use client";

import { useEffect, useEffectEvent, useRef } from "react";
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
  syncToken: number;
}

export function ChessBoardPure({
  fen,
  orientation,
  onMove,
  canMove,
  lastMove,
  syncToken,
}: ChessBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);
  const handleMove = useEffectEvent((orig: Key, dest: Key) => {
    onMove(orig, dest);
  });

  useEffect(() => {
    const boardElement = boardRef.current;

    if (!boardElement) return;

    let disposed = false;

    // Dynamically import chessground to avoid SSR issues
    void import("chessground").then(({ Chessground }) => {
      if (disposed) return;

      cgRef.current = Chessground(boardElement, {
        fen,
        orientation,
        turnColor: orientation,
        coordinates: true,
        movable: {
          free: true,
          color: canMove ? orientation : undefined,
          showDests: false,
          events: {
            after: (orig: Key, dest: Key) => {
              handleMove(orig, dest);
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
      disposed = true;

      if (cgRef.current) {
        cgRef.current.destroy();
        cgRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!cgRef.current) return;

    cgRef.current.set({
      fen,
      orientation,
      turnColor: orientation,
      lastMove: (lastMove as [Key, Key]) || undefined,
      movable: {
        free: true,
        color: canMove ? orientation : undefined,
        showDests: false,
      },
    });
  }, [fen, canMove, lastMove, orientation, syncToken]);

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
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-sm bg-black/40 pointer-events-none">
          <div className="bg-yellow-400 text-black px-8 py-4 rounded-xl font-bold text-xl shadow-2xl">
            ⏱️ Waiting for timer...
          </div>
        </div>
      )}
    </div>
  );
}
