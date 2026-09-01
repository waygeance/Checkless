import { Show, SignInButton, SignUpButton } from "@clerk/react";
import { motion } from "framer-motion";
import { ArrowRight, Clock3, Eye, Radio, Shield, Swords } from "lucide-react";
import { useEffect } from "react";
import { MiniBoard } from "../components/app/MiniBoard";
import { Badge, Button, Card, SketchDivider } from "../components/ui";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { liveGames } from "../data/platform";

const steps = [
  {
    number: "I",
    icon: Swords,
    title: "Both players move",
    text: "There are no turns. Read the same changing board together."
  },
  {
    number: "II",
    icon: Clock3,
    title: "Your clock recharges",
    text: "After every accepted move, your 1s, 3s, or 5s cooldown begins."
  },
  {
    number: "III",
    icon: Shield,
    title: "Capture the king",
    text: "No check or checkmate. The first accepted king capture wins."
  }
];

export default function Home() {
  useEffect(() => {
    document.title = "Checkless — Chess without turns";
  }, []);

  return (
    <div className="min-h-screen overflow-hidden bg-roasted text-cream">
      <SiteHeader active="landing" />
      <main>
        <section className="relative isolate min-h-[48rem] overflow-hidden px-5 pb-20 pt-36 sm:px-7 lg:pt-40">
          <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(19,15,12,.98)_0%,rgba(19,15,12,.88)_42%,rgba(19,15,12,.4)_100%),url('/images/home-hero-poster.jpg')] bg-cover bg-center" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_28%,rgba(194,216,46,.12),transparent_28rem)]" />
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[minmax(0,.88fr)_minmax(28rem,1.12fr)]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65 }}
            >
              <Badge tone="brass">
                <Radio className="mr-1.5 h-3 w-3" /> Public tables open
              </Badge>
              <h1 className="mt-7 font-display text-[clamp(4.3rem,10vw,8.2rem)] font-semibold leading-[0.76] tracking-[-0.055em] text-cream">
                Chess.
                <br />
                <span className="text-lime">No turns.</span>
              </h1>
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-cream-muted">
                A faster, stranger coffeehouse game. You and your opponent move
                on independent cooldowns, and the king is captured in plain
                sight.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Show when="signed-out">
                  <SignUpButton mode="modal" fallbackRedirectUrl="/home">
                    <Button size="large" icon={ArrowRight} iconPosition="right">
                      Claim a table
                    </Button>
                  </SignUpButton>
                </Show>
                <Show when="signed-in">
                  <Button
                    to="/home"
                    size="large"
                    icon={ArrowRight}
                    iconPosition="right"
                  >
                    Enter the coffeehouse
                  </Button>
                </Show>
                <Button to="/watch" size="large" variant="outline" icon={Eye}>
                  Watch live
                </Button>
              </div>
              <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-cream-muted/55">
                Free to play · Public replays · No checkmate
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, rotate: 1.5, x: 20 }}
              animate={{ opacity: 1, rotate: -1.2, x: 0 }}
              transition={{ duration: 0.75, delay: 0.12 }}
              className="relative hidden lg:block"
            >
              <div className="absolute -inset-5 rounded-[2rem] border border-brass/15 bg-walnut/45 shadow-[0_40px_100px_rgba(0,0,0,.55)]" />
              <MiniBoard className="relative" />
              <div className="absolute -bottom-8 -left-8 rounded-xl border border-brass/25 bg-roasted/95 px-5 py-4 shadow-2xl">
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-cream-muted">
                  Your cooldown
                </p>
                <p className="mt-1 font-mono text-3xl font-semibold text-lime">
                  00.8
                </p>
              </div>
              <div className="absolute -right-5 -top-7 rounded-full border border-wine/35 bg-roasted/95 px-4 py-3 font-mono text-xs text-wine-light shadow-2xl">
                KING EXPOSED
              </div>
            </motion.div>
          </div>
        </section>

        <section id="how-it-works" className="px-5 py-20 sm:px-7">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-brass-light">
                House rules
              </p>
              <h2 className="mt-3 font-display text-5xl font-semibold sm:text-6xl">
                Familiar pieces. Different pressure.
              </h2>
              <p className="mt-4 text-cream-muted">
                The rules fit on the back of a café receipt.
              </p>
            </div>
            <SketchDivider className="my-9 max-w-3xl" />
            <div className="grid gap-5 lg:grid-cols-3">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <Card key={step.number} className="p-6">
                    <div className="flex items-start justify-between">
                      <span className="font-display text-4xl text-brass/60">
                        {step.number}
                      </span>
                      <Icon className="h-5 w-5 text-lime" />
                    </div>
                    <h3 className="mt-9 font-display text-2xl font-semibold">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-cream-muted">
                      {step.text}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-cream/[0.07] bg-espresso-deep/70 px-5 py-20 sm:px-7">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-brass-light">
                  Across the room
                </p>
                <h2 className="mt-3 font-display text-5xl font-semibold">
                  Live public tables
                </h2>
              </div>
              <Button
                to="/watch"
                variant="ghost"
                icon={ArrowRight}
                iconPosition="right"
              >
                See every table
              </Button>
            </div>
            <div className="mt-9 grid gap-5 lg:grid-cols-3">
              {liveGames.map((game) => (
                <Card key={game.id} className="p-5">
                  <div className="flex items-center justify-between">
                    <Badge tone="danger">Live</Badge>
                    <span className="font-mono text-xs text-cream-muted">
                      {game.viewers} watching
                    </span>
                  </div>
                  <h3 className="mt-6 font-display text-2xl font-semibold">
                    {game.white}
                  </h3>
                  <p className="my-1 font-display italic text-brass-light">
                    against
                  </p>
                  <h3 className="font-display text-2xl font-semibold">
                    {game.black}
                  </h3>
                  <div className="mt-6 flex items-center justify-between border-t border-cream/[0.07] pt-4">
                    <span className="font-mono text-xs text-cream-muted">
                      {game.variant} · move {game.sequence}
                    </span>
                    <Button
                      to={`/games/${game.id}`}
                      variant="outline"
                      size="small"
                    >
                      Watch
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-24 sm:px-7">
          <Card tone="parchment" className="mx-auto max-w-7xl p-8 sm:p-12">
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-wine">
                  The next game is already changing
                </p>
                <h2 className="mt-3 font-display text-5xl font-semibold text-roasted">
                  Pull up a chair.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-roasted/65">
                  Create your profile, choose a cooldown, and meet somebody at
                  the board.
                </p>
              </div>
              <Show when="signed-out">
                <SignInButton mode="modal" fallbackRedirectUrl="/home">
                  <Button size="large">Sign in to play</Button>
                </SignInButton>
              </Show>
              <Show when="signed-in">
                <Button to="/play" size="large">
                  Find a game
                </Button>
              </Show>
            </div>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
