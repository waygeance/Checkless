import { Ban, Search, ShieldCheck, Undo2 } from "lucide-react";
import { Badge, Button, Card, Input, PageHeader } from "../components/ui";

export default function Admin() {
  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Moderation"
        description="Search users and inspect public games. Every mutation requires a non-empty reason and an append-only audit record."
        action={<Badge tone="danger">Admin preview</Badge>}
      />
      <Card className="p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-muted/45" />
          <Input
            className="pl-10"
            placeholder="Search username or public game ID"
          />
        </div>
      </Card>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-brass-light" />
            <h2 className="font-display text-2xl font-semibold">
              User results
            </h2>
          </div>
          {["CoffeeGambit", "QuietRook", "VelvetKnight"].map((name, index) => (
            <div
              key={name}
              className="mt-5 flex flex-col gap-4 border-b border-cream/[0.07] pb-5 last:border-0 last:pb-0 sm:flex-row sm:items-center"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-cream">{name}</span>
                  <Badge tone={index === 2 ? "danger" : "lime"}>
                    {index === 2 ? "Suspended" : "Active"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-cream-muted">
                  Human player · last seen today
                </p>
              </div>
              {index === 2 ? (
                <Button variant="outline" size="small" icon={Undo2}>
                  Restore
                </Button>
              ) : (
                <Button variant="danger" size="small" icon={Ban}>
                  Suspend
                </Button>
              )}
            </div>
          ))}
        </Card>
        <Card tone="parchment" className="p-6">
          <h2 className="font-display text-3xl font-semibold text-roasted">
            Audit before action.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-roasted/65">
            The frontend can present moderation controls, but the server must
            resolve the verified Clerk subject to a local ADMIN role. Client
            metadata is never authority.
          </p>
          <div className="mt-6 rounded-xl border border-wine/20 bg-wine/5 p-4 text-xs leading-relaxed text-wine">
            No moderation mutation is wired from this preview UI.
          </div>
        </Card>
      </div>
    </div>
  );
}
