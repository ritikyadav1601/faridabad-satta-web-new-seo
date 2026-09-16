// Shared helpers for the per-game chart pages: the server-rendered initial
// data in src/app/chart/[gameCode]/page.tsx, and the client-side month
// navigation in src/app/chart/[gameCode]/ChartTableClient.tsx. Keeping this
// in one place means both sides agree on the month window, labels, and
// day-of-month parsing.

export const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

export const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// How many month-columns to show at once in the table.
export const MONTHS_IN_VIEW = 6;

export interface MonthColumn {
  key: string; // "2026-5" (year-monthIndex)
  year: number;
  monthIndex: number; // 0-11
  label: string; // "Jun 2026"
  rowsByDay: Record<number, string>; // day-of-month -> result
}

// `date` may be a plain day number ("26") or a full date string
// (e.g. "2026-06-01"). Always returns the day-of-month, never the year.
export function getDayOfMonth(date: string): string {
  const trimmed = (date || "").trim();
  if (/^\d{1,2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) return String(parsed.getDate());
  return trimmed.slice(-2);
}

// Build the list of months (oldest -> newest) ending at `anchor`.
export function getMonthsWindow(anchor: Date, count: number): Date[] {
  const list: Date[] = [];
  for (let i = count - 1; i >= 0; i--) {
    list.push(new Date(anchor.getFullYear(), anchor.getMonth() - i, 1));
  }
  return list;
}

export function buildMonthColumn(
  date: Date,
  results: { date: string; result: string }[] | undefined
): MonthColumn {
  const y = date.getFullYear();
  const monthIndex = date.getMonth();
  const key = `${y}-${monthIndex}`;
  const label = `${MONTH_LABELS[monthIndex]} ${y}`;
  const rowsByDay: Record<number, string> = {};
  (results || []).forEach((row) => {
    const day = parseInt(getDayOfMonth(row.date), 10);
    if (!isNaN(day)) rowsByDay[day] = row.result;
  });
  return { key, year: y, monthIndex, label, rowsByDay };
}
