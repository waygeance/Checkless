const { Router } = require("express");
const { issueGuestIdentity } = require("../services/guest-identity");

function createGuestRouter(prisma) {
  const router = Router();
  router.post("/", async (_req, res) => {
    try {
      const { guest, token } = await issueGuestIdentity(prisma);
      res
        .status(201)
        .json({ token, guestId: guest.id, publicAlias: guest.publicAlias });
    } catch (error) {
      res.status(503).json({ error: "GUEST_IDENTITY_UNAVAILABLE" });
    }
  });
  return router;
}

module.exports = { createGuestRouter };
