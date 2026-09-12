# Implementation review and fixes

Reviewed 2026-09-06 against the current working tree, including newer frontend API integrations. This is a review report: application code was not changed. Findings below distinguish reproduced failures, code-confirmed defects, and gaps that need integration verification. No finite review guarantees that every bug has been found.

## Evidence and limits

- Read backend services, routes, authentication, sockets, engine, Prisma schemas, frontend routing, API clients, hooks, game/replay/watch/social screens, and existing tests.
- Ran `npm test` in `backend`: all 15 tests passed. Those tests cover CMN, basic casual matchmaking/live moves, and move buffering. They do **not** exercise most features subsequently reported complete: ranked settlement, real database races, guest auth, reconnect, spectating, social, challenge, or admin flows.
- Ran isolated Node probes with synthetic data, without writing to PostgreSQL or starting another backend. Results: FEN `-` became `KQkq`; castling without a rook returned valid; requested knight promotion returned `Q`; simultaneous disconnect expiry returned both `black` and `white` winners; compatible ranked players remained queued without a new join event.
- No live moderation, account creation, schema migration, deployment, or external writes were performed. Concurrency findings are grounded in asynchronous code paths; real PostgreSQL race tests remain necessary. Database permissions/triggers were not inspected, so database-enforced audit immutability is unverified.

## Priority guide

P1 means fix before a public launch because a core flow, result integrity, or permission guarantee is broken. P2 means a functional/reliability issue or an incomplete required contract. P3 means usability or documentation debt. Suggested fixes are proposals, not completed changes.

## P1 — Launch blockers

### F01. Accepted challenges never become playable games

**Source:** `backend/src/services/challenge.js`, `accept`; `backend/src/routes/challenge.js`; `frontend/src/hooks/useChallenges.js`.

Acceptance only changes the record to `ACCEPTED`. No code creates a `CHALLENGE` game, attaches live participants, joins sockets, emits `game_start`, or changes the challenge to `STARTED`/`COMPLETED`. Accepted records also fall outside both cancellation and expiry filters and can remain stuck indefinitely.

**Fix:** implement an explicit ready/start service that atomically links one unrated game, reserves both verified identities, handles disconnected players, and settles the challenge when the game ends. Define cancellation/recovery for accepted-but-not-started records. **Verify:** accepting from two browsers starts exactly one playable public game and its final result is linked to the challenge.

### F02. Ranked rating-window expansion does not actually match waiting players

**Source:** `backend/src/services/matchmaking.js:14`, `ratingCompatible`.

Compatibility is evaluated only inside `join`. Two incompatible users already in the queue remain there after their windows expand; there is no queue scan/timer to pair them. Probe: ratings 1200/1500, advance queued timestamps by ten seconds, compatibility becomes true but zero games start.

**Fix:** add a periodic matchmaking pass preserving original queue times, with a shared match-publication path. **Verify:** two users match after the window expands without any additional client event.

### F03. Ranked players can abort to avoid a rated loss

**Source:** `backend/src/websocket/handlers.js:228`; `backend/src/services/live-game.js:400`; `frontend/src/components/Game.jsx`, match actions.

`abort_match` is available throughout an active game, including ranked games after moves. It settles `ABORTED` without a winner and thus without Elo loss. A losing player can invoke it instead of resignation. The opponent is nevertheless told they won, inconsistent with storage.

**Fix:** define a narrowly allowed pre-play abort policy; reject later aborts or settle them as resignations. Use the same authoritative result for storage and clients. **Verify:** a started ranked match cannot be abandoned without the appropriate rated loss.

### F04. Matchmaking reservations do not protect identities across awaits

**Source:** `backend/src/services/matchmaking.js:14`; `backend/src/services/live-game.js`, identity lookup helpers.

Only socket IDs are reserved while a database game is being created. A second socket belonging to the same account can queue/match while the first socket's game creation is pending. Ranked rating lookup also awaits before reserving a request: disconnect/cancel during that lookup can be followed by inserting the canceled socket into the queue. Finishing games are excluded from identity lookups, allowing a new match before settlement finishes.

**Fix:** reserve identity keys and request generations before the first await; invalidate pending work on leave/disconnect; retain reservations through settlement. **Verify:** concurrent same-account sockets, repeated joins, and disconnect during rating lookup never produce duplicate games or stale queue entries.

### F05. Concurrent games can overwrite ratings

**Source:** `backend/src/services/game-persistence.js:136`, rating reads and stats upserts.

