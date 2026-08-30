const { syncClerkUser } = require("./clerk");

function createSocketAuthMiddleware({
  prisma,
  clerkClient,
  authorizedParties
}) {
  return async function authenticateSocket(socket, next) {
    try {
      const token = socket.handshake.auth?.token;

      if (typeof token !== "string" || !token) {
        return next(new Error("AUTH_REQUIRED"));
      }

      const origin = socket.handshake.headers.origin;
      const headers = new Headers({
        authorization: `Bearer ${token}`
      });

      if (origin) headers.set("origin", origin);

      const request = new Request("http://checkless.local/socket.io", {
        method: "GET",
        headers
      });
      const requestState = await clerkClient.authenticateRequest(request, {
        acceptsToken: "session_token",
        authorizedParties
      });

      if (!requestState.isAuthenticated) {
        return next(new Error("AUTH_INVALID"));
      }

      const auth = requestState.toAuth();
      const user = await syncClerkUser(prisma, clerkClient, auth.userId);

      if (user.status === "SUSPENDED") {
        return next(new Error("ACCOUNT_SUSPENDED"));
      }

      socket.data.auth = {
        clerkUserId: auth.userId,
        sessionId: auth.sessionId,
        userId: user.id
      };
      socket.data.user = user;

      return next();
    } catch (error) {
      console.error("Socket authentication failed:", error.message);
      return next(new Error("AUTH_INVALID"));
    }
  };
}

module.exports = { createSocketAuthMiddleware };
