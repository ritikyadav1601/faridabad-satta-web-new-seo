"use client";

// Shared "today's live results at a glance" block: the hero banner (title,
// live clock, upcoming/latest result mini-cards) plus the 12-game Top Game
// Results table. This is the same content the homepage shows at the top —
// duplicated here (not imported from HomeClient.tsx, which is homepage-only
// and much larger/riskier to refactor) so every /chart/[gameCode] page can
// show today's numbers regardless of which specific game page a visitor
// lands on, per Ritik's request (2026-09-22).
//
// Deliberately does NOT include the homepage's "Khaiwal" WhatsApp section —
// that's a live betting-agent advertisement (payout rates, payment
// channels, a "book a bet" WhatsApp link), not an informational display,
// and duplicating it across every chart page was declined.

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiBarChart2 } from "react-icons/fi";
import { useLanguage, t } from "@/context/LanguageContext";
import { format } from "date-fns";

interface SK24Game {
  name: string;
  time: string;
  yesterday: string;
  today: string;
}

function formatIstClock(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || "";

  return `${value("month")} ${value("day")}, ${value("year")} ${value("hour")}:${value("minute")}:${value("second")} ${value("dayPeriod")}`;
}

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

function ordinalSuffix(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return "th";
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

function istDayLabel(offsetDays = 0): string {
  const d = new Date();
  if (offsetDays) d.setUTCDate(d.getUTCDate() + offsetDays);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
  }).formatToParts(d);
  const weekday = parts.find((p) => p.type === "weekday")?.value || "";
  const day = parseInt(parts.find((p) => p.type === "day")?.value || "0", 10);
  return `${weekday}. ${day}${ordinalSuffix(day)}`;
}

