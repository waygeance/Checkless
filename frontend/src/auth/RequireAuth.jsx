import { useAuth } from "@clerk/react";
import { LoaderCircle } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";

export function RequireAuth({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-espresso text-cream">
        <div className="flex items-center gap-3 font-mono text-sm uppercase tracking-[0.2em] text-cream-muted">
          <LoaderCircle className="h-5 w-5 animate-spin text-lime" />
          Loading account
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <Navigate
        to="/sign-in"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return children;
}
