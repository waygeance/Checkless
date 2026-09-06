import { useEffect, useRef, useState } from "react";
import { Eye, Radio, Users } from "lucide-react";
import { io } from "socket.io-client";
import { Badge, Button, Card, PageHeader } from "../components/ui";
import { PublicPage } from "../components/app/PublicLayout";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "";

/**
 * Watch page — discovers live games via WebSocket.
 * We use the spectate_game / spectate_started flow to probe for live games.
 * The socket is created unauthenticated (guest access only for spectating).
 *
 * NOTE: The server registers live games in memory; there is currently no REST
 * endpoint to enumerate live games. We handle this by subscribing to
 * game_start events via a shared socket.
 */
export default function Watch() {
  const [liveGames, setLiveGames] = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 3
    });

    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    // Listen for game_start events broadcast to spectators
    // When a move is made, update that game's sequence count
    socket.on("move_made", ({ gameId, sequence }) => {
      setLiveGames((prev) =>
        prev.map((g) => (g.id === gameId ? { ...g, sequence } : g))
      );
    });

    // On spectate_started — add the game to the live list if not present
    socket.on("spectate_started", (state) => {
      setLiveGames((prev) => {
        const exists = prev.find((g) => g.id === state.gameId);
        if (exists) return prev;
        return [
          ...prev,
          {
            id: state.gameId,
            white: state.players?.white?.username ?? "White",
            black: state.players?.black?.username ?? "Black",
            variant: state.variant,
            sequence: state.sequence ?? 0,
            viewers: 1
          }
        ];
      });
    });

    socket.on("game_over", ({ gameId }) => {
      setLiveGames((prev) => prev.filter((g) => g.id !== gameId));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const VARIANT_LABELS = {
    ONE_SECOND: "1s",
    THREE_SECONDS: "3s",
    FIVE_SECONDS: "5s"
  };

  return (
    <PublicPage>
      <PageHeader
        eyebrow="Public tables"
        title="Watch the room think."
        description="Every live table is public. Follow the exact server order, cooldown tension, and final king capture without touching the board."
      />

      {liveGames.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-cream/[0.08] bg-roasted/40 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-cream/10 bg-walnut">
            <Eye className="h-7 w-7 text-brass-light" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-cream">
              No live tables right now.
            </h2>
            <p className="mt-2 text-sm text-cream-muted">
              {connected
                ? "The café is quiet. Check back when players are at the board."
                : "Connecting to the live stream…"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          {liveGames.map((game, index) => (
            <Card key={game.id} className="group p-5">
              <div className="aspect-[4/3] rounded-xl border border-cream/10 bg-[linear-gradient(45deg,#c6ad82_25%,#50392b_25%,#50392b_50%,#c6ad82_50%,#c6ad82_75%,#50392b_75%)] bg-[length:25%_25%] opacity-80 transition group-hover:opacity-100" />
              <div className="mt-5 flex items-center justify-between gap-3">
                <Badge tone="danger">
                  <Radio className="mr-1.5 h-3 w-3" /> Live
                </Badge>
                <span className="flex items-center gap-1.5 text-xs text-cream-muted">
                  <Users className="h-3.5 w-3.5" /> {game.viewers ?? 1}
                </span>
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold text-cream">
                {game.white} <span className="text-cream-muted/45">vs</span> {game.black}
              </h2>
              <p className="mt-2 text-xs text-cream-muted">
                {VARIANT_LABELS[game.variant] ?? game.variant} cooldown · move {game.sequence}
              </p>
              <Button
                to={`/games/${game.id}`}
                variant={index === 0 ? "primary" : "outline"}
                size="small"
                className="mt-5 w-full"
                icon={Eye}
              >
                Watch table
              </Button>
            </Card>
          ))}
        </div>
      )}
    </PublicPage>
  );
}
