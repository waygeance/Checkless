const { syncClerkUser } = require("../services/user");
const { resolveGuestIdentity } = require("../services/guest-identity");

function createSocketAuthMiddleware({
  prisma,
  clerkClient,
  authorizedParties
}) {
  return async function authenticateSocket(socket, next) {
    try {
      const token = socket.handshake.auth?.token;

      if (typeof token !== "string" || !token)
        return next(new Error("AUTH_REQUIRED"));

      const guest = await resolveGuestIdentity(prisma, token);
      if (guest) {
        socket.data.auth = { guestIdentityId: guest.id };
        socket.data.identity = { type: "guest", id: guest.id, guest };
        socket.data.user = {
          id: guest.id,
          username: guest.publicAlias,
          displayName: guest.publicAlias,
          avatarUrl: null,
          kind: "GUEST"
        };
        return next();
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
      socket.data.identity = { type: "human", id: user.id, user };
      socket.data.user = user;

      return next();
    } catch (error) {
      console.error("Socket authentication failed:", error.message);
      return next(new Error("AUTH_INVALID"));
    }
  };
}

module.exports = { createSocketAuthMiddleware };
