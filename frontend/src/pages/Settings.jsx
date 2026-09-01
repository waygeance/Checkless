import { Bell, Monitor, Save, Shield, Volume2 } from "lucide-react";
import {
  Button,
  Card,
  Field,
  PageHeader,
  Select,
  Toggle
} from "../components/ui";

export default function Settings() {
  return (
    <div>
      <PageHeader
        eyebrow="Your corner"
        title="Settings"
        description="Tune the board and notifications without changing the rules or hiding public game history."
        action={<Button icon={Save}>Save changes</Button>}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Monitor className="h-5 w-5 text-brass-light" />
            <h2 className="font-display text-2xl font-semibold">
              Board and display
            </h2>
          </div>
          <div className="mt-6 grid gap-5">
            <Field label="Board material">
              <Select defaultValue="walnut">
                <option value="walnut">Walnut café</option>
                <option value="newspaper">Sunday newspaper</option>
                <option value="marble">Old marble</option>
              </Select>
            </Field>
            <Field label="Piece set">
              <Select defaultValue="cburnett">
                <option value="cburnett">Classic Cburnett</option>
                <option value="companion">Companion</option>
                <option value="alpha">Alpha</option>
              </Select>
            </Field>
            <Toggle
              label="Show board coordinates"
              description="Display files and ranks around the live board."
              defaultChecked
            />
            <Toggle
              label="Reduced motion"
              description="Prefer shorter transitions and disable decorative movement."
            />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-brass-light" />
            <h2 className="font-display text-2xl font-semibold">
              Sound and notices
            </h2>
          </div>
          <div className="mt-6 grid gap-3">
            <Toggle
              label="Move sounds"
              description="A restrained wooden tap for accepted moves."
              defaultChecked
            />
            <Toggle
              label="Challenge notifications"
              description="Notify when a friend invites you to an unrated table."
              defaultChecked
            />
            <Toggle
              label="Tournament reminders"
              description="Receive registration and round-start notices."
              defaultChecked
            />
          </div>
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-cream/[0.08] bg-roasted/40 p-4 text-sm text-cream-muted">
            <Volume2 className="h-4 w-4 text-brass-light" /> Sound effects never
            mask timer state.
          </div>
        </Card>
        <Card className="p-6 xl:col-span-2">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-brass-light" />
            <div>
              <h2 className="font-display text-2xl font-semibold">
                Account policy
              </h2>
              <p className="mt-1 text-sm text-cream-muted">
                Authentication is managed by Clerk. Checkless retains historical
                profiles and games and does not expose account deletion.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
