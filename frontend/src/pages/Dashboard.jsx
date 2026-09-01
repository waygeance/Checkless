import { useUser } from "@clerk/react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleDot,
  Flame,
  Swords,
  Trophy,
  Users,
  Zap
} from "lucide-react";
import { friends, recentGames, tournaments } from "../data/platform";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  PageHeader,
  Progress,
  SketchDivider
} from "../components/ui";

const variants = [
  {
    value: "1s",
    title: "Lightning",
    note: "Pure reflex",
    rating: 1428,
    icon: Zap
  },
  {
    value: "3s",
    title: "House blend",
    note: "Fast and balanced",
    rating: 1516,
    icon: Swords
  },
  {
    value: "5s",
    title: "Slow pour",
    note: "Room to scheme",
    rating: 1472,
    icon: CircleDot
  }
];

const reveal = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function Dashboard() {
  const { user } = useUser();
  const firstName = user?.firstName || user?.username || "Player";

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.06 } } }}
    >
      <motion.div variants={reveal}>
        <PageHeader
          eyebrow="Your table is ready"
          title={`Good evening, ${firstName}.`}
          description="Pick a pace, revisit your latest positions, or pull up a chair at this week’s tournament."
          action={
            <Button to="/play" size="large" icon={Swords}>
              Find a game
            </Button>
          }
        />
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.7fr)]">
        <motion.div variants={reveal}>
          <Card tone="parchment" className="p-6 sm:p-8">
            <CardHeader eyebrow="Quick match" title="Choose your house pace">
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-roasted/65">
                Casual tables are open. Ranked matchmaking becomes available
                when the rating service lands.
              </p>
            </CardHeader>
            <SketchDivider className="my-4" />
            <div className="grid gap-3 md:grid-cols-3">
              {variants.map((variant, index) => {
                const Icon = variant.icon;
                return (
                  <motion.div
                    key={variant.value}
                    whileHover={{ y: -3 }}
                    className={`rounded-2xl border p-4 ${index === 1 ? "border-roasted/40 bg-roasted text-cream" : "border-roasted/15 bg-white/25 text-roasted"}`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon
                        className={`h-5 w-5 ${index === 1 ? "text-lime" : "text-wine"}`}
                      />
                      <span className="font-mono text-xs opacity-60">
                        {variant.rating}
                      </span>
                    </div>
                    <div className="mt-5 font-display text-3xl font-semibold">
                      {variant.value}
                    </div>
                    <div className="mt-1 text-sm font-semibold">
                      {variant.title}
                    </div>
                    <div className="mt-1 text-xs opacity-60">
                      {variant.note}
                    </div>
                    <Button
                      to={`/play?variant=${variant.value}`}
                      size="small"
                      variant={index === 1 ? "primary" : "secondary"}
                      className="mt-5 w-full"
                    >
                      Take a seat
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={reveal}>
          <Card className="h-full p-6">
            <div className="flex items-center justify-between">
              <Badge tone="brass">Daily ritual</Badge>
              <Flame className="h-5 w-5 text-wine-light" />
            </div>
            <h2 className="mt-5 font-display text-3xl font-semibold">
              Keep the table warm.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-cream-muted">
              Finish today’s three grounded goals. No artificial currency—just
              progress you can understand.
            </p>
            <div className="mt-6 space-y-5">
              <Progress value={67} label="Play three games" detail="2 / 3" />
              <Progress value={50} label="Win two games" detail="1 / 2" />
              <Progress
                value={80}
                label="Make 25 accepted moves"
                detail="20 / 25"
              />
            </div>
            <div className="mt-7 flex items-center gap-3 rounded-xl border border-lime/15 bg-lime/[0.06] p-3 text-xs text-cream-muted">
              <Check className="h-4 w-4 text-lime" />
              One-day streak secured
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <motion.div variants={reveal}>
          <Card className="p-6">
            <CardHeader
              eyebrow="Notebook"
              title="Recent games"
              action={
                <Button
                  to="/games"
                  variant="ghost"
                  size="small"
                  icon={ArrowUpRight}
                  iconPosition="right"
                >
                  View all
                </Button>
              }
            />
            <div className="mt-5 divide-y divide-cream/[0.07]">
              {recentGames.slice(0, 4).map((game) => (
                <a
                  href={`/games/${game.id}`}
                  key={game.id}
                  className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${game.result === "WIN" ? "bg-lime" : "bg-wine-light"}`}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-cream group-hover:text-lime">
                      {game.opponent}
                    </span>
                    <span className="mt-1 block text-xs text-cream-muted/60">
                      {game.variant} · {game.playedAt}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span
                      className={`font-mono text-xs ${game.result === "WIN" ? "text-lime" : "text-wine-light"}`}
                    >
                      {game.delta}
                    </span>
                    <ChevronRight className="h-4 w-4 text-cream-muted/40" />
                  </span>
                </a>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={reveal} className="grid gap-6">
          <Card className="p-6">
            <CardHeader eyebrow="This week" title={tournaments[0].name} />
            <div className="mt-5 flex items-center gap-4 rounded-xl border border-brass/20 bg-brass/[0.06] p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-brass/35 text-brass-light">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-cream">
                  {tournaments[0].starts}
                </div>
                <div className="mt-1 text-xs text-cream-muted">
                  {tournaments[0].entrants}/{tournaments[0].capacity} seats
                </div>
              </div>
            </div>
            <Button
              to={`/tournaments/${tournaments[0].id}`}
              variant="outline"
              size="small"
              className="mt-5 w-full"
            >
              View tournament
            </Button>
          </Card>

          <Card className="p-6">
            <CardHeader eyebrow="At the café" title="Friends online" />
            <div className="mt-5 space-y-4">
              {friends
                .filter((friend) => friend.online)
                .slice(0, 3)
                .map((friend) => (
                  <div
                    key={friend.username}
                    className="flex items-center gap-3"
                  >
                    <span className="h-8 w-8 rounded-full border border-brass/25 bg-roasted/80" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-cream">
                        {friend.username}
                      </div>
                      <div className="truncate text-xs text-cream-muted/60">
                        {friend.status}
                      </div>
                    </div>
                    <span className="ml-auto h-2 w-2 rounded-full bg-lime" />
                  </div>
                ))}
            </div>
            <Button
              to="/friends"
              variant="ghost"
              size="small"
              className="mt-4 w-full"
              icon={Users}
            >
              Open friends
            </Button>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
