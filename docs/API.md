# WebSocket API Reference

The Checkless backend communicates with the frontend almost exclusively over Socket.io. Below is a reference of the events emitted by the client and the events broadcasted by the server.

## Client-to-Server Events

### `find_game`

Requests to join the matchmaking queue.

- **Payload**: `{ variant: string }` (e.g. "1s", "3s", "5s")
- **Behavior**: The server attempts to find another player in the queue for the requested variant. If found, a game starts. If not, the player waits in the queue.

### `abort_match`

Requests to cancel matchmaking or concede an active game.

- **Payload**: `{ gameId?: string }`
- **Behavior**: If in queue, removes the player. If in a game, ends the game and alerts the opponent.

### `make_move`

Attempts to execute a chess move.

- **Payload**: `{ gameId: string, clientMoveId?: UUID, move: { from: string, to: string, promotion?: string } }`
- **Behavior**: The server validates the move. If legal and the player's timer is at 0, the move is executed.
- **Idempotency**: Current clients always send a new `clientMoveId` for an
  intended move and reuse it for retries. It is temporarily optional for older
  clients; duplicate protection cannot be guaranteed when it is absent.

### `latency_ping`

Requests a ping timestamp to calculate network latency.

- **Payload**: `{ clientAt: number }`
- **Response Callback**: `({ clientAt: number, serverAt: number })`

## Server-to-Client Events

### `waiting`

Sent when a player joins the queue and is waiting for an opponent.

- **Payload**: `{ message: string }`

### `game_start`

Sent when a match is found and the game begins.

- **Payload**:
  ```json
  {
    "gameId": "string",
    "color": "white" | "black",
    "variant": "string",
    "fen": "string"
  }
  ```

### `timer_update`

Sent every 100ms by the global game tick to sync client timers.

- **Payload**:
  ```json
  {
    "gameId": "string",
    "white": "number (ms)",
    "black": "number (ms)",
    "whiteCanMove": "boolean",
    "blackCanMove": "boolean"
  }
  ```

### `move_made`

Broadcasted to all players in a game when a valid move is executed.

- **Payload**:
  ```json
  {
    "clientMoveId": "UUID | null",
    "sequence": "number",
    "notation": "string (CMN v1)",
    "move": {
      "from": "string",
      "to": "string",
      "captured": "string | undefined"
    },
    "fen": "string",
    "timers": { "white": "number", "black": "number" },
    "whiteCanMove": "boolean",
    "blackCanMove": "boolean"
  }
  ```
- **Ordering**: `sequence` is the authoritative global move order. `notation`
  is the server-generated readable form, for example `(4)B:f6xg4`.

### `move_rejected`

Sent directly to the offending player if they attempt an invalid move or move before their timer is ready.

- **Payload**: `{ reason: string }`

### `game_over`

Broadcasted when a win condition is met, or a player disconnects/aborts.

- **Payload**:
  ```json
  {
    "reason": "KING_CAPTURED" | "opponent_disconnected" | "opponent_aborted" | "SERVER_INTERRUPTED",
    "winner": "white" | "black" | null,
    "capturedPiece": "string | undefined",
    "capturedBy": "string | undefined",
    "sequence": "number | undefined",
    "notation": "string (CMN v1) | undefined",
    "move": { "from": "string", "to": "string" },
    "fen": "string",
    "timers": { "white": "number", "black": "number" }
  }
  ```

`sequence` and `notation` are present when `reason` is `KING_CAPTURED`; other
terminal reasons are not caused by an accepted move.

`SERVER_INTERRUPTED` is emitted with no winner if durable move persistence fails
while a game is active. It includes the same board/timer snapshot fields, but
does not include a move-specific `sequence` or `notation`.

### `matchmaking_error`

Sent when a validated matchmaking request cannot produce a durable game.

- **Payload**: `{ reason: string, message: string }`
- **Behavior**: `game_start` is never emitted unless the `Game` and both
  participant rows were committed successfully.

### `match_aborted`

Sent when a match is successfully aborted, returning the player to the lobby.

- **Payload**: `{ message: string }`
