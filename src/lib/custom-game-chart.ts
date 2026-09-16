import { getCustomGameDocuments } from "@/lib/extra-games-mongodb";
import { memGet, memSet } from "@/lib/api-helpers";

export interface CustomGameChartData {
  gameName: string;
  chartTitle: string;
  month: string;
  year: string;
  columns: string[];
  results: { date: string; day: string; result: string }[];
}

const MONTH_FULL_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

/**
 * Fetches one month of chart data for a "custom" (extra-games collection)
 * game, e.g. kohlapur/manipur/up-bazar/palwal-city/mathura-city. Shared by
 * GET /api/custom-games/chart (client-side month navigation) and the
 * server-rendered chart page (initial page load / SSR). On a Mongo read
 * failure this degrades to an all-"XX" month rather than throwing, so the
 * page still renders (and is still indexable) instead of 500ing.
 */
export async function fetchCustomGameChartMonth(
  game: string,
  month: number,
  year: number
): Promise<CustomGameChartData> {
  const cacheKey = `custom-chart:${game}:${year}:${month}`;
  const cached = memGet<CustomGameChartData>(cacheKey);
  if (cached) return cached;

  const daysInMonth = new Date(year, month, 0).getDate();
  const results: { date: string; day: string; result: string }[] = [];

  try {
    const startStr = `${year}-${String(month).padStart(2, "0")}-01`;
    const endStr = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
    const documents = await getCustomGameDocuments(startStr, endStr);

    const dataMap: Record<string, string> = {};
    documents.forEach((data) => {
      if (data[game]) {
        dataMap[String(data._id)] = String(data[game]);
      }
    });

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month - 1, d);
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      results.push({
        date: String(d).padStart(2, "0"),
        day: DAY_NAMES[dateObj.getDay()],
        result: dataMap[dateStr] || "XX",
      });
    }
  } catch (error) {
    console.error("[custom-game-chart] failed to read documents:", (error as Error).message);
    results.length = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month - 1, d);
      results.push({
        date: String(d).padStart(2, "0"),
        day: DAY_NAMES[dateObj.getDay()],
        result: "XX",
      });
    }
  }

  const payload: CustomGameChartData = {
    gameName: game.replace(/-/g, " ").toUpperCase(),
    chartTitle: `${game.replace(/-/g, " ").toUpperCase()} - ${MONTH_FULL_NAMES[month - 1]} ${year}`,
    month: MONTH_FULL_NAMES[month - 1],
    year: String(year),
    columns: ["Date", "Day", "Result"],
    results,
  };
  memSet(cacheKey, payload, 300);
  return payload;
}
