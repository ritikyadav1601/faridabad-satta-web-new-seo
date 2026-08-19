import { NextResponse } from "next/server";
import { getSK24ChartsFromMongo } from "@/lib/extra-games-mongodb";
import { memGet, memSet, CHART_CACHE_HEADERS } from "@/lib/api-helpers";
import type { SK24ChartsData } from "@/lib/types";

export async function GET() {
  try {
    const cached = memGet<SK24ChartsData>("sk24-charts");
    if (cached) {
      return NextResponse.json(
        { success: true, tables: cached.tables },
        { headers: CHART_CACHE_HEADERS }
      );
    }

    const mongoData = await getSK24ChartsFromMongo();
    if (mongoData) {
      memSet("sk24-charts", mongoData, 300);
      return NextResponse.json(
        { success: true, tables: mongoData.tables },
        { headers: CHART_CACHE_HEADERS }
      );
    }

    return NextResponse.json(
      { success: false, error: "Chart data not available" },
      { status: 503 }
    );
  } catch (err) {
    console.error("SK24 chart error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch chart data" },
      { status: 500 }
    );
  }
}
