const { Router } = require("express");

function createSocialRouter(service, requireAuth) {
  const router = Router();
  router.use(requireAuth);
  router.get("/search", async (req, res) =>
    res.json({ users: await service.searchUsers(req.query.q, req.user.id) })
  );
  router.get("/friends", async (req, res) =>
    res.json({ friends: await service.listFriends(req.user.id) })
  );
  router.get("/requests", async (req, res) =>
    res.json({ requests: await service.listRequests(req.user.id) })
  );
  router.post("/requests", async (req, res) =>
    action(res, () => service.sendRequest(req.user.id, req.body?.username), 201)
  );
  router.post("/requests/:id/:action", async (req, res) => {
    if (!["accept", "decline"].includes(req.params.action))
      return res.status(400).json({ error: "INVALID_ACTION" });
    return action(res, () =>
      service.respond(req.user.id, req.params.id, req.params.action)
    );
  });
  router.delete("/requests/:id", async (req, res) =>
    action(res, () => service.cancel(req.user.id, req.params.id))
  );
  router.delete("/friends/:userId", async (req, res) =>
    action(res, () => service.removeFriend(req.user.id, req.params.userId))
  );
  router.get("/blocks", async (req, res) =>
    res.json({ blocks: await service.listBlocks(req.user.id) })
  );
  router.post("/blocks", async (req, res) =>
    action(res, () => service.block(req.user.id, req.body?.username), 201)
  );
  router.delete("/blocks/:userId", async (req, res) =>
    action(res, () => service.unblock(req.user.id, req.params.userId))
  );
  return router;
}

async function action(res, operation, status = 200) {
  try {
    return res.status(status).json({ result: await operation() });
  } catch (error) {
    return res
      .status(error.code === "INVALID_TARGET" ? 404 : 409)
      .json({ error: error.code || "SOCIAL_OPERATION_FAILED" });
  }
}

module.exports = { createSocialRouter };
