import { lazy, Suspense } from "react";
import { useAuth } from "@clerk/react";
import { LoaderCircle } from "lucide-react";
import { Routes, Route } from "react-router-dom";
import { RequireAuth } from "./auth/RequireAuth";
import { AppShell } from "./components/app/AppShell";
import { PublicLayout } from "./components/app/PublicLayout";
import Auth from "./pages/Auth";
import Home from "./pages/Home";

const Admin = lazy(() => import("./pages/Admin"));
const Attributions = lazy(() => import("./pages/Attributions"));
const Challenges = lazy(() => import("./pages/Challenges"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Friends = lazy(() => import("./pages/Friends"));
const GameDetails = lazy(() => import("./pages/GameDetails"));
const Games = lazy(() => import("./pages/Games"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Play = lazy(() => import("./pages/Play"));
const PlayerProfile = lazy(() => import("./pages/PlayerProfile"));
const Settings = lazy(() => import("./pages/Settings"));
const TournamentCreate = lazy(() => import("./pages/TournamentCreate"));
const TournamentDetails = lazy(() => import("./pages/TournamentDetails"));
const Tournaments = lazy(() => import("./pages/Tournaments"));
const Watch = lazy(() => import("./pages/Watch"));

function RouteLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-roasted text-cream-muted">
      <LoaderCircle className="mr-3 h-5 w-5 animate-spin text-lime" /> Opening
      the table
    </div>
  );
}

function ProtectedShell() {
  return (
    <RequireAuth>
      <AppShell />
    </RequireAuth>
  );
}

function AdaptiveShell() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <RouteLoading />;
  return isSignedIn ? <AppShell /> : <PublicLayout />;
}

export default function App() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sign-in/*" element={<Auth mode="sign-in" />} />
        <Route path="/sign-up/*" element={<Auth mode="sign-up" />} />

        <Route element={<ProtectedShell />}>
          <Route path="/home" element={<Dashboard />} />
          <Route path="/play" element={<Play />} />
          <Route path="/games" element={<Games />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/tournaments/new" element={<TournamentCreate />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin/*" element={<Admin />} />
        </Route>

        <Route element={<AdaptiveShell />}>
          <Route path="/players/:username" element={<PlayerProfile />} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route path="/tournaments/:id" element={<TournamentDetails />} />
        </Route>

        <Route element={<PublicLayout />}>
          <Route path="/watch" element={<Watch />} />
          <Route path="/games/:gameId" element={<GameDetails />} />
          <Route path="/attributions" element={<Attributions />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
