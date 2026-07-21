import { MongoClient } from "mongodb";
import { getISTDateString } from "./utils";
import { EMPTY_TOP_GAMES, TOP_GAME_DEFS } from "./top-games";
import type { ChartRow, GameChartData, MonthlyChartData, SK24Game } from "./types";

let clientPromise: Promise<MongoClient> | null = null;

function getClient() {
  const uri = process.env.TOP_GAMES_MONGODB_URI;
  if (!uri) return null;

  if (!clientPromise) {
    clientPromise = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 }).connect();
    clientPromise.catch(() => {
      clientPromise = null;
    });
  }
  return clientPromise;
}

function normalise(value: unknown) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function resultValue(record: Record<string, unknown>) {
  const value = record.result ?? record.today ?? record.value ?? record.number;
  return value === undefined || value === null || value === "" ? "XX" : String(value).padStart(2, "0");
}

function dateKey(value: unknown) {
  if (value instanceof Date) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(value);
    const part = (type: string) => parts.find((item) => item.type === type)?.value || "";
    return `${part("year")}-${part("month")}-${part("day")}`;
  }
  return String(value ?? "").slice(0, 10);
}

function monthRangeInIST(year: number, monthIndex: number) {
  const start = new Date(
    `${year}-${String(monthIndex + 1).padStart(2, "0")}-01T00:00:00+05:30`
  );
  const nextYear = monthIndex === 11 ? year + 1 : year;
  const nextMonth = monthIndex === 11 ? 1 : monthIndex + 2;
  const end = new Date(
    `${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00+05:30`
  );
  return { start, end };
}

function topGameForSlug(slug: string) {
  const wanted = normalise(slug);
  return TOP_GAME_DEFS.find(({ name, aliases }) =>
    [normalise(name), ...aliases.map(normalise)].includes(wanted)
  );
}

export function isMongoTopGameSlug(slug: string) {
  return Boolean(topGameForSlug(slug));
}

async function getCityNames(db: ReturnType<MongoClient["db"]>) {
  const cities = await db
    .collection<Record<string, unknown>>("cities")
    .find({})
    .project({ name: 1, cityName: 1 })
    .toArray();
  return new Map(cities.map((city) => [String(city._id), String(city.name ?? city.cityName ?? "")]));
}

/**
 * Reads the promoted games from the separate MongoDB database. Expected document
 * shape: { city: "<city id>", date: Date, number }, with names in the `cities`
 * collection. The older { game, resultDate, result } shape is also supported.
 */
export async function getTopGamesFromMongo(): Promise<SK24Game[]> {
  const client = getClient();
  if (!client) return EMPTY_TOP_GAMES;

  try {
    const dbName = process.env.TOP_GAMES_MONGODB_DB;
    const collectionName = process.env.TOP_GAMES_MONGODB_COLLECTION || "gameresults";
    const db = (await client).db(dbName || undefined);
    const today = getISTDateString();
    const yesterday = getISTDateString(-1);
    const tomorrow = getISTDateString(1);
    const yesterdayStart = new Date(`${yesterday}T00:00:00.000Z`);
    const tomorrowStart = new Date(`${tomorrow}T00:00:00.000Z`);
    const [cityNames, rows] = await Promise.all([
      getCityNames(db),
      db
      .collection<Record<string, unknown>>(collectionName)
      .find({
        // dailynumbers stores `date` as a BSON Date; legacy result collections
        // store resultDate as YYYY-MM-DD strings.
        $or: [
          { resultDate: { $in: [today, yesterday] } },
          { date: { $in: [today, yesterday] } },
          { date: { $gte: yesterdayStart, $lt: tomorrowStart } },
        ],
      })
      .toArray(),
    ]);
    return TOP_GAME_DEFS.map(({ name, time, aliases }) => {
      const gameNames = new Set([normalise(name), ...aliases.map(normalise)]);
      const matching = rows.filter((row) => {
        const game = row.city ?? row.game ?? row.name ?? row.gameName;
        return gameNames.has(normalise(cityNames.get(String(game)) ?? game));
      });
      const todayRow = matching.find((row) => dateKey(row.resultDate ?? row.date) === today);
      const yesterdayRow = matching.find((row) => dateKey(row.resultDate ?? row.date) === yesterday);

      return {
        name,
        time,
        yesterday: yesterdayRow ? resultValue(yesterdayRow) : "XX",
        today: todayRow ? resultValue(todayRow) : "XX",
      };
    });
  } catch (error) {
    console.error("[top-games-mongodb] Failed to read top games:", (error as Error).message);
    return EMPTY_TOP_GAMES;
  }
}

