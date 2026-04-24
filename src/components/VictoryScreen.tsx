"use client";

import { Crown, Swords } from "lucide-react";

interface VictoryScreenProps {
  winner: "white" | "black";
  playerColor: "white" | "black";
  capturedPiece: string;
  capturedBy: string;
  onClose: () => void;
}

export function VictoryScreen({
  winner,
  playerColor,
  capturedPiece,
  capturedBy,
  onClose,
}: VictoryScreenProps) {
  const isVictory = winner === playerColor;

  const pieceSymbols: { [key: string]: string } = {
    p: "♟",
    r: "♜",
    n: "♞",
    b: "♝",
    q: "♛",
    k: "♚",
    P: "♟",
    R: "♜",
    N: "♞",
    B: "♝",
    Q: "♛",
    K: "♚",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative z-10 mx-4 w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-mocha p-8 shadow-[0_30px_80px_rgba(0,0,0,0.42)] sm:p-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(200,255,0,0.18),transparent_75%)]" />
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-espresso/80 shadow-inner">
            {isVictory ? (
              <Crown className="h-8 w-8 text-lime" />
            ) : (
              <Swords className="h-8 w-8 text-danger" />
            )}
          </div>

          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-cream-muted">
            Match Result
          </div>

          <h2 className="mb-4 mt-3 font-display text-4xl font-bold text-cream sm:text-5xl">
            {isVictory ? "VICTORY!" : "DEFEAT"}
          </h2>

          <div className="mb-6 rounded-[1.6rem] border border-white/8 bg-espresso/65 p-6 shadow-inner">
            <p className="mb-2 text-cream-muted">
              {isVictory
                ? "You captured the enemy king!"
                : "Your king was captured!"}
            </p>

            <div className="my-5 flex items-center justify-center gap-4 text-5xl">
              <div className="text-cream">
                {pieceSymbols[capturedBy] || capturedBy}
              </div>
              <div className="text-2xl text-cream-muted">⚔️</div>
              <div className="text-danger">
                {pieceSymbols[capturedPiece] || capturedPiece}
              </div>
            </div>

            <p className="font-mono text-xs uppercase tracking-[0.18em] text-cream-muted">
              {capturedBy.toUpperCase()} captured {capturedPiece.toUpperCase()}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full rounded-full bg-lime px-6 py-4 font-display text-lg font-bold text-espresso shadow-tactile-btn transition-all duration-300 hover:bg-lime-hover active:translate-y-0.5 active:shadow-tactile-btn-pressed"
          >
            Back To Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
