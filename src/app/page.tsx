"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Clock3,
  Lock,
  Shield,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

const casualVariants = ["1s", "3s", "5s"] as const;

const featureCards = [
  {
    icon: Zap,
    title: "Real-Time Action",
    description:
      "Pieces move simultaneously. Every second becomes a prediction problem.",
  },
  {
    icon: Shield,
    title: "No Checkmate",
    description:
      "Kings are hunted, not protected by slow move trees. Capture ends the match.",
  },
  {
    icon: Trophy,
    title: "Ranked Soon",
    description:
      "Casual queues are live today while account and ladder systems finish baking.",
  },
] as const;

const ruleCards = [
  {
    icon: Users,
    title: "Independent Timers",
    description: "Both players recharge and move on separate cooldowns.",
  },
  {
    icon: Clock3,
    title: "Tempo Wins",
    description: "When your timer hits zero, you move. Fast reads matter more.",
  },
  {
    icon: Shield,
    title: "King Capture",
    description: "No checkmate sequence. If the king falls, the game is over.",
  },
] as const;

export default function LandingPage() {
  const [hoveredVariant, setHoveredVariant] = useState<string | null>(null);

  return (
    <div className="min-h-screen overflow-hidden bg-espresso text-cream">
      <SiteHeader active="home" />

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top,rgba(200,255,0,0.14),transparent_58%)]" />

        <section className="relative px-6 pb-14 pt-36 sm:pb-20 sm:pt-40">
          <div className="mx-auto max-w-6xl">
            <motion.div
              className="mx-auto max-w-4xl text-center"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
            >
              <motion.div
                variants={fadeUp}
                className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-mocha/80 px-5 py-2 shadow-tactile backdrop-blur-sm"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-lime" />
                </span>
                <span className="font-mono text-xs uppercase tracking-[0.24em] text-cream-muted">
                  Match Servers Online
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="mt-10 font-display text-[clamp(3.4rem,11vw,7.4rem)] font-bold leading-[0.88] tracking-[-0.05em] text-cream text-shadow-sm"
              >
                NO TURNS.
                <br />
                <span className="text-lime text-shadow-lime">JUST CHAOS.</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mx-auto mt-7 max-w-3xl text-lg leading-relaxed text-cream-muted sm:text-xl"
              >
                Simultaneous chess where both players recharge independently,
                move under pressure, and finish games by capturing the king.
                The designer’s espresso-and-lime identity now drives every page
                of the experience.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-10 flex flex-wrap items-center justify-center gap-4"
              >
                <Link
                  href="/play?variant=3s"
                  className="inline-flex items-center gap-2 rounded-full bg-lime px-7 py-4 font-display text-lg font-bold text-espresso shadow-tactile-btn transition-all duration-300 hover:bg-lime-hover active:translate-y-0.5 active:shadow-tactile-btn-pressed"
                >
                  Play 3s Queue
                  <ChevronRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/#rules"
                  className="inline-flex items-center rounded-full border border-white/12 bg-mocha/70 px-7 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-cream transition-colors hover:border-lime/40 hover:text-lime"
                >
                  See Rules
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              id="features"
              className="mt-16 grid gap-6 md:grid-cols-3"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-120px" }}
              variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
            >
              {featureCards.map((feature) => {
                const Icon = feature.icon;

                return (
                  <motion.div
                    key={feature.title}
                    variants={fadeUp}
                    className="rounded-[1.75rem] border border-white/8 bg-mocha p-7 shadow-tactile bg-tactile-gradient"
                  >
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-espresso text-lime shadow-inner">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h2 className="font-display text-2xl font-bold text-cream">
                      {feature.title}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-cream-muted">
                      {feature.description}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        <section id="rules" className="px-6 py-8 sm:py-12">
          <div className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <motion.div
              initial={{ opacity: 0, x: -18 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-mocha p-7 shadow-tactile bg-tactile-gradient sm:p-10"
            >
              <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-lime/8 blur-[90px]" />
              <div className="relative">
                <span className="font-mono text-xs uppercase tracking-[0.24em] text-cream-muted">
                  Matchmaking
                </span>
                <h2 className="mt-3 font-display text-4xl font-bold text-cream sm:text-5xl">
                  CASUAL MATCH
                </h2>
                <p className="mt-3 max-w-xl text-lg text-cream-muted">
                  Jump straight in. No account required. Pick the cooldown that
                  fits your reflexes and enter the arena.
                </p>

                <div className="mt-9">
                  <div className="font-mono text-xs uppercase tracking-[0.24em] text-cream-muted">
                    Select Cooldown
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
                    {casualVariants.map((time) => (
                      <Link
                        key={time}
                        href={`/play?variant=${time}`}
                        onMouseEnter={() => setHoveredVariant(time)}
                        onMouseLeave={() => setHoveredVariant(null)}
                        className="group flex min-h-24 flex-col items-center justify-center rounded-[1.4rem] border border-lime/25 bg-espresso/60 px-4 py-5 font-mono text-lime transition-all duration-300 hover:-translate-y-1 hover:border-lime hover:bg-lime hover:text-espresso hover:shadow-tactile-lime sm:min-h-32"
                      >
                        <span className="text-3xl font-bold">{time}</span>
                        <span className="mt-2 text-[10px] uppercase tracking-[0.28em] opacity-75">
                          Cooldown
                        </span>
                        <span className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          {hoveredVariant === time ? "Queue Now" : "Ready"}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <div className="rounded-full border border-white/10 bg-espresso/75 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-lime">
                    Casual queue live
                  </div>
                  <div className="rounded-full border border-white/10 bg-espresso/75 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-cream-muted">
                    No login needed
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="grid gap-6">
              <motion.div
                initial={{ opacity: 0, x: 18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-120px" }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-mocha/65 p-7 shadow-tactile"
              >
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.22)_0,rgba(0,0,0,0.22)_2px,transparent_2px,transparent_11px)] opacity-[0.1]" />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-espresso/40 text-center backdrop-blur-[3px]">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-espresso/75 shadow-inner">
                    <Lock className="h-7 w-7 text-cream-muted/70" />
                  </div>
                  <div className="mt-5 font-display text-3xl font-bold text-cream/70">
                    RANKED MATCH
                  </div>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-cream-muted/80">
                    Authentication, ladders, and persistent ratings are coming
                    next.
                  </p>
                </div>

                <div className="opacity-30">
                  <span className="font-mono text-xs uppercase tracking-[0.24em] text-cream-muted">
                    Locked State
                  </span>
                  <h3 className="mt-3 font-display text-4xl font-bold text-cream">
                    Seasonal pressure with real ratings.
                  </h3>
                  <button className="mt-8 w-full rounded-full border border-white/14 px-6 py-4 font-display text-lg font-bold text-cream-muted">
                    Login To Enter Ranked
                  </button>
                </div>
              </motion.div>

              <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                {ruleCards.map((rule) => {
                  const Icon = rule.icon;

                  return (
                    <motion.div
                      key={rule.title}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 0.45 }}
                      className="rounded-[1.5rem] border border-white/8 bg-mocha/85 p-5 shadow-tactile"
                    >
                      <Icon className="h-5 w-5 text-lime" />
                      <h3 className="mt-4 font-display text-xl font-bold text-cream">
                        {rule.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-cream-muted">
                        {rule.description}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
