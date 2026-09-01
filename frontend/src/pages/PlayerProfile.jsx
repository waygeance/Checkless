import { CalendarDays, Gamepad2, Trophy, UserPlus } from "lucide-react";
import { useAuth } from "@clerk/react";
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
import { ratingHistory, ratings, recentGames } from "../data/platform";
import { Badge, Button, Card, PageHeader } from "../components/ui";

export default function PlayerProfile({ embedded = false }) {
  const { isSignedIn } = useAuth();
  const { username } = useParams();
  const displayName =
    username === "me" || !username ? "CoffeePlayer" : username;

  const content = (
    <>
      <PageHeader
        eyebrow="Public player card"
        title={displayName}
        description="A clean public record of variant ratings, results, and recent games. Historical opponent snapshots remain unchanged when profiles are edited."
        action={
          <div className="flex gap-2">
            <Button variant="outline" icon={UserPlus}>
              Add friend
            </Button>
            <Button icon={Gamepad2}>Challenge</Button>
          </div>
        }
      >
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="lime">Online</Badge>
          <Badge>Human player</Badge>
          <Badge tone="brass">Member since Aug 2026</Badge>
        </div>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
        <Card className="p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {ratings.map((rating) => (
              <div
                key={rating.label}
                className="rounded-xl border border-cream/[0.08] bg-roasted/45 p-4"
              >
                <div className="font-mono text-xs text-cream-muted">
                  {rating.label} cooldown
                </div>
                <div className="mt-3 font-display text-4xl font-semibold text-cream">
                  {rating.value}
                </div>
                <div
                  className={`mt-1 font-mono text-xs ${rating.delta >= 0 ? "text-lime" : "text-danger"}`}
                >
                  {rating.delta >= 0 ? "+" : ""}
                  {rating.delta} this week
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-brass-light">
                Three-second rating
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold">
                A steady climb
              </h2>
            </div>
            <Badge tone="brass">Last 14 days</Badge>
          </div>
          <div className="mt-5 h-64 w-full" aria-label="Rating history chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={ratingHistory}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <XAxis
                  dataKey="match"
                  stroke="rgba(216,208,192,.45)"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
                <YAxis
                  domain={[1380, 1560]}
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
        </Card>

        <div className="space-y-5">
          <Card tone="parchment" className="p-6">
            <Trophy className="h-7 w-7 text-wine" />
            <h2 className="mt-4 font-display text-3xl font-semibold text-roasted">
              Table record
            </h2>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              {[
                ["Wins", 42],
                ["Losses", 31],
                ["Win rate", "58%"]
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
              <CalendarDays className="h-4 w-4" /> Last played today
            </div>
          </Card>
          <Card className="p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-brass-light">
              Recent tables
            </p>
            {recentGames.slice(0, 3).map((game) => (
              <a
                href={`/games/${game.id}`}
                key={game.id}
                className="mt-4 flex items-center gap-3 text-sm"
              >
                <span
                  className={`h-2 w-2 rounded-full ${game.result === "WIN" ? "bg-lime" : "bg-danger"}`}
                />
                <span className="font-semibold text-cream">
                  {game.opponent}
                </span>
                <span className="ml-auto font-mono text-xs text-cream-muted">
                  {game.variant}
                </span>
              </a>
            ))}
          </Card>
        </div>
      </div>
    </>
  );

  return embedded || isSignedIn ? content : <PublicPage>{content}</PublicPage>;
}
