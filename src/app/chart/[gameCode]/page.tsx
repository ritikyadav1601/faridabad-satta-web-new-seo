import Link from "next/link";
import { FiCalendar, FiChevronLeft } from "react-icons/fi";
import { fetchGameChartMonth } from "@/lib/chart-data";
import { MONTH_NAMES, MONTHS_IN_VIEW, getMonthsWindow, buildMonthColumn } from "@/lib/chart-format";
import ChartTableClient from "./ChartTableClient";
import ResultTimeBadge from "./ResultTimeBadge";
import ChartAbout from "./ChartAbout";
import { findGameResultTime } from "@/lib/chart-meta";

// Revalidate periodically so today's result shows up without a full
// rebuild, while still serving from cache for most requests — same pattern
// already used on the homepage (src/app/page.tsx).
export const revalidate = 60;

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
  const initialColumns = await Promise.all(
    months.map(async (date) => {
      try {
        const data = await fetchGameChartMonth(gameCode, MONTH_NAMES[date.getMonth()], String(date.getFullYear()));
        return buildMonthColumn(date, data?.results);
      } catch {
        return buildMonthColumn(date, undefined);
      }
    })
  );

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-5xl mx-auto px-3 md:px-4 py-6 md:py-10">
        <nav aria-label="Breadcrumb" className="mb-5 text-sm text-gray-500">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="hover:text-blue-700">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/charts" className="hover:text-blue-700">Charts</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="font-semibold text-gray-800">{gameName}</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-4 py-1.5 mb-3">
            <FiCalendar size={14} className="text-gray-500" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chart Record</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">
            {gameName}
          </h1>
          <ResultTimeBadge gameCode={gameCode} />
        </div>

        <ChartTableClient
          gameCode={gameCode}
          gameName={gameName}
          initialColumns={initialColumns}
          initialAnchorYear={anchorDate.getFullYear()}
          initialAnchorMonth={anchorDate.getMonth()}
        />

        <ChartAbout gameName={gameName} resultTime={findGameResultTime(gameCode)} />

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
