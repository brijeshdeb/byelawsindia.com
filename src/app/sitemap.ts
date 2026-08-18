import type { MetadataRoute } from "next";

/**
 * Sitemap — public pages only.
 * Authenticated tenant routes are excluded intentionally.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.byelawsindia.com";
  const now = new Date();

  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${base}/login`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];
}
