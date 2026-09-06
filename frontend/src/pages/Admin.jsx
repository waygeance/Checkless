import { useState } from "react";
import { Ban, Search, ShieldCheck, Undo2 } from "lucide-react";
import { useAdminSearch } from "../hooks/useAdminSearch";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Input,
  LoadingState,
  PageHeader,
  ReasonModal
} from "../components/ui";

function formatDate(isoString) {
  if (!isoString) return "Never";
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export default function Admin() {
  const { query, setQuery, users, games, loading, error, actionLoading, suspend, restore } =
    useAdminSearch();

  const [modal, setModal] = useState(null); // { type: "suspend"|"restore", user }
  const [reason, setReason] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  const openModal = (type, user) => {
    setModal({ type, user });
    setReason("");
    setModalError(null);
  };

  const closeModal = () => {
    setModal(null);
    setReason("");
    setModalError(null);
  };

  const handleConfirm = async () => {
    if (!modal || reason.trim().length < 3) return;
    setModalLoading(true);
    setModalError(null);
    try {
      if (modal.type === "suspend") {
        await suspend(modal.user.id, reason.trim());
      } else {
        await restore(modal.user.id, reason.trim());
      }
      closeModal();
    } catch (err) {
      setModalError(err.code || err.message);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Moderation"
        description="Search users and inspect public games. Every mutation requires a non-empty reason and an append-only audit record."
        action={<Badge tone="danger">Admin panel</Badge>}
      />
      <Card className="p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-muted/45" />
          <Input
            className="pl-10"
            placeholder="Search username or public game ID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </Card>

      {error && <ErrorState error={error} className="mt-5" />}

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Users panel */}
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-brass-light" />
            <h2 className="font-display text-2xl font-semibold">
              User results {users.length > 0 && `(${users.length})`}
            </h2>
          </div>

          {loading ? (
            <LoadingState text="Searching…" className="mt-5" />
          ) : users.length === 0 ? (
            <p className="mt-5 text-sm text-cream-muted/60">
              {query.trim() ? "No users match your query." : "Type a username to search."}
            </p>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="mt-5 flex flex-col gap-4 border-b border-cream/[0.07] pb-5 last:border-0 last:pb-0 sm:flex-row sm:items-center"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-cream">{user.username}</span>
                    <Badge tone={user.status === "SUSPENDED" ? "danger" : "lime"}>
                      {user.status}
                    </Badge>
                    <Badge tone="brass">{user.role}</Badge>
                    {user.kind === "BOT" && <Badge>Bot</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-cream-muted">
                    {user.displayName && `${user.displayName} · `}
                    Last seen {formatDate(user.lastSeenAt)} · Joined {formatDate(user.createdAt)}
                  </p>
                </div>
                {user.status === "SUSPENDED" ? (
                  <Button
                    variant="outline"
                    size="small"
                    icon={Undo2}
                    onClick={() => openModal("restore", user)}
                    disabled={actionLoading === user.id}
                  >
                    {actionLoading === user.id ? "Working…" : "Restore"}
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    size="small"
                    icon={Ban}
                    onClick={() => openModal("suspend", user)}
                    disabled={actionLoading === user.id || user.role === "ADMIN"}
                    title={user.role === "ADMIN" ? "Cannot suspend an admin" : undefined}
                  >
                    {actionLoading === user.id ? "Working…" : "Suspend"}
                  </Button>
                )}
              </div>
            ))
          )}
        </Card>

        {/* Games panel */}
        <div className="space-y-5">
          <Card tone="parchment" className="p-6">
            <h2 className="font-display text-3xl font-semibold text-roasted">
              Audit before action.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-roasted/65">
              Suspend and restore require a reason. Every action is written to an
              append-only audit log, resolved against the server-verified Clerk role.
            </p>
          </Card>

          {games.length > 0 && (
            <Card className="p-5">
              <h2 className="mb-4 font-display text-xl font-semibold">Game results</h2>
              {games.slice(0, 5).map((game) => (
                <div
                  key={game.id}
                  className="mb-3 rounded-xl border border-cream/[0.08] bg-roasted/30 px-4 py-3 last:mb-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-cream-muted truncate">{game.id}</span>
                    <Badge tone={game.status === "ACTIVE" ? "danger" : "brass"}>
                      {game.status}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-cream-muted">
                    {game.participants?.map((p) => p.usernameSnapshot).join(" vs ")}
                  </div>
                  <Button
                    to={`/games/${game.id}`}
                    size="small"
                    variant="ghost"
                    className="mt-2"
                  >
                    View game →
                  </Button>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>

      {/* Reason modal */}
      <ReasonModal
        open={!!modal}
        onClose={closeModal}
        title={
          modal?.type === "suspend"
            ? `Suspend ${modal?.user?.username}`
            : `Restore ${modal?.user?.username}`
        }
        reason={reason}
        onReasonChange={setReason}
        onConfirm={handleConfirm}
        loading={modalLoading}
        confirmLabel={modal?.type === "suspend" ? "Suspend" : "Restore"}
        confirmVariant={modal?.type === "suspend" ? "danger" : "primary"}
      />
      {modalError && (
        <p className="mt-2 text-xs text-danger text-center">{modalError}</p>
      )}
    </div>
  );
}
