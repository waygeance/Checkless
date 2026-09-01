import { ArrowLeft, CalendarDays, ShieldCheck, Trophy } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  Select,
  Textarea,
  Toggle
} from "../components/ui";

export default function TournamentCreate() {
  return (
    <div>
      <PageHeader
        eyebrow="Host’s ledger"
        title="Create a tournament"
        description="Set the public shape of the event. Pairing algorithms and rated tournament policies remain deferred, so this form is presented as a frontend-ready flow."
        action={
          <Button to="/tournaments" variant="ghost" icon={ArrowLeft}>
            Back to events
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.65fr)]">
        <Card className="p-6 sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Tournament name" className="sm:col-span-2">
              <Input placeholder="The Sunday House Cup" />
            </Field>
            <Field
              label="Format"
              hint="Swiss policy must be finalized before server implementation."
            >
              <Select defaultValue="swiss">
                <option value="swiss">Swiss</option>
                <option value="round-robin">Round robin</option>
              </Select>
            </Field>
            <Field label="Access">
              <Select defaultValue="public">
                <option value="public">Public listing</option>
                <option value="code">Invite code</option>
              </Select>
            </Field>
            <Field label="Cooldown">
              <Select defaultValue="3s">
                <option>1s</option>
                <option>3s</option>
                <option>5s</option>
              </Select>
            </Field>
            <Field label="Maximum players">
              <Input type="number" min="2" defaultValue="16" />
            </Field>
            <Field label="Start date">
              <Input type="datetime-local" />
            </Field>
            <Field label="Registration closes">
              <Input type="datetime-local" />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea placeholder="Tell players what makes this event worth entering." />
            </Field>
          </div>
          <div className="mt-6 grid gap-3">
            <Toggle
              label="Public spectator access"
              description="All Checkless games are public; spectators remain read-only."
              defaultChecked
            />
            <Toggle
              label="Rated tournament"
              description="Disabled until eligibility and anti-farming rules are approved."
            />
          </div>
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost">Save draft</Button>
            <Button icon={CalendarDays}>Review tournament</Button>
          </div>
        </Card>

        <div className="space-y-5">
          <Card tone="parchment" className="p-6">
            <Trophy className="h-7 w-7 text-wine" />
            <h2 className="mt-5 font-display text-3xl font-semibold text-roasted">
              Sunday House Cup
            </h2>
            <p className="mt-2 text-sm text-roasted/65">
              Swiss · 3s · 16 seats
            </p>
            <div className="mt-5 flex gap-2">
              <Badge className="!border-roasted/15 !text-roasted">Draft</Badge>
              <Badge className="!border-roasted/15 !text-roasted">
                Unrated
              </Badge>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brass-light" />
              <div>
                <h3 className="font-semibold text-cream">Policy checkpoint</h3>
                <p className="mt-2 text-xs leading-relaxed text-cream-muted">
                  Before shipping tournament mutations, define scoring, ties,
                  withdrawals, byes, colors, and rated anti-abuse rules.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
