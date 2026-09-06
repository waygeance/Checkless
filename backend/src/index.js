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
const cors = require("cors");
const { Server } = require("socket.io");
const { PrismaClient } = require("@prisma/client");

const { createAppClerkClient } = require("./middlewares/auth");
const { createSocketAuthMiddleware } = require("./middlewares/socket-auth");
const { GamePersistenceService } = require("./services/game-persistence");
const { LiveGameService } = require("./services/live-game");
const { MatchmakingService } = require("./services/matchmaking");
const { PublicGameService } = require("./services/public-game");
const { buildAllowedOrigins, isAllowedOrigin } = require("./utils/cors");
const {
  registerGameServiceEvents,
  registerHandlers,
  startTimerTick
} = require("./websocket/handlers");
const healthRouter = require("./routes/health");
const { createGuestRouter } = require("./routes/guest");
const { createRequireAuth } = require("./middlewares/rest-auth");
const { SocialService } = require("./services/social");
const { PresenceService } = require("./services/presence");
const { ChallengeService } = require("./services/challenge");
const { AdminService } = require("./services/admin");

// ── Core Instances ───────────────────────────────────

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();
const clerkClient = createAppClerkClient();
const gamePersistenceService = new GamePersistenceService(prisma);
const gameService = new LiveGameService({
  persistence: gamePersistenceService,
  moveBatchSize: Number(process.env.MOVE_BATCH_SIZE) || 10,
  moveFlushIntervalMs: Number(process.env.MOVE_FLUSH_INTERVAL_MS) || 5000
});
const matchmakingService = new MatchmakingService(gameService, prisma);
const publicGameService = new PublicGameService(prisma);
const socialService = new SocialService(prisma);
const presenceService = new PresenceService(prisma);
const challengeService = new ChallengeService(prisma);
const adminService = new AdminService(prisma);

const PORT = Number(process.env.PORT) || 8081;
const HOST = process.env.HOST || "0.0.0.0";
const allowedOrigins = buildAllowedOrigins(process.env.CORS_ORIGIN);
const authorizedParties = process.env.CLERK_AUTHORIZED_PARTIES
  ? process.env.CLERK_AUTHORIZED_PARTIES.split(",").map((s) => s.trim())
  : undefined;

// ── Socket.io ────────────────────────────────────────

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      const allowed =
        allowedOrigins.length === 0
          ? true
          : isAllowedOrigin(origin, allowedOrigins);

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

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, same-origin)
      if (!origin) return callback(null, true);
      const allowed =
        allowedOrigins.length === 0
          ? true
          : isAllowedOrigin(origin, allowedOrigins);
      callback(allowed ? null : new Error("Not allowed by CORS"), allowed);
    },
    credentials: true,
    methods: ["GET", "POST", "DELETE", "PATCH", "PUT", "OPTIONS"]
  })
);
app.use(express.json());

// ── Routes ───────────────────────────────────────────

const requireAuth = createRequireAuth({ prisma, clerkClient, authorizedParties });

app.use("/", healthRouter);
app.use("/api/guest", createGuestRouter(prisma));
app.get("/api/me", requireAuth, async (req, res) => {
  const profile = await publicGameService.getProfile(req.user.username);
  return res.json({ user: req.user, profile });
});
app.use(
  "/api",
  require("./routes/public").createPublicRouter(publicGameService)
);
app.use(
  "/api/admin",
  require("./routes/admin").createAdminRouter(
    adminService,
    requireAuth,
    io,
    presenceService
  )
);
app.use(
  "/api/challenges",
  require("./routes/challenge").createChallengeRouter(
    challengeService,
    requireAuth
  )
);
app.use(
  "/api/social",
  require("./routes/social").createSocialRouter(
    socialService,
    requireAuth
  )
);

// Future routes go here:
// app.use("/api/users",       require("./routes/users"));
// app.use("/api/games",       require("./routes/games"));
// app.use("/api/friends",     require("./routes/friends"));
// app.use("/api/challenges",  require("./routes/challenges"));

// ── WebSocket ────────────────────────────────────────

registerGameServiceEvents(io, gameService);
io.on("connection", (socket) =>
  registerHandlers(io, socket, {
    gameService,
    matchmakingService,
    presenceService
  })
);
startTimerTick(io, gameService);
const challengeExpiryTimer = setInterval(() => {
  void challengeService
    .expire()
    .catch((error) => console.error("Challenge expiry failed", error));
}, 60_000);
challengeExpiryTimer.unref?.();

// ── Start ────────────────────────────────────────────

async function startServer() {
  const recovered = await gamePersistenceService.recoverInterruptedGames();
  if (recovered.count > 0) {
    console.warn(
      `Marked ${recovered.count} unfinished game(s) as server-interrupted`
    );
  }

  await new Promise((resolve, reject) => {
    const handleError = (error) => {
      server.off("listening", handleListening);
      reject(error);
    };
    const handleListening = () => {
      server.off("error", handleError);
      resolve();
    };

    server.once("error", handleError);
    server.once("listening", handleListening);
    server.listen(PORT, HOST);
  });

  console.log(`✓ Checkless server running on ${HOST}:${PORT}`);
}

let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`Received ${signal}; flushing active games...`);

  try {
    await gameService.shutdown();
    await new Promise((resolve) => io.close(resolve));
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Graceful shutdown failed", error);
    process.exit(1);
  }
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

startServer().catch(async (error) => {
  console.error("Could not start Checkless server", error);
  await prisma.$disconnect();
  process.exit(1);
});