The conditional game transition protects duplicate settlement of **one game**, which is good. It does not serialize different games sharing a player. Both transactions can read the same rating and later write absolute `rating: after`; even an unrated settlement writes an unchanged, potentially stale rating. F04 makes overlapping games possible. Incremented counters do not make the absolute rating writes safe.

**Fix:** lock both variant-stat rows in canonical user order, or use serializable transactions with bounded conflict retries; avoid rating writes for unrated games. Keep both Elo calculations based on the same pre-update pair. **Verify:** overlapping ranked settlements and ranked/casual settlement preserve every delta and do not deadlock.

### F06. Simultaneous disconnect deadlines can announce opposite winners

**Source:** `backend/src/services/live-game.js`, `tick`; `backend/src/websocket/handlers.js`, `startTimerTick`.

When both deadlines have expired in one tick, the loop marks the game finishing but continues processing the other color. The probe produced two expiry updates with opposite winners. Both are broadcast before durable settlement; the database may keep only one result.

**Fix:** select one terminal event deterministically, stop processing the game, and share one finalization promise/result. Specify the both-disconnected policy. **Verify:** simultaneous expiry emits one terminal result matching PostgreSQL; king capture before expiry remains final.

### F07. Startup recovery can interrupt another running server's games

**Source:** `backend/src/index.js`, `startServer`; `backend/src/services/game-persistence.js:282`.

Recovery marks every `ACTIVE` database game interrupted **before** successfully binding the port. Starting a second process against the same database can therefore change the first process's active games even if the second process subsequently fails with `EADDRINUSE`.

**Fix:** acquire exclusive process/game ownership before recovery (a database lease/lock suitable for the single-instance design). Refuse recovery without ownership. Binding first alone is insufficient across different ports/hosts. **Verify:** a duplicate startup cannot alter another live instance's games.

### F08. Guest play is blocked by frontend routing

**Source:** `frontend/src/App.jsx`, `/play` inside `ProtectedShell`; `frontend/src/components/Game.jsx`, guest token helper.

Guest token code exists, but a signed-out visitor cannot reach the Play component because `RequireAuth` redirects first.

**Fix:** make casual play reachable through an adaptive/public route while keeping ranked/social/admin authorization. **Verify:** a fresh signed-out browser obtains a guest token, plays a persisted casual game, and reclaims its seat.

### F09. Watch page cannot connect or discover games

**Source:** `frontend/src/pages/Watch.jsx`; `backend/src/middlewares/socket-auth.js`; socket handlers.

Watch creates a socket without `auth.token`, but the server rejects missing tokens. It also never emits `spectate_game`, and there is no live-list endpoint/subscription. `game_start` is sent only to matched players. Even with auth fixed, discovery stays empty. Snapshot fields expected by Watch (`players`, `sequence`) disagree with `participants`, `lastSequence`.

**Fix:** authenticate guest/human viewers, expose bounded public live discovery, explicitly subscribe, and use the actual snapshot contract. **Verify:** a third browser finds, joins, and follows an ongoing game.

### F10. Replay board never renders the supplied position

**Source:** `frontend/src/pages/GameDetails.jsx`; `frontend/src/components/app/MiniBoard.jsx`.

GameDetails supplies `fen`, but MiniBoard accepts only `className` and always renders a hardcoded piece map. Moving between replay frames does not change the board. GameDetails also does not subscribe to sockets for active games, so its live view is a one-time REST read.

**Fix:** render a read-only board from FEN and use the spectator protocol for active games. **Verify:** initial, intermediate, final, and live positions visually match persisted/server FENs.

### F11. Refresh loses the game seat recovery path

**Source:** `frontend/src/components/Game.jsx`, `activeGameIdRef`, connect and reconnect handlers.

The game ID exists only in a React ref. Reloading destroys it, so no reclaim request is sent. `reconnect_success` only updates an existing game state and cannot construct one; `reconnect_failed` is not handled. A game ending while the player is offline is not resolved back into the UI. Terminal/abort paths do not consistently clear the ref.

**Fix:** persist an identity-scoped active game reference or query the server for the current seat; return a complete reclaim snapshot (variant, color, sequence, current result), and handle failure/terminal recovery explicitly. **Verify:** refresh within ten seconds, refresh after expiry, and king capture while offline all reach the correct screen.

### F12. Castling validation and FEN rights are incorrect

**Source:** `backend/src/engine/chess.js`, `loadFen`, king validation, castling execution.

