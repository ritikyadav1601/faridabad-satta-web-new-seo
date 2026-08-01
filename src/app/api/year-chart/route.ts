import { NextRequest } from "next/server";
import { CHART_CACHE_HEADERS, memGet, memSet } from "@/lib/api-helpers";
import { getTopGameYearChartFromMongo } from "@/lib/top-games-mongodb";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = (searchParams.get("slug") || "").toLowerCase();
  const year = Number(searchParams.get("year"));

  if (!slug || !Number.isInteger(year) || year < 2015 || year > 2100) {
    return Response.json({ success: false, error: "Valid slug and year are required" }, { status: 400 });
  }

  const cacheKey = `year-chart:${slug}:${year}`;
  const cached = memGet<Record<number, Record<number, string>>>(cacheKey);
  if (cached) {
    return Response.json({ success: true, months: cached }, { headers: CHART_CACHE_HEADERS });
  }

  const months = await getTopGameYearChartFromMongo(slug, year);
  if (!months) {
    return Response.json({ success: false, error: "Chart not found" }, { status: 404 });
  }

  memSet(cacheKey, months, 300);
  return Response.json({ success: true, months }, { headers: CHART_CACHE_HEADERS });
}
