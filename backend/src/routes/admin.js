const { Router } = require("express");
function createAdminRouter(service, requireAuth, io, presenceService) {
  const router = Router();
  router.use(requireAuth, (req, res, next) =>
    req.user.role === "ADMIN"
      ? next()
      : res.status(403).json({ error: "ADMIN_REQUIRED" })
  );
  router.get("/users", async (req, res) =>
    res.json({ users: await service.searchUsers(req.query.q) })
  );
  router.get("/games", async (req, res) =>
    res.json({ games: await service.searchGames(req.query.q) })
  );
  router.post("/users/:userId/suspend", async (req, res) => {
    try {
      const user = await service.suspend(
        req.user.id,
        req.params.userId,
        req.body?.reason
      );
      for (const socketId of presenceService.socketsFor(req.params.userId))
        io.sockets.sockets.get(socketId)?.disconnect(true);
      return res.json({ user });
    } catch (e) {
      return res
        .status(e.code === "REASON_REQUIRED" ? 400 : 404)
        .json({ error: e.code || "SUSPEND_FAILED" });
    }
  });
  router.post("/users/:userId/restore", async (req, res) => {
    try {
      return res.json({
        user: await service.restore(
          req.user.id,
          req.params.userId,
          req.body?.reason
        )
      });
    } catch (e) {
      return res
        .status(e.code === "REASON_REQUIRED" ? 400 : 404)
        .json({ error: e.code || "RESTORE_FAILED" });
    }
  });
  return router;
}
module.exports = { createAdminRouter };
