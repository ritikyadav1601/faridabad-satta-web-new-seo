import { MongoClient, type Document } from "mongodb";
import type {
  GameChartData,
  HomepageData,
  MonthlyChartData,
  SK24ChartsData,
  SK24GamesData,
} from "./types";
import { getISTDateString } from "./utils";

let clientPromise: Promise<MongoClient> | null = null;

export interface ExtraGameDocument extends Document {
  _id: string;
}

function value(record: Document, keys: string[], fallback = "") {
  for (const key of keys) {
    const candidate = record[key];
    if (candidate !== undefined && candidate !== null && candidate !== "") return String(candidate);
  }
  return fallback;
}

function asGame(record: Document) {
  const name = value(record, ["name", "gameName", "game", "title", "cityName"]);
  if (!name) return null;
  return {
    name,
    time: value(record, ["time", "resultTime", "closeTime", "gameTime"]),
    yesterday: value(record, ["yesterday", "yesterdayResult", "previous", "previousResult"], "XX"),
    today: value(record, ["today", "todayResult", "result", "value", "number"], "XX"),
  };
}

function displayTime(raw: unknown) {
  const match = String(raw || "").match(/^(\d{1,2}):(\d{2})/);
  if (!match) return String(raw || "");
  const hour = Number(match[1]);
  return `${hour % 12 || 12}:${match[2]} ${hour >= 12 ? "PM" : "AM"}`;
}

function getClient() {
  const uri = process.env.EXTRA_GAMES_MONGO_URI;
  if (!uri) return null;
  if (!clientPromise) {
    clientPromise = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 })
      .connect()
      .catch((error) => {
        clientPromise = null;
        throw error;
      });
  }
  return clientPromise;
}

async function collection(name: string) {
  const client = getClient();
  if (!client) throw new Error("EXTRA_GAMES_MONGO_URI is not configured");
  return (await client).db(process.env.EXTRA_GAMES_MONGO_DB || undefined).collection<ExtraGameDocument>(name);
}

async function cacheDocument(id: string) {
  try {
    return await (await collection(process.env.EXTRA_GAMES_CACHE_COLLECTION || "scraped_cache"))
      .findOne({ _id: id });
  } catch (error) {
    console.error(`[extra-games-mongodb] Failed to read ${id}:`, (error as Error).message);
    return null;
  }
}

export async function getHomepageFromMongo(): Promise<HomepageData | null> {
  try {
    const gameDocuments = await (await collection(process.env.EXTRA_GAMES_MONGO_COLLECTION || "games"))
      .find({ isActive: { $ne: false } } as never)
      .sort({ showIndex: 1, resultTime: 1, name: 1 })
      .toArray();
    const ids = gameDocuments.map((game) => game._id);
    const today = getISTDateString();
    const yesterday = getISTDateString(-1);
    const resultDocuments = await (await collection(process.env.EXTRA_GAMES_RESULTS_COLLECTION || "gameresults"))
      .find({ game: { $in: ids }, resultDate: { $in: [today, yesterday] } } as never)
      .toArray();
    const results = new Map(
      resultDocuments.map((result) => [
        `${String(result.game)}:${result.resultDate}`,
        value(result, ["result", "value", "number"], "XX"),
      ])
    );
    const games = gameDocuments.map((game) => ({
      name: String(game.name || game.gameName || "").trim(),
      time: displayTime(game.resultTime || game.time),
      yesterday: results.get(`${String(game._id)}:${yesterday}`) || "XX",
      today: results.get(`${String(game._id)}:${today}`) || "XX",
    })).filter((game) => Boolean(game.name));
    return games.length ? { live: games, next: [], rest: [], scrapedAt: Date.now() } : null;
  } catch (error) {
    console.error("[extra-games-mongodb] Failed to read all games:", (error as Error).message);
    return null;
  }
}

export async function getMonthlyChartCacheFromMongo(month: string, year: string): Promise<MonthlyChartData | null> {
  const d = await cacheDocument(`chart_${month.toLowerCase()}_${year}`);
  return d ? { month: d.month, year: d.year, results: d.results || [], scrapedAt: d.scrapedAt || 0 } : null;
}

export async function getGameChartCacheFromMongo(slug: string, month?: string, year?: string): Promise<GameChartData | null> {
  const d = await cacheDocument(`game_${slug}_${(month || "current").toLowerCase()}_${year || "current"}`);
  return d ? { gameName: d.gameName, chartTitle: d.chartTitle, month: d.month, year: d.year, columns: d.columns || [], results: d.results || [], scrapedAt: d.scrapedAt || 0 } : null;
}

export async function getSK24GamesFromMongo(): Promise<SK24GamesData | null> {
  const d = await cacheDocument("sk24_games");
  return d ? { games: d.games || [], scrapedAt: d.scrapedAt || 0 } : null;
}

export async function getSK24ChartsFromMongo(): Promise<SK24ChartsData | null> {
  const d = await cacheDocument("sk24_charts");
  return d ? { tables: d.tables || [], scrapedAt: d.scrapedAt || 0 } : null;
}

export async function getCustomGameDocument(date: string) {
  return (await collection(process.env.EXTRA_GAMES_CUSTOM_COLLECTION || "custom_games")).findOne({ _id: date });
}

export async function getKhaiwalSettings() {
  try {
    const customGames = await collection(process.env.EXTRA_GAMES_CUSTOM_COLLECTION || "custom_games");
    const settings = await customGames.findOne({ _id: "khaiwal-settings" });
    if (settings?.khaiwal) return settings.khaiwal as { name: string; whatsapp: string };

    // Backward-compatible fallback for details saved by the older date-based panel.
    const latest = await customGames.findOne({ khaiwal: { $exists: true } } as never, { sort: { _id: -1 } });
    return latest?.khaiwal ? latest.khaiwal as { name: string; whatsapp: string } : null;
  } catch (error) {
    // This is called from the root layout's WhatsAppButton on every single
    // page, and from /contact — a MongoDB hiccup here must never 500 the
    // whole site. Callers already have a hardcoded phone-number fallback for
    // a null result (see WhatsAppButton.tsx and contact/page.tsx).
    console.error("[extra-games-mongodb] Failed to read khaiwal settings:", (error as Error).message);
    return null;
  }
}

export async function getCustomGameDocuments(start?: string, end?: string) {
  const query = start && end ? { _id: { $gte: start, $lte: end } } : {};
  return (await collection(process.env.EXTRA_GAMES_CUSTOM_COLLECTION || "custom_games"))
    .find(query).sort({ _id: -1 }).toArray();
}

export async function upsertCustomGameDocument(date: string, fields: Document) {
  await (await collection(process.env.EXTRA_GAMES_CUSTOM_COLLECTION || "custom_games"))
    .updateOne({ _id: date }, { $set: fields }, { upsert: true });
}

export async function deleteCustomGameField(date: string, field: string) {
  await (await collection(process.env.EXTRA_GAMES_CUSTOM_COLLECTION || "custom_games"))
    .updateOne({ _id: date }, { $unset: { [field]: "" }, $set: { updatedAt: Date.now() } });
}
