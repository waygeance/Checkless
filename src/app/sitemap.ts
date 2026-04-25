import type { MetadataRoute } from "next";
import { SHARE_IMAGE_PATH, getAbsoluteUrl } from "@/lib/site";

const lastModified = new Date("2026-04-25T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: getAbsoluteUrl("/"),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
      images: [getAbsoluteUrl(SHARE_IMAGE_PATH)],
    },
    {
      url: getAbsoluteUrl("/play"),
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
      images: [getAbsoluteUrl(SHARE_IMAGE_PATH)],
    },
  ];
}