// Monthly chart data for the 12 MongoDB-backed promoted games.
export async function getTopGameChartFromMongo(
  slug: string,
  month: string,
  year: string
): Promise<GameChartData | null> {
  const game = topGameForSlug(slug);
  const client = getClient();
  if (!game || !client) return null;

  const monthIndex = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"].indexOf(month.toLowerCase());
  const yearNumber = Number(year);
  if (monthIndex < 0 || !Number.isInteger(yearNumber)) return null;

  try {
    const db = (await client).db(process.env.TOP_GAMES_MONGODB_DB || undefined);
    const { start, end } = monthRangeInIST(yearNumber, monthIndex);
    const [cityNames, rows] = await Promise.all([
      getCityNames(db),
      db.collection<Record<string, unknown>>(process.env.TOP_GAMES_MONGODB_COLLECTION || "dailynumbers")
        .find({ date: { $gte: start, $lt: end } })
        .sort({ date: 1 })
        .toArray(),
    ]);
    const gameNames = new Set([normalise(game.name), ...game.aliases.map(normalise)]);
    const results = rows
      .filter((row) => gameNames.has(normalise(cityNames.get(String(row.city ?? row.game)) ?? row.city ?? row.game)))
      .map((row) => {
        const date = dateKey(row.date ?? row.resultDate);
        return {
          date,
          day: new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(new Date(`${date}T00:00:00.000Z`)),
          result: resultValue(row),
        };
      });

    return {
      gameName: game.name,
      chartTitle: `${game.name} - ${month.charAt(0).toUpperCase()}${month.slice(1)} ${year}`,
      month: month.charAt(0).toUpperCase() + month.slice(1),
      year,
      columns: ["Date", "Day", game.name],
      results,
      scrapedAt: Date.now(),
    };
  } catch (error) {
    console.error("[top-games-mongodb] Failed to read chart:", (error as Error).message);
    return null;
  }
}

const MONTHLY_CITY_FIELDS: Record<string, keyof Pick<ChartRow, "dswr" | "frbd" | "gzbd" | "gali">> = {
  DESHAWER: "dswr",
  FARIDABAD: "frbd",
  GHAZIABAD: "gzbd",
  "PURANI GALI": "gali",
};

/**
 * Provides historical rows for the four markets stored in the Top Games
 * MongoDB database. The Firestore monthly chart still supplies Delhi Bazar
 * and Shri Ganesh, and callers merge both sources before rendering.
 */
export async function getMonthlyChartFromMongo(
  month: string,
  year: string
): Promise<MonthlyChartData | null> {
  const client = getClient();
  const monthIndex = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"].indexOf(month.toLowerCase());
  const yearNumber = Number(year);
  if (!client || monthIndex < 0 || !Number.isInteger(yearNumber)) return null;

  try {
    const db = (await client).db(process.env.TOP_GAMES_MONGODB_DB || undefined);
    const { start, end } = monthRangeInIST(yearNumber, monthIndex);
    const [cities, rows] = await Promise.all([
      db.collection<Record<string, unknown>>("cities").find({}).project({ name: 1, cityName: 1 }).toArray(),
      db.collection<Record<string, unknown>>(process.env.TOP_GAMES_MONGODB_COLLECTION || "dailynumbers")
        .find({ date: { $gte: start, $lt: end } })
        .sort({ date: 1 })
        .toArray(),
    ]);
    const cityFields = new Map(
      cities.map((city) => [
        String(city._id),
        MONTHLY_CITY_FIELDS[String(city.name ?? city.cityName ?? "").toUpperCase()],
      ])
    );
    const byDay = new Map<number, ChartRow>();

    for (const record of rows) {
      const field = cityFields.get(String(record.city));
      if (!field) continue;
      const date = dateKey(record.date ?? record.resultDate);
      const day = Number(date.slice(-2));
      if (!Number.isInteger(day)) continue;
      const row = byDay.get(day) || {
        date: String(day).padStart(2, "0"),
        dswr: "",
        frbd: "",
        gzbd: "",
        gali: "",
        srgn: "",
        dlbz: "",
      };
      row[field] = resultValue(record);
      byDay.set(day, row);
    }

    if (!byDay.size) return null;
    return {
      month: month.charAt(0).toUpperCase() + month.slice(1).toLowerCase(),
      year: String(yearNumber),
      results: [...byDay.entries()].sort(([a], [b]) => a - b).map(([, row]) => row),
      scrapedAt: Date.now(),
    };
  } catch (error) {
    console.error("[top-games-mongodb] Failed to read monthly chart:", (error as Error).message);
    return null;
  }
}

export function mergeMonthlyChartData(
  firestoreData: MonthlyChartData | null,
  mongoData: MonthlyChartData | null
): MonthlyChartData | null {
  if (!firestoreData) return mongoData;
  if (!mongoData) return firestoreData;

  const dayFromDate = (date: string) => Number(date.match(/(\d{1,2})$/)?.[1]);
  const rows = new Map<number, ChartRow>();
  firestoreData.results.forEach((row) => rows.set(dayFromDate(row.date), { ...row }));
  mongoData.results.forEach((mongoRow) => {
    const day = dayFromDate(mongoRow.date);
    const existing = rows.get(day) || {
      date: mongoRow.date,
      dswr: "",
      frbd: "",
      gzbd: "",
      gali: "",
      srgn: "",
      dlbz: "",
    };
    (["dswr", "frbd", "gzbd", "gali"] as const).forEach((field) => {
      if (mongoRow[field]) existing[field] = mongoRow[field];
    });
    rows.set(day, existing);
  });

  return {
    ...firestoreData,
    results: [...rows.entries()].sort(([a], [b]) => a - b).map(([, row]) => row),
    scrapedAt: Math.max(firestoreData.scrapedAt, mongoData.scrapedAt),
  };
}
