import type { Metadata } from "next";
import Link from "next/link";
import { FiCalendar, FiChevronLeft } from "react-icons/fi";
import { fetchGameChartMonth } from "@/lib/chart-data";
import { MONTH_NAMES, MONTHS_IN_VIEW, getMonthsWindow, buildMonthColumn } from "@/lib/chart-format";
import ChartTableClient from "./ChartTableClient";
import ResultTimeBadge from "./ResultTimeBadge";
import ChartAbout from "./ChartAbout";
import RelatedCharts from "./RelatedCharts";
import { findGameResultTime, getRelatedGames, isCuratedChartSlug } from "@/lib/chart-meta";
import { getTopGamesFromMongo } from "@/lib/top-games-mongodb";
import { getHomepageFromMongo } from "@/lib/extra-games-mongodb";
import { getISTDateString } from "@/lib/utils";
import TopResultsBlock from "@/components/TopResultsBlock";
import KhaiwalChartSection from "@/components/KhaiwalChartSection";
import CurrentGameResult from "./CurrentGameResult";

// Revalidate periodically so today's result shows up without a full
// rebuild, while still serving from cache for most requests — same pattern
// already used on the homepage (src/app/page.tsx).
export const revalidate = 60;

// Without generateStaticParams, Next.js ignores `revalidate` on a dynamic
// route and renders every request from scratch (live check 2026-10-19:
// 2-5s per chart page, x-vercel-cache MISS, cache-control no-store, while
// the cached homepage answered in ~40ms). Returning [] keeps build time the
// same (nothing prerendered) but caches each chart page on first visit and
// refreshes it every `revalidate` seconds (ISR) — much faster for visitors
// and Googlebot, which matters for the ~95 "Discovered - currently not
// indexed" pages waiting to be crawled.
export async function generateStaticParams() {
  return [];
}

// Charts with (almost) no real results in the 6-month window are thin pages
// Google won't index anyway; keep them reachable but tell crawlers not to
// index them so crawl budget goes to the charts that have real records.
// Uses the same fetchGameChartMonth calls as the page (in-memory cached),
// so this adds no extra upstream requests in practice.
const MIN_REAL_RESULTS_FOR_INDEX = 20;

async function countRealResults(gameCode: string): Promise<number> {
  const now = new Date();
  const months = getMonthsWindow(new Date(now.getFullYear(), now.getMonth()), MONTHS_IN_VIEW);
  const counts = await Promise.all(
    months.map(async (date) => {
      try {
        const data = await fetchGameChartMonth(gameCode, MONTH_NAMES[date.getMonth()], String(date.getFullYear()));
        return (data?.results || []).filter((r) => /^\d{2}$/.test(String(r.result).trim())).length;
      } catch {
        return 0;
      }
    })
  );
  return counts.reduce((a, b) => a + b, 0);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gameCode: string }>;
}): Promise<Metadata> {
  const { gameCode } = await params;
  // Curated sitemap pages were verified to have full charts — never let a
  // transient Mongo/scrape failure during an ISR refresh mark them noindex.
  if (isCuratedChartSlug(gameCode)) return {};
  const real = await countRealResults(gameCode);
  if (real < MIN_REAL_RESULTS_FOR_INDEX) {
    return { robots: { index: false, follow: true } };
  }
  return {};
}

export default async function GameChartPage({
  params,
}: {
  params: Promise<{ gameCode: string }>;
}) {
  const { gameCode } = await params;
  const gameName = gameCode.replace(/-/g, " ").toUpperCase();

  const now = new Date();
  const anchorDate = new Date(now.getFullYear(), now.getMonth());
  const months = getMonthsWindow(anchorDate, MONTHS_IN_VIEW);

  // Fetch the default 6-month window server-side so the initial HTML a
  // crawler (or any non-JS client) sees already contains the real result
  // table, not just a loading skeleton.
  const [initialColumns, topGames, homepage] = await Promise.all([
    Promise.all(
      months.map(async (date) => {
        try {
          const data = await fetchGameChartMonth(gameCode, MONTH_NAMES[date.getMonth()], String(date.getFullYear()));
          return buildMonthColumn(date, data?.results);
        } catch {
          return buildMonthColumn(date, undefined);
        }
      })
    ),
    getTopGamesFromMongo().catch(() => []),
    getHomepageFromMongo().catch(() => null),
  ]);
  const extraGames = homepage?.live || [];

  // Last-resort fallback for the handful of chart-only slugs that aren't in
  // either live-results feed above: read today's/yesterday's cell straight
  // out of this page's own month-by-month chart data (IST calendar days).
  const findChartResult = (dateString: string) => {
    const [y, m, d] = dateString.split("-").map(Number);
    const col = initialColumns.find((c) => c.year === y && c.monthIndex === m - 1);
    return col?.rowsByDay[d];
  };
  const chartFallback = {
    today: findChartResult(getISTDateString()),
    yesterday: findChartResult(getISTDateString(-1)),
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-5xl mx-auto px-3 md:px-4 pt-4 md:pt-6">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-500">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="hover:text-blue-700">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/charts" className="hover:text-blue-700">Charts</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="font-semibold text-gray-800">{gameName}</li>
          </ol>
        </nav>

        {/* Header — this game's own H1 comes first (it used to sit ~1600px
            down, below the homepage hero + 12-game table, so every chart
            page opened with identical content). */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-4 py-1.5 mb-3">
            <FiCalendar size={14} className="text-gray-500" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chart Record</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">
            {gameName} Satta King Result &amp; Chart
          </h1>
          <ResultTimeBadge gameCode={gameCode} />
        </div>

        <CurrentGameResult
          gameCode={gameCode}
          gameName={gameName}
          topGames={topGames}
          extraGames={extraGames}
          chartFallback={chartFallback}
        />
      </div>

      <div className="max-w-5xl mx-auto px-3 md:px-4 py-4 md:py-6">
        <KhaiwalChartSection />

        <ChartTableClient
          gameCode={gameCode}
          gameName={gameName}
          initialColumns={initialColumns}
          initialAnchorYear={anchorDate.getFullYear()}
          initialAnchorMonth={anchorDate.getMonth()}
        />

        {/* Shared live results block, moved below this game's chart. */}
        <div className="mt-8">
          <TopResultsBlock topGames={topGames} />
        </div>

        <ChartAbout gameName={gameName} resultTime={findGameResultTime(gameCode)} />

        <RelatedCharts games={getRelatedGames(gameCode)} />

        {/* Back link */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-bold transition-colors"
          >
            <FiChevronLeft size={16} />
            Back to All Results
          </Link>
        </div>
      </div>
    </div>
  );
}