Loading FEN with rights `-` leaves constructor rights true. Castling does not require the correct rook on its original square or explicitly require the king's original file. Capturing a rook does not revoke its rights. This allows castling without a rook and can move whatever piece occupies the corner.

**Reproduced:** `new SimultaneousChess('4k3/8/8/8/8/8/8/4K3 w - - 0 1')` serializes rights as `KQkq`; `e1 -> g1` succeeds.

**Fix:** reset rights on every FEN load, validate king/rook starting squares and ownership, and revoke captured-rook rights. Preserve Checkless's intentional absence of check restrictions. Version any historical rule change. **Verify:** missing/enemy rook, captured rook, moved king, and no-rights FEN cases.

### F13. Social transactions do not protect concurrent relationship changes

**Source:** `backend/src/services/social.js:63`, `respond`, `block`, `cancel`.

Read-then-write transactions use no pair lock/serializable retry. Acceptance can read `PENDING`, then race cancellation/decline and overwrite it using an unconditional update by ID. Blocking can race acceptance: friendship deletion can finish before acceptance inserts a friendship, leaving a friendship alongside a block. The unique friendship pair only prevents duplicates, not these invariant violations.

**Fix:** serialize changes per canonical pair, use conditional pending-state claims, and retry serialization conflicts. **Verify:** accept/cancel, accept/decline, accept/block, and reverse accepts concurrently against PostgreSQL.

### F14. Suspension has a handshake race

**Source:** `backend/src/routes/admin.js`; `backend/src/middlewares/socket-auth.js`; `backend/src/services/presence.js`.

Suspension disconnects currently registered presence sockets. A handshake that already fetched an ACTIVE user can finish after suspension and register a new socket missed by that loop. Move/queue handlers trust cached user state afterward. Pending matchmaking can likewise complete with stale account eligibility.

**Fix:** coordinate socket admission and queue reservations with moderation state/version; revalidate admission after async auth and invalidate pending joins. **Verify:** hold auth/game creation in flight, suspend the user, then release it; no suspended identity is allowed to play.

## P2 — Correctness, contracts, and reliability

### F15. Spectator room lifecycle is incomplete

**Source:** `backend/src/websocket/handlers.js:97`, `leave_spectating`, terminal handlers.

Participants and spectators use the same room. A player can call `leave_spectating` on their own game and lose updates while retaining the seat. Normal king capture/resignation/forfeit never removes room memberships; abort notifies only the opponent, leaving spectators without a terminal event. A spectator joining a finishing game can miss an already-emitted result.

**Fix:** track subscription roles, protect participant membership, limit subscriptions, and publish/clean up every terminal event centrally. **Verify:** participant leave attempt, spectator abort observation, late join during finalization, and room cleanup after every ending.

### F16. Multi-game socket events lack game IDs and leak retry IDs to viewers

**Source:** `backend/src/websocket/handlers.js`, `moveEvent`, game-over and reconnect notices; `frontend/src/pages/Watch.jsx`.

Moves and most terminal notices omit `gameId`; a socket can subscribe to several games and cannot reliably attribute them. Watch explicitly expects that field. Shared room broadcasts also include `clientMoveId`, although viewers only need authoritative sequence/notation.

**Fix:** include gameId on all game events, filter frontend updates by ID/sequence, and keep request-specific identifiers in participant acknowledgments. **Verify:** watch two games without cross-contaminating boards or exposing client retry metadata.

### F17. Duplicate move handling can rewind clients and misattribute requests

**Source:** `backend/src/services/live-game.js:288`; `frontend/src/components/Game.jsx`, `move_made`.

The deduplication signature omits participant identity. Another player using a known move ID and matching coordinates receives the original player's success. Repeated older IDs return historical FENs; the frontend accepts every `move_made` without checking sequence and can roll back visually. Terminal retries are rejected before cache lookup because the game is no longer active.

**Fix:** bind cached requests to participant identity, process acknowledgments independently from current board state, reject stale sequences, and define a bounded terminal retry result cache. **Verify:** cross-player reuse, retry after later moves, and retry of king capture.

### F18. Async socket errors can become unhandled rejections

**Source:** `backend/src/websocket/handlers.js`, `resign_game`, presence `.then` chains.

Resignation awaits finalization without a catch. Presence database queries on connection/disconnection also have no rejection handlers. Socket.IO does not provide Express-style async route error forwarding. A database failure can create an unhandled rejection and, under normal Node defaults, terminate the process.

**Fix:** add guarded socket dispatch and explicit error/result handling. **Verify:** reject each relevant persistence promise and assert the server survives and clients get a consistent error/result.

