import { useState } from "react";
import { Clock3, Copy, Link2, Plus, Swords, X } from "lucide-react";
import { useChallenges } from "../hooks/useChallenges";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Field,
  LoadingState,
  PageHeader,
  Select
} from "../components/ui";

const VARIANT_OPTIONS = [
  { value: "1s", label: "Lightning (1s)" },
  { value: "3s", label: "House Blend (3s)" },
  { value: "5s", label: "Slow Pour (5s)" }
];

const VARIANT_DISPLAY = {
  ONE_SECOND: "1s",
  THREE_SECONDS: "3s",
  FIVE_SECONDS: "5s"
};

function timeUntil(isoDate) {
  if (!isoDate) return "—";
  const ms = new Date(isoDate) - Date.now();
  if (ms <= 0) return "Expired";
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
}

export default function Challenges() {
  const {
    myChallenge,
    creating,
    error,
    createChallenge,
    cancelChallenge,
    clearMyChallenge
  } = useChallenges();

  const [variant, setVariant] = useState("3s");
  const [lookupCode, setLookupCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const handleCreate = async () => {
    await createChallenge(variant);
  };

  const handleCancel = async (id) => {
    setCancellingId(id);
    try {
      await cancelChallenge(id);
    } finally {
      setCancellingId(null);
    }
  };

  const copyCode = () => {
    if (!myChallenge?.code) return;
    navigator.clipboard.writeText(myChallenge.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const copyLink = () => {
    if (!myChallenge?.code) return;
    const url = `${window.location.origin}/challenges?code=${myChallenge.code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Direct tables"
        title="Challenges"
        description="Create an open challenge and share the code with any signed-in player. Challenges expire 15 minutes after creation."
        action={
          <Button
            icon={Plus}
            onClick={handleCreate}
            disabled={creating || !!myChallenge}
          >
            {creating ? "Creating…" : "Create challenge"}
          </Button>
        }
      />

      {error && <ErrorState error={{ message: error }} className="mb-5" />}

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          {/* Active open challenge */}
          {myChallenge && (
            <Card className="p-5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-lime/25 bg-lime/10 text-lime">
                  <Swords className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-cream">Your open challenge</h2>
                    <Badge tone="lime">OUTGOING</Badge>
                    <Badge>{VARIANT_DISPLAY[myChallenge.variant] ?? myChallenge.variant}</Badge>
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-xs text-cream-muted">
                    <Clock3 className="h-3.5 w-3.5" />
                    Expires in {timeUntil(myChallenge.expiresAt)}
                  </p>
                </div>
                <Button
                  size="small"
                  variant="danger"
                  icon={X}
                  onClick={() => handleCancel(myChallenge.id)}
                  disabled={cancellingId === myChallenge.id}
                >
                  {cancellingId === myChallenge.id ? "Cancelling…" : "Cancel"}
                </Button>
              </div>
            </Card>
          )}

          {/* Lookup an incoming challenge by code */}
          <Card className="p-5">
            <p className="mb-3 text-sm font-semibold text-cream">Accept a challenge</p>
            <p className="mb-3 text-xs text-cream-muted">
              Enter a challenge code shared by another player to join their table.
            </p>
            <div className="flex gap-2">
              <input
                className="min-h-11 flex-1 rounded-xl border border-cream/10 bg-roasted/70 px-4 text-sm font-mono uppercase tracking-[0.2em] text-cream outline-none transition placeholder:text-cream-muted/40 focus:border-lime/55 focus:ring-2 focus:ring-lime/10"
                placeholder="Enter code (e.g. J7K-P4M)"
                value={lookupCode}
                onChange={(e) => setLookupCode(e.target.value.toUpperCase())}
              />
              <Button
                disabled={!lookupCode.trim()}
                onClick={() => {
                  window.location.href = `/challenges?code=${lookupCode.replace(/-/g, "").trim()}`;
                }}
              >
                Join
              </Button>
            </div>
          </Card>
        </div>

        {/* Create challenge panel */}
        <Card tone="parchment" className="p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.23em] text-wine">
            {myChallenge ? "Your open code" : "New challenge"}
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-roasted">
            {myChallenge ? "Pull up a chair." : "Create a table."}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-roasted/65">
            {myChallenge
              ? "Share this code with one player. The seat is claimed atomically when accepted."
              : "Choose a cooldown and create an open challenge. You'll get a shareable code."}
          </p>

          {myChallenge ? (
            <>
              <div className="mt-6 rounded-xl border border-dashed border-roasted/30 bg-white/30 px-5 py-6 text-center font-mono text-3xl font-bold tracking-[0.24em] text-roasted">
                {myChallenge.code}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="secondary" icon={Copy} onClick={copyCode}>
                  {copied ? "Copied!" : "Copy code"}
                </Button>
                <Button
                  variant="outline"
                  className="!border-roasted/20 !text-roasted hover:!border-roasted/50"
                  icon={Link2}
                  onClick={copyLink}
                >
                  Copy link
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="mt-6">
                <Field label="Cooldown">
                  <Select value={variant} onChange={(e) => setVariant(e.target.value)}>
                    {VARIANT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Button
                className="mt-5 w-full"
                onClick={handleCreate}
                disabled={creating}
                icon={Swords}
              >
                {creating ? "Creating…" : "Create challenge"}
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
