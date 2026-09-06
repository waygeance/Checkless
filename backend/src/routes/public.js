const { Router } = require("express");

function createPublicRouter(service) {
  const router = Router();
  router.get("/games", async (req, res) =>
    res.json(await service.listCompleted(req.query))
  );
  router.get("/games/:gameId", async (req, res) => {
    const game = await service.getGame(req.params.gameId);
    if (!game) return res.status(404).json({ error: "GAME_NOT_FOUND" });
    return res.json({ game });
  });
  router.get("/games/:gameId/moves", async (req, res) => {
    const game = await service.getGame(req.params.gameId);
    if (!game) return res.status(404).json({ error: "GAME_NOT_FOUND" });
    return res.json(await service.getMoves(req.params.gameId, req.query));
  });
  router.get("/games/:gameId/replay", async (req, res) => {
    try {
      const replay = await service.replay(req.params.gameId);
      if (!replay) return res.status(404).json({ error: "GAME_NOT_FOUND" });
      return res.json(replay);
    } catch (error) {
      return res.status(500).json({ error: "REPLAY_INVALID" });
    }
  });
  router.get("/users/:username", async (req, res) => {
    const profile = await service.getProfile(req.params.username);
    if (!profile) return res.status(404).json({ error: "USER_NOT_FOUND" });
    return res.json({ profile });
  });
  router.get("/users/:username/games", async (req, res) => {
    const games = await service.listPlayerGames(req.params.username, req.query);
    if (!games) return res.status(404).json({ error: "USER_NOT_FOUND" });
    return res.json(games);
  });
  return router;
}

module.exports = { createPublicRouter };
