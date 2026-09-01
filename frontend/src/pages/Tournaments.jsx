import { CalendarDays, ChevronRight, Plus, Trophy, Users } from "lucide-react";
import { useAuth } from "@clerk/react";
import { tournaments } from "../data/platform";
import { PublicPage } from "../components/app/PublicLayout";
import { Badge, Button, Card, PageHeader, Progress } from "../components/ui";

export default function Tournaments({ embedded = false }) {
  const { isSignedIn } = useAuth();
  const content = (
    <>
      <PageHeader
        eyebrow="The tournament room"
        title="Events with a little ceremony."
        description="Discover public competitions, follow live rounds, or host a table of your own. Tournament data shown here is a frontend preview until the deferred tournament service is implemented."
        action={
          <Button to="/tournaments/new" icon={Plus}>
            Create tournament
          </Button>
        }
      />
      <div className="grid gap-5 lg:grid-cols-3">
        {tournaments.map((tournament, index) => (
          <Card key={tournament.id} className="flex flex-col p-5">
            <div className="flex items-start justify-between gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full border ${index === 0 ? "border-lime/30 bg-lime/10 text-lime" : "border-brass/30 bg-brass/10 text-brass-light"}`}
              >
                <Trophy className="h-5 w-5" />
              </div>
              <Badge tone={tournament.status === "ACTIVE" ? "danger" : "brass"}>
                {tournament.status}
              </Badge>
            </div>
            <h2 className="mt-6 font-display text-3xl font-semibold text-cream">
              {tournament.name}
            </h2>
            <p className="mt-2 min-h-10 text-sm leading-relaxed text-cream-muted">
              {tournament.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge>{tournament.format}</Badge>
              <Badge>{tournament.variant}</Badge>
              <Badge>Unrated</Badge>
            </div>
            <Progress
              className="mt-6"
              value={(tournament.entrants / tournament.capacity) * 100}
              label="Seats filled"
              detail={`${tournament.entrants} / ${tournament.capacity}`}
            />
            <div className="mt-5 space-y-2 text-xs text-cream-muted">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 text-brass-light" />{" "}
                {tournament.starts}
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-brass-light" /> Public
                registration
              </div>
            </div>
            <Button
              to={`/tournaments/${tournament.id}`}
              variant={index === 0 ? "primary" : "outline"}
              size="small"
              className="mt-6 w-full"
              icon={ChevronRight}
              iconPosition="right"
            >
              Open event
            </Button>
          </Card>
        ))}
      </div>
    </>
  );

  return embedded || isSignedIn ? content : <PublicPage>{content}</PublicPage>;
}
