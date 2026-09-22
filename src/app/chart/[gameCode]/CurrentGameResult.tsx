import type { SK24Game } from "@/lib/types";

// A focused "this game's result" banner for /chart/[gameCode] pages.
// Placed above the generic 12-game TopResultsBlock so a visitor who landed
// on, say, /chart/gali sees the Gali result immediately instead of having
// to scan the shared table for their game's row. Renders nothing when the
// current chart page isn't one of the curated live-result games (a few
// chart-only slugs, e.g. rajdhani-jaipur, aren't fed by the live-results
// source and only have historical chart data below).
export default function CurrentGameResult({
  gameCode,
  gameName,
  topGames,
}: {
  gameCode: string;
  gameName: string;
  topGames: SK24Game[];
}) {
  const game = topGames.find(
    (g) => g.name.toLowerCase().replace(/\s+/g, "-") === gameCode
  );

  if (!game) return null;

  const hasToday = Boolean(game.today) && game.today !== "XX" && game.today !== "--";

  return (
    <div className="mx-auto mb-4 max-w-2xl overflow-hidden rounded-2xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-6 md:py-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            {gameName} Result
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-500">
            {game.time ? `Result Time: ${game.time}` : "Today's Result"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase text-gray-400">Yesterday</p>
            <p className="font-mono text-xl font-black text-gray-500 md:text-2xl">
              {game.yesterday || "XX"}
            </p>
          </div>

          <div className="rounded-xl border-2 border-emerald-300 bg-white px-4 py-2 text-center shadow-sm">
            <p className="text-[10px] font-bold uppercase text-emerald-600">Today</p>
            {hasToday ? (
              <p className="font-mono text-3xl font-black text-emerald-600 md:text-4xl">
                {game.today}
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
