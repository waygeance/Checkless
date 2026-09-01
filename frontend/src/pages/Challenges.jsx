import { Clock3, Copy, Link2, Plus, Swords } from "lucide-react";
import { challenges } from "../data/platform";
import { Badge, Button, Card, PageHeader } from "../components/ui";

export default function Challenges() {
  return (
    <div>
      <PageHeader
        eyebrow="Direct tables"
        title="Challenges"
        description="Invite a signed-in player or share a short code. Challenges are public, unrated, and expire fifteen minutes after creation."
        action={<Button icon={Plus}>Create challenge</Button>}
      />

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          {challenges.map((challenge) => (
            <Card key={challenge.id} className="p-5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-brass/25 bg-brass/10 text-brass-light">
                  <Swords className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-cream">
                      {challenge.username}
                    </h2>
                    <Badge
                      tone={
                        challenge.direction === "INCOMING" ? "lime" : "brass"
                      }
                    >
                      {challenge.direction}
                    </Badge>
                    <Badge>{challenge.variant}</Badge>
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-xs text-cream-muted">
                    <Clock3 className="h-3.5 w-3.5" /> Expires in{" "}
                    {challenge.expires}
                  </p>
                </div>
                <div className="flex gap-2">
                  {challenge.direction === "INCOMING" ? (
                    <>
                      <Button size="small" variant="ghost">
                        Decline
                      </Button>
                      <Button size="small">Accept</Button>
                    </>
                  ) : (
                    <Button size="small" variant="danger">
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card tone="parchment" className="p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.23em] text-wine">
            Your open code
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-roasted">
            Pull up a chair.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-roasted/65">
            Share this code with one player. The opponent seat is claimed
            atomically when accepted.
          </p>
          <div className="mt-6 rounded-xl border border-dashed border-roasted/30 bg-white/30 px-5 py-6 text-center font-mono text-3xl font-bold tracking-[0.24em] text-roasted">
            J7K–P4M
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="secondary" icon={Copy}>
              Copy code
            </Button>
            <Button
              variant="outline"
              className="!border-roasted/20 !text-roasted hover:!border-roasted/50"
              icon={Link2}
            >
              Copy link
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
