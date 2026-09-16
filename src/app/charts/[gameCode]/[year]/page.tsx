import Link from "next/link";
import { FiBarChart2, FiChevronLeft } from "react-icons/fi";
import { getTopGameYearChartFromMongo } from "@/lib/top-games-mongodb";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Revalidate periodically so a newly-added result shows up without a full
// rebuild, while still serving from cache for most requests — same pattern
// already used on the homepage (src/app/page.tsx).
export const revalidate = 60;

// The full year view has no in-page interactivity (a different year is a
// different URL, validated in layout.tsx), so it needs no client JS at
// all — it renders entirely on the server, and the raw HTML a crawler sees
// already contains the complete January-December table.
export default async function YearChartPage({
  params,
}: {
  params: Promise<{ gameCode: string; year: string }>;
}) {
  const { gameCode, year } = await params;
  const gameName = gameCode.replace(/-/g, " ").toUpperCase();

  let months: Record<number, Record<number, string>> = {};
  try {
    months = (await getTopGameYearChartFromMongo(gameCode, Number(year))) || {};
  } catch {
    months = {};
  }

  return (
    <main className="min-h-screen bg-[var(--surface-page)] px-2.5 py-5 md:px-5 md:py-7">
      <div className="mx-auto max-w-7xl">
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

        <div className="mt-4 text-center">
          <Link href="/charts" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700">
            <FiChevronLeft /> Back to all charts
          </Link>
        </div>
      </div>
    </main>
  );
}
