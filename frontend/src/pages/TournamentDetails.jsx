import { ArrowLeft, Trophy } from "lucide-react";
import { useAuth } from "@clerk/react";
import { useParams } from "react-router-dom";
import { PublicPage } from "../components/app/PublicLayout";
import { Button, Card, PageHeader } from "../components/ui";

export default function TournamentDetails() {
  const { isSignedIn } = useAuth();
  const { id } = useParams();

  const content = (
    <>
      <PageHeader
        eyebrow="Tournament details"
        title="Event not available"
        description={`Tournament ${id} — The tournament system is not yet live.`}
        action={
          <Button to="/tournaments" variant="outline" icon={ArrowLeft}>
            All tournaments
          </Button>
        }
      />

      <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-cream/[0.07] bg-roasted/30 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-brass/30 bg-brass/10">
          <Trophy className="h-9 w-9 text-brass-light" />
        </div>
        <div>
          <h2 className="font-display text-3xl font-semibold text-cream">
            Tournament system launching soon.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-cream-muted">
            Swiss and Round Robin tournament support is under active development.
            This event detail page will be available once the service goes live.
          </p>
        </div>
        <Button to="/play" size="small">
          Find a casual game
        </Button>
      </div>
    </>
  );

  return isSignedIn ? content : <PublicPage>{content}</PublicPage>;
}
