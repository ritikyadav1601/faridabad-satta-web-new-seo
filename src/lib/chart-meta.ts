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
// Added 2026-10-19: popular, high-search-demand markets (Meerut City and
// similar) that were only reachable from homepage links, not the sitemap.
// Their chart data comes from the extra-games `gameresults` history, so the
// sitemap lists each one only while it actually has results there (see
// getExtraGameResultCounts in src/app/sitemap.ts), and they are NOT exempt
// from the thin-page noindex check. Descriptions rotate between a few
// phrasings so the pages don't share identical meta copy.
const POPULAR_GAMES: [slug: string, name: string][] = [
  ["meerut-city", "Meerut City"],
  ["meerut-metro", "Meerut Metro"],
  ["agra-bazar", "Agra Bazar"],
  ["jaipur-king", "Jaipur King"],
  ["new-jaipur-king", "New Jaipur King"],
  ["mumbai-bazaar", "Mumbai Bazaar"],
  ["super-king", "Super King"],
  ["delhi-city", "Delhi City"],
  ["delhi-king", "Delhi King"],
  ["delhi-bazar-day", "Delhi Bazar Day"],
  ["delhi-dream", "Delhi Dream"],
  ["super-delhi", "Super Delhi"],
  ["new-delhi-darbar", "New Delhi Darbar"],
  ["dubai-delhi", "Dubai Delhi"],
  ["kalka-bazar", "Kalka Bazar"],
  ["mohali", "Mohali"],
  ["chennai", "Chennai"],
  ["royal-challenge", "Royal Challenge"],
  ["royal-bazar", "Royal Bazar"],
  ["taj-darbar", "Taj Darbar"],
  ["new-taj", "New Taj"],
  ["super-taj", "Super Taj"],
  ["deep-sagar", "Deep Sagar"],
  ["savera", "Savera"],
  ["matka-king", "Matka King"],
  ["maa-bhagwati", "Maa Bhagwati"],
  ["anarkali", "Anarkali"],
  ["chand-tara", "Chand Tara"],
  ["bikaner-super", "Bikaner Super"],
  ["bhagya-lakshmi", "Bhagya Lakshmi"],
  ["udaan-king", "Udaan King"],
  ["shree-ganga-nagar", "Shree Ganga Nagar"],
  ["bihar-king", "Bihar King"],
  ["ghaziabad-din", "Ghaziabad Din"],
  ["ghaziabad-night", "Ghaziabad Night"],
  ["new-ghaziabad", "New Ghaziabad"],
  ["faridabad-super", "Faridabad Super"],
  ["gali-gold", "Gali Gold"],
  ["noida-king", "Noida King"],
  ["mahakal", "Mahakal"],
  ["neelkanth", "Neelkanth"],
  ["jaisalmer", "Jaisalmer"],
  // Added 2026-10-21: Search Console shows "<name> satta king" queries
  // landing on the homepage; these chart pages have 200+ real results.
  ["shiv-shakti", "Shiv Shakti"],
  ["veera-king", "Veera King"],
  ["shivraj-786", "Shivraj 786"],
  ["bala-ji-dadri", "Bala Ji Dadri"],
];

const POPULAR_DESCRIPTIONS = [
  (n: string) => `Check today's ${n} Satta King result, the full ${n} chart and old records, updated daily on Faridabad Satta.`,
  (n: string) => `${n} Satta King result today with the month-wise ${n} chart and complete record history.`,
  (n: string) => `Latest ${n} result, ${n} Satta King chart and old record archive in one fast, easy-to-read table.`,
];

export const POPULAR_GAME_SLUGS = new Set(POPULAR_GAMES.map(([slug]) => slug));

const POPULAR_CHART_META: Record<string, { title: string; description: string }> = Object.fromEntries(
  POPULAR_GAMES.map(([slug, name], i) => [
    slug,
    {
      title: `${name} Satta King Result & Chart`,
      description: POPULAR_DESCRIPTIONS[i % POPULAR_DESCRIPTIONS.length](name),
    },
  ])
);

export const CHART_META: Record<string, { title: string; description: string }> = {
  ...POPULAR_CHART_META,
  // 2026-10-21: retargeted at Search Console queries "faridabad satta chart"
  // (105 impr, pos ~35), "faridabad satta record", "faridabad satta number".
  faridabad: {
    title: "Faridabad Satta Chart 2026 & Faridabad Satta King Record",
    description:
      "Faridabad Satta chart 2026 with every day's Faridabad Satta King number, month-wise Faridabad result record and old charts. फरीदाबाद सट्टा चार्ट और रिकॉर्ड.",
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
  // 2026-10-21: "fatehabad satta king" + "satta king fatehabad" are the top
  // non-Faridabad queries (~100 impr, pos ~38). /chart/fatehabad had no data,
  // so it now 301s here (next.config.ts) and this page carries the keywords.
  "fatehabad-city": {
    title: "Fatehabad Satta King Result Today & Fatehabad Chart",
    description:
      "Fatehabad Satta King result today, Satta King Fatehabad (Fatehabad City) chart month-wise and old record, updated daily at 05:20 PM.",
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

// Full curated slug list (promoted TOP_GAME_DEFS games + every hand-written
// CHART_META entry) — the same set the sitemap advertises. Used to build
// "Related Charts" cross-links on each chart page so internal link equity
// isn't 100% funneled through the homepage (previously the only page
// linking to /chart/[gameCode] routes at all).
function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, "-");
}

function titleCaseSlug(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const CURATED_CHART_SLUGS: string[] = Array.from(
  new Set<string>([...TOP_GAME_DEFS.map((g) => slugify(g.name)), ...Object.keys(CHART_META)])
)
  // Stable, deterministic order (not insertion order) so the "related
  // games" window below is consistent across page renders/deploys.
  .sort();

// Pages whose data source is known-good (the 12 promoted games and the
// original hand-picked CHART_META entries). Popular extra games are excluded:
// their chart depends on gameresults history, so they must pass the
// real-results check like any other page.
export function isCuratedChartSlug(slug: string): boolean {
  const s = slug.toLowerCase();
  return CURATED_CHART_SLUGS.includes(s) && !POPULAR_GAME_SLUGS.has(s);
}

// Deterministic "related games" pick for a given chart page: a window of
// `count` other curated games starting right after this one in the sorted
// slug list, wrapping around. Every curated page ends up both linking out
// to, and being linked from, a handful of others — spreading internal link
// equity around the site instead of it all pooling on the homepage.
export function getRelatedGames(
  currentSlug: string,
  count = 8
): { slug: string; label: string }[] {
  const slugs = CURATED_CHART_SLUGS.filter((s) => s !== currentSlug);
  if (slugs.length === 0) return [];

  const startIndex = CURATED_CHART_SLUGS.indexOf(currentSlug);
  const start = startIndex === -1 ? 0 : startIndex % slugs.length;
  const picked: string[] = [];
  for (let i = 0; i < Math.min(count, slugs.length); i++) {
    picked.push(slugs[(start + i) % slugs.length]);
  }

  return picked.map((slug) => ({
    slug,
    label: CHART_META[slug]?.title.replace(/\s*(Result Chart & Old Records|Satta King Result & Chart|Satta King Chart)$/, "") || titleCaseSlug(slug),
  }));
}

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
