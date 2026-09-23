import type { SK24Game, GameResult } from "@/lib/types";

// A focused "this game's result" banner for /chart/[gameCode] pages.
// Placed above the generic 12-game TopResultsBlock so a visitor who landed
// on, say, /chart/gali sees the Gali result immediately instead of having
// to scan the shared table for their game's row.
//
// Three data sources, tried in order, so every chart page gets a banner
// (not just the curated 12 "Top Game Results"):
//   1. topGames    -- the curated live-results feed (TopResultsBlock's data)
//   2. extraGames  -- the homepage "Other Game Results" section's live feed
//   3. chartFallback -- today/yesterday read straight out of this page's own
//      month-by-month chart table, for the handful of chart-only slugs
//      that aren't fed by either live-results source at all.

function parseGameTimeToMinutes(time: string): number | null {
  const m = time?.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = m[3].toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h * 60 + min;
}

function istNowMinutes(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const h = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
  const min = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
  return (h % 24) * 60 + min;
}

// extraGames isn't pre-gated the way the curated top-games feed is -- hide
// "today" until its scheduled result time has actually passed, same as the
// homepage's "Other Game Results" section does.
function gateTodayByTime(today: string, time: string): string {
  const resultMin = parseGameTimeToMinutes(time);
  if (resultMin === null) return today;
  return istNowMinutes() < resultMin ? "XX" : today;
}

interface ChartFallback {
  today?: string;
  yesterday?: string;
}

export default function CurrentGameResult({
  gameCode,
  gameName,
  topGames,
  extraGames,
  chartFallback,
}: {
  gameCode: string;
  gameName: string;
  topGames: SK24Game[];
  extraGames: GameResult[];
  chartFallback?: ChartFallback;
}) {
  const slugOf = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

  const topMatch = topGames.find((g) => slugOf(g.name) === gameCode);
  const extraMatch = !topMatch ? extraGames.find((g) => slugOf(g.name) === gameCode) : undefined;

  let time = "";
  let today = "";
  let yesterday = "";

  if (topMatch) {
    time = topMatch.time;
    today = topMatch.today;
    yesterday = topMatch.yesterday;
  } else if (extraMatch) {
    time = extraMatch.time;
    today = gateTodayByTime(extraMatch.today, extraMatch.time);
    yesterday = extraMatch.yesterday;
  } else if (chartFallback && (chartFallback.today || chartFallback.yesterday)) {
    today = chartFallback.today || "";
    yesterday = chartFallback.yesterday || "";
  } else {
    return null;
  }

  const hasToday = Boolean(today) && today !== "XX" && today !== "--";

  return (
    <div className="mx-auto mb-4 max-w-2xl overflow-hidden rounded-2xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-6 md:py-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            {gameName} Result
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-500">
            {time ? `Result Time: ${time}` : "Today's Result"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase text-gray-400">Yesterday</p>
            <p className="font-mono text-xl font-black text-gray-500 md:text-2xl">
              {yesterday || "XX"}
            </p>
          </div>

          <div className="rounded-xl border-2 border-emerald-300 bg-white px-4 py-2 text-center shadow-sm">
            <p className="text-[10px] font-bold uppercase text-emerald-600">Today</p>
            {hasToday ? (
              <p className="font-mono text-3xl font-black text-emerald-600 md:text-4xl">
                {today}
              </p>
            ) : (
              <p className="font-mono text-2xl font-black text-red-500 md:text-3xl">XX</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
