"use client";

import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";

interface ChessBoardProps {
  onMove: (move: string) => void;
  playerColor: "white" | "black";
  timer: number;
  isMyTurn: boolean;
}

export default function ChessBoard({
  onMove,
  playerColor,
  timer,
  isMyTurn,
}: ChessBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);

  const pieces = {
    K: "king",
    Q: "queen",
    R: "rook",
    B: "bishop",
    N: "knight",
    P: "pawn",
    k: "king",
    q: "queen",
    r: "rook",
    b: "bishop",
    n: "knight",
    p: "pawn",
  };

  const getPieceSymbol = (piece: string) => {
    const symbols = {
      K: "2654",
      Q: "2655",
      R: "2656",
      B: "2657",
      N: "2658",
      P: "2659",
      k: "265a",
      q: "265b",
      r: "265c",
      b: "265d",
      n: "265e",
      p: "265f",
    };
    const code = symbols[piece as keyof typeof symbols];
    return code ? String.fromCharCode(parseInt(code, 16)) : "";
  };

  const handleSquareClick = (square: string) => {
    if (!isMyTurn) return;

    const piece = game.get(square);

    if (selectedSquare === null) {
      // Select a piece
      if (piece && piece.color === playerColor[0]) {
        setSelectedSquare(square);
        const moves = game.moves({ square, verbose: true });
        setPossibleMoves(moves.map((m) => m.to));
      }
    } else {
      // Try to move
      if (square === selectedSquare) {
        // Deselect
        setSelectedSquare(null);
        setPossibleMoves([]);
      } else if (possibleMoves.includes(square)) {
        // Make move
        const move = game.move({ from: selectedSquare, to: square });
        if (move) {
          setGame(new Chess(game.fen()));
          onMove(move.san);
          setSelectedSquare(null);
          setPossibleMoves([]);
        }
      } else if (piece && piece.color === playerColor[0]) {
        // Select different piece
        setSelectedSquare(square);
        const moves = game.moves({ square, verbose: true });
        setPossibleMoves(moves.map((m) => m.to));
      } else {
        // Deselect
        setSelectedSquare(null);
        setPossibleMoves([]);
      }
    }
  };

  const renderSquare = (row: number, col: number) => {
    const file = String.fromCharCode(97 + col);
    const rank = 8 - row;
    const square = file + rank;
    const piece = game.get(square);
    const isLight = (row + col) % 2 === 0;
    const isSelected = selectedSquare === square;
    const isPossibleMove = possibleMoves.includes(square);

    return (
      <div
        key={square}
        className={`
          relative w-full h-full flex items-center justify-center cursor-pointer
          transition-all duration-200
          ${isLight ? "bg-amber-100" : "bg-amber-700"}
          ${isSelected ? "ring-4 ring-blue-500" : ""}
          ${isPossibleMove ? "ring-2 ring-green-500" : ""}
          ${isMyTurn && piece?.color === playerColor[0] ? "hover:brightness-110" : ""}
        `}
        onClick={() => handleSquareClick(square)}
      >
        {piece && (
          <div
            className={`text-5xl ${piece.color === "w" ? "text-white" : "text-black"} drop-shadow-md`}
          >
            {getPieceSymbol(piece.type)}
          </div>
        )}
        {isPossibleMove && !piece && (
          <div className="absolute w-3 h-3 bg-green-500 rounded-full opacity-70"></div>
        )}
        {isPossibleMove && piece && (
          <div className="absolute inset-0 border-4 border-green-500 rounded-sm opacity-70"></div>
        )}
      </div>
    );
  };

  const board = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      board.push(renderSquare(row, col));
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Timer */}
      <div
        className={`text-3xl font-bold ${isMyTurn ? "text-green-600" : "text-gray-600"}`}
      >
        {timer}s
      </div>

      {/* Chess Board */}
      <div className="relative">
        <div
          ref={boardRef}
          className="grid grid-cols-8 gap-0 border-4 border-gray-800 rounded-lg shadow-2xl"
          style={{ width: "512px", height: "512px" }}
        >
          {board}
        </div>

        {/* Coordinates */}
        <div className="absolute -left-8 top-0 flex flex-col justify-around text-sm text-gray-600 font-semibold">
          {["8", "7", "6", "5", "4", "3", "2", "1"].map((rank) => (
            <div key={rank} className="h-[64px] flex items-center">
              {rank}
            </div>
          ))}
        </div>
        <div className="absolute -bottom-8 left-0 flex justify-around text-sm text-gray-600 font-semibold">
          {["a", "b", "c", "d", "e", "f", "g", "h"].map((file) => (
            <div key={file} className="w-[64px] flex justify-center">
              {file}
            </div>
          ))}
        </div>
      </div>

      {/* Turn Indicator */}
      <div className="text-center">
        <div
          className={`text-lg font-semibold ${isMyTurn ? "text-green-600" : "text-gray-600"}`}
        >
          {isMyTurn ? "Your turn!" : "Opponent's turn"}
        </div>
      </div>
    </div>
  );
}