### F19. Graceful shutdown can accept work during drain and hide failures

**Source:** `backend/src/index.js`, `shutdown`; `backend/src/services/live-game.js:479`.

New connections/queue work remain enabled while shutdown snapshots active games and awaits flushes. Games created afterward can be missed. `Promise.allSettled` results are discarded, so failed flush/interruption writes can still yield exit code zero. A finishing game's settlement can race shutdown interruption.

**Fix:** enter a draining state first, stop new admission/matches, await existing finalizations, flush the remaining games, and propagate failures. **Verify:** game creation during drain, finalization during drain, and injected write failures.

### F20. Rated snapshots and interruption statistics are incomplete

**Source:** `backend/src/services/game-persistence.js:20`, `finalizeGame`, `markGameInterrupted`, `recoverInterruptedGames`.

Rated participant snapshots are absent at game creation and populated only for winning terminal results. `finalizeGame` returns a game loaded before participant outcome/rating updates. Interruption helpers bypass statistics and omit finalFen, unlike other endings; no-result counters therefore depend on the path used.

**Fix:** store ratingBefore at start, return refreshed settled participants, and define one consistent interruption/no-result policy using the last durable FEN. **Verify:** completed, aborted, interrupted, and repeated finalizations return matching stored outcomes/counters.

### F21. Guest token expiration leaves the browser permanently retrying a bad token

**Source:** `frontend/src/components/Game.jsx`, `getGuestToken`; `backend/src/services/guest-identity.js`; `socket-auth.js`.

The client reuses any stored token forever without expiry/revocation recovery. Missing guest signing configuration also breaks Clerk socket login, because every Clerk JWT is first passed through guest HMAC verification, which throws before Clerk verification. Token parsing accepts trailing dot segments, and lastSeenAt writes on every connection despite the throttling requirement.

**Fix:** explicitly distinguish token types, validate configuration at startup, strictly parse tokens, throttle presence writes, and clear/reissue invalid guest tokens only for a signed-out identity. **Verify:** expired/revoked guest token, unavailable secret, and authenticated Clerk login independently.

### F22. Block enforcement is missing from search and challenges

**Source:** `backend/src/services/social.js`, `searchUsers`, `block`; `backend/src/services/challenge.js:56`.

Search does not exclude either direction of blocking. Blocking cancels pending friend requests but not challenges. Challenge acceptance never checks blocks or host suspension. A blocked/suspended host's existing code remains claimable.

**Fix:** apply the bidirectional interaction policy consistently and cancel pending challenges in the block transaction. **Verify:** both block directions hide search results and prevent code acceptance; suspended hosts cannot start games.

### F23. Reverse friend requests remain independently pending

**Source:** `backend/src/services/social.js`, `sendRequest`, `respond`.

Only the sender-to-receiver pending request is checked. A sends to B and B sends to A, leaving two pending requests. Accepting one does not resolve the other; its later acceptance fails on the unique friendship pair.

**Fix:** define one pending interaction per pair (or atomically accept the reverse request) and resolve both directional records consistently. **Verify:** reverse sends and retries produce one clear relationship state.

### F24. Outgoing requests are rendered as incoming

**Source:** `frontend/src/pages/Friends.jsx:64`.

`request.receiverId === viewerId || request.sender?.username !== undefined` is true for every backend request, because sender.username is always included. Users see themselves as the other party and receive accept/decline actions instead of cancel.

**Fix:** compare the verified local user ID or return an explicit request direction. **Verify:** one incoming and one outgoing request display the correct user and permitted buttons.

### F25. Presence is wrong for multiple tabs and missing on social pages

**Source:** `backend/src/services/presence.js`; socket online/offline handlers; frontend social hooks.

Closing any socket broadcasts `online: false` even if another socket remains. Presence is tied to the game/watch sockets; ordinary dashboard/friends usage does not register a shared authenticated socket, and social hooks do not subscribe to `friend_presence`. No initial online snapshot is supplied. Friend lookups can also complete after relationship removal, emitting a stale notification.

**Fix:** publish only first-connect/last-disconnect transitions, provide initial state and a shared authenticated frontend connection, and recheck relationship permissions before delivery. **Verify:** two tabs, dashboard-only session, reconnect, friendship acceptance/removal, and block during a pending presence lookup.

### F26. Challenge validation and expiration have holes

**Source:** `backend/src/services/challenge.js:9`, `lookup`; challenge routes.

