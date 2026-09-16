import "server-only";

import { MongoClient } from "mongodb";
import { TOP_GAME_DEFS } from "./top-games";

let clientPromise: Promise<MongoClient> | null = null;

function normalize(value: unknown) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function getDb() {
  const uri = process.env.TOP_GAMES_MONGODB_URI;
  if (!uri) throw new Error("TOP_GAMES_MONGODB_URI is not configured");
  if (!clientPromise) clientPromise = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 }).connect().catch((error) => { clientPromise = null; throw error; });
  return (await clientPromise).db(process.env.TOP_GAMES_MONGODB_DB || undefined);
}

async function getTopGameCities() {
  const db = await getDb();
  const cities = await db.collection<{ name?: string; cityName?: string }>("cities").find({}).toArray();
  return TOP_GAME_DEFS.map((definition) => {
    const accepted = new Set([normalize(definition.name), ...definition.aliases.map(normalize)]);
    const city = cities.find((item) => accepted.has(normalize(item.name || item.cityName)));
    return city ? { definition, city } : null;
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));
}

export async function declareTopGameResult(gameName: string, resultDate: string, result: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(resultDate)) throw new Error("Select a valid result date.");
  if (!/^\d{1,2}$/.test(result)) throw new Error("Declare a number from 00 to 99.");
  const definition = TOP_GAME_DEFS.find((game) => game.name === gameName);
  if (!definition) throw new Error("Select a valid top game.");

  const db = await getDb();
  const match = (await getTopGameCities()).find((item) => item.definition.name === definition.name);
  if (!match) throw new Error(`City record not found for ${definition.name}.`);
  const city = match.city;

  const cleanResult = result.padStart(2, "0");
  const now = new Date();
  const chartDate = new Date(`${resultDate}T00:00:00+05:30`);
  await Promise.all([
    db.collection("gameresults").updateOne(
      { game: city._id, resultDate },
      { $set: { result: cleanResult, updatedAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: true }
    ),
    db.collection("dailynumbers").updateOne(
      { city: city._id, date: chartDate },
      { $set: { number: Number(cleanResult), updatedAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: true }
    ),
  ]);
  return { game: definition.name, date: resultDate, result: cleanResult };
}

export async function listTopGameResults(resultDate: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(resultDate)) throw new Error("Select a valid result date.");
  const db = await getDb();
  const games = await getTopGameCities();
  const rows = await db.collection<{ game: unknown; result: unknown }>("gameresults")
    .find({ resultDate, game: { $in: games.map((item) => item.city._id) } } as never).toArray();
  return games.flatMap(({ definition, city }) => {
    const row = rows.find((item) => String(item.game) === String(city._id));
    return row ? [{ game: definition.name, time: definition.time, result: String(row.result).padStart(2, "0"), date: resultDate }] : [];
  });
}

export async function deleteTopGameResult(gameName: string, resultDate: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(resultDate)) throw new Error("Select a valid result date.");
  const match = (await getTopGameCities()).find((item) => item.definition.name === gameName);
  if (!match) throw new Error("Select a valid top game.");
  const db = await getDb();
  const chartDate = new Date(`${resultDate}T00:00:00+05:30`);
  await Promise.all([
    db.collection("gameresults").deleteMany({ game: match.city._id, resultDate }),
    db.collection("dailynumbers").deleteMany({ city: match.city._id, date: chartDate }),
  ]);
}
