import {
  scrapeGameChart,
  scrapeSattaFastGameChart,
  scrapeSK24GameChart,
} from "@/lib/scraper";
import { getGameChartCacheFromMongo } from "@/lib/extra-games-mongodb";
import type { GameChartData } from "@/lib/types";
import { memGet, memSet } from "@/lib/api-helpers";
import { getTopGameChartFromMongo, isMongoTopGameSlug } from "@/lib/top-games-mongodb";

// Homepage uses Hinglish display spellings, but the cache + source site
// store charts under canonical slugs. Normalize before any lookup so the
// "Chart →" links for these games resolve correctly.
const SLUG_ALIASES: Record<string, string> = {
  fridabad: "faridabad",
  frbd: "faridabad",
  gaziabad: "ghaziabad",
  gzbd: "ghaziabad",
  disawar: "desawar",
  desawer: "desawar",
  dswr: "desawar",
};

const SATTA_FAST_SLUGS = new Set(["delhi-bazar", "shri-ganesh"]);

export function normalizeGameSlug(rawSlug: string): string {
  return SLUG_ALIASES[rawSlug.toLowerCase()] || rawSlug.toLowerCase();
}

/**
 * Fetches one month of chart data for a game, in the same source-priority
 * order previously inlined in GET /api/game-chart (satta-fast source ->
 * promoted-games Mongo -> extra-games Mongo cache -> scrape fallback),
 * including the in-memory cache. Shared by that API route (client-side
 * month navigation) and the server-rendered chart page (initial page
 * load / SSR), so both always agree on what a given game/month/year
 * resolves to and crawlers see the same content a visitor's browser
 * would eventually hydrate.
 */
export async function fetchGameChartMonth(
  rawSlug: string,
  month?: string,
  year?: string
): Promise<GameChartData | null> {
  const slug = normalizeGameSlug(rawSlug);
  const cacheKey = `game:${slug}:${month || "current"}:${year || "current"}`;

  const cached = memGet<GameChartData>(cacheKey);
  if (cached) return cached;

  // Delhi Bazar and Shri Ganesh are sourced directly from satta-fast.com.
  // Keep this before database fallbacks so the chart always reflects the
  // selected source site, while preserving local data as resilience fallback.
  if (SATTA_FAST_SLUGS.has(slug)) {
    try {
      const sourceResult = await scrapeSattaFastGameChart(slug, month, year);
      if (sourceResult) {
        const chartData: GameChartData = { ...sourceResult, scrapedAt: Date.now() };
        memSet(cacheKey, chartData, 300);
        return chartData;
      }
    } catch (error) {
      console.error("[chart-data] satta-fast scrape failed:", (error as Error).message);
    }
  }

  // The promoted homepage games use the separate MongoDB dailynumbers source.
  if (isMongoTopGameSlug(slug)) {
    const mongoData = await getTopGameChartFromMongo(slug, month || "", year || "");
    if (mongoData) {
      memSet(cacheKey, mongoData, 300);
      return mongoData;
    }
  }

  // Extra-games MongoDB cache
  const mongoCacheData = await getGameChartCacheFromMongo(slug, month, year);
  if (mongoCacheData) {
    memSet(cacheKey, mongoCacheData, 300);
    return mongoCacheData;
  }

  // Scrape fallback (for games not yet cached)
  try {
    let result = await scrapeGameChart(slug, month, year);
    if (!result) {
      result = await scrapeSK24GameChart(slug, month, year);
    }
    if (!result) return null;

    const chartData: GameChartData = { ...result, scrapedAt: Date.now() };
    memSet(cacheKey, chartData, 300);
    return chartData;
  } catch (error) {
    console.error("[chart-data] scrape fallback failed:", (error as Error).message);
    return null;
  }
}