Invalid variants reach Prisma rather than a request validator; code collisions are not retried. Lazy expiry reads OPEN then updates by ID only, so it can overwrite a status changed concurrently (for example cancellation). Unknown cancellation IDs return a successful count-zero response that the frontend treats as cancellation.

**Fix:** validate variant/code/IDs, generate from a uniform case-insensitive alphabet with collision retry, expire with conditional OPEN/time filters, and distinguish canceled/no-op/conflict responses. **Verify:** malformed input, forced collision, concurrent cancel/expiry, and stale cancellation.

### F27. Replay depends on the current engine and loads all moves unbounded

**Source:** `backend/src/services/public-game.js:140`.

Every replay request re-executes every move using today's engine, ignores rulesVersion, and rejects mismatched FENs. Future engine corrections can break historical games despite stored fenAfter snapshots. It loads all moves and constructs all frames per request. Participants are not included in the replay query, so its game summary unexpectedly has an empty participant array.

**Fix:** serve paginated stored frames/timing as the public replay source; run engine validation separately with the correct rules version. Include consistent participant summaries and sequence-integrity checks. **Verify:** old rules versions, very long games, missing sequences, and matching summary shapes.

### F28. GameDetails truncates moves and retains stale replay/error state

**Source:** `frontend/src/pages/GameDetails.jsx`.

It requests limit 200 but the server caps it at 50, then ignores nextCursor. Switching games does not clear prior errors/frames; a failed replay request is swallowed, potentially retaining another game's frames. Playback uses manual steps only, not elapsed-time playback. The king-capture label always says White captured the king.

**Fix:** follow cursors, reset all game-scoped state, surface replay failures, use stored elapsed timing, and derive result copy from winner. **Verify:** 51+ moves, navigating between games, replay failure, and Black king capture.

### F29. Promotion/en-passant contracts disagree with the engine

**Source:** `backend/src/engine/chess.js`, pawn/move logic; move validator; `docs/GAME-RULES.md`.

The API accepts q/r/b/n promotion but the engine always promotes to queen (reproduced with a7-a8, promotion n). En passant is described as maintained but has no implementation/state. This is a rules decision as well as a bug; do not silently apply standard turn-based en-passant semantics to simultaneous play.

**Fix:** either implement agreed promotion choices and explicitly defined simultaneous en-passant rules under a versioned engine, or narrow API/docs/UI to the intended supported rules. **Verify:** every promotion choice and the agreed en-passant expiry policy.

### F30. Premove side effects run inside React state updaters

**Source:** `frontend/src/components/Game.jsx`, `timer_update`; `frontend/src/main.jsx`.

Socket emission and a new UUID occur inside a setPremove updater nested in a setGameState updater. React StrictMode can invoke updaters more than once; different IDs defeat retry deduplication. Premove state also drops promotion choice. Ordinary move broadcasts omit canMove values, leaving stale readiness until the next tick.

**Fix:** keep updaters pure, dispatch each queued move once from a controlled effect/ref with one stable request ID, retain promotion, and include authoritative readiness in move responses. **Verify:** StrictMode executes one premove request and underpromotion is preserved.

### F31. Terminal UI and disconnect toast can misreport the result

**Source:** `frontend/src/components/Game.jsx`, `game_over`; `ui/OpponentDisconnectToast.jsx`.

Resignation copy says the opponent resigned even to the resigning player. No-winner interruption is reduced to generic game-over text. The countdown subtracts the browser clock from a server epoch, so clock skew can hide it immediately or display more than ten seconds. Clearing the toast locally does not mean the server has awarded a win.

**Fix:** derive result messages from local color, reason, and winner; base countdown on remainingMs plus a local monotonic clock or measured server offset; wait for server terminal confirmation. **Verify:** both player perspectives and a browser clock skewed by a minute.

### F32. Social lists and costly public operations lack bounds

**Source:** social list methods; replay service; guest/challenge creation routes; spectate handler.

Friends/requests/blocks return entire collections without cursors. Guest and challenge creation have no application rate limits; one socket can join unlimited spectator rooms. Replay computation is unbounded. These are concrete unbounded work paths; no load test establishes a safe launch capacity.

**Fix:** bounded cursor pagination, per-identity/IP creation limits, spectator room caps, and bounded replay reads; document intended limits. **Verify:** oversized request histories, repeated creations, and excess subscriptions fail predictably without unbounded resource growth.

### F33. Error responses and validation are inconsistent

**Source:** REST route modules, `rest-auth.js`, `index.js`.

