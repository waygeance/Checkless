import { useState } from "react";
import { Search, UserMinus, UserPlus, Users, X, Check } from "lucide-react";
import { useAuth } from "@clerk/react";
import { searchUsers } from "../api/social";
import { useSocialFriends, useBlocks } from "../hooks/useSocialFriends";
import { useDebounce } from "../hooks/useApi";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Input,
  LoadingState,
  Modal,
  PageHeader
} from "../components/ui";

function FriendCard({ friend, onRemove, onChallenge }) {
  const [removing, setRemoving] = useState(false);
  const handleRemove = async () => {
    setRemoving(true);
    try { await onRemove(friend.id); }
    finally { setRemoving(false); }
  };
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-brass/25 bg-roasted/70">
        {friend.avatarUrl ? (
          <img src={friend.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
        ) : (
          <Users className="h-5 w-5 text-brass-light" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate font-semibold text-cream">{friend.username}</h2>
        </div>
        {friend.displayName && (
          <p className="mt-1 truncate text-xs text-cream-muted">{friend.displayName}</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button to={`/players/${friend.username}`} size="small" variant="ghost">
          Profile
        </Button>
        <Button size="small" variant="outline" onClick={() => onChallenge(friend.username)}>
          Challenge
        </Button>
        <Button
          size="small"
          variant="danger"
          icon={UserMinus}
          onClick={handleRemove}
          disabled={removing}
        >
          {removing ? "…" : ""}
        </Button>
      </div>
    </Card>
  );
}

function RequestCard({ request, viewerId, onAccept, onDecline, onCancel }) {
  const isIncoming = request.receiverId === viewerId || request.sender?.username !== undefined;
  const [loading, setLoading] = useState(false);

  const handle = async (action) => {
    setLoading(true);
    try {
      if (action === "accept") await onAccept(request.id);
      else if (action === "decline") await onDecline(request.id);
      else await onCancel(request.id);
    } finally { setLoading(false); }
  };

  const otherUser = isIncoming ? request.sender : request.receiver;

  return (
    <Card className="flex items-center gap-4 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-brass/25 bg-roasted/70">
        <Users className="h-4 w-4 text-brass-light" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="font-semibold text-cream">{otherUser?.username ?? "Unknown"}</span>
        <Badge tone={isIncoming ? "lime" : "brass"} className="ml-2">
          {isIncoming ? "Incoming" : "Outgoing"}
        </Badge>
      </div>
      <div className="flex gap-2">
        {isIncoming ? (
          <>
            <Button size="small" variant="ghost" icon={X} onClick={() => handle("decline")} disabled={loading}>
              Decline
            </Button>
            <Button size="small" icon={Check} onClick={() => handle("accept")} disabled={loading}>
              Accept
            </Button>
          </>
        ) : (
          <Button size="small" variant="danger" icon={X} onClick={() => handle("cancel")} disabled={loading}>
            Cancel
          </Button>
        )}
      </div>
    </Card>
  );
}

export default function Friends() {
  const { getToken } = useAuth();
  const {
    friends,
    requests,
    loading,
    error,
    sendRequest,
    respondRequest,
    cancelRequest,
    removeFriend
  } = useSocialFriends();
  const { blocks, loading: blocksLoading, unblockUser } = useBlocks();

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addUsername, setAddUsername] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestError, setRequestError] = useState(null);
  const [showBlocks, setShowBlocks] = useState(false);

  // Search users
  useState(() => {}); // placeholder — we use an effect below
  const [searchEffect, setSearchEffect] = useState(null);

  // Trigger search when debounced query changes
  const doSearch = async (q) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const token = await getToken();
      const res = await searchUsers(q, token);
      setSearchResults(res.users ?? []);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  };

  // Use a manual effect trigger
  const [lastSearch, setLastSearch] = useState("");
  if (debouncedSearch !== lastSearch) {
    setLastSearch(debouncedSearch);
    doSearch(debouncedSearch);
  }

  const handleSendRequest = async () => {
    if (!addUsername.trim()) return;
    setSendingRequest(true);
    setRequestError(null);
    try {
      await sendRequest(addUsername.trim());
      setAddUsername("");
    } catch (err) {
      setRequestError(err.code || err.message);
    } finally { setSendingRequest(false); }
  };

  const handleChallenge = (username) => {
    window.location.href = `/challenges?opponent=${encodeURIComponent(username)}`;
  };

  const pendingRequests = requests.filter((r) => r.status === "PENDING");

  return (
    <div>
      <PageHeader
        eyebrow="Your regulars"
        title="Friends"
        description="Find players by username, see who is around, and send a challenge. Presence is visible only between accepted friends."
        action={<Badge tone="lime">{friends.length} friends</Badge>}
      />

      {/* Add friend */}
      <Card className="p-4 mb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-cream-muted">
          Add a friend
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-muted/45" />
            <Input
              className="pl-10"
              placeholder="Exact username"
              value={addUsername}
              onChange={(e) => setAddUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendRequest()}
            />
          </div>
          <Button
            icon={UserPlus}
            onClick={handleSendRequest}
            disabled={sendingRequest || !addUsername.trim()}
          >
            {sendingRequest ? "Sending…" : "Add"}
          </Button>
        </div>
        {requestError && (
          <p className="mt-2 text-xs text-danger">{requestError}</p>
        )}
      </Card>

      {/* User search */}
      <Card className="p-4 mb-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-muted/45" />
          <Input
            className="pl-10"
            placeholder="Search players by username"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {searching && <p className="mt-2 text-xs text-cream-muted">Searching…</p>}
        {searchResults.length > 0 && (
          <div className="mt-3 space-y-2">
            {searchResults.map((u) => (
              <div key={u.username} className="flex items-center justify-between gap-3 rounded-xl border border-cream/[0.08] bg-roasted/30 px-4 py-3">
                <span className="font-semibold text-cream">{u.username}</span>
                <Button
                  size="small"
                  icon={UserPlus}
                  onClick={() => { setAddUsername(u.username); setSearchQuery(""); setSearchResults([]); }}
                >
                  Add
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pending requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-5">
          <h3 className="mb-3 text-sm font-semibold text-cream-muted uppercase tracking-wider">
            Requests ({pendingRequests.length})
          </h3>
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                onAccept={(id) => respondRequest(id, "accept")}
                onDecline={(id) => respondRequest(id, "decline")}
                onCancel={(id) => cancelRequest(id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && <ErrorState error={error} className="mb-5" />}

      {/* Friends list */}
      {loading ? (
        <LoadingState text="Loading friends…" />
      ) : friends.length === 0 ? (
        <div className="rounded-xl border border-cream/[0.07] bg-roasted/30 py-12 text-center text-sm text-cream-muted/60">
          No friends yet. Search for a player above and send a request!
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {friends.map((friend) => (
            <FriendCard
              key={friend.id}
              friend={friend}
              onRemove={removeFriend}
              onChallenge={handleChallenge}
            />
          ))}
        </div>
      )}

      {/* Manage blocks */}
      <div className="mt-8 flex items-center justify-between border-t border-cream/[0.07] pt-5">
        <p className="text-xs text-cream-muted/60">
          Blocking removes friendships and pending interactions in one transaction.
        </p>
        <Button
          variant="ghost"
          size="small"
          icon={UserMinus}
          onClick={() => setShowBlocks(true)}
        >
          Manage blocks
        </Button>
      </div>

      {/* Blocks modal */}
      <Modal
        open={showBlocks}
        onClose={() => setShowBlocks(false)}
        title="Blocked players"
      >
        {blocksLoading ? (
          <LoadingState text="Loading blocks…" />
        ) : blocks.length === 0 ? (
          <p className="text-sm text-cream-muted">You haven't blocked anyone.</p>
        ) : (
          <div className="space-y-3">
            {blocks.map((block) => (
              <div
                key={block.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-cream/[0.08] px-4 py-3"
              >
                <span className="font-semibold text-cream">{block.blocked?.username}</span>
                <Button
                  size="small"
                  variant="outline"
                  onClick={() => unblockUser(block.blockedId)}
                >
                  Unblock
                </Button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
