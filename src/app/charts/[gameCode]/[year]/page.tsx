import Link from "next/link";
import { FiBarChart2, FiChevronLeft } from "react-icons/fi";
import { getTopGameYearChartFromMongo, getTopGamesFromMongo } from "@/lib/top-games-mongodb";
import { getHomepageFromMongo } from "@/lib/extra-games-mongodb";
import { getISTDateString } from "@/lib/utils";
import { findGameResultTime, getRelatedGames } from "@/lib/chart-meta";
import TopResultsBlock from "@/components/TopResultsBlock";
import CurrentGameResult from "@/app/chart/[gameCode]/CurrentGameResult";
import ResultTimeBadge from "@/app/chart/[gameCode]/ResultTimeBadge";
import ChartAbout from "@/app/chart/[gameCode]/ChartAbout";
import RelatedCharts from "@/app/chart/[gameCode]/RelatedCharts";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Revalidate periodically so a newly-added result shows up without a full
// rebuild, while still serving from cache for most requests — same pattern
// already used on the homepage (src/app/page.tsx).
export const revalidate = 60;

// Brought in line with /chart/[gameCode]: same top result banner + live
// Top Games table, same result-time badge, same FAQ/About content and
// Related Charts links, so a visitor lands on the same page "shape"
// whether they're on the rolling 6-month chart or a specific year's table.
export default async function YearChartPage({
  params,
}: {
  params: Promise<{ gameCode: string; year: string }>;
}) {
  const { gameCode, year } = await params;
  const gameName = gameCode.replace(/-/g, " ").toUpperCase();

  const [monthsResult, topGames, homepage] = await Promise.all([
    getTopGameYearChartFromMongo(gameCode, Number(year)).catch(() => null),
    getTopGamesFromMongo().catch(() => []),
    getHomepageFromMongo().catch(() => null),
  ]);
  const months: Record<number, Record<number, string>> = monthsResult || {};
  const extraGames = homepage?.live || [];

  // Only meaningful when this page's year is the current IST year -- a
  // 2016 archive page has no "today's result" to speak of, so the banner
  // just won't find one and (per CurrentGameResult) won't render.
  const istToday = getISTDateString();
  const istYesterday = getISTDateString(-1);
  const [istTodayYear, istTodayMonth, istTodayDay] = istToday.split("-").map(Number);
  const [istYestYear, istYestMonth, istYestDay] = istYesterday.split("-").map(Number);
  const chartFallback = {
    today: istTodayYear === Number(year) ? months[istTodayMonth - 1]?.[istTodayDay] : undefined,
    yesterday: istYestYear === Number(year) ? months[istYestMonth - 1]?.[istYestDay] : undefined,
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-5xl mx-auto px-3 md:px-4 pt-4 md:pt-6">
        <CurrentGameResult
          gameCode={gameCode}
          gameName={gameName}
          topGames={topGames}
          extraGames={extraGames}
          chartFallback={chartFallback}
        />
        <TopResultsBlock topGames={topGames} />
      </div>

      <main className="mx-auto max-w-7xl px-2.5 py-5 md:px-5 md:py-7">
        <nav aria-label="Breadcrumb" className="mb-4 text-xs text-slate-500">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="hover:text-indigo-700">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/charts" className="hover:text-indigo-700">Charts</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="font-semibold text-slate-800">{gameName} {year}</li>
          </ol>
        </nav>
        <header className="mb-4 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
            <FiBarChart2 /> Full year chart
          </span>
          <h1 className="mt-2 text-xl font-black text-slate-950 md:text-3xl">{gameName} {year}</h1>
          <p className="text-xs text-slate-500">Complete January–December result record</p>
          <ResultTimeBadge gameCode={gameCode} />
        </header>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[900px] w-full border-collapse text-center">
            <thead>
              <tr className="bg-gradient-to-r from-slate-950 to-indigo-900 text-white">
                <th className="sticky left-0 z-20 bg-slate-950 px-2 py-2 text-[10px] uppercase tracking-wider">Date</th>
                {MONTH_LABELS.map((month) => (
                  <th key={month} className="border-l border-white/10 px-2 py-2 text-[10px] uppercase tracking-wider">{month}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                <tr key={day} className="border-t border-slate-100 even:bg-slate-50/70">
                  <td className="sticky left-0 z-10 bg-white px-2 py-1.5 text-sm font-black text-slate-700">{day}</td>
                  {MONTH_LABELS.map((_, monthIndex) => {
                    const result = months[monthIndex]?.[day];
                    return (
                      <td key={monthIndex} className={`border-l border-slate-100 px-2 py-1.5 font-mono text-sm font-black ${result && result !== "XX" ? "text-indigo-700" : "text-slate-300"}`}>
                        {result || "--"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ChartAbout gameName={gameName} resultTime={findGameResultTime(gameCode)} />

        <RelatedCharts games={getRelatedGames(gameCode)} />

        <div className="mt-4 text-center">
          <Link href="/charts" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700">
            <FiChevronLeft /> Back to all charts
          </Link>
        </div>
      </main>
    </div>
  );
}
