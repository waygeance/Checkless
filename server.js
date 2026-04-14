const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { SimultaneousChess } = require("./chess-engine");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // This tells the server: "Allow anyone to connect!"
    methods: ["GET", "POST"],
  },
});

const games = new Map();
const waitingPlayers = [];
const TICK_INTERVAL = 100;
const VARIANT_TIMES = { "1s": 1000, "3s": 3000, "5s": 5000 };

function normalizeMoveInput(move) {
  if (!move || typeof move !== "object") return null;
  if (typeof move.from !== "string" || typeof move.to !== "string") return null;

  const from = move.from.toLowerCase();
  const to = move.to.toLowerCase();

  // Basic validation
  if (from.length !== 2 || to.length !== 2) return null;
  if (from[0] < "a" || from[0] > "h" || to[0] < "a" || to[0] > "h") return null;
  if (from[1] < "1" || from[1] > "8" || to[1] < "1" || to[1] > "8") return null;

  return { from, to };
}

function createGame(player1, player2, variant) {
  const variantTime = VARIANT_TIMES[variant];
  return {
    id: `game_${Date.now()}`,
    variant,
    variantTime,
    players: {
      white: {
        socketId: player1,
        timerValue: variantTime,
        canMove: false,
        lastMoveAt: null,
      },
      black: {
        socketId: player2,
        timerValue: variantTime,
        canMove: false,
        lastMoveAt: null,
      },
    },
    chess: new SimultaneousChess(),
    moveHistory: [],
    status: "active",
  };
}

setInterval(() => {
  games.forEach((game) => {
    if (game.status !== "active") return;

    ["white", "black"].forEach((color) => {
      const player = game.players[color];
      if (player.timerValue > 0) {
        player.timerValue = Math.max(0, player.timerValue - TICK_INTERVAL);
        if (player.timerValue === 0) player.canMove = true;
      }
    });

    io.to(game.id).emit("timer_update", {
      white: game.players.white.timerValue,
      black: game.players.black.timerValue,
      whiteCanMove: game.players.white.canMove,
      blackCanMove: game.players.black.canMove,
    });
  });
}, TICK_INTERVAL);

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("find_game", ({ variant }) => {
    const waiting = waitingPlayers.find((p) => p.variant === variant);
    if (waiting) {
      const game = createGame(waiting.socketId, socket.id, variant);
      games.set(game.id, game);

      io.sockets.sockets.get(waiting.socketId)?.join(game.id);
      socket.join(game.id);

      io.to(waiting.socketId).emit("game_start", {
        gameId: game.id,
        color: "white",
        variant,
      });
      io.to(socket.id).emit("game_start", {
        gameId: game.id,
        color: "black",
        variant,
      });

      waitingPlayers.splice(waitingPlayers.indexOf(waiting), 1);
    } else {
      waitingPlayers.push({ socketId: socket.id, variant });
      socket.emit("waiting", { message: "Searching for opponent..." });
    }
  });

  socket.on("make_move", ({ gameId, move }) => {
    const game = games.get(gameId);
    if (!game || game.status !== "active") return;

    const playerColor =
      game.players.white.socketId === socket.id ? "white" : "black";
    const player = game.players[playerColor];

    // Only timer check
    if (!player.canMove) {
      return socket.emit("move_rejected", {
        reason: "TIMER_NOT_READY",
        message: "Wait for your timer to reach 0",
      });
    }

    const normalizedMove = normalizeMoveInput(move);
    if (!normalizedMove) {
      return socket.emit("move_rejected", {
        reason: "INVALID_MOVE",
        message: "Malformed move payload",
      });
    }

    // Use custom chess engine - pass 'w' or 'b' not 'white'/'black'
    const engineColor = playerColor === "white" ? "w" : "b";
    const result = game.chess.move(normalizedMove, engineColor);

    if (!result.valid) {
      return socket.emit("move_rejected", {
        reason: "ILLEGAL_MOVE",
        message: result.reason || "Invalid move for your pieces",
      });
    }

    // Move is valid - update game state
    player.timerValue = game.variantTime;
    player.canMove = false;
    player.lastMoveAt = Date.now();

    game.moveHistory.push({
      move: result.from + result.to, // Use simple notation
      color: playerColor,
      timestamp: Date.now(),
    });

    // Check for king capture (either 'k' or 'K')
    if (result.captured === "k" || result.captured === "K") {
      game.status = "finished";
      io.to(gameId).emit("game_over", {
        reason: "KING_CAPTURED",
        winner: playerColor,
        capturedPiece: result.captured,
        capturedBy: result.piece,
      });
      games.delete(gameId);
      return;
    }

    // Broadcast move to both players
    io.to(gameId).emit("move_made", {
      move: {
        from: result.from,
        to: result.to,
        piece: result.piece,
        promotion: result.promotion,
        captured: result.captured,
      },
      fen: game.chess.fen(),
      movedBy: playerColor,
      timers: {
        white: game.players.white.timerValue,
        black: game.players.black.timerValue,
      },
    });
  });

  socket.on("disconnect", () => {
    const waitingIndex = waitingPlayers.findIndex(
      (p) => p.socketId === socket.id,
    );
    if (waitingIndex !== -1) waitingPlayers.splice(waitingIndex, 1);

    games.forEach((game, gameId) => {
      if (
        game.players.white.socketId === socket.id ||
        game.players.black.socketId === socket.id
      ) {
        const winner =
          game.players.white.socketId === socket.id ? "black" : "white";
        io.to(gameId).emit("game_over", {
          reason: "opponent_disconnected",
          winner,
        });
        games.delete(gameId);
      }
    });
  });
});

server.listen(8081, () => console.log("✓ Server running on :8081"));
