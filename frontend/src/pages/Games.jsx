import { Filter, Search } from "lucide-react";
import { recentGames } from "../data/platform";
import { Badge, Button, Card, Input, PageHeader } from "../components/ui";

export default function Games() {
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
            <Input className="pl-10" placeholder="Search opponent or game ID" />
          </div>
          <Button variant="outline" icon={Filter}>
            Filter games
          </Button>
        </div>
      </Card>
      <div className="mt-5 space-y-3">
        {recentGames.map((game) => (
          <Card
            key={game.id}
            className="grid gap-5 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full border font-display text-sm font-bold ${game.result === "WIN" ? "border-lime/30 bg-lime/10 text-lime" : "border-danger/30 bg-danger/10 text-danger"}`}
            >
              {game.result === "WIN" ? "W" : "L"}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-cream">
                  vs {game.opponent}
                </h2>
                <Badge tone="brass">{game.variant}</Badge>
                <Badge>{game.reason}</Badge>
              </div>
              <p className="mt-2 text-xs text-cream-muted">
                {game.playedAt} · {game.elapsed}
              </p>
            </div>
            <div className="flex items-center gap-4 sm:justify-end">
              <span
                className={`font-mono text-sm ${game.result === "WIN" ? "text-lime" : "text-danger"}`}
              >
                {game.delta}
              </span>
              <Button to={`/games/${game.id}`} size="small" variant="outline">
                Open replay
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
