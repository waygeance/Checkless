import { Outlet } from "react-router-dom";
import { SiteFooter } from "../SiteFooter";
import { SiteHeader } from "../SiteHeader";

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-roasted text-cream">
      <SiteHeader active="public" />
      <main className="flex-1 pt-24">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}

export function PublicPage({ children }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-7 sm:py-14">
      {children}
    </div>
  );
}
