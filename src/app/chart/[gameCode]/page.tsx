"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { FiChevronLeft, FiChevronRight, FiCalendar } from "react-icons/fi";

interface ChartRow {
  date: string;
  day: string;
  result: string;
}

// `date` may be a plain day number ("26") or a full date string
// (e.g. "2026-06-01"). Always show the day-of-month, never the year.
function getDayOfMonth(date: string): string {
  const trimmed = (date || "").trim();
  if (/^\d{1,2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) return String(parsed.getDate());
  return trimmed.slice(-2);
}

const MONTH_NAMES = ["january","february","march","april","may","june","july","august","september","october","november","december"];
const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// How many month-columns to show at once in the table.
const MONTHS_IN_VIEW = 6;

interface MonthColumn {
  key: string;       // "2026-5" (year-monthIndex)
  year: number;
  monthIndex: number; // 0-11
  label: string;      // "Jun 2026"
  rowsByDay: Record<number, string>; // day-of-month -> result
  loaded: boolean;
}

export default function GameChartPage({
  params,
}: {
  params: Promise<{ gameCode: string }>;
}) {
  const { gameCode } = use(params);
  const gameName = gameCode.replace(/-/g, " ").toUpperCase();

  const [loading, setLoading] = useState(true);
  const [resultTime, setResultTime] = useState("");
  const [columns, setColumns] = useState<MonthColumn[]>([]);

  const now = new Date();
  // anchorDate = the newest (rightmost) month currently in view.
  const [anchorDate, setAnchorDate] = useState(new Date(now.getFullYear(), now.getMonth()));

  // Custom games use a separate API
  const customGameKeys = ["kohlapur", "manipur", "up-bazar", "palwal-city", "mathura-city"];
  const isCustomGame = customGameKeys.includes(gameCode);

  // Build the list of months (oldest -> newest) ending at `anchor`.
  const getMonthsWindow = (anchor: Date, count: number): Date[] => {
    const list: Date[] = [];
    for (let i = count - 1; i >= 0; i--) {
      list.push(new Date(anchor.getFullYear(), anchor.getMonth() - i, 1));
    }
    return list;
  };

  const fetchMonth = async (date: Date): Promise<MonthColumn> => {
    const m = MONTH_NAMES[date.getMonth()];
    const y = date.getFullYear();
    const key = `${y}-${date.getMonth()}`;
    const label = `${MONTH_LABELS[date.getMonth()]} ${y}`;

    try {
      const url = isCustomGame
        ? `/api/custom-games/chart?game=${gameCode}&month=${date.getMonth() + 1}&year=${y}`
        : `/api/game-chart?slug=${gameCode}&month=${m}&year=${y}`;
      const res = await fetch(url);
      const data = await res.json();
      const rowsByDay: Record<number, string> = {};
      if (data.success) {
        (data.results || []).forEach((row: ChartRow) => {
          const day = parseInt(getDayOfMonth(row.date), 10);
          if (!isNaN(day)) rowsByDay[day] = row.result;
        });
      }
      return { key, year: y, monthIndex: date.getMonth(), label, rowsByDay, loaded: true };
    } catch {
      return { key, year: y, monthIndex: date.getMonth(), label, rowsByDay: {}, loaded: true };
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const months = getMonthsWindow(anchorDate, MONTHS_IN_VIEW);
    Promise.all(months.map(fetchMonth)).then((results) => {
      if (!cancelled) {
        setColumns(results);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameCode, anchorDate]);

  useEffect(() => {
    const findTime = async () => {
      try {
        const endpoints = ["/api/live-results", "/api/next-results", "/api/rest-results"];
        for (const url of endpoints) {
          const res = await fetch(url);
          const data = await res.json();
          if (data.success) {
            const found = data.results?.find(
              (g: { name: string }) => g.name.toLowerCase().replace(/\s+/g, "-") === gameCode
            );
            if (found) {
              setResultTime(found.time);
              return;
            }
          }
        }
        const sk24Res = await fetch("/api/sattaking24");
        const sk24Data = await sk24Res.json();
        if (sk24Data.success) {
          const found = sk24Data.games?.find(
            (g: { name: string }) => g.name.toLowerCase().replace(/\s+/g, "-") === gameCode
          );
          if (found) setResultTime(found.time);
        }
      } catch { /* ignore */ }
    };
    findTime();
  }, [gameCode]);

  // Shift the whole window back/forward by MONTHS_IN_VIEW months at a time.
  const navigateWindow = (dir: -1 | 1) => {
    setAnchorDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + dir * MONTHS_IN_VIEW)
    );
  };

  const isCurrentWindow =
    anchorDate.getFullYear() === now.getFullYear() &&
    anchorDate.getMonth() === now.getMonth();

  const rangeLabel =
    columns.length > 0 ? `${columns[0].label} – ${columns[columns.length - 1].label}` : "...";

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-5xl mx-auto px-3 md:px-4 py-6 md:py-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-4 py-1.5 mb-3">
            <FiCalendar size={14} className="text-gray-500" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chart Record</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">
            {gameName}
          </h1>
          {resultTime && (
            <p className="text-gray-400 text-sm mt-1">Result Time: {resultTime}</p>
          )}
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between bg-gray-50 rounded-2xl border border-gray-200 px-4 py-3 mb-5">
          <button
            onClick={() => navigateWindow(-1)}
            className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 transition-colors text-gray-700 shadow-sm"
          >
            <FiChevronLeft size={18} />
          </button>
          <div className="text-sm md:text-lg font-black text-gray-900">
            {rangeLabel}
          </div>
          <button
            onClick={() => navigateWindow(1)}
            disabled={isCurrentWindow}
            className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 transition-colors text-gray-700 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <FiChevronRight size={18} />
          </button>
        </div>

        {/* Chart Table: rows = day of month, columns = months */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton h-9 w-full rounded-lg" />
            ))}
          </div>
        ) : columns.some((c) => Object.keys(c.rowsByDay).length > 0) ? (
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full border-collapse text-center">
              <thead>
                <tr className="bg-gray-100">
                  <th className="sticky left-0 z-10 bg-gray-100 px-3 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Date
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="px-3 py-2.5 text-xs md:text-sm font-black text-gray-800 border-b border-l border-gray-200 whitespace-nowrap"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <tr key={day} className="even:bg-gray-50/50">
                    <td className="sticky left-0 z-10 bg-white even:bg-gray-50 px-3 py-2 font-bold text-gray-700 border-b border-gray-100">
                      {day}
                    </td>
                    {columns.map((col) => {
                      const result = col.rowsByDay[day];
                      const hasResult = result && result !== "XX";
                      return (
                        <td
                          key={col.key}
                          className={`px-3 py-2 border-b border-l border-gray-100 font-mono font-bold ${
                            hasResult ? "text-green-700" : "text-gray-300"
                          }`}
                        >
                          {result || "--"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiCalendar size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">No chart data available</p>
            <p className="text-gray-400 text-sm mt-1">
              {rangeLabel} data not found for {gameName}
            </p>
          </div>
        )}

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