import { readFileSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { load } from "cheerio";
import { MongoClient, ObjectId } from "mongodb";

const SOURCE_ROOT = "https://satta-king.org";
const START_YEAR = 2015;
const END_YEAR = new Date().getFullYear();
const APPLY = process.argv.includes("--apply");
const execFileAsync = promisify(execFile);
const gameArgument = process.argv
  .find((argument) => argument.startsWith("--game="))
  ?.slice("--game=".length)
  .toUpperCase();

const GAMES = [
  { name: "FARIDABAD", slug: "satta-king-fast-faridabad-sattaking-records-chart" },
  { name: "GHAZIABAD", slug: "satta-king-up-records-sattaking-records-chart" },
  { name: "PURANI GALI", slug: "satta-king-786-records-sattaking-records-chart" },
  { name: "DESHAWER", slug: "delhi-satta-king-records-sattaking-records-chart" },
];

const gamesToImport = gameArgument
  ? GAMES.filter((game) => game.name === gameArgument)
  : GAMES;

if (gameArgument && !gamesToImport.length) {
  throw new Error(`Unknown game: ${gameArgument}. Use one of: ${GAMES.map((game) => game.name).join(", ")}`);
}

function loadEnvironment() {
  for (const file of [".env.local", ".env"]) {
    try {
      for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
        const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
        if (match && !process.env[match[1]]) {
          process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
        }
      }
      return;
    } catch {
      // Try the next environment file.
    }
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function istMidnight(year, month, day) {
  return new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00+05:30`);
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function parseYear(html, year) {
  const $ = load(html);
  const rows = [];

  $("table.skc-table--year").each((_, table) => {
    const months = $(table)
      .find("thead .skc-sub")
      .map((__, cell) => Number($(cell).text().trim()))
      .get();

    if (!months.length) return;

    $(table)
      .find("tbody tr")
      .each((__, row) => {
        const cells = $(row).find("td");
        const day = Number($(cells[0]).text().trim());
        if (!Number.isInteger(day) || day < 1 || day > 31) return;

        months.forEach((month, index) => {
          const result = $(cells[index + 1]).text().trim();
          if (
            !Number.isInteger(month) ||
            month < 1 ||
            month > 12 ||
            day > daysInMonth(year, month) ||
            !/^\d{1,2}$/.test(result)
          ) {
            return;
          }
          rows.push({ year, month, day, number: Number(result) });
        });
      });
  });

  return rows;
}

async function fetchYear(game, year) {
  const url = `${SOURCE_ROOT}/${game.slug}/july/${year}`;
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const { stdout } = await execFileAsync(
        "curl",
        [
          "--fail",
          "--location",
          "--silent",
          "--show-error",
          "--max-time",
          "20",
          "--user-agent",
          "FaridabadSatta historical-data-import/1.0",
          url,
        ],
        { maxBuffer: 5 * 1024 * 1024 }
      );
      const records = parseYear(stdout, year);
      if (!records.length) throw new Error("no records found");
      return records;
    } catch (error) {
      lastError = error;
      if (attempt < 2) await sleep(1_000);
    }
  }
  throw new Error(`${game.name} ${year}: ${(lastError && lastError.message) || "request failed"}`);
}

async function main() {
  loadEnvironment();
  if (!process.env.TOP_GAMES_MONGODB_URI) {
    throw new Error("TOP_GAMES_MONGODB_URI is not configured.");
  }

  const client = new MongoClient(process.env.TOP_GAMES_MONGODB_URI, {
    serverSelectionTimeoutMS: 15_000,
  });
  await client.connect();

  try {
    const db = client.db(process.env.TOP_GAMES_MONGODB_DB || undefined);
    const collection = db.collection(process.env.TOP_GAMES_MONGODB_COLLECTION || "dailynumbers");
    const cities = await db.collection("cities").find({}).toArray();
    const cityIds = new Map(
      cities.map((city) => [String(city.name || city.cityName || "").toUpperCase(), city._id])
    );
    const summary = [];

    for (const game of gamesToImport) {
      const city = cityIds.get(game.name);
      if (!city) throw new Error(`Missing MongoDB city mapping for ${game.name}`);

      const sourceRows = [];
      for (let year = START_YEAR; year <= END_YEAR; year += 1) {
        const rows = await fetchYear(game, year);
        sourceRows.push(...rows);
        process.stdout.write(`Fetched ${game.name} ${year}: ${rows.length} records\n`);
        await sleep(250);
      }

      const dates = sourceRows.map((row) => istMidnight(row.year, row.month, row.day));
      const existing = await collection
        .find({ city, date: { $in: dates } }, { projection: { date: 1 } })
        .toArray();
      const existingDates = new Set(existing.map((row) => row.date.getTime()));
      const missing = sourceRows.filter(
        (row) => !existingDates.has(istMidnight(row.year, row.month, row.day).getTime())
      );

      if (APPLY && missing.length) {
        const now = new Date();
        await collection.insertMany(
          missing.map((row) => ({
            city: new ObjectId(city),
            date: istMidnight(row.year, row.month, row.day),
            number: row.number,
            createdAt: now,
            updatedAt: now,
            source: "satta-king.org",
          }))
        );
      }

      summary.push({
        game: game.name,
        source: sourceRows.length,
        existing: sourceRows.length - missing.length,
        inserted: APPLY ? missing.length : 0,
        wouldInsert: missing.length,
      });
    }

    console.table(summary);
    if (!APPLY) console.log("Dry run only. Run with --apply to insert missing records.");
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
