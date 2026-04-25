export const SITE_NAME = "Checkless";
export const SITE_TAGLINE = "Simultaneous Chess";
export const SITE_DESCRIPTION =
  "Checkless is a real-time simultaneous chess experience with independent timers, instant multiplayer queues, and king-capture wins.";
export const SITE_KEYWORDS = [
  "checkless",
  "simultaneous chess",
  "real-time chess",
  "multiplayer chess",
  "chess variant",
  "online chess game",
  "independent timers chess",
  "king capture chess",
];
export const DEFAULT_SITE_URL = "https://checkless-iota.vercel.app";
export const SHARE_IMAGE_PATH = "/images/home-hero-poster.jpg";
export const FAVICON_PATH = "/checkless-mark.svg";
export const THEME_COLOR = "#2c211f";
export const BACKGROUND_COLOR = "#2c211f";

export function getSiteUrl() {
  const configuredSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    DEFAULT_SITE_URL;

  const withProtocol = configuredSiteUrl.startsWith("http")
    ? configuredSiteUrl
    : `https://${configuredSiteUrl}`;

  return withProtocol.replace(/\/+$/, "");
}

export function getAbsoluteUrl(path = "/") {
  return new URL(path, `${getSiteUrl()}/`).toString();
}
