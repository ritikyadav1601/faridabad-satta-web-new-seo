import { NextRequest } from "next/server";
import { getMonthlyChartFromFirestore } from "@/lib/firebase-cache";
import { memGet, memSet } from "@/lib/api-helpers";
import type { MonthlyChartData } from "@/lib/types";
import { getMonthlyChartFromMongo, mergeMonthlyChartData } from "@/lib/top-games-mongodb";

const MONTHLY_CHART_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=20, stale-while-revalidate=0",
  "CDN-Cache-Control": "public, s-maxage=20, stale-while-revalidate=0",
  "Vercel-CDN-Cache-Control": "public, s-maxage=20, stale-while-revalidate=0",
} as const;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const monthName = searchParams.get("month") || "may";
  const year = searchParams.get("year") || "2026";
  const cacheKey = `chart:${monthName.toLowerCase()}:${year}`;

  const cached = memGet<MonthlyChartData>(cacheKey);
  if (cached) {
    return Response.json(
      { success: true, month: cached.month, year: cached.year, results: cached.results },
      { headers: MONTHLY_CHART_CACHE_HEADERS }
    );
  }

  const [firebaseData, mongoData] = await Promise.all([
    getMonthlyChartFromFirestore(monthName, year),
    getMonthlyChartFromMongo(monthName, year),
  ]);
  const chartData = mergeMonthlyChartData(firebaseData, mongoData);
  if (chartData) {
    memSet(cacheKey, chartData, 20);
    return Response.json(
      { success: true, month: chartData.month, year: chartData.year, results: chartData.results },
      { headers: MONTHLY_CHART_CACHE_HEADERS }
    );
  }

  return Response.json(
    { success: false, error: "Chart data not available" },
    { status: 404 }
  );
}
