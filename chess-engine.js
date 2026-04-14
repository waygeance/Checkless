// Pure Chess Engine for Simultaneous Chess - No dependencies, pure geometry
// White pieces: UPPERCASE (P N B R Q K), Black pieces: lowercase (p n b r q k)
// Row 0 = Rank 8 (top), Row 7 = Rank 1 (bottom)
// Col 0 = File 'a' (left), Col 7 = File 'h' (right)

class SimultaneousChess {
  constructor(fen) {
    this.board = [];
    this.moveHistory = [];
    this.castlingRights = {
      whiteKingside: true,
      whiteQueenside: true,
      blackKingside: true,
      blackQueenside: true,
    };

    if (fen) {
      this.loadFen(fen);
    } else {
      this.setupInitialPosition();
    }
  }

  // Proper FEN generation with / separators and number compression
  toFen() {
    const rows = [];
    for (let row = 0; row < 8; row++) {
      let empty = 0;
      let rowStr = "";
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece) {
          if (empty > 0) {
            rowStr += empty;
            empty = 0;
          }
          rowStr += piece;
        } else {
          empty++;
        }
      }
      if (empty > 0) rowStr += empty;
      rows.push(rowStr);
    }

    // Castling rights
    let castling = "";
    if (this.castlingRights.whiteKingside) castling += "K";
    if (this.castlingRights.whiteQueenside) castling += "Q";
    if (this.castlingRights.blackKingside) castling += "k";
    if (this.castlingRights.blackQueenside) castling += "q";
    if (castling === "") castling = "-";

    return rows.join("/") + " w " + castling + " - 0 1";
  }

  // Proper FEN parser that handles number compression
  loadFen(fen) {
    const parts = fen.split(" ");
    if (parts.length < 1) return false;

    this.board = Array(8)
      .fill(null)
      .map(() => Array(8).fill(""));
    const rows = parts[0].split("/");

    for (let row = 0; row < 8 && row < rows.length; row++) {
      let col = 0;
      for (let i = 0; i < rows[row].length; i++) {
        const ch = rows[row][i];
        if (ch >= "1" && ch <= "8") {
          const skip = parseInt(ch);
          for (let s = 0; s < skip; s++) {
            this.board[row][col++] = "";
          }
        } else {
          this.board[row][col++] = ch;
        }
      }
    }

    // Parse castling rights if available
    if (parts.length >= 3 && parts[2] !== "-") {
      const castling = parts[2];
      this.castlingRights = {
        whiteKingside: castling.includes("K"),
        whiteQueenside: castling.includes("Q"),
        blackKingside: castling.includes("k"),
        blackQueenside: castling.includes("q"),
      };
    }

    return true;
  }

  // Correct initial position
  setupInitialPosition() {
    this.board = [
      ["r", "n", "b", "q", "k", "b", "n", "r"], // row 0 = rank 8 (black back rank)
      ["p", "p", "p", "p", "p", "p", "p", "p"], // row 1 = rank 7 (black pawns)
      ["", "", "", "", "", "", "", ""], // row 2 = rank 6
      ["", "", "", "", "", "", "", ""], // row 3 = rank 5
      ["", "", "", "", "", "", "", ""], // row 4 = rank 4
      ["", "", "", "", "", "", "", ""], // row 5 = rank 3
      ["P", "P", "P", "P", "P", "P", "P", "P"], // row 6 = rank 2 (white pawns)
      ["R", "N", "B", "Q", "K", "B", "N", "R"], // row 7 = rank 1 (white back rank)
    ];
  }

  // Convert algebraic notation (e.g. "e4") to {row, col}
  algebraicToIndices(sq) {
    if (!sq || sq.length !== 2) return null;
    const col = sq.charCodeAt(0) - 97; // a=0, h=7
    const row = 8 - parseInt(sq[1]); // '8'->0, '1'->7
    if (col < 0 || col > 7 || row < 0 || row > 7) return null;
    return { row, col };
  }

  // Convert {row, col} to algebraic notation
  indicesToAlgebraic(row, col) {
    return String.fromCharCode(97 + col) + (8 - row).toString();
  }

  // Get piece at algebraic square
  get(sq) {
    const i = this.algebraicToIndices(sq);
    if (!i) return null;
    return this.board[i.row]?.[i.col] || null;
  }

  // Is square empty?
  isEmpty(sq) {
    const i = this.algebraicToIndices(sq);
    if (!i) return true;
    return !this.board[i.row][i.col];
  }

  // Is piece at square owned by given color? ('w' or 'b')
  isOwnPiece(sq, color) {
    const i = this.algebraicToIndices(sq);
    if (!i) return false;
    const p = this.board[i.row][i.col];
    if (!p) return false;
    return color === "w" ? p === p.toUpperCase() : p === p.toLowerCase();
  }

  // Is piece at square an enemy of given color?
  isEnemyPiece(sq, color) {
    const i = this.algebraicToIndices(sq);
    if (!i) return false;
    const p = this.board[i.row][i.col];
    if (!p) return false;
    return color === "w" ? p === p.toLowerCase() : p === p.toUpperCase();
  }

  // Check if path between two squares is clear (for sliding pieces)
  isPathClear(fr, fc, tr, tc) {
    const dr = Math.sign(tr - fr);
    const dc = Math.sign(tc - fc);
    let r = fr + dr;
    let c = fc + dc;
    while (r !== tr || c !== tc) {
      if (r < 0 || r > 7 || c < 0 || c > 7) return false;
      if (this.board[r][c]) return false; // any piece blocks
      r += dr;
      c += dc;
    }
    return true;
  }

  // Master validation: isLegalMove(board, from, to, playerColor)
  isLegalMove(from, to, color) {
    const fi = this.algebraicToIndices(from);
    const ti = this.algebraicToIndices(to);
    if (!fi || !ti) return false;

    // Step A: Basic sanity
    const piece = this.board[fi.row][fi.col];
    if (!piece) return false; // empty square
    if (!this.isOwnPiece(from, color)) return false; // not your piece
    if (this.isOwnPiece(to, color)) return false; // friendly fire

    const type = piece.toUpperCase();
    const rd = ti.row - fi.row;
    const cd = ti.col - fi.col;
    const ard = Math.abs(rd);
    const acd = Math.abs(cd);

    // Step C: Piece-specific geometry
    switch (type) {
      case "P": {
        const dir = color === "w" ? -1 : 1; // white moves up (row-), black moves down (row+)
        const startRow = color === "w" ? 6 : 1;

        // Single push
        if (rd === dir && cd === 0 && this.isEmpty(to)) return true;

        // Double push from start
        if (rd === dir * 2 && cd === 0 && fi.row === startRow) {
          const midSq = this.indicesToAlgebraic(fi.row + dir, fi.col);
          return this.isEmpty(midSq) && this.isEmpty(to);
        }

        // Capture
        if (rd === dir && acd === 1 && this.isEnemyPiece(to, color))
          return true;

        return false;
      }
      case "N":
        return (ard === 2 && acd === 1) || (ard === 1 && acd === 2);

      case "B":
        return (
          ard === acd &&
          ard > 0 &&
          this.isPathClear(fi.row, fi.col, ti.row, ti.col)
        );

      case "R":
        return (
          (rd === 0 || cd === 0) &&
          (rd !== 0 || cd !== 0) &&
          this.isPathClear(fi.row, fi.col, ti.row, ti.col)
        );

      case "Q":
        return (
          (rd === 0 || cd === 0 || (ard === acd && ard > 0)) &&
          (rd !== 0 || cd !== 0) &&
          this.isPathClear(fi.row, fi.col, ti.row, ti.col)
        );

      case "K":
        // Regular king move
        if (ard <= 1 && acd <= 1 && ard + acd > 0) return true;

        // Castling (kingside and queenside)
        if (ard === 0 && acd === 2) {
          const kingside = ti.col > fi.col;
          const backRank = color === "w" ? 7 : 0;
          if (fi.row !== backRank || ti.row !== backRank) return false;

          // Check if castling rights are available
          if (color === "w") {
            if (kingside && !this.castlingRights.whiteKingside) return false;
            if (!kingside && !this.castlingRights.whiteQueenside) return false;
          } else {
            if (kingside && !this.castlingRights.blackKingside) return false;
            if (!kingside && !this.castlingRights.blackQueenside) return false;
          }

          // Check if path is clear
          if (kingside) {
            // Kingside: check f and g files
            if (this.board[backRank][5] || this.board[backRank][6])
              return false;
          } else {
            // Queenside: check b, c, d files
            if (
              this.board[backRank][1] ||
              this.board[backRank][2] ||
              this.board[backRank][3]
            )
              return false;
          }

          return true;
        }
        return false;

      default:
        return false;
    }
  }

  // Execute a move. Returns { valid, from, to, piece, captured, promotion, kingCapture, castling } or { valid: false, reason }
  move(moveObj, color) {
    const from =
      typeof moveObj === "string" ? moveObj.substring(0, 2) : moveObj.from;
    const to =
      typeof moveObj === "string" ? moveObj.substring(2, 4) : moveObj.to;

    if (!this.isLegalMove(from, to, color)) {
      return { valid: false, reason: "Illegal move" };
    }

    const fi = this.algebraicToIndices(from);
    const ti = this.algebraicToIndices(to);
    const piece = this.board[fi.row][fi.col];
    const captured = this.board[ti.row][ti.col]; // capture BEFORE moving

    // Check for king capture
    const isKingCapture = captured === "K" || captured === "k";

    // Check for castling
    const isCastling =
      piece.toUpperCase() === "K" && Math.abs(ti.col - fi.col) === 2;
    let castlingMove = null;

    if (isCastling) {
      const kingside = ti.col > fi.col;
      const backRank = color === "w" ? 7 : 0;

      if (kingside) {
        // Kingside castling: move rook from h to f
        this.board[backRank][5] = this.board[backRank][7]; // rook to f
        this.board[backRank][7] = ""; // clear h
        castlingMove = {
          rookFrom: "h" + (8 - backRank),
          rookTo: "f" + (8 - backRank),
        };
      } else {
        // Queenside castling: move rook from a to d
        this.board[backRank][3] = this.board[backRank][0]; // rook to d
        this.board[backRank][0] = ""; // clear a
        castlingMove = {
          rookFrom: "a" + (8 - backRank),
          rookTo: "d" + (8 - backRank),
        };
      }
    }

    // Move piece
    this.board[ti.row][ti.col] = piece;
    this.board[fi.row][fi.col] = "";

    // If king was captured, place the captured piece ON the king
    if (isKingCapture) {
      // The captured piece is now ON the king square
      // We'll represent this by keeping the captured piece info
    }

    // Update castling rights when king or rooks move
    if (piece === "K") {
      this.castlingRights.whiteKingside = false;
      this.castlingRights.whiteQueenside = false;
    }
    if (piece === "k") {
      this.castlingRights.blackKingside = false;
      this.castlingRights.blackQueenside = false;
    }
    if (piece === "R") {
      if (from === "a1") this.castlingRights.whiteQueenside = false;
      if (from === "h1") this.castlingRights.whiteKingside = false;
    }
    if (piece === "r") {
      if (from === "a8") this.castlingRights.blackQueenside = false;
      if (from === "h8") this.castlingRights.blackKingside = false;
    }

    // Auto-queen promotion
    let promotion = null;
    if (piece === "P" && ti.row === 0) {
      this.board[ti.row][ti.col] = "Q";
      promotion = "Q";
    }
    if (piece === "p" && ti.row === 7) {
      this.board[ti.row][ti.col] = "q";
      promotion = "q";
    }

    this.moveHistory.push({
      from,
      to,
      piece,
      color,
      captured,
      promotion,
      timestamp: Date.now(),
    });

    return {
      valid: true,
      from,
      to,
      piece,
      captured,
      promotion,
      kingCapture: isKingCapture,
      castling: castlingMove,
    };
  }

  // Get all legal destination squares for a piece (for Chessground dests)
  getLegalMoves(square, color) {
    const moves = [];
    if (!this.isOwnPiece(square, color)) return moves;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const target = this.indicesToAlgebraic(row, col);
        if (this.isLegalMove(square, target, color)) {
          moves.push(target);
        }
      }
    }
    return moves;
  }

  // Get FEN
  fen() {
    return this.toFen();
  }

  // Check if a king exists (for win condition)
  hasKing(color) {
    const target = color === "w" ? "K" : "k";
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (this.board[row][col] === target) return true;
      }
    }
    return false;
  }

  pgn() {
    return this.moveHistory.map((m) => `${m.from}${m.to}`).join(" ");
  }
}

module.exports = { SimultaneousChess };
