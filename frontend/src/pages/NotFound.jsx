import { Compass } from "lucide-react";
import { PublicPage } from "../components/app/PublicLayout";
import { Button, Card } from "../components/ui";

export default function NotFound() {
  return (
    <PublicPage>
      <Card
        tone="parchment"
        className="mx-auto max-w-2xl px-6 py-16 text-center"
      >
        <Compass className="mx-auto h-8 w-8 text-wine" />
        <p className="mt-5 font-mono text-xs uppercase tracking-[0.25em] text-wine">
          404 · Table not found
        </p>
        <h1 className="mt-3 font-display text-5xl font-semibold text-roasted">
          Wrong door, right café.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-roasted/65">
          That route does not lead to a public table. Return to the front room
          and choose another.
        </p>
        <Button to="/" className="mt-7">
          Return to landing
        </Button>
      </Card>
    </PublicPage>
  );
}
