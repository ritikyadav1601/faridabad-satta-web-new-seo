import { MongoClient } from "mongodb";
import { getISTDateString } from "./utils";
import { EMPTY_TOP_GAMES, TOP_GAME_DEFS } from "./top-games";
import type { GameChartData, SK24Game } from "./types";

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
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? "").slice(0, 10);
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
    const start = new Date(Date.UTC(yearNumber, monthIndex, 1));
    const end = new Date(Date.UTC(yearNumber, monthIndex + 1, 1));
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
