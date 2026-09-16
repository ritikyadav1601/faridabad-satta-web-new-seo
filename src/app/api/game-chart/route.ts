import { NextRequest } from "next/server";
import { fetchGameChartMonth } from "@/lib/chart-data";
import { CHART_CACHE_HEADERS } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawSlug = searchParams.get("slug");
  const month = searchParams.get("month") || undefined;
  const year = searchParams.get("year") || undefined;

  if (!rawSlug) {
    return Response.json({ success: false, error: "slug is required" }, { status: 400 });
  }

  try {
    const data = await fetchGameChartMonth(rawSlug, month, year);
    if (!data) {
      return Response.json({ success: false, error: "Game not found" }, { status: 404 });
    }
    return Response.json({ success: true, ...data }, { headers: CHART_CACHE_HEADERS });
  } catch (error) {
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
