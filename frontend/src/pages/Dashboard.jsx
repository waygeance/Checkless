import { useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ChevronRight,
  CircleDot,
  Flame,
  Swords,
  Trophy,
  Users,
  Zap
} from "lucide-react";
import { listPlayerGames } from "../api/users";
import { getProfile } from "../api/users";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  LoadingState,
  PageHeader,
  Progress,
  SketchDivider
} from "../components/ui";

const VARIANT_META = {
  ONE_SECOND: { label: "1s", title: "Lightning", note: "Pure reflex", icon: Zap },
  THREE_SECONDS: { label: "3s", title: "House blend", note: "Fast and balanced", icon: Swords },
  FIVE_SECONDS: { label: "5s", title: "Slow pour", note: "Room to scheme", icon: CircleDot }
};

const reveal = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

/** Format variant enum string into display label */
function variantLabel(variant) {
  if (!variant) return "";
  return VARIANT_META[variant]?.label ?? variant.replace("_SECONDS", "s").replace("ONE_SECOND", "1s");
}

/** Format ISO date to relative label */
function relativeDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor((now - date) / 86400000);
  if (diffDays === 0) return `Today, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

/** Derive opponent from game participants */
function getOpponent(game, myUsername) {
  const opponent = game.participants?.find(
    (p) => p.username?.toLowerCase() !== myUsername?.toLowerCase()
  );
  return opponent?.username ?? "Unknown";
}

/** Derive my outcome from participants */
function getMyOutcome(game, myUsername) {
  const me = game.participants?.find(
    (p) => p.username?.toLowerCase() === myUsername?.toLowerCase()
  );
  return me?.outcome ?? "no_result";
}

/** Get rating delta for my participant */
function getMyDelta(game, myUsername) {
  const me = game.participants?.find(
    (p) => p.username?.toLowerCase() === myUsername?.toLowerCase()
  );
  if (me?.ratingDelta == null) return null;
  return me.ratingDelta >= 0 ? `+${me.ratingDelta}` : `${me.ratingDelta}`;
}

export default function Dashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const firstName = user?.firstName || user?.username || "Player";
  const username = user?.username;

  const [variantStats, setVariantStats] = useState([]);
  const [recentGames, setRecentGames] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [gamesLoading, setGamesLoading] = useState(true);

  // Fetch profile for variant stats
  useEffect(() => {
    if (!username) return;
    const controller = new AbortController();
    getProfile(username, undefined, controller.signal)
      .then((res) => {
        setVariantStats(res.profile?.stats ?? []);
        setStatsLoading(false);
      })
      .catch(() => setStatsLoading(false));
    return () => controller.abort();
  }, [username]);

  // Fetch recent games
  useEffect(() => {
    if (!username) return;
    const controller = new AbortController();
    listPlayerGames(username, { limit: 4 }, undefined, controller.signal)
      .then((res) => {
        setRecentGames(res.games ?? []);
        setGamesLoading(false);
      })
      .catch(() => setGamesLoading(false));
    return () => controller.abort();
  }, [username]);

  // Build variant cards from real stats
  const variantCards = Object.entries(VARIANT_META).map(([key, meta], index) => {
    const stat = variantStats.find((s) => s.variant === key.toLowerCase());
    const Icon = meta.icon;
    return {
      key,
      label: meta.label,
      title: meta.title,
      note: meta.note,
      rating: stat?.rating ?? 1200,
      Icon,
      index
    };
  });

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.06 } } }}
    >
      <motion.div variants={reveal}>
        <PageHeader
          eyebrow="Your table is ready"
          title={`Good evening, ${firstName}.`}
          description="Pick a pace, revisit your latest positions, or pull up a chair at this week's tournament."
          action={
            <Button to="/play" size="large" icon={Swords}>
              Find a game
            </Button>
          }
        />
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.7fr)]">
        <motion.div variants={reveal}>
          <Card tone="parchment" className="p-6 sm:p-8">
            <CardHeader eyebrow="Quick match" title="Choose your house pace">
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-roasted/65">
                Casual tables are open. Ranked matchmaking is available for authenticated players.
              </p>
            </CardHeader>
            <SketchDivider className="my-4" />
            {statsLoading ? (
              <LoadingState text="Loading ratings…" />
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                {variantCards.map(({ key, label, title, note, rating, Icon, index }) => (
                  <motion.div
                    key={key}
                    whileHover={{ y: -3 }}
                    className={`rounded-2xl border p-4 ${index === 1 ? "border-roasted/40 bg-roasted text-cream" : "border-roasted/15 bg-white/25 text-roasted"}`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className={`h-5 w-5 ${index === 1 ? "text-lime" : "text-wine"}`} />
                      <span className="font-mono text-xs opacity-60">{rating}</span>
                    </div>
                    <div className="mt-5 font-display text-3xl font-semibold">{label}</div>
                    <div className="mt-1 text-sm font-semibold">{title}</div>
                    <div className="mt-1 text-xs opacity-60">{note}</div>
                    <Button
                      to={`/play?variant=${label}`}
                      size="small"
                      variant={index === 1 ? "primary" : "secondary"}
                      className="mt-5 w-full"
                    >
                      Take a seat
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div variants={reveal}>
          <Card className="h-full p-6">
            <div className="flex items-center justify-between">
              <Badge tone="brass">Daily ritual</Badge>
              <Flame className="h-5 w-5 text-wine-light" />
            </div>
            <h2 className="mt-5 font-display text-3xl font-semibold">Keep the table warm.</h2>
            <p className="mt-2 text-sm leading-relaxed text-cream-muted">
              Track your progress across today's sessions. No artificial currency—just the game.
            </p>
            {recentGames.length > 0 && (
              <div className="mt-6 space-y-3 text-sm text-cream-muted">
                <div className="flex items-center justify-between">
                  <span>Games today</span>
                  <span className="font-mono text-cream">{recentGames.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Wins today</span>
                  <span className="font-mono text-lime">
                    {recentGames.filter((g) => getMyOutcome(g, username) === "win").length}
                  </span>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <motion.div variants={reveal}>
          <Card className="p-6">
            <CardHeader
              eyebrow="Notebook"
              title="Recent games"
              action={
                <Button
                  to="/games"
                  variant="ghost"
                  size="small"
                  icon={ArrowUpRight}
                  iconPosition="right"
                >
                  View all
                </Button>
              }
            />
            {gamesLoading ? (
              <LoadingState text="Loading games…" className="mt-4" />
            ) : recentGames.length === 0 ? (
              <p className="mt-5 text-sm text-cream-muted/60">No games yet. Take a seat!</p>
            ) : (
              <div className="mt-5 divide-y divide-cream/[0.07]">
                {recentGames.slice(0, 4).map((game) => {
                  const outcome = getMyOutcome(game, username);
                  const isWin = outcome === "win";
                  const delta = getMyDelta(game, username);
                  return (
                    <a
                      href={`/games/${game.id}`}
                      key={game.id}
                      className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${isWin ? "bg-lime" : outcome === "loss" ? "bg-wine-light" : "bg-cream-muted/40"}`}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-cream group-hover:text-lime">
                          {getOpponent(game, username)}
                        </span>
                        <span className="mt-1 block text-xs text-cream-muted/60">
                          {variantLabel(game.variant)} · {relativeDate(game.endedAt)}
                        </span>
                      </span>
                      <span className="flex items-center gap-3">
                        {delta && (
                          <span
                            className={`font-mono text-xs ${isWin ? "text-lime" : "text-wine-light"}`}
                          >
                            {delta}
                          </span>
                        )}
                        <ChevronRight className="h-4 w-4 text-cream-muted/40" />
                      </span>
                    </a>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div variants={reveal} className="grid gap-6">
          {/* Tournament card — placeholder until tournament API is available */}
          <Card className="p-6">
            <CardHeader eyebrow="This week" title="Tournaments" />
            <div className="mt-5 flex items-center gap-4 rounded-xl border border-brass/20 bg-brass/[0.06] p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-brass/35 text-brass-light">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-cream">Coming soon</div>
                <div className="mt-1 text-xs text-cream-muted">
                  Tournament system is launching soon.
                </div>
              </div>
            </div>
            <Button to="/tournaments" variant="outline" size="small" className="mt-5 w-full">
              Browse events
            </Button>
          </Card>

          <Card className="p-6">
            <CardHeader eyebrow="At the café" title="Friends" />
            <div className="mt-4 space-y-3">
              <p className="text-sm text-cream-muted/60">
                Friend presence updates live while you play.
              </p>
            </div>
            <Button
              to="/friends"
              variant="ghost"
              size="small"
              className="mt-4 w-full"
              icon={Users}
            >
              Open friends
            </Button>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
