const initialPieces = {
  a8: "♜",
  c8: "♝",
  d8: "♛",
  e8: "♚",
  g8: "♞",
  h8: "♜",
  a7: "♟",
  b7: "♟",
  c7: "♟",
  d7: "♟",
  e7: "♟",
  h7: "♟",
  f6: "♞",
  f5: "♟",
  e5: "♙",
  c4: "♘",
  d4: "♙",
  h4: "♙",
  b3: "♙",
  f3: "♝",
  a2: "♙",
  b2: "♙",
  c2: "♙",
  d2: "♙",
  f2: "♙",
  g2: "♙",
  h2: "♙",
  a1: "♖",
  c1: "♗",
  d1: "♕",
  e1: "♔",
  f1: "♗",
  g1: "♘",
  h1: "♖"
};

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

export function MiniBoard({ className = "" }) {
  const squares = [];
  for (let rank = 8; rank >= 1; rank -= 1) {
    files.forEach((file, fileIndex) => {
      const square = `${file}${rank}`;
      const dark = (rank + fileIndex) % 2 === 0;
      squares.push(
        <div
          key={square}
          className={`flex aspect-square items-center justify-center text-[clamp(1rem,5vw,3.1rem)] leading-none ${dark ? "bg-[#4c3427]" : "bg-[#c7ae83]"}`}
        >
          <span className="select-none drop-shadow-[0_2px_1px_rgba(0,0,0,0.35)]">
            {initialPieces[square]}
          </span>
        </div>
      );
    });
  }

  return (
    <div
      className={`grid grid-cols-8 overflow-hidden rounded-xl border-[5px] border-coffee-leather bg-coffee-leather shadow-2xl ${className}`}
    >
      {squares}
    </div>
  );
}
