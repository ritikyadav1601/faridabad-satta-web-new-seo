import { NextRequest } from "next/server";
import { CHART_CACHE_HEADERS } from "@/lib/api-helpers";
import { fetchCustomGameChartMonth } from "@/lib/custom-game-chart";

// GET - Fetch monthly chart data for a custom game
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const game = searchParams.get("game"); // e.g. "kohlapur"
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1), 10);
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10);

  if (!game) {
    return Response.json({ success: false, error: "game is required" }, { status: 400 });
  }

  try {
    const payload = await fetchCustomGameChartMonth(game, month, year);
    return Response.json({ success: true, ...payload }, { headers: CHART_CACHE_HEADERS });
  } catch (error) {
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
