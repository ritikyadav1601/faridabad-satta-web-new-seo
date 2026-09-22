import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { TOP_GAME_DEFS } from "@/lib/top-games";
import { getTopGameAvailableYearsFromMongo } from "@/lib/top-games-mongodb";
import { CHART_META } from "@/lib/chart-meta";
import { getPublishedBlogSlugs } from "@/lib/blogs-mongodb";

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

// Games that always exist on the homepage, regardless of what MongoDB returns.
const FIXED_GAME_NAMES = TOP_GAME_DEFS.map((game) => game.name);

// The sitemap's chart routes are the deliberately curated set: the promoted
// homepage games and every slug with hand-written SEO metadata in
// CHART_META. This used to also merge in every game name from
// the live homepage feed (getHomepageFromMongo/getSK24GamesFromMongo) and
// the SK24 source, which pulled in ~200 scraped, non-curated market names
// with no unique metadata. Search Console showed the cost of that: 215 of
// 218 known pages stuck as "Discovered - currently not indexed", spreading
// crawl budget across a huge long tail of near-duplicate pages instead of
// the ones actually worth Google's attention. Those other chart pages still
// exist and work if visited directly — they're just no longer advertised in
// the sitemap.
const CURATED_GAME_SLUGS = new Set<string>([
  ...FIXED_GAME_NAMES.map(toSlug),
  ...Object.keys(CHART_META),
]);

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

  // ─── Chart pages (one per curated game) ───
  const chartRoutes: MetadataRoute.Sitemap = Array.from(CURATED_GAME_SLUGS).map((slug) => ({
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

  // ─── Blog posts ───
  // Previously missing entirely: published posts had no sitemap entry and
  // no dedicated index page linking to them, so only whatever the
  // homepage's rotating "Latest Blogs" section happened to show (max 12,
  // newest-first) was ever discoverable by Google. Older posts fell off
  // silently as newer ones were published. This makes every published post
  // discoverable regardless of homepage rotation.
  const blogSlugs = await getPublishedBlogSlugs();
  const blogRoutes: MetadataRoute.Sitemap = blogSlugs.map(({ slug, updatedAt }) => ({
    url: `${SITE_URL}/blog/${encodeURIComponent(slug)}`,
    lastModified: updatedAt ? new Date(updatedAt) : undefined,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...chartRoutes, ...yearlyChartRoutes, ...blogRoutes];
}
