import { ExternalLink } from "lucide-react";
import { PublicPage } from "../components/app/PublicLayout";
import { Button, Card, PageHeader } from "../components/ui";

const sources = [
  {
    name: "The Chess Players — Thomas Eakins",
    owner: "The Metropolitan Museum of Art",
    license: "Public Domain / Open Access",
    href: "https://www.metmuseum.org/art/collection/search/10813"
  },
  {
    name: "De schaakspelers — Isaac Israels",
    owner: "Rijksmuseum",
    license: "Public Domain",
    href: "https://www.rijksmuseum.nl/en/collection/object/De%2Bschaakspelers--318863b8bc863e591a052324a024be06"
  },
  {
    name: "Game Icons",
    owner: "Lorc, Delapouite & contributors",
    license: "CC BY 3.0",
    href: "https://game-icons.net/about.html"
  }
];

export default function Attributions() {
  return (
    <PublicPage>
      <PageHeader
        eyebrow="The back of the menu"
        title="Attributions"
        description="Open-source software and public-domain art give this coffeehouse its texture. We keep the provenance visible."
      />
      <div className="space-y-4">
        {sources.map((source) => (
          <Card
            key={source.name}
            className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
          >
            <div className="flex-1">
              <h2 className="font-display text-xl font-semibold text-cream">
                {source.name}
              </h2>
              <p className="mt-1 text-sm text-cream-muted">
                {source.owner} · {source.license}
              </p>
            </div>
            <Button
              href={source.href}
              target="_blank"
              rel="noreferrer"
              variant="outline"
              size="small"
              icon={ExternalLink}
            >
              View source
            </Button>
          </Card>
        ))}
      </div>
    </PublicPage>
  );
}
