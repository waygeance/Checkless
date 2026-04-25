import type { Metadata } from "next";
import Game from "@/components/Game";
import { SHARE_IMAGE_PATH, SITE_NAME } from "@/lib/site";

const isVariant = (value: unknown): value is "1s" | "3s" | "5s" =>
  value === "1s" || value === "3s" || value === "5s";

export const metadata: Metadata = {
  title: "Play Simultaneous Chess",
  description:
    "Queue into live 1s, 3s, or 5s simultaneous chess matches and capture the king before your opponent does.",
  alternates: {
    canonical: "/play",
  },
  openGraph: {
    title: `Play ${SITE_NAME}`,
    description:
      "Jump into live simultaneous chess matches with independent timers and real-time king-capture gameplay.",
    url: "/play",
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: SHARE_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} play screen preview`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Play ${SITE_NAME}`,
    description:
      "Live simultaneous chess with fast queues, independent timers, and no-turn pressure.",
    images: [SHARE_IMAGE_PATH],
  },
};

export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string | string[] }>;
}) {
  const params = await searchParams;
  const variantValue = Array.isArray(params.variant)
    ? params.variant[0]
    : params.variant;
  const hasVariant = isVariant(variantValue);
  const initialVariant = hasVariant ? variantValue : "3s";

  return <Game initialVariant={initialVariant} autoStart={hasVariant} />;
}
