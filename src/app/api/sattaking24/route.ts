import { NextResponse } from "next/server";
import { getSK24GamesFromMongo } from "@/lib/extra-games-mongodb";
import { memGet, memSet, EDGE_CACHE_HEADERS } from "@/lib/api-helpers";
import type { SK24GamesData } from "@/lib/types";

export async function GET() {
  try {
    const cached = memGet<SK24GamesData>("sk24-games");
    if (cached) {
      return NextResponse.json(
        { success: true, games: cached.games },
        { headers: EDGE_CACHE_HEADERS }
      );
    }

    const mongoData = await getSK24GamesFromMongo();
    if (mongoData) {
      memSet("sk24-games", mongoData, 30);
      return NextResponse.json(
        { success: true, games: mongoData.games },
        { headers: EDGE_CACHE_HEADERS }
      );
    }

    return NextResponse.json(
      { success: false, error: "Data not available" },
      { status: 503 }
    );
  } catch (err) {
    console.error("SK24 error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
