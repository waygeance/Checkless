import { Search, UserMinus, UserPlus, Users } from "lucide-react";
import { friends } from "../data/platform";
import { Badge, Button, Card, Input, PageHeader } from "../components/ui";

export default function Friends() {
  return (
    <div>
      <PageHeader
        eyebrow="Your regulars"
        title="Friends"
        description="Find players by username, see who is around, and send an unrated table invitation. Presence is visible only between accepted friends."
        action={<Button icon={UserPlus}>Add a friend</Button>}
      />
      <Card className="p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-muted/45" />
          <Input
            className="pl-10"
            placeholder="Search exact or partial username"
          />
        </div>
      </Card>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {friends.map((friend) => (
          <Card key={friend.username} className="flex items-center gap-4 p-5">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-brass/25 bg-roasted/70 text-brass-light">
              <Users className="h-5 w-5" />
              <span
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-walnut ${friend.online ? "bg-lime" : "bg-cream-muted/35"}`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate font-semibold text-cream">
                  {friend.username}
                </h2>
                {friend.online ? (
                  <Badge tone="lime">Online</Badge>
                ) : (
                  <Badge>Offline</Badge>
                )}
              </div>
              <p className="mt-1 truncate text-xs text-cream-muted">
                {friend.status} · {friend.rating}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                to={`/players/${friend.username}`}
                size="small"
                variant="ghost"
              >
                Profile
              </Button>
              <Button size="small" variant="outline">
                Challenge
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-8 flex items-center justify-between border-t border-cream/[0.07] pt-5">
        <p className="text-xs text-cream-muted/60">
          Blocking removes friendships and pending interactions in one
          transaction.
        </p>
        <Button variant="ghost" size="small" icon={UserMinus}>
          Manage blocks
        </Button>
      </div>
    </div>
  );
}