Most social/admin/challenge inputs are string-coerced rather than validated. Mutation catches classify database/internal errors as 404/409, while uncaught Express errors use the default response format. Auth maps Clerk/DB outages to invalid credentials. Public cursor parsing silently restarts pagination for malformed values. Clients cannot reliably distinguish bad input, conflict, missing resource, and server outage.

**Fix:** add bounded Zod contracts and central JSON error mapping, keep safe internal logging, and return explicit 400/401/403/404/409/500/503 semantics. **Verify:** invalid types, malformed cursors, missing rows, and injected DB/Clerk failures.

### F34. Clerk identity synchronization is incomplete and expensive

**Source:** `backend/src/services/user.js`; authentication middleware; registered routes.

Every authenticated REST request/socket handshake fetches Clerk and upserts lastSeenAt. No webhook handler preserves clerkDeletedAt when an identity is administratively removed; the sync path always clears that field. This does not meet the blueprint's throttled writes and identity-deletion history behavior.

**Fix:** throttle sync/presence writes, add verified idempotent Clerk webhook processing, preserve removed identities, and keep local moderation authoritative. **Verify:** repeated requests do not each write presence, and administrative Clerk deletion retains history while disabling the identity.

## P3 — Hardening, maintainability, and documentation

### F35. Audit append-only enforcement is only at the application surface

**Source:** `backend/prisma/schema/admin.prisma`; `backend/src/services/admin.js`.

There are only create calls and no audit-edit API, which is appropriate. The checked-in schema permits nullable reasons and does not itself prevent UPDATE/DELETE. Database triggers/role grants were not inspected; therefore the stronger claim of database-enforced immutability is unverified.

**Fix:** document the enforcement boundary; review a migration/role policy enforcing nonblank moderation reasons and append-only audit access if that guarantee is required. Add an admin-only audit read path for operational review. **Verify:** the application DB role cannot modify/delete audit rows under that policy.

### F36. Social search performs asynchronous work during rendering

**Source:** `frontend/src/pages/Friends.jsx`, lastSearch/doSearch; frontend data hooks.

The component calls doSearch (including state updates and fetch) during render. It has no request cancellation/version check, allowing slow old searches to overwrite newer results. Some load-more hooks similarly append old user results after navigation.

**Fix:** move searches into effects with AbortController/request generations, and scope paginated results to the active query/user. **Verify:** rapidly change queries/profile routes with reversed response order.

### F37. Public identity and stats response contracts need cleanup

**Source:** `backend/src/services/public-game.js`, profile methods; `frontend/src/pages/PlayerProfile.jsx`.

Public username endpoints also accept Clerk IDs, coupling public URLs to authentication identifiers. Stats spread the Prisma row rather than explicitly selecting public fields. Profile variants are lowercase enum names whereas game variants are uppercase; frontend mappings are not consistent across both. New players get no default variant stats, and membership date is inferred from a stats row instead of account creation.

**Fix:** use canonical public usernames, explicit response projections, one variant convention, default variant ratings, and a public account-created timestamp. **Verify:** a brand-new player profile and its history display consistent labels and dates.

### F38. API-test and completion documentation overstate current behavior

**Source:** `docs/API-Test.md`, `docs/API.md`, `docs/V1.implementation.md`, current route registration.

API-Test says `/api/me` does not exist, but the current server registers it. Socket abort uses `opponent_aborted`, not a uniform `ABORTED` event reason. Several documented guarantees (automatic ranked expansion, complete reconnect, live Watch, challenge play) are not met as shown above. The same 15 passing tests were repeatedly cited for newly added features that those tests do not exercise.

**Fix:** update completion status and examples from current code after fixing each issue. Add targeted tests for actual invariants, especially authorization, races, and frontend contracts. **Verify:** each claimed complete feature has an end-to-end acceptance test or clearly stated manual verification evidence.

## Recommended repair order

1. Result integrity: F03–F07, F12, F17–F20. Add real PostgreSQL concurrency coverage for settlement and matchmaking reservations.
2. Complete playable flows: F01–F02, F08–F11, F15–F16, F21, F26–F31. Verify with two players and a third viewer.
3. Social and moderation correctness: F13–F14, F22–F25, F34–F36. Test concurrent requests and multiple browser tabs.
4. Bound work and align contracts: F27, F32–F33, F37–F38. Update launch status only after the corresponding checks pass.

Tournaments and bots remain intentionally deferred. Redis/multiple backend instances are also not required for the stated single-process V1. The five-second move-buffer crash-loss window is an accepted architectural tradeoff, not by itself a new bug.
