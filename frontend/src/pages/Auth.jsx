import { SignIn, SignUp } from "@clerk/react";
import { useLocation } from "react-router-dom";
import { SiteHeader } from "../components/SiteHeader";

export default function Auth({ mode }) {
  const location = useLocation();
  const redirectTo = location.state?.from || "/play";
  const isSignUp = mode === "sign-up";
  const AuthComponent = isSignUp ? SignUp : SignIn;

  return (
    <div className="min-h-screen bg-espresso text-cream">
      {/* active="auth" keeps the header solid/blurred from the start */}
      <SiteHeader active="auth" />

      <main className="flex min-h-screen items-center justify-center px-4 pb-16 pt-28 sm:px-6">
        <section className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-mocha shadow-tactile lg:grid-cols-[0.9fr_1.1fr]">
          {/* ── Left panel (desktop only) ───────────────────── */}
          <div className="relative hidden overflow-hidden bg-tactile-gradient p-10 lg:flex lg:flex-col lg:justify-between">
            {/* Lime glow accent */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-lime/10 blur-[80px]" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-lime/6 blur-[60px]" />

            <div className="relative">
              <div className="font-mono text-xs uppercase tracking-[0.28em] text-lime">
                Player identity
              </div>
              <h1 className="mt-5 font-display text-5xl font-bold leading-tight">
                {isSignUp
                  ? "Create your player profile."
                  : "Return to the board."}
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-cream-muted">
                {isSignUp
                  ? "Your Clerk account secures your live game identity and prepares your profile for history, ratings, friends, and challenges."
                  : "Sign back in to pick up where you left off — your ratings, friends, and challenge history are waiting."}
              </p>
            </div>

            {/* Decorative king */}
            <div className="relative flex items-end justify-between">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-cream-muted/70">
                No turns. No checkmate. Capture the king.
              </p>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-espresso/80 shadow-tactile">
                <img
                  src="/pieces/companion/wK.svg"
                  alt=""
                  aria-hidden="true"
                  width={34}
                  height={34}
                  className="opacity-60 saturate-0"
                />
              </div>
            </div>
          </div>

          {/* ── Right panel — Clerk form ─────────────────────── */}
          <div className="flex min-h-[620px] items-center justify-center bg-espresso/60 p-6 sm:p-10">
            <AuthComponent
              routing="path"
              path={isSignUp ? "/sign-up" : "/sign-in"}
              signInUrl="/sign-in"
              signUpUrl="/sign-up"
              forceRedirectUrl={redirectTo}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
