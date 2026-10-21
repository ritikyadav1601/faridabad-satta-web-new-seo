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

// ─── Extra-game chart history from our own `gameresults` collection ───
//
// Added 2026-10-19. Chart pages for the extra (non-top-12) games used to get
// their month data only from the scraped_cache doc or, failing that, by
// scraping satta-king-fast.com / satta-king-24.com live. For games like
// Meerut City both scrapes found nothing and each waited out a 15s timeout,
// so the page took ~16s and still showed "No chart data available". The
// homepage already reads today's/yesterday's numbers for these same games
// from `gameresults`; this reads a whole month from there in one query.

const MONTH_NAMES_LC = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

let extraGamesListCache: { data: Document[]; expiresAt: number } | null = null;

function slugOfName(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, "-");
}

async function getExtraGamesList(): Promise<Document[]> {
  if (extraGamesListCache && extraGamesListCache.expiresAt > Date.now()) return extraGamesListCache.data;
  const docs = await (await collection(process.env.EXTRA_GAMES_MONGO_COLLECTION || "games"))
    .find({} as never, { projection: { name: 1, gameName: 1, resultTime: 1, time: 1 } })
    .toArray();
  extraGamesListCache = { data: docs, expiresAt: Date.now() + 10 * 60 * 1000 };
  return docs;
}

function resultDateKey(raw: unknown): string {
  if (raw instanceof Date) return getISTDateStringFor(raw);
  return String(raw || "").slice(0, 10);
}

function getISTDateStringFor(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
}

export async function getExtraGameChartFromResults(
  slug: string,
  month?: string,
  year?: string
): Promise<GameChartData | null> {
  try {
    const now = new Date();
    const monthIndex = month ? MONTH_NAMES_LC.indexOf(month.toLowerCase()) : now.getMonth();
    const yearNumber = year ? Number(year) : now.getFullYear();
    if (monthIndex < 0 || !Number.isInteger(yearNumber)) return null;

    const games = await getExtraGamesList();
    const game = games.find((g) => slugOfName(String(g.name || g.gameName || "")) === slug);
    if (!game) return null;

    const mm = String(monthIndex + 1).padStart(2, "0");
    const startStr = `${yearNumber}-${mm}-01`;
    const endStr = `${yearNumber}-${mm}-31`;
    const startDate = new Date(`${startStr}T00:00:00+05:30`);
    const endDate = new Date(new Date(startDate).setMonth(startDate.getMonth() + 1));

    const rows = await (await collection(process.env.EXTRA_GAMES_RESULTS_COLLECTION || "gameresults"))
      .find({
        game: game._id,
        $or: [
          { resultDate: { $gte: startStr, $lte: endStr } },
          { resultDate: { $gte: startDate, $lt: endDate } },
        ],
      } as never)
      .toArray();
    if (!rows.length) return null;

    const name = String(game.name || game.gameName).trim().toUpperCase();
    const monthLabel = MONTH_NAMES_LC[monthIndex].charAt(0).toUpperCase() + MONTH_NAMES_LC[monthIndex].slice(1);
    const results = rows
      .map((row) => {
        const date = resultDateKey(row.resultDate);
        const raw = value(row, ["result", "value", "number"], "XX");
        return {
          date,
          day: new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(new Date(`${date}T00:00:00.000Z`)),
          result: /^\d{1,2}$/.test(raw) ? raw.padStart(2, "0") : raw,
        };
      })
      .filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      gameName: name,
      chartTitle: `${name} - ${monthLabel} ${yearNumber}`,
      month: monthLabel,
      year: String(yearNumber),
      columns: ["Date", "Day", name],
      results,
      scrapedAt: Date.now(),
    };
  } catch (error) {
    console.error("[extra-games-mongodb] Failed to read game chart from results:", (error as Error).message);
    return null;
  }
}

// Number of real results per extra-game slug over the last ~6 months. Used by
// the sitemap so only extra games with an actual chart history get listed.
export async function getExtraGameResultCounts(days = 183): Promise<Record<string, number>> {
  try {
    const games = await getExtraGamesList();
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const sinceStr = getISTDateStringFor(since);
    const counts = await (await collection(process.env.EXTRA_GAMES_RESULTS_COLLECTION || "gameresults"))
      .aggregate<{ _id: unknown; n: number }>([
        { $match: { $or: [{ resultDate: { $gte: sinceStr } }, { resultDate: { $gte: since } }] } },
        { $group: { _id: "$game", n: { $sum: 1 } } },
      ])
      .toArray();
    const byId = new Map(counts.map((c) => [String(c._id), c.n]));
    const out: Record<string, number> = {};
    for (const g of games) {
      const name = String(g.name || g.gameName || "");
      if (name) out[slugOfName(name)] = byId.get(String(g._id)) || 0;
    }
    return out;
  } catch (error) {
    console.error("[extra-games-mongodb] Failed to count game results:", (error as Error).message);
    return {};
  }
}
