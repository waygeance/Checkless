const { SimultaneousChess } = require("../engine/chess");

const MAX_PAGE_SIZE = 50;

function pageSize(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed)
    ? Math.min(Math.max(parsed, 1), MAX_PAGE_SIZE)
    : 20;
}

function cursor(value) {
  if (!value) return null;
  try {
    return Buffer.from(value, "base64url").toString("utf8") || null;
  } catch {
    return null;
  }
}

function nextCursor(value) {
  return Buffer.from(String(value)).toString("base64url");
}

function historyCursorWhere(value) {
  if (!value) return {};
  const [endedAt, id] = value.split("|");
  const date = new Date(endedAt);
  if (!id || Number.isNaN(date.getTime())) return {};
  return { OR: [{ endedAt: { lt: date } }, { endedAt: date, id: { lt: id } }] };
}

function participantView(participant) {
  return {
    color: participant.color.toLowerCase(),
    outcome: participant.outcome.toLowerCase(),
    username: participant.usernameSnapshot,
    displayName: participant.displayNameSnapshot,
    avatarUrl: participant.avatarUrlSnapshot,
    ratingBefore: participant.ratingBefore,
    ratingAfter: participant.ratingAfter,
    ratingDelta: participant.ratingDelta
  };
}

function gameView(game) {
  return {
    id: game.id,
    mode: game.mode.toLowerCase(),
    variant: game.variant,
    status: game.status.toLowerCase(),
    rated: game.rated,
    rulesVersion: game.rulesVersion,
    initialFen: game.initialFen,
    finalFen: game.finalFen,
    winner: game.winnerColor?.toLowerCase() ?? null,
    endReason: game.endReason?.toLowerCase() ?? null,
    lastSequence: game.lastSequence,
    startedAt: game.startedAt,
    endedAt: game.endedAt,
    participants: game.participants?.map(participantView) ?? []
  };
}

function moveView(move) {
  return {
    sequence: move.sequence,
    notation: move.notation,
    color: move.color.toLowerCase(),
    from: move.fromSquare,
    to: move.toSquare,
    piece: move.piece,
    capturedPiece: move.capturedPiece,
    promotionPiece: move.promotionPiece,
    fenAfter: move.fenAfter,
    elapsedMs: move.elapsedMs,
    whiteCooldownMsAfter: move.whiteCooldownMsAfter,
    blackCooldownMsAfter: move.blackCooldownMsAfter,
    acceptedAt: move.acceptedAt
  };
}

class PublicGameService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async getGame(gameId) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: { participants: { orderBy: { color: "asc" } } }
    });
    return game ? gameView(game) : null;
  }

  async getMoves(gameId, query) {
    const limit = pageSize(query.limit);
    const after = cursor(query.cursor);
    const sequence = after ? Number.parseInt(after, 10) : null;
    const rows = await this.prisma.gameMove.findMany({
      where: {
        gameId,
        ...(Number.isInteger(sequence) ? { sequence: { gt: sequence } } : {})
      },
      orderBy: { sequence: "asc" },
      take: limit + 1
    });
    const hasMore = rows.length > limit;
    const moves = rows.slice(0, limit).map(moveView);
    return {
      moves,
      nextCursor: hasMore ? nextCursor(moves[moves.length - 1].sequence) : null
    };
  }

  async listCompleted(query) {
    const limit = pageSize(query.limit);
    const after = cursor(query.cursor);
    const games = await this.prisma.game.findMany({
      where: {
        endedAt: { not: null },
        ...historyCursorWhere(after)
      },
      orderBy: [{ endedAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      include: { participants: { orderBy: { color: "asc" } } }
    });
    const page = games.slice(0, limit).map(gameView);
    return {
      games: page,
      nextCursor:
        games.length > limit
          ? nextCursor(
              `${page[page.length - 1].endedAt.toISOString()}|${page[page.length - 1].id}`
            )
          : null
    };
  }

  async replay(gameId) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: { moves: { orderBy: { sequence: "asc" } } }
    });
    if (!game) return null;
    const chess = new SimultaneousChess(game.initialFen);
    const frames = [{ sequence: 0, fen: chess.fen(), elapsedMs: 0 }];
    for (const move of game.moves) {
      const result = chess.move(
        {
          from: move.fromSquare,
          to: move.toSquare,
          promotion: move.promotionPiece?.toLowerCase()
        },
        move.color === "WHITE" ? "w" : "b"
      );
      if (!result.valid || chess.fen() !== move.fenAfter) {
        throw new Error(`REPLAY_MISMATCH:${gameId}:${move.sequence}`);
      }
      frames.push({
        sequence: move.sequence,
        fen: move.fenAfter,
        elapsedMs: move.elapsedMs
      });
    }
    return { game: gameView(game), frames };
  }

  async getProfile(username) {
    const user = await this.prisma.user.findUnique({
      where: { normalizedUsername: username.toLowerCase() },
      include: { variantStats: true }
    });
    if (!user) return null;
    return {
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      kind: user.kind.toLowerCase(),
      stats: user.variantStats.map((stat) => ({
        ...stat,
        variant: stat.variant.toLowerCase(),
        userId: undefined,
        id: undefined
      }))
    };
  }

  async listPlayerGames(username, query) {
    const user = await this.prisma.user.findUnique({
      where: { normalizedUsername: username.toLowerCase() },
      select: { id: true }
    });
    if (!user) return null;
    const limit = pageSize(query.limit);
    const after = cursor(query.cursor);
    const games = await this.prisma.game.findMany({
      where: {
        endedAt: { not: null },
        participants: { some: { userId: user.id } },
        ...historyCursorWhere(after)
      },
      orderBy: [{ endedAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      include: { participants: { orderBy: { color: "asc" } } }
    });
    const page = games.slice(0, limit).map(gameView);
    return {
      games: page,
      nextCursor:
        games.length > limit
          ? nextCursor(
              `${page[page.length - 1].endedAt.toISOString()}|${page[page.length - 1].id}`
            )
          : null
    };
  }
}

module.exports = { PublicGameService, gameView, moveView };
