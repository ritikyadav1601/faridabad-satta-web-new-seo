import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // Chart pages hydrate their result tables from these read-only routes.
        // Their longer Allow paths override the general /api/ block so search
        // engine renderers can see the same chart content as visitors.
        allow: [
          "/",
          "/api/game-chart",
          "/api/year-chart",
          "/api/custom-games/chart",
        ],
        disallow: ["/api/", "/add-game-value"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
