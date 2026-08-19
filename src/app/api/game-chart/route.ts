import { NextRequest } from "next/server";
import {
  scrapeGameChart,
  scrapeSattaFastGameChart,
  scrapeSK24GameChart,
} from "@/lib/scraper";
import { getGameChartCacheFromMongo } from "@/lib/extra-games-mongodb";
import type { GameChartData } from "@/lib/types";
import { memGet, memSet, CHART_CACHE_HEADERS } from "@/lib/api-helpers";
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawSlug = searchParams.get("slug");
  const month = searchParams.get("month") || undefined;
  const year = searchParams.get("year") || undefined;

  if (!rawSlug) {
    return Response.json({ success: false, error: "slug is required" }, { status: 400 });
  }

  const slug = SLUG_ALIASES[rawSlug.toLowerCase()] || rawSlug.toLowerCase();

  const cacheKey = `game:${slug}:${month || "current"}:${year || "current"}`;

  // 1. In-memory cache
  const cached = memGet<GameChartData>(cacheKey);
  if (cached) {
    return Response.json({ success: true, ...cached }, { headers: CHART_CACHE_HEADERS });
  }

  // Delhi Bazar and Shri Ganesh are sourced directly from satta-fast.com.
  // Keep this before database fallbacks so the chart always reflects the
  // selected source site, while preserving local data as resilience fallback.
  if (SATTA_FAST_SLUGS.has(slug)) {
    try {
      const sourceResult = await scrapeSattaFastGameChart(slug, month, year);
      if (sourceResult) {
        const chartData: GameChartData = { ...sourceResult, scrapedAt: Date.now() };
        memSet(cacheKey, chartData, 300);
        return Response.json(
          { success: true, ...sourceResult },
          { headers: CHART_CACHE_HEADERS }
        );
      }
    } catch (error) {
      console.error("[game-chart] satta-fast scrape failed:", (error as Error).message);
    }
  }

  // The promoted homepage games use the separate MongoDB dailynumbers source.
  if (isMongoTopGameSlug(slug)) {
    const mongoData = await getTopGameChartFromMongo(slug, month || "", year || "");
    if (mongoData) {
      memSet(cacheKey, mongoData, 300);
      return Response.json({ success: true, ...mongoData }, { headers: CHART_CACHE_HEADERS });
    }
  }

  // 2. Extra-games MongoDB cache
  const mongoCacheData = await getGameChartCacheFromMongo(slug, month, year);
  if (mongoCacheData) {
    memSet(cacheKey, mongoCacheData, 300);
    return Response.json({ success: true, ...mongoCacheData }, { headers: CHART_CACHE_HEADERS });
  }

  // 3. Scrape fallback (for games not yet cached)
  try {
    let result = await scrapeGameChart(slug, month, year);
    if (!result) {
      result = await scrapeSK24GameChart(slug, month, year);
    }
    if (!result) {
      return Response.json({ success: false, error: "Game not found" }, { status: 404 });
    }

    const chartData: GameChartData = { ...result, scrapedAt: Date.now() };
    memSet(cacheKey, chartData, 300);

    return Response.json({ success: true, ...result }, { headers: CHART_CACHE_HEADERS });
  } catch (error) {
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
