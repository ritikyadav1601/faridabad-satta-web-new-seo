import { readFileSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { load } from "cheerio";
import { MongoClient, ObjectId } from "mongodb";

const SOURCE_ROOT = "https://satta-fast.com";
const START_YEAR = 2017;
// satta-fast.com hasn't published dedicated year-chart pages for the
// current year yet (current-year numbers only show on the homepage table),
// so cap at last completed year. Bump this once a YYYY chart page exists.
const END_YEAR = new Date().getFullYear() - 1;
const APPLY = process.argv.includes("--apply");
const execFileAsync = promisify(execFile);
const gameArgument = process.argv
  .find((argument) => argument.startsWith("--game="))
  ?.slice("--game=".length)
  .toUpperCase();

const GAMES = [
  { name: "DELHI BAZAR", slug: "delhi-bazar" },
  { name: "SHRI GANESH", slug: "shri-ganesh" },
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

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function monthIndexFromLabel(label) {
  return MONTHS.indexOf(label.trim().toLowerCase().slice(0, 3));
}

// satta-fast.com year-chart pages use a single table for the whole year:
// header row = Date | Jan | Feb | ... | Dec, body rows = day 1-31.
// This is structurally different from satta-king.org's per-month tables,
// so the parser is rewritten (not reused) even though the pipeline matches.
function parseYear(html, year) {
  const $ = load(html);
  const rows = [];

  $("table").each((_, table) => {
    const headerCells = $(table)
      .find("tr")
      .first()
      .find("th, td")
      .map((__, cell) => $(cell).text().trim())
      .get();

    if (!headerCells.length || !/^date$/i.test(headerCells[0])) return;

    const monthColumns = headerCells.slice(1).map(monthIndexFromLabel);
    if (!monthColumns.some((index) => index >= 0)) return;

    $(table)
      .find("tr")
      .slice(1)
      .each((__, row) => {
        const cells = $(row).find("td");
        if (!cells.length) return;

        const day = Number($(cells[0]).text().trim());
        if (!Number.isInteger(day) || day < 1 || day > 31) return;

        monthColumns.forEach((monthIndex, columnOffset) => {
          if (monthIndex < 0) return;
          const month = monthIndex + 1;
          if (day > daysInMonth(year, month)) return;

          const result = $(cells[columnOffset + 1]).text().trim();
          if (!/^\d{1,2}$/.test(result)) return;

          rows.push({ year, month, day, number: Number(result) });
        });
      });
  });

  return rows;
}

async function fetchYear(game, year) {
  const url = `${SOURCE_ROOT}/${game.slug}-satta-record-chart-${year}`;
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
      if (!city) {
        console.warn(`Skipping ${game.name}: no matching document in cities collection. Add it first.`);
        continue;
      }

      const sourceRows = [];
      for (let year = START_YEAR; year <= END_YEAR; year += 1) {
        try {
          const rows = await fetchYear(game, year);
          sourceRows.push(...rows);
          process.stdout.write(`Fetched ${game.name} ${year}: ${rows.length} records\n`);
        } catch (error) {
          console.warn(`Skipping ${game.name} ${year}: ${error.message}`);
        }
        await sleep(250);
      }

      if (!sourceRows.length) {
        summary.push({ game: game.name, source: 0, existing: 0, inserted: 0, wouldInsert: 0 });
        continue;
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
            source: "satta-fast.com",
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
