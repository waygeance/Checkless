import { Plus, Trophy } from "lucide-react";
import { useAuth } from "@clerk/react";
import { PublicPage } from "../components/app/PublicLayout";
import { Button, Card, PageHeader } from "../components/ui";

export default function Tournaments({ embedded = false }) {
  const { isSignedIn } = useAuth();

  const content = (
    <>
      <PageHeader
        eyebrow="The tournament room"
        title="Events with a little ceremony."
        description="Discover public competitions, follow live rounds, or host a table of your own."
        action={
          <Button to="/tournaments/new" icon={Plus} disabled title="Tournaments launching soon">
            Create tournament
          </Button>
        }
      />

      {/* Coming soon state */}
      <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-cream/[0.07] bg-roasted/30 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-brass/30 bg-brass/10">
          <Trophy className="h-9 w-9 text-brass-light" />
        </div>
        <div>
          <h2 className="font-display text-3xl font-semibold text-cream">
            Tournaments are coming.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-cream-muted">
            The tournament system — Swiss, Round Robin, seeding, and standings — is
            actively being built. Check back soon for the first public events.
          </p>
        </div>
        <Card tone="parchment" className="max-w-sm p-5 text-left">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-wine">
            In the meantime
          </p>
          <p className="mt-2 text-sm text-roasted/70">
            You can use <strong>Challenges</strong> to invite specific players to a direct
            unrated table — no queue, no wait.
          </p>
          <Button to="/challenges" size="small" variant="secondary" className="mt-4">
            Open challenges
          </Button>
        </Card>
      </div>
    </>
  );

  return embedded || isSignedIn ? content : <PublicPage>{content}</PublicPage>;
}
