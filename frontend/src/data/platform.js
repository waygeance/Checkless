export const ratings = [
  { label: "1s", value: 1428, delta: 18 },
  { label: "3s", value: 1516, delta: 9 },
  { label: "5s", value: 1472, delta: -4 }
];

export const recentGames = [
  {
    id: "game-cafe-1042",
    opponent: "VelvetKnight",
    result: "WIN",
    variant: "3s",
    elapsed: "2m 14s",
    delta: "+14",
    reason: "King captured",
    playedAt: "Today, 18:42"
  },
  {
    id: "game-cafe-1038",
    opponent: "QuietRook",
    result: "LOSS",
    variant: "1s",
    elapsed: "58s",
    delta: "−11",
    reason: "King captured",
    playedAt: "Today, 17:09"
  },
  {
    id: "game-cafe-1029",
    opponent: "BishopAndBean",
    result: "WIN",
    variant: "5s",
    elapsed: "4m 03s",
    delta: "+9",
    reason: "Disconnect forfeit",
    playedAt: "Yesterday"
  },
  {
    id: "game-cafe-1017",
    opponent: "OpenFile",
    result: "WIN",
    variant: "3s",
    elapsed: "2m 48s",
    delta: "+12",
    reason: "King captured",
    playedAt: "Yesterday"
  }
];

export const liveGames = [
  {
    id: "live-amber-14",
    white: "CoffeeGambit",
    black: "QuietRook",
    variant: "3s",
    sequence: 23,
    viewers: 84
  },
  {
    id: "live-amber-09",
    white: "Fianchetto",
    black: "VelvetKnight",
    variant: "1s",
    sequence: 41,
    viewers: 51
  },
  {
    id: "live-amber-03",
    white: "OldBook",
    black: "OpenFile",
    variant: "5s",
    sequence: 17,
    viewers: 29
  }
];

export const friends = [
  {
    username: "VelvetKnight",
    status: "In a 3s game",
    online: true,
    rating: 1582
  },
  {
    username: "BishopAndBean",
    status: "Available",
    online: true,
    rating: 1491
  },
  {
    username: "QuietRook",
    status: "Watching live",
    online: true,
    rating: 1538
  },
  { username: "OldBook", status: "Seen yesterday", online: false, rating: 1444 }
];

export const challenges = [
  {
    id: "CH-47A2",
    direction: "INCOMING",
    username: "BishopAndBean",
    variant: "3s",
    expires: "11 min"
  },
  {
    id: "CH-1C8F",
    direction: "OUTGOING",
    username: "VelvetKnight",
    variant: "5s",
    expires: "7 min"
  }
];

export const tournaments = [
  {
    id: "open-king-2026",
    name: "The Open King",
    format: "Swiss",
    variant: "3s",
    entrants: 64,
    capacity: 96,
    status: "REGISTRATION",
    starts: "Saturday · 19:00 UTC",
    description: "Seven brisk rounds beneath the café lamps."
  },
  {
    id: "midnight-rooks",
    name: "Midnight Rooks",
    format: "Round robin",
    variant: "1s",
    entrants: 12,
    capacity: 12,
    status: "ACTIVE",
    starts: "Round 4 in progress",
    description: "A compact invitational for fearless clockwork players."
  },
  {
    id: "slow-pour-cup",
    name: "Slow Pour Cup",
    format: "Swiss",
    variant: "5s",
    entrants: 27,
    capacity: 40,
    status: "REGISTRATION",
    starts: "Sep 12 · 16:00 UTC",
    description: "Longer cooldowns, quieter tables, deeper traps."
  }
];

export const ratingHistory = [
  { match: "Aug 18", rating: 1420 },
  { match: "Aug 20", rating: 1444 },
  { match: "Aug 22", rating: 1431 },
  { match: "Aug 25", rating: 1476 },
  { match: "Aug 28", rating: 1492 },
  { match: "Sep 1", rating: 1516 }
];

export const leaderboard = [
  { rank: 1, username: "TempoMerchant", rating: 2241 },
  { rank: 2, username: "KingHunter", rating: 2198 },
  { rank: 3, username: "OpenFile", rating: 2144 },
  { rank: 4, username: "VelvetKnight", rating: 2089 }
];

export const pairings = [
  { board: 1, white: "TempoMerchant", black: "OpenFile", result: "Playing" },
  { board: 2, white: "VelvetKnight", black: "OldBook", result: "1–0" },
  { board: 3, white: "QuietRook", black: "BishopAndBean", result: "Playing" },
  { board: 4, white: "Fianchetto", black: "CoffeeGambit", result: "0–1" }
];
