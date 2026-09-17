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
  fatehabad: {
    title: "Fatehabad Satta King Chart",
    description:
      "View Fatehabad Satta King chart, daily results, old records, and updated chart history.",
  },

  // Added 2026-09-17: promoted from the long-tail scraped feed after
  // confirming (a) their monthly chart cache is well-populated with real
  // historical results (85%+ of past days, not "XX"), unlike the games
  // removed above, and (b) each has visible external search demand —
  // dedicated result pages on other satta-result sites — so they're worth
  // the sitemap/crawl-budget spend.
  taj: {
    title: "Taj Satta King Chart",
    description:
      "Check Taj Satta King chart, daily results, old records, and complete chart history on Faridabad Satta.",
  },
  "shri-laxmi": {
    title: "Shri Laxmi Satta King Chart",
    description:
      "View Shri Laxmi Satta King chart with today's result, old records, and complete historical data.",
  },
  gurgaon: {
    title: "Gurgaon Satta King Chart",
    description:
      "Check Gurgaon Satta King chart, daily results, old records, and complete chart history.",
  },
  nagpur: {
    title: "Nagpur Satta King Chart",
    description:
      "View Nagpur Satta King chart with today's result, old records, and complete historical data.",
  },
  "rajdhani-jaipur": {
    title: "Rajdhani Jaipur Satta King Chart",
    description:
      "Check Rajdhani Jaipur Satta King chart, daily results, old records, and complete chart history.",
  },
  "gali-disawar-mix": {
    title: "Gali Disawar Mix Satta King Chart",
    description:
      "View Gali Disawar Mix Satta King chart with today's result, old records, and complete historical data.",
  },
  "new-punjab": {
    title: "New Punjab Satta King Chart",
    description:
      "Check New Punjab Satta King chart, daily results, old records, and complete chart history.",
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
