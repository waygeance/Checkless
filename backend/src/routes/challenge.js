const { Router } = require("express");
function createChallengeRouter(service, requireAuth) {
  const router = Router();
  router.use(requireAuth);
  router.post("/", async (req, res) => {
    try {
      return res.status(201).json({
        challenge: await service.create(req.user.id, req.body?.variant)
      });
    } catch (e) {
      return res.status(400).json({ error: e.code || "INVALID_CHALLENGE" });
    }
  });
  router.get("/:code", async (req, res) => {
    const challenge = await service.lookup(req.params.code);
    return challenge
      ? res.json({ challenge })
      : res.status(404).json({ error: "CHALLENGE_NOT_FOUND" });
  });
  router.post("/:code/accept", async (req, res) => {
    try {
      return res.json({
        challenge: await service.accept(req.user.id, req.params.code)
      });
    } catch (e) {
      return res.status(409).json({ error: e.code || "CHALLENGE_UNAVAILABLE" });
    }
  });
  router.delete("/:id", async (req, res) =>
    res.json({ result: await service.cancel(req.user.id, req.params.id) })
  );
  return router;
}
module.exports = { createChallengeRouter };
