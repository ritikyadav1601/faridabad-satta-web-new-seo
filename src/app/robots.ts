import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // Chart pages render their default result table server-side now, but
        // client-side month navigation still calls these read-only routes.
        // Their longer Allow paths override the general /api/ block below.
        allow: [
          "/",
          "/api/game-chart",
          "/api/year-chart",
        ],
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
