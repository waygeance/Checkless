/**
 * routes/health.js
 *
 * Simple liveness and readiness endpoints.
 * No auth required — used by load balancers and uptime monitors.
 */

const { Router } = require("express");

const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "checkless-backend",
    message: "Realtime game server is running.",
    socketPath: "/socket.io/"
  });
});

router.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

module.exports = router;
