import { useEffect, useState } from "react";
import { useUser } from "@clerk/react";
import { Filter, Search } from "lucide-react";
import { listPlayerGames } from "../api/users";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  InfiniteList,
  Input,
  PageHeader
} from "../components/ui";
import { getPlayerUsername } from "../lib/user";

const VARIANT_LABELS = {
  ONE_SECOND: "1s",
  THREE_SECONDS: "3s",
  FIVE_SECONDS: "5s"
};

const END_REASON_LABELS = {
  king_captured: "King captured",
  disconnect_forfeit: "Disconnect forfeit",
  resignation: "Resignation",
  aborted: "Aborted",
  server_interrupted: "Server interrupted",
  admin_terminated: "Admin terminated"
};

function relativeDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor((now - date) / 86400000);
  if (diffDays === 0)
    return `Today, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

function elapsedLabel(game) {
  if (!game.startedAt || !game.endedAt) return "";
  const ms = new Date(game.endedAt) - new Date(game.startedAt);
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default function Games() {
  const { user, isLoaded } = useUser();
  const username = getPlayerUsername(user);

  const [games, setGames] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const load = async (cursor = null, replace = true) => {
    if (!username) {
      setLoading(false);
      return;
    }
    if (replace) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    try {
      const res = await listPlayerGames(username, { limit: 20, cursor });
      if (replace) {
        setGames(res.games ?? []);
      } else {
        setGames((prev) => [...prev, ...(res.games ?? [])]);
      }
      setNextCursor(res.nextCursor ?? null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    load();
  }, [username, isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Client-side search filter (opponent name or game ID)
  const filtered = search.trim()
    ? games.filter((g) => {
        const q = search.toLowerCase();
        return (
          g.id.toLowerCase().includes(q) ||
          g.participants?.some((p) => p.username?.toLowerCase().includes(q))
        );
      })
    : games;

  const getOpponent = (game) => {
    const opp = game.participants?.find(
      (p) => p.username?.toLowerCase() !== username?.toLowerCase()
    );
    return opp?.username ?? "Unknown";
  };

  const getMyOutcome = (game) => {
    const me = game.participants?.find(
      (p) => p.username?.toLowerCase() === username?.toLowerCase()
    );
    return me?.outcome ?? "no_result";
  };

  const getMyDelta = (game) => {
    const me = game.participants?.find(
      (p) => p.username?.toLowerCase() === username?.toLowerCase()
    );
    if (me?.ratingDelta == null) return null;
    return me.ratingDelta >= 0 ? `+${me.ratingDelta}` : `${me.ratingDelta}`;
  };

  return (
    <div>
      <PageHeader
        eyebrow="Game journal"
        title="Your games"
        description="A durable record of accepted moves, outcomes, and rating changes across every cooldown."
      />
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-muted/50" />
            <Input
              className="pl-10"
              placeholder="Search opponent or game ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" icon={Filter} onClick={() => load()}>
            Refresh
          </Button>
        </div>
      </Card>

      {error && <ErrorState error={error} onRetry={() => load()} className="mt-4" />}

      <div className="mt-5">
        <InfiniteList
          loading={loading}
          loadingMore={loadingMore}
          nextCursor={search.trim() ? null : nextCursor}
          onLoadMore={() => load(nextCursor, false)}
          empty={
            <p className="py-12 text-center text-sm text-cream-muted/60">
              No games yet. Take a seat at the table!
            </p>
          }
        >
          <div className="space-y-3">
            {filtered.map((game) => {
              const outcome = getMyOutcome(game);
              const isWin = outcome === "win";
              const isLoss = outcome === "loss";
              const delta = getMyDelta(game);
              const variantLabel = VARIANT_LABELS[game.variant] ?? game.variant;
              const endReason = END_REASON_LABELS[game.endReason] ?? game.endReason ?? "";

              return (
                <Card
                  key={game.id}
                  className="grid gap-5 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full border font-display text-sm font-bold ${
                      isWin
                        ? "border-lime/30 bg-lime/10 text-lime"
                        : isLoss
                        ? "border-danger/30 bg-danger/10 text-danger"
                        : "border-cream/15 bg-cream/5 text-cream-muted"
                    }`}
                  >
                    {isWin ? "W" : isLoss ? "L" : "—"}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-cream">
                        vs {getOpponent(game)}
                      </h2>
                      <Badge tone="brass">{variantLabel}</Badge>
                      {endReason && <Badge>{endReason}</Badge>}
                    </div>
                    <p className="mt-2 text-xs text-cream-muted">
                      {relativeDate(game.endedAt)} · {elapsedLabel(game)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 sm:justify-end">
                    {delta && (
                      <span
                        className={`font-mono text-sm ${isWin ? "text-lime" : "text-danger"}`}
                      >
                        {delta}
                      </span>
                    )}
                    <Button to={`/games/${game.id}`} size="small" variant="outline">
                      Open replay
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </InfiniteList>
      </div>
    </div>
  );
}
