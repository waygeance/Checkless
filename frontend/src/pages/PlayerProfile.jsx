import { useState } from "react";
import { CalendarDays, Gamepad2, Trophy, UserPlus } from "lucide-react";
import { useAuth } from "@clerk/react";
import { useUser } from "@clerk/react";
import { useParams } from "react-router-dom";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { PublicPage } from "../components/app/PublicLayout";
import { usePlayerProfile } from "../hooks/usePlayerProfile";
import { useSocialFriends } from "../hooks/useSocialFriends";
import { useChallenges } from "../hooks/useChallenges";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  LoadingState,
  PageHeader
} from "../components/ui";

const VARIANT_META = {
  one_second: { label: "1s", display: "Lightning" },
  three_seconds: { label: "3s", display: "House Blend" },
  five_seconds: { label: "5s", display: "Slow Pour" }
};

function relativeDate(isoString) {
  if (!isoString) return "Never";
  const date = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor((now - date) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

function memberSince(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function PlayerProfile({ embedded = false }) {
  const { isSignedIn } = useAuth();
  const { user: me } = useUser();
  const { username } = useParams();
  const effectiveUsername = username === "me" || !username ? me?.username : username;

  const { profile, games, nextCursor, loading, loadingMore, error, loadMore } =
    usePlayerProfile(effectiveUsername);

  const { sendRequest } = useSocialFriends();
  const { createChallenge } = useChallenges();
  const [addingFriend, setAddingFriend] = useState(false);
  const [challenging, setChallenging] = useState(false);

  const isSelf = me?.username?.toLowerCase() === effectiveUsername?.toLowerCase();

  const handleAddFriend = async () => {
    setAddingFriend(true);
    try { await sendRequest(effectiveUsername); }
    finally { setAddingFriend(false); }
  };

  const handleChallenge = async () => {
    setChallenging(true);
    try {
      const challenge = await createChallenge("3s");
      if (challenge?.code) {
        window.location.href = `/challenges`;
      }
    } finally { setChallenging(false); }
  };

  // Compute stats
  const totalWins = profile?.stats?.reduce((s, st) => s + (st.totalWins ?? 0), 0) ?? 0;
  const totalLosses = profile?.stats?.reduce((s, st) => s + (st.totalLosses ?? 0), 0) ?? 0;
  const winRate =
    totalWins + totalLosses > 0
      ? `${Math.round((totalWins / (totalWins + totalLosses)) * 100)}%`
      : "—";

  // Sorted variant stats for the chart — just show current ratings
  const chartData = (profile?.stats ?? [])
    .sort((a, b) => a.variant.localeCompare(b.variant))
    .map((stat) => ({
      match: VARIANT_META[stat.variant]?.label ?? stat.variant,
      rating: stat.rating
    }));

  const lastPlayedAt = profile?.stats?.reduce((best, st) => {
    if (!st.lastPlayedAt) return best;
    return !best || new Date(st.lastPlayedAt) > new Date(best) ? st.lastPlayedAt : best;
  }, null);

  const displayName = profile?.displayName || profile?.username || effectiveUsername;

  const content = (
    <>
      {loading ? (
        <LoadingState text="Loading profile…" className="py-24" />
      ) : error ? (
        <ErrorState error={error} className="mt-8" />
      ) : (
        <>
          <PageHeader
            eyebrow="Public player card"
            title={displayName}
            description="Variant ratings, results, and recent games. Historical opponent snapshots remain unchanged when profiles are edited."
            action={
              !isSelf && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    icon={UserPlus}
                    onClick={handleAddFriend}
                    disabled={addingFriend}
                  >
                    {addingFriend ? "Sending…" : "Add friend"}
                  </Button>
                  <Button icon={Gamepad2} onClick={handleChallenge} disabled={challenging}>
                    {challenging ? "Creating…" : "Challenge"}
                  </Button>
                </div>
              )
            }
          >
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>{profile?.kind === "bot" ? "Bot" : "Human player"}</Badge>
              {profile?.stats?.[0]?.createdAt && (
                <Badge tone="brass">Member since {memberSince(profile.stats[0].createdAt)}</Badge>
              )}
            </div>
          </PageHeader>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
            <Card className="p-6">
              {/* Variant ratings */}
              <div className="grid gap-4 sm:grid-cols-3">
                {(profile?.stats ?? []).map((stat) => {
                  const meta = VARIANT_META[stat.variant] ?? {};
                  return (
                    <div
                      key={stat.variant}
                      className="rounded-xl border border-cream/[0.08] bg-roasted/45 p-4"
                    >
                      <div className="font-mono text-xs text-cream-muted">
                        {meta.label ?? stat.variant} cooldown
                      </div>
                      <div className="mt-3 font-display text-4xl font-semibold text-cream">
                        {stat.rating}
                      </div>
                      <div className="mt-1 font-mono text-xs text-cream-muted">
                        {stat.rankedWins}W / {stat.rankedLosses}L ranked
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rating chart — shows current ratings per variant */}
              {chartData.length > 0 && (
                <>
                  <div className="mt-8 flex items-center justify-between">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-brass-light">
                        Rating overview
                      </p>
                      <h2 className="mt-1 font-display text-2xl font-semibold">
                        By variant
                      </h2>
                    </div>
                    <Badge tone="brass">All-time</Badge>
                  </div>
                  <div className="mt-5 h-48 w-full" aria-label="Rating chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <XAxis
                          dataKey="match"
                          stroke="rgba(216,208,192,.45)"
                          tickLine={false}
                          axisLine={false}
                          fontSize={11}
                        />
                        <YAxis
                          stroke="rgba(216,208,192,.45)"
                          tickLine={false}
                          axisLine={false}
                          fontSize={11}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#211611",
                            border: "1px solid rgba(181,138,74,.35)",
                            borderRadius: 12,
                            color: "#f2e7cf"
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="rating"
                          stroke="#c2d82e"
                          strokeWidth={3}
                          dot={{ fill: "#b58a4a", strokeWidth: 0, r: 4 }}
                          activeDot={{ r: 6, fill: "#c2d82e" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </Card>

            <div className="space-y-5">
              <Card tone="parchment" className="p-6">
                <Trophy className="h-7 w-7 text-wine" />
                <h2 className="mt-4 font-display text-3xl font-semibold text-roasted">
                  Table record
                </h2>
                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  {[
                    ["Wins", totalWins],
                    ["Losses", totalLosses],
                    ["Win rate", winRate]
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="font-display text-2xl font-semibold text-roasted">
                        {value}
                      </div>
                      <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-roasted/55">
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-2 border-t border-roasted/10 pt-4 text-xs text-roasted/60">
                  <CalendarDays className="h-4 w-4" />
                  Last played {relativeDate(lastPlayedAt)}
                </div>
              </Card>

              <Card className="p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-brass-light">
                  Recent tables
                </p>
                {games.length === 0 ? (
                  <p className="mt-4 text-xs text-cream-muted/60">No games yet.</p>
                ) : (
                  games.slice(0, 5).map((game) => {
                    const me = game.participants?.find(
                      (p) => p.username?.toLowerCase() === effectiveUsername?.toLowerCase()
                    );
                    const opp = game.participants?.find(
                      (p) => p.username?.toLowerCase() !== effectiveUsername?.toLowerCase()
                    );
                    const isWin = me?.outcome === "win";
                    return (
                      <a
                        href={`/games/${game.id}`}
                        key={game.id}
                        className="mt-4 flex items-center gap-3 text-sm"
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${isWin ? "bg-lime" : me?.outcome === "loss" ? "bg-danger" : "bg-cream-muted/30"}`}
                        />
                        <span className="font-semibold text-cream">
                          {opp?.username ?? "Unknown"}
                        </span>
                        <span className="ml-auto font-mono text-xs text-cream-muted">
                          {VARIANT_META[game.variant]?.label ?? game.variant}
                        </span>
                      </a>
                    );
                  })
                )}
                {nextCursor && (
                  <Button
                    variant="ghost"
                    size="small"
                    className="mt-4 w-full"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? "Loading…" : "Load more"}
                  </Button>
                )}
              </Card>
            </div>
          </div>
        </>
      )}
    </>
  );

  return embedded || isSignedIn ? content : <PublicPage>{content}</PublicPage>;
}
