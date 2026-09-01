import {
  CalendarDays,
  Medal,
  Share2,
  Swords,
  Trophy,
  Users
} from "lucide-react";
import { useAuth } from "@clerk/react";
import { useParams } from "react-router-dom";
import { pairings, tournaments } from "../data/platform";
import { PublicPage } from "../components/app/PublicLayout";
import { Badge, Button, Card, PageHeader, Progress } from "../components/ui";

export default function TournamentDetails() {
  const { isSignedIn } = useAuth();
  const { id } = useParams();
  const tournament =
    tournaments.find((item) => item.id === id) || tournaments[0];

  const content = (
    <>
      <PageHeader
        eyebrow={`${tournament.format} · ${tournament.variant}`}
        title={tournament.name}
        description={tournament.description}
        action={
          <div className="flex gap-2">
            <Button variant="outline" icon={Share2}>
              Share
            </Button>
            <Button icon={Trophy}>Join event</Button>
          </div>
        }
      >
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone={tournament.status === "ACTIVE" ? "danger" : "lime"}>
            {tournament.status}
          </Badge>
          <Badge>Public</Badge>
          <Badge>Unrated</Badge>
        </div>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-brass-light">
                Current round
              </p>
              <h2 className="mt-1 font-display text-3xl font-semibold">
                Round four pairings
              </h2>
            </div>
            <Swords className="h-6 w-6 text-brass-light" />
          </div>
          <div className="mt-6 overflow-hidden rounded-xl border border-cream/[0.08]">
            {pairings.map((pairing) => (
              <div
                key={pairing.board}
                className="grid grid-cols-[3rem_1fr_auto_1fr_auto] items-center gap-3 border-b border-cream/[0.07] px-4 py-4 text-sm last:border-0"
              >
                <span className="font-mono text-xs text-cream-muted/50">
                  #{pairing.board}
                </span>
                <span className="truncate font-semibold text-cream">
                  {pairing.white}
                </span>
                <span className="text-cream-muted/35">vs</span>
                <span className="truncate font-semibold text-cream">
                  {pairing.black}
                </span>
                <Badge tone={pairing.result === "Playing" ? "danger" : "brass"}>
                  {pairing.result}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-5">
          <Card tone="parchment" className="p-6">
            <Medal className="h-7 w-7 text-wine" />
            <h2 className="mt-4 font-display text-3xl font-semibold text-roasted">
              Event card
            </h2>
            <div className="mt-5 space-y-3 text-sm text-roasted/70">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-4 w-4" /> {tournament.starts}
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4" /> {tournament.entrants} registered
              </div>
              <div className="flex items-center gap-3">
                <Trophy className="h-4 w-4" /> Seven rounds
              </div>
            </div>
            <Progress
              className="mt-6 [&_*]:!text-roasted"
              value={(tournament.entrants / tournament.capacity) * 100}
              label="Capacity"
              detail={`${tournament.entrants}/${tournament.capacity}`}
            />
          </Card>
          <Card className="p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-brass-light">
              Standings
            </p>
            {["TempoMerchant", "OpenFile", "VelvetKnight", "CoffeeGambit"].map(
              (name, index) => (
                <div
                  key={name}
                  className="mt-4 flex items-center gap-3 text-sm"
                >
                  <span className="font-mono text-cream-muted/45">
                    {index + 1}
                  </span>
                  <span className="font-semibold text-cream">{name}</span>
                  <span className="ml-auto font-mono text-lime">
                    {6 - index * 0.5}
                  </span>
                </div>
              )
            )}
          </Card>
        </div>
      </div>
    </>
  );

  return isSignedIn ? content : <PublicPage>{content}</PublicPage>;
}
