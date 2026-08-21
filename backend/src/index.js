/**
 * Checkless — Game Server Entry Point
 *
 * Express REST endpoints + Socket.io real-time game server.
 * Prisma client is initialised here for future database operations.
 */

require("dotenv").config({ path: "../.env" });

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { PrismaClient } = require("@prisma/client");
const { buildAllowedOrigins, isAllowedOrigin } = require("./utils/cors");
const { startTimerTick, registerHandlers } = require("./socket/handlers");

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

const PORT = Number(process.env.PORT) || 8081;
const HOST = process.env.HOST || "0.0.0.0";
const allowedOrigins = buildAllowedOrigins(process.env.CORS_ORIGIN);

// ── Socket.io ───────────────────────────────────────

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      const allowed =
        allowedOrigins.length === 0 ? true : isAllowedOrigin(origin, allowedOrigins);

      if (!allowed) {
        console.warn(
          `Blocked origin: ${origin ?? "unknown"}; allowed: ${allowedOrigins.join(", ")}`
        );
      }

      callback(null, allowed);
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ── REST Endpoints ──────────────────────────────────

app.get("/", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "checkless-backend",
    message: "Realtime game server is running.",
    health: "/health",
    socketPath: "/socket.io/"
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

// ── Start ───────────────────────────────────────────

io.on("connection", (socket) => registerHandlers(io, socket));
startTimerTick(io);

server.listen(PORT, HOST, () => {
  console.log(`✓ Checkless server running on ${HOST}:${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
