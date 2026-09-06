const { syncClerkUser } = require("../services/user");

function createRequireAuth({ prisma, clerkClient, authorizedParties }) {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
      if (!token) return res.status(401).json({ error: "AUTH_REQUIRED" });
      const headers = new Headers({ authorization: `Bearer ${token}` });
      const origin = req.headers.origin;
      if (origin) headers.set("origin", origin);
      const state = await clerkClient.authenticateRequest(
        new Request("http://checkless.local/api", { headers }),
        { acceptsToken: "session_token", authorizedParties }
      );
      if (!state.isAuthenticated)
        return res.status(401).json({ error: "AUTH_INVALID" });
      const user = await syncClerkUser(
        prisma,
        clerkClient,
        state.toAuth().userId
      );
      if (user.status === "SUSPENDED")
        return res.status(403).json({ error: "ACCOUNT_SUSPENDED" });
      req.user = user;
      next();
    } catch {
      res.status(401).json({ error: "AUTH_INVALID" });
    }
  };
}

module.exports = { createRequireAuth };