export default function TopResultsBlock({ topGames }: { topGames: SK24Game[] }) {
  const { lang } = useLanguage();
  const [clockText, setClockText] = useState("");

  useEffect(() => {
    const updateClock = () => setClockText(formatIstClock(new Date()));
    updateClock();
    const interval = window.setInterval(updateClock, 1_000);
    return () => window.clearInterval(interval);
  }, []);

  const currentIstMinutes = istNowMinutes();
  const isTopGameDeclared = (game: SK24Game) => {
    const resultTime = parseGameTimeToMinutes(game.time);
    return (
      Boolean(game.today) &&
      game.today !== "XX" &&
      game.today !== "--" &&
      (resultTime === null || resultTime <= currentIstMinutes)
    );
  };
  const latestTopGame = topGames
    .filter(isTopGameDeclared)
    .sort(
      (a, b) =>
        (parseGameTimeToMinutes(b.time) ?? -1) - (parseGameTimeToMinutes(a.time) ?? -1)
    )[0];
  const upcomingTopGames = topGames
    .filter((game) => {
      const resultTime = parseGameTimeToMinutes(game.time);
      return resultTime !== null && resultTime > currentIstMinutes;
    })
    .sort(
      (a, b) =>
        (parseGameTimeToMinutes(a.time) ?? Number.MAX_SAFE_INTEGER) -
        (parseGameTimeToMinutes(b.time) ?? Number.MAX_SAFE_INTEGER)
    );
  const tomorrowTopGames = [...topGames].sort(
    (a, b) =>
      (parseGameTimeToMinutes(a.time) ?? Number.MAX_SAFE_INTEGER) -
      (parseGameTimeToMinutes(b.time) ?? Number.MAX_SAFE_INTEGER)
  );
  const upcomingTopGame = upcomingTopGames[0] || tomorrowTopGames[0];
  const upcomingIsTomorrow = upcomingTopGames.length === 0;

  return (
    <div className="bg-[var(--surface-page)]">
      {/* Hero */}
      <div className="site-hero px-3 py-8 text-center text-slate-900 md:px-4 md:py-10 rounded-2xl">
        {/* h2, not h1 -- this component is embedded on every chart page,
            and each of those pages' own h1 (the specific game name) is what
            should carry that page's primary heading/SEO relevance. */}
        <h2 className="mb-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl md:text-4xl">
          Faridabad Satta King Result Today
        </h2>
        <p className="text-sm font-bold text-slate-600">
          Daily results and charts • {format(new Date(), "yyyy")}
        </p>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 font-mono text-xs font-bold tabular-nums text-slate-700 sm:text-sm">
          <span className="w-2 h-2 bg-amber-300 rounded-full animate-live-pulse" />
          <time suppressHydrationWarning>{clockText || "Loading clock..."}</time>
        </div>

        <div className={`mx-auto mt-5 grid w-full gap-3 ${latestTopGame ? "max-w-2xl sm:grid-cols-2" : "max-w-md"}`}>
          {upcomingTopGame && (
            <div className="flex items-center justify-between rounded-2xl border border-indigo-200 bg-indigo-50/70 px-4 py-3.5 text-left shadow-sm">
              <div>
                <p className="mt-1 text-lg font-black text-slate-900">{upcomingTopGame.name}</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                  {upcomingIsTomorrow ? `${t("कल", "Tomorrow", lang)} • ` : ""}
                  {upcomingTopGame.time}
                </p>
              </div>
              <span className="px-3 py-2 text-center">
                <span className="mt-0.5 block font-mono text-xl font-black text-red-500">XX</span>
              </span>
            </div>
          )}

          {latestTopGame && (
            <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3.5 text-left shadow-sm">
              <div>
                <p className="mt-1 text-lg font-black text-slate-900">{latestTopGame.name}</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">{latestTopGame.time}</p>
              </div>
              <span className="rounded-xl bg-white px-3 py-1 font-mono text-3xl font-black tracking-wider text-amber-600 shadow-sm">
                {latestTopGame.today}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center gap-3 mb-4">
          <div>
            <h2 className="text-lg md:text-xl font-black text-gray-900 flex items-center gap-2">
              <FiBarChart2 size={18} className="inline -mt-1 mr-1" />
              {t("टॉप गेम रिजल्ट", "Top Game Results", lang)}
              <span className="w-2 h-2 bg-red-500 rounded-full animate-live-pulse" />
            </h2>
            <p className="text-xs text-gray-500">
              {t("आज के प्रमुख गेमों के रिजल्ट", "Today's featured game results", lang)}
            </p>
          </div>
          <div className="ml-auto px-3 py-1 rounded-full text-xs font-bold bg-gray-100 border border-gray-300 text-teal-700">
            {topGames.length} Games
          </div>
        </div>

        <div className="results-table-shell overflow-x-auto">
          <table className="w-full border-collapse table-fixed">
            <colgroup>
              <col className="w-[42%]" />
              <col className="w-[calc(29%_-_12px)]" />
              <col className="w-[calc(29%_+_12px)]" />
            </colgroup>
            <thead>
              <tr className="text-white">
                <th className="border px-3 py-3 text-left">Game</th>
                <th className="border text-center px-1.5 py-2">
                  <div className="text-[10px] sm:text-xs font-semibold text-white/75">Yesterday</div>
                  <div className="text-[11px] md:text-xs font-semibold text-green-300 mt-0.5">
                    {istDayLabel(-1)}
                  </div>
                </th>
                <th className="border text-center px-3 py-3 bg-emerald-600/25">
                  <div className="text-base md:text-lg font-black">Today</div>
                  <div className="text-xs md:text-sm font-semibold text-green-300 mt-0.5">
                    {istDayLabel(0)}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {topGames.map((game, i) => {
                const slug = game.name.toLowerCase().replace(/\s+/g, "-");
                const hasResult = game.today && game.today !== "XX" && game.today !== "--";

                return (
                  <tr key={game.name + i} className="transition">
                    <td className="border px-2 py-3 text-center">
                      <div className="font-black uppercase text-sm md:text-base leading-none">
                        {game.name}
                      </div>
                      <div className="text-[10px] text-black leading-none mt-1">{game.time}</div>
                      <Link
                        href={`/chart/${slug}`}
                        aria-label={`View ${game.name} Satta King chart and old records`}
                        title={`${game.name} Chart`}
                        className="inline-block text-[10px] font-bold text-blue-600 hover:text-blue-800 leading-none mt-0.5"
                      >
                        Chart →
                      </Link>
                    </td>
                    <td className="border text-center px-1.5 py-2 bg-gray-50/80">
                      <span className="font-mono font-black text-gray-500 text-2xl md:text-3xl">
                        {game.yesterday || "XX"}
                      </span>
                    </td>
                    <td className="border text-center px-3 py-3 bg-emerald-50/70">
                      {hasResult ? (
                        <span className="font-mono font-black text-green-600 text-3xl md:text-4xl">
                          {game.today}
                        </span>
                      ) : (
                        <span className="font-bold text-red-500 text-xl md:text-2xl">XX</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
