"use client";

import { useEffect } from "react";
import { initConfetti, clearConfetti } from "./confetti";

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
  const isDefeat = winner !== playerColor;

  useEffect(() => {
    // Launch confetti animation
    initConfetti({ cannons: true, fireworks: true });

    return () => {
      clearConfetti();
    };
  }, []);

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
      <canvas
        id="confetti"
        className="fixed inset-0 pointer-events-none"
        style={{ width: "100%", height: "100%" }}
      />
      <div className="relative z-10 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-700">
        <div className="text-center">
          <div className="text-6xl mb-4">
            {isVictory ? "🎉" : "😔"}
          </div>
          
          <h2 className="text-4xl font-bold mb-4 text-white">
            {isVictory ? "VICTORY!" : "DEFEAT"}
          </h2>
          
          <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
            <p className="text-gray-300 mb-2">
              {isVictory
                ? "You captured the enemy king!"
                : "Your king was captured!"}
            </p>
            
            <div className="flex items-center justify-center gap-4 text-5xl my-4">
              <div className="text-white">{pieceSymbols[capturedBy] || capturedBy}</div>
              <div className="text-2xl text-gray-400">⚔️</div>
              <div className="text-red-400">{pieceSymbols[capturedPiece] || capturedPiece}</div>
            </div>
            
            <p className="text-sm text-gray-400">
              {capturedBy.toUpperCase()} captured {capturedPiece.toUpperCase()}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
