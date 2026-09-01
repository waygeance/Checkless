import { Link } from "react-router-dom";

const groups = [
  {
    title: "Play",
    links: [
      ["Dashboard", "/home"],
      ["Matchmaking", "/play"],
      ["Watch live", "/watch"],
      ["Tournaments", "/tournaments"]
    ]
  },
  {
    title: "Community",
    links: [
      ["Friends", "/friends"],
      ["Challenges", "/challenges"],
      ["Game history", "/games"],
      ["Attributions", "/attributions"]
    ]
  }
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-cream/[0.07] bg-espresso-deep">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-[1.4fr_0.6fr_0.6fr]">
        <div className="max-w-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime">
              <img src="/pieces/companion/bK.svg" alt="" className="h-9 w-9" />
            </div>
            <div>
              <div className="font-display text-2xl font-semibold">
                Checkless
              </div>
              <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-brass-light">
                The digital coffeehouse
              </div>
            </div>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-cream-muted">
            Independent clocks, simultaneous moves, and a public record of every
            accepted decision.
          </p>
        </div>
        {groups.map((group) => (
          <div key={group.title}>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-brass-light">
              {group.title}
            </h2>
            <div className="mt-4 space-y-3">
              {group.links.map(([label, to]) => (
                <Link
                  key={to}
                  to={to}
                  className="block text-sm text-cream-muted transition hover:text-lime"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-2 border-t border-cream/[0.06] px-6 py-5 text-xs text-cream-muted/55 sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} Checkless</span>
        <span>Designed like a quiet café. Played like a fire drill.</span>
      </div>
    </footer>
  );
}
