# Checkless API Test Guide

This is the manual smoke-test checklist for the current backend.

## Environment

```bash
API=http://localhost:8081
SOCKET=$API
```

Authenticated REST requests use a Clerk session token:

```bash
curl -H "Authorization: Bearer $CLERK_SESSION_TOKEN" "$API/api/me"
```

The current server does not expose `/api/me` yet; use the token for the
`/api/social`, `/api/challenges`, and `/api/admin` examples below. Public and
guest-token endpoints do not require a Clerk token.

## 1. Health

```bash
curl "$API/"
curl "$API/health"
```

Expected: HTTP `200` and `{ "ok": true }`.

## 2. Guest identity

```bash
curl -X POST "$API/api/guest"
```

Expected HTTP `201`:

```json
{
  "token": "signed.opaque.token",
  "guestId": "cm...",
  "publicAlias": "Guest-A1B2C3"
}
```

Store `token` and send it as the Socket.IO handshake `auth.token`.

## 3. Public games, moves, and replay

```bash
curl "$API/api/games/GAME_ID"
curl "$API/api/games/GAME_ID/moves?limit=20"
curl "$API/api/games/GAME_ID/moves?limit=20&cursor=NEXT_CURSOR"
curl "$API/api/games/GAME_ID/replay"
curl "$API/api/games?limit=20"
curl "$API/api/users/USERNAME"
curl "$API/api/users/USERNAME/games?limit=20"
```

Expected: HTTP `200`. Missing IDs return HTTP `404`. Public responses contain
participant snapshots, CMN, FENs, elapsed time, and outcomes, but never Clerk
IDs, guest IDs, client move IDs, or moderation data.

## 4. Social/friends API (Clerk required)

Set:

```bash
AUTH="Authorization: Bearer $CLERK_SESSION_TOKEN"
```

```bash
curl -H "$AUTH" "$API/api/social/search?q=alice"
curl -H "$AUTH" "$API/api/social/friends"
curl -H "$AUTH" "$API/api/social/requests"

curl -X POST -H "$AUTH" -H 'Content-Type: application/json' \\
  -d '{"username":"alice"}' "$API/api/social/requests"

curl -X POST -H "$AUTH" "$API/api/social/requests/REQUEST_ID/accept"
curl -X POST -H "$AUTH" "$API/api/social/requests/REQUEST_ID/decline"
curl -X DELETE -H "$AUTH" "$API/api/social/requests/REQUEST_ID"
curl -X DELETE -H "$AUTH" "$API/api/social/friends/USER_ID"

curl -H "$AUTH" "$API/api/social/blocks"
curl -X POST -H "$AUTH" -H 'Content-Type: application/json' \\
  -d '{"username":"alice"}' "$API/api/social/blocks"
curl -X DELETE -H "$AUTH" "$API/api/social/blocks/USER_ID"
```

Expected: HTTP `200`/`201`. Verify self-targets, duplicates, blocked users, and
reverse friendships are rejected. Missing authentication returns `401`;
invalid social operations return `404` or `409`.

## 5. Challenges (Clerk required)

```bash
curl -X POST -H "$AUTH" -H 'Content-Type: application/json' \\
  -d '{"variant":"3s"}' "$API/api/challenges"

curl -H "$AUTH" "$API/api/challenges/CODE"
curl -X POST -H "$AUTH" "$API/api/challenges/CODE/accept"
curl -X DELETE -H "$AUTH" "$API/api/challenges/CHALLENGE_ID"
```

Challenge creation returns HTTP `201`, a cryptographically random code, and an
expiry about 15 minutes in the future. Acceptance is atomic: send two requests
at the same time and verify only one receives success. Expired or canceled
challenges return `CHALLENGE_UNAVAILABLE`.

## 6. Admin moderation (ADMIN role required)

```bash
curl -H "$AUTH" "$API/api/admin/users?q=alice"
curl -H "$AUTH" "$API/api/admin/games?q=GAME_ID"

curl -X POST -H "$AUTH" -H 'Content-Type: application/json' \\
  -d '{"reason":"Spam confirmed by moderation review"}' \\
  "$API/api/admin/users/USER_ID/suspend"

curl -X POST -H "$AUTH" -H 'Content-Type: application/json' \\
  -d '{"reason":"Appeal reviewed and accepted"}' \\
  "$API/api/admin/users/USER_ID/restore"
```

Verify an empty or missing reason returns `400`, a non-admin returns `403`, and
each successful mutation creates one append-only `AdminAuditLog`. Suspending a
connected user must disconnect their active sockets and prevent reconnection.

## 7. Socket.IO connection

Connect with either a Clerk session token or a guest token:

```js
import { io } from "socket.io-client";
const socket = io("http://localhost:8081", {
  auth: { token: GUEST_TOKEN },
  transports: ["websocket"]
});
```

### Matchmaking and game actions

```js
socket.emit("find_game", { mode: "CASUAL", variant: "3s" });
socket.emit("find_game", { mode: "RANKED", variant: "3s" });
socket.emit("abort_match", { gameId });
socket.emit("resign_game", { gameId });
socket.emit("make_move", {
  gameId,
  clientMoveId: crypto.randomUUID(),
  move: { from: "e2", to: "e4" }
});
socket.emit("latency_ping", { clientAt: Date.now() }, console.log);
```

Listen for `waiting`, `game_start`, `timer_update`, `move_made`,
`move_rejected`, `matchmaking_error`, `match_aborted`, and `game_over`.

### Reconnect and spectating

```js
socket.emit("reconnect_game", { gameId });
socket.emit("spectate_game", { gameId });
socket.emit("leave_spectating", { gameId });
```

Listen for `reconnect_success`, `reconnect_failed`,
`opponent_disconnected`, `opponent_reconnected`, `spectate_started`,
`spectate_failed`, `spectating_left`, and `friend_presence`.

## Expected terminal reasons

`KING_CAPTURED`, `RESIGNATION`, `DISCONNECT_FORFEIT`, `ABORTED`, and
`SERVER_INTERRUPTED`. Ranked results update Elo only for a real winner; aborts
and server interruptions are no-result outcomes.

## Recommended test order

1. Health and guest token.
2. Two guest sockets: casual matchmaking, moves, resignation, reconnect.
3. Public game and replay endpoints using the resulting game ID.
4. Two authenticated users: friends, blocks, and presence.
5. Challenge creation, concurrent acceptance, cancellation, expiration.
6. Ranked matchmaking and rating changes.
7. Admin search, suspend, disconnect, audit, and restore.
