import { TOP_GAME_DEFS } from "./top-games";

// Per-game SEO metadata for chart pages, keyed by URL slug (canonical
// gameCode). This is the deliberately curated, hand-written set of chart
// pages — used both for their <title>/description in
// src/app/chart/[gameCode]/layout.tsx, and to build the sitemap's chart
// route list (src/app/sitemap.ts) alongside the promoted TOP_GAME_DEFS.
// Anything scraped from the live homepage feed but
// NOT one of these slugs still works if visited directly — it's just not
// advertised in the sitemap, since that long tail of near-duplicate scraped
// markets was diluting crawl budget across ~200 thin pages instead of the
// ones actually worth indexing (confirmed via Search Console: 215/218 known
// pages stuck as "Discovered - currently not indexed").
export const CHART_META: Record<string, { title: string; description: string }> = {
  faridabad: {
    title: "Faridabad Result Chart & Old Records",
    description:
      "Check Faridabad results, daily chart records and historical data on Faridabad Satta.",
  },
  ghaziabad: {
    title: "Ghaziabad Result Chart & Old Records",
    description:
      "Check Ghaziabad results, daily chart records and historical data on Faridabad Satta.",
  },
  gali: {
    title: "Gali Result Chart & Old Records",
    description:
      "Check Gali results, daily chart records and historical data on Faridabad Satta.",
  },
  deshawer: {
    title: "Deshawer Result Chart & Old Records",
    description:
      "Check Deshawer results, daily chart records and historical data on Faridabad Satta.",
  },
  "new-gali": {
    title: "New Gali Satta King Chart",
    description:
      "Check the latest New Gali Satta King chart, daily results, old record, and complete chart history on Faridabad Satta.",
  },
  "delhi-evening": {
    title: "Delhi Evening Satta King Chart",
    description:
      "View Delhi Evening Satta King chart with today's result, old records, and complete historical data.",
  },
  "choti-gali": {
    title: "Choti Gali Satta King Chart",
    description:
      "Find Choti Gali Satta King chart, live results, old charts, and historical records updated daily.",
  },
  desawer: {
    title: "Desawer Satta King Chart",
    description:
      "Check Desawer Satta King chart, daily results, old charts, and complete record history.",
  },
  "shiv-dham": {
    title: "Shiv Dham Satta King Chart",
    description:
      "View Shiv Dham Satta King chart with today's results, historical records, and daily updates.",
  },
  "pushkar-bazar": {
    title: "Pushkar Bazar Satta King Chart",
    description:
      "Get the latest Pushkar Bazar Satta King chart, old records, and daily result updates.",
  },
  "delhi-metro": {
    title: "Delhi Metro Satta King Chart",
    description:
      "Delhi Metro Satta King chart with today's result, old charts, and complete historical records.",
  },
  "shri-sayam": {
    title: "Shri Sayam Satta King Chart",
    description:
      "Check Shri Sayam Satta King chart, historical records, and today's updated results.",
  },
  kolmbia: {
    title: "Kolmbia Satta King Chart",
    description:
      "View Kolmbia Satta King chart with daily results, old charts, and complete chart history.",
  },
  "makka-madina": {
    title: "Makka Madina Satta King Chart",
    description:
      "Find Makka Madina Satta King chart, latest results, old records, and complete history.",
  },
  "kalka-night": {
    title: "Kalka Night Satta King Chart",
    description:
      "Kalka Night Satta King chart featuring today's result, old records, and chart history.",
  },
  "shirdi-dham": {
    title: "Shirdi Dham Satta King Chart",
    description:
      "View Shirdi Dham Satta King chart with updated results, historical charts, and daily records.",
  },
  "delhi-darbar": {
    title: "Delhi Darbar Satta King Chart",
    description:
      "Delhi Darbar Satta King chart with latest results, old records, and complete chart history.",
  },
  kaliyar: {
    title: "Kaliyar Satta King Chart",
    description:
      "Check Kaliyar Satta King chart, daily results, historical records, and old charts.",
  },
  "new-ganga": {
    title: "New Ganga Satta King Chart",
    description:
      "New Ganga Satta King chart with today's results, old records, and complete history.",
  },
  fatehabad: {
    title: "Fatehabad Satta King Chart",
    description:
      "View Fatehabad Satta King chart, daily results, old records, and updated chart history.",
  },
  "shakti-peeth": {
    title: "Shakti Peeth Satta King Chart",
    description:
      "Find Shakti Peeth Satta King chart, latest results, historical charts, and daily updates.",
  },
  "mandi-bazar": {
    title: "Mandi Bazar Satta King Chart",
    description:
      "Mandi Bazar Satta King chart with today's result, old records, and complete history.",
  },
  "ghaziabad-king": {
    title: "Ghaziabad King Satta King Chart",
    description:
      "Check Ghaziabad King Satta King chart, historical records, and today's updated results.",
  },
};

function normalise(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Looks up a promoted game's declared result time (from TOP_GAME_DEFS) by
// slug/alias, for use in per-page FAQ copy. Returns null for games outside
// that promoted list (their result time isn't tracked statically).
export function findGameResultTime(gameCode: string): string | null {
  const wanted = normalise(gameCode);
  const match = TOP_GAME_DEFS.find(({ name, aliases }) =>
    [normalise(name), ...aliases.map(normalise)].includes(wanted)
  );
  return match?.time ?? null;
}
