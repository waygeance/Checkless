/**
 * Checkless — Game Server Entry Point
 *
 * Bootstraps Express, Socket.io, and Prisma.
 * Routes, middleware, and socket handlers are imported from their own layers.
 *
 * Layer map:
 *   src/middlewares/   — Express and Socket.io middleware (auth, CORS, etc.)
 *   src/routes/        — Express REST route definitions
 *   src/services/      — Business logic (called by routes and websocket handlers)
 *   src/validators/    — Zod schemas for request/payload validation
 *   src/websocket/     — Socket.io event handlers
 *   src/engine/        — Pure chess engine (no I/O, no side effects)
 *   src/utils/         — Shared pure utility functions
 */

require("dotenv").config({ path: "../.env" });

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { PrismaClient } = require("@prisma/client");

const { createAppClerkClient } = require("./middlewares/auth");
const { createSocketAuthMiddleware } = require("./middlewares/socket-auth");
const { buildAllowedOrigins, isAllowedOrigin } = require("./utils/cors");
const { startTimerTick, registerHandlers } = require("./websocket/handlers");
const healthRouter = require("./routes/health");

// ── Core Instances ───────────────────────────────────

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();
const clerkClient = createAppClerkClient();

const PORT = Number(process.env.PORT) || 8081;
const HOST = process.env.HOST || "0.0.0.0";
const allowedOrigins = buildAllowedOrigins(process.env.CORS_ORIGIN);
const authorizedParties =
  allowedOrigins.length > 0
    ? allowedOrigins
    : ["http://localhost:5173", "http://127.0.0.1:5173"];

// ── Socket.io ────────────────────────────────────────

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

io.use(
  createSocketAuthMiddleware({
    prisma,
    clerkClient,
    authorizedParties
  })
);

// ── Express Middleware ───────────────────────────────

app.use(express.json());

// ── Routes ───────────────────────────────────────────

app.use("/", healthRouter);

// Future routes go here:
// app.use("/api/users",       require("./routes/users"));
// app.use("/api/games",       require("./routes/games"));
// app.use("/api/friends",     require("./routes/friends"));
// app.use("/api/challenges",  require("./routes/challenges"));

// ── WebSocket ────────────────────────────────────────

io.on("connection", (socket) => registerHandlers(io, socket));
startTimerTick(io);

// ── Start ────────────────────────────────────────────

server.listen(PORT, HOST, () => {
  console.log(`✓ Checkless server running on ${HOST}:${PORT}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
