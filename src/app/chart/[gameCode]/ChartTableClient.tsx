"use client";

import { useState } from "react";
import { FiChevronLeft, FiChevronRight, FiCalendar } from "react-icons/fi";
import {
  MONTH_NAMES,
  MONTHS_IN_VIEW,
  getMonthsWindow,
  buildMonthColumn,
  type MonthColumn,
} from "@/lib/chart-format";

interface ChartTableClientProps {
  gameCode: string;
  gameName: string;
  isCustomGame: boolean;
  initialColumns: MonthColumn[];
  initialAnchorYear: number;
  initialAnchorMonth: number; // 0-11
}

// Renders the month-navigation bar + result table for a game chart page.
// Starts from server-fetched `initialColumns` (so the very first render —
// what a crawler sees — already has real data), and only hits the API
// client-side when the visitor pages to a different 6-month window.
export default function ChartTableClient({
  gameCode,
  gameName,
  isCustomGame,
  initialColumns,
  initialAnchorYear,
  initialAnchorMonth,
}: ChartTableClientProps) {
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState<MonthColumn[]>(initialColumns);
  const [anchorDate, setAnchorDate] = useState(new Date(initialAnchorYear, initialAnchorMonth));

  const now = new Date();

  const fetchMonth = async (date: Date): Promise<MonthColumn> => {
    try {
      const url = isCustomGame
        ? `/api/custom-games/chart?game=${gameCode}&month=${date.getMonth() + 1}&year=${date.getFullYear()}`
        : `/api/game-chart?slug=${gameCode}&month=${MONTH_NAMES[date.getMonth()]}&year=${date.getFullYear()}`;
      const res = await fetch(url);
      const data = await res.json();
      return buildMonthColumn(date, data.success ? data.results : undefined);
    } catch {
      return buildMonthColumn(date, undefined);
    }
  };

  const navigateWindow = async (dir: -1 | 1) => {
    const nextAnchor = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + dir * MONTHS_IN_VIEW);
    setLoading(true);
    setAnchorDate(nextAnchor);
    const months = getMonthsWindow(nextAnchor, MONTHS_IN_VIEW);
    const results = await Promise.all(months.map(fetchMonth));
    setColumns(results);
    setLoading(false);
  };

  const isCurrentWindow =
    anchorDate.getFullYear() === now.getFullYear() && anchorDate.getMonth() === now.getMonth();

  const rangeLabel = columns.length > 0 ? `${columns[0].label} – ${columns[columns.length - 1].label}` : "...";

  return (
    <>
      <div className="flex items-center justify-between bg-gray-50 rounded-2xl border border-gray-200 px-4 py-3 mb-5">
        <button
          onClick={() => navigateWindow(-1)}
          className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 transition-colors text-gray-700 shadow-sm"
        >
          <FiChevronLeft size={18} />
        </button>
        <div className="text-sm md:text-lg font-black text-gray-900">{rangeLabel}</div>
        <button
          onClick={() => navigateWindow(1)}
          disabled={isCurrentWindow}
          className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 transition-colors text-gray-700 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <FiChevronRight size={18} />
        </button>
      </div>

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
    </>
  );
}
