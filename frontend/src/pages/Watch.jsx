import { Eye, Radio, Users } from "lucide-react";
import { liveGames } from "../data/platform";
import { Badge, Button, Card, PageHeader } from "../components/ui";
import { PublicPage } from "../components/app/PublicLayout";

export default function Watch() {
  return (
    <PublicPage>
      <PageHeader
        eyebrow="Public tables"
        title="Watch the room think."
        description="Every live table is public. Follow the exact server order, cooldown tension, and final king capture without touching the board."
      />
      <div className="grid gap-5 lg:grid-cols-3">
        {liveGames.map((game, index) => (
          <Card key={game.id} className="group p-5">
            <div className="aspect-[4/3] rounded-xl border border-cream/10 bg-[linear-gradient(45deg,#c6ad82_25%,#50392b_25%,#50392b_50%,#c6ad82_50%,#c6ad82_75%,#50392b_75%)] bg-[length:25%_25%] opacity-80 transition group-hover:opacity-100" />
            <div className="mt-5 flex items-center justify-between gap-3">
              <Badge tone="danger">
                <Radio className="mr-1.5 h-3 w-3" /> Live
              </Badge>
              <span className="flex items-center gap-1.5 text-xs text-cream-muted">
                <Users className="h-3.5 w-3.5" /> {game.viewers}
              </span>
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold text-cream">
              {game.white} <span className="text-cream-muted/45">vs</span>{" "}
              {game.black}
            </h2>
            <p className="mt-2 text-xs text-cream-muted">
              {game.variant} cooldown · move {game.sequence}
            </p>
            <Button
              to={`/games/${game.id}`}
              variant={index === 0 ? "primary" : "outline"}
              size="small"
              className="mt-5 w-full"
              icon={Eye}
            >
              Watch table
            </Button>
          </Card>
        ))}
      </div>
    </PublicPage>
  );
}
