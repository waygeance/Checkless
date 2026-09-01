/**
 * Site-wide constants and URL helpers.
 */

export const SITE_NAME = "Checkless";
export const SITE_TAGLINE = "Simultaneous Chess";
export const SITE_DESCRIPTION =
  "Checkless is a real-time simultaneous chess experience with independent timers, instant multiplayer queues, and king-capture wins.";
export const DEFAULT_SITE_URL = "https://checkless-iota.vercel.app";
export const SHARE_IMAGE_PATH = "/images/home-hero-poster.jpg";
export const FAVICON_PATH = "/checkless-mark.svg";
export const THEME_COLOR = "#2c211f";

export function getSiteUrl() {
  const configured = import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL;

  const withProtocol = configured.startsWith("http")
    ? configured
    : `https://${configured}`;

  return withProtocol.replace(/\/+$/, "");
}
