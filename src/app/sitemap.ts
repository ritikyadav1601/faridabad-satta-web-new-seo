import type { MetadataRoute } from "next";
import {
  getHomepageFromFirestore,
  getSK24GamesFromFirestore,
} from "@/lib/firebase-cache";
import { SITE_URL } from "@/lib/site";
import { TOP_GAME_DEFS } from "@/lib/top-games";
import { getTopGameAvailableYearsFromMongo } from "@/lib/top-games-mongodb";

// Refresh the sitemap at most every hour.
export const revalidate = 3600;

// Convert a game name into the same slug used by /chart/[gameCode] links.
function toSlug(name: string): string {
  const slug = name.toLowerCase().trim().replace(/\s+/g, "-");
  const aliases: Record<string, string> = {
    fridabad: "faridabad",
    frbd: "faridabad",
    gaziabad: "ghaziabad",
    gzbd: "ghaziabad",
    "purani-gali": "gali",
    disawar: "deshawer",
    desawar: "deshawer",
    desawer: "deshawer",
    dswr: "deshawer",
  };
  return aliases[slug] || slug;
}

function isJunkSlug(slug: string): boolean {
  return slug.replace(/[^a-z0-9]/g, "") === "showyourgamehere";
}

// Games that always exist on the homepage, regardless of what Firestore returns.
const FIXED_GAME_NAMES = [
  ...TOP_GAME_DEFS.map((game) => game.name),
  "kohlapur", "manipur", "up-bazar", "palwal-city", "mathura-city",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  // ─── Static pages ───
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/charts`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/disclaimer`, changeFrequency: "yearly", priority: 0.3 },
  ];

  // ─── Chart pages (one per game) ───
  // Pull live game names from Firestore, then merge with the fixed lists so the
  // sitemap is complete even if the cache is momentarily empty.
  const slugs = new Set<string>();
  FIXED_GAME_NAMES.forEach((n) => slugs.add(toSlug(n)));

  try {
    const [homepage, sk24] = await Promise.all([
      getHomepageFromFirestore(),
      getSK24GamesFromFirestore(),
    ]);

    [
      ...(homepage?.live || []),
      ...(homepage?.next || []),
      ...(homepage?.rest || []),
      ...(sk24?.games || []),
    ].forEach((g) => {
      if (g?.name) slugs.add(toSlug(g.name));
    });
  } catch {
    // Fall back to the fixed list only.
  }

  const chartRoutes: MetadataRoute.Sitemap = Array.from(slugs)
    .filter((slug) => Boolean(slug) && !isJunkSlug(slug))
    .map((slug) => ({
      url: `${SITE_URL}/chart/${slug}`,
      changeFrequency: "daily",
      priority: 0.8,
    }));

  // Publish only archive pages backed by real records. Advertising every year
  // for every game creates empty, thin URLs and wastes search-engine crawl
  // budget. If Mongo is temporarily unavailable, omit these routes until the
  // next hourly sitemap refresh instead of publishing false URLs.
  const availableYears = await getTopGameAvailableYearsFromMongo();
  const currentYear = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", year: "numeric" }).format(now)
  );
  const yearlyChartRoutes: MetadataRoute.Sitemap = TOP_GAME_DEFS.flatMap((game) => {
    const slug = toSlug(game.name);
    return (availableYears[slug] || []).map((year) => ({
      url: `${SITE_URL}/charts/${slug}/${year}`,
      changeFrequency: year === currentYear ? "daily" as const : "yearly" as const,
      priority: year === currentYear ? 0.75 : 0.55,
    }));
  });

  return [...staticRoutes, ...chartRoutes, ...yearlyChartRoutes];
}
