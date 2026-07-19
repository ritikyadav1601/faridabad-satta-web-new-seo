"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { FiClock, FiTrendingUp, FiZap, FiBarChart2, FiCalendar, FiChevronDown } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { useLanguage, t } from "@/context/LanguageContext";
import type { HomeData } from "@/lib/home-data";
import { TOP_GAME_DEFS } from "@/lib/top-games";

// ─── Types ───

interface GameResult {
  name: string;
  time: string;
  yesterday: string;
  today: string;
}

interface SK24Game {
  name: string;
  time: string;
  yesterday: string;
  today: string;
}

interface SK24ChartTable {
  title: string;
  headers: string[];
  rows: string[][];
}

interface ChartRow {
  date: string;
  dswr: string;
  frbd: string;
  gzbd: string;
  gali: string;
  srgn: string;
  dlbz: string;
}

// ─── Scroll Animation ───

function useScrollAnimation(deps: unknown[] = []) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fadeInUp");
            entry.target.classList.remove("opacity-0", "translate-y-8");
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
    );
    const el = ref.current;
    if (el) el.querySelectorAll(".sa").forEach((item) => observer.observe(item));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

// ─── Skeleton ───

function CardSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-gray-100 rounded-2xl px-4 py-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="skeleton h-4 w-28 mb-1.5" />
            <div className="skeleton h-3 w-16" />
          </div>
          <div className="skeleton h-8 w-12" />
          <div className="skeleton h-8 w-12" />
          <div className="skeleton h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ───

export default function HomeClient({ initialData }: { initialData: HomeData }) {
  // ✅ Data is fetched on the server and passed in as props — no client-side
  // fetch waterfall, so everything is present on first paint.
  const [liveResults] = useState<GameResult[]>(initialData.liveResults);
  const [nextResults] = useState<GameResult[]>(initialData.nextResults);
  const [restResults] = useState<GameResult[]>(initialData.restResults);
  const [sk24Games] = useState<SK24Game[]>(initialData.sk24Games);
  const [sk24Charts] = useState<SK24ChartTable[]>(initialData.sk24Charts);
  const [monthlyChart] = useState<ChartRow[]>(initialData.monthlyChart);
  const [monthlyChartMeta] = useState<{ month: string; year: string }>(initialData.monthlyChartMeta);
  const [customGames] = useState<Record<string, string>>(initialData.customGames);
  const [customGamesYesterday] = useState<Record<string, string>>(initialData.customGamesYesterday);
  const [mongoTopGames] = useState<SK24Game[]>(initialData.mongoTopGames);
  const [loading] = useState(false);
  const [khaiwal] = useState<any>(initialData.khaiwal);

  const containerRef = useScrollAnimation([loading]);
  const { lang } = useLanguage();

  const updatedAt = format(new Date(), "dd MMMM yyyy, hh:mm a") + " IST";

  // Games to hide from all sections
  const hiddenGames = new Set([
    "gaziabad night",
    "punjab laxmi",
    "new sahibabad",
    "super max",
    "brij rani",
    "verra king",
    "mahalaxmi bazar",
  ]);
  const isHidden = (name: string) => hiddenGames.has(name.toLowerCase().trim());

  // ─── Promoted games: supplied by the separate MongoDB database ───
  const topGames = mongoTopGames;
  const allApiGames = [...liveResults, ...nextResults, ...restResults, ...sk24Games];
  // Former top games are now shown in Other Game Results. Games promoted above
  // are deliberately excluded here, preventing Delhi Bazar/Shri Ganesh/
  // Faridabad/Ghaziabad/Gali/Deshawer duplicates.
  const otherGameDefs = [
    { name: "kohlapur", time: "1:30 PM", customKey: "kohlapur", aliases: [] },
    { name: "manipur", time: "2:30 PM", customKey: "manipur", aliases: [] },
    { name: "up bazar", time: "3:30 PM", customKey: "up-bazar", aliases: ["upbazar"] },
    { name: "palwal city", time: "4:30 PM", customKey: "palwal-city", aliases: [] },
    { name: "mathura city", time: "6:50 PM", customKey: "mathura-city", aliases: [] },
    { name: "sadar bazar", time: "", customKey: "", aliases: [] },
    { name: "gwalior", time: "", customKey: "", aliases: [] },
    { name: "delhi matka", time: "", customKey: "", aliases: [] },
    { name: "agra", time: "", customKey: "", aliases: [] },
    { name: "alwar", time: "", customKey: "", aliases: [] },
    { name: "dwarka", time: "", customKey: "", aliases: [] },
  ];
  const otherGames: SK24Game[] = otherGameDefs.map(({ name, time, customKey, aliases }) => {
    const norm = name.toLowerCase().replace(/\s+/g, "");
    const allNames = [norm, ...aliases];
    const existing = allApiGames.find(g => {
      const gn = g.name.toLowerCase().replace(/\s+/g, "");
      return allNames.some(n => n === gn);
    });
    const today = customKey && customGames[customKey] ? customGames[customKey] : existing?.today || "XX";
    const yesterday = customKey && customGamesYesterday[customKey]
      ? customGamesYesterday[customKey]
      : existing?.yesterday || "XX";
    if (existing) {
      return {
        name: name.toUpperCase(),
        time: existing.time || time,
        yesterday,
        today: gateTodayByTime(today, existing.time || time),
      };
    }
    return { name: name.toUpperCase(), time, yesterday, today: gateTodayByTime(today, time) };
  });

  // Filter remaining games: no promoted/other game should be repeated below.
  const allFixedNames = new Set<string>();
  TOP_GAME_DEFS.forEach(({ name, aliases }) => {
    allFixedNames.add(name.toLowerCase().replace(/\s+/g, ""));
    aliases.forEach((alias) => allFixedNames.add(alias));
  });
  otherGameDefs.forEach(({ name, aliases }) => {
    allFixedNames.add(name.toLowerCase().replace(/\s+/g, ""));
    aliases.forEach(a => allFixedNames.add(a));
  });
  const isInFixedList = (name: string) => {
    const n = name.toLowerCase().replace(/\s+/g, "");
    return allFixedNames.has(n);
  };
  const filteredLive = liveResults.filter(g => !isInFixedList(g.name) && !isHidden(g.name));
  const filteredNext = nextResults.filter(g => !isInFixedList(g.name) && !isHidden(g.name));
  const filteredRest = restResults.filter(g => !isInFixedList(g.name) && !isHidden(g.name));

  return (
    <div ref={containerRef} className="bg-[var(--surface-page)]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[var(--color-brand-deep)] via-emerald-900 to-teal-700 text-white text-center py-6 md:py-10 px-3 md:px-4">
        <div className="inline-block mb-3 px-4 py-1.5 rounded-full bg-white/10 border border-white/20">
          <span className="text-emerald-100 text-xs md:text-sm font-bold tracking-wider uppercase">
            {t("लाइव रिजल्ट डैशबोर्ड", "Live Results Dashboard", lang)}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mb-2">
          Faridabad Satta {format(new Date(), "yyyy")}
          <br className="md:hidden" />
          <span className="text-amber-300"> {t("लाइव रिजल्ट", "Live Results", lang)}</span>
        </h1>
        <p className="text-emerald-100/80 text-sm md:text-base max-w-2xl mx-auto">
          {t(
            "लाइव सट्टा रिजल्ट अपडेट। गली, देसावर, गाज़ियाबाद, फरीदाबाद और अन्य गेम्स।",
            "Live Satta result updates for Gali, Desawar, Ghaziabad, Faridabad and more games.",
            lang
          )}
        </p>
        <div className="mt-4 inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-2 text-xs text-emerald-100">
          <span className="w-2 h-2 bg-amber-300 rounded-full animate-live-pulse" />
          {t("अंतिम अपडेट", "Last Updated", lang)}: {updatedAt}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-gray-50 border-b border-gray-200 py-1.5 px-2 md:px-4">
        <p className="text-center text-[11px] md:text-xs text-gray-500 max-w-4xl mx-auto">
          <span className="font-bold text-red-500">{t("अस्वीकरण", "DISCLAIMER", lang)}:</span>{" "}
          {t(
            "FaridabadSatta.com एक स्वतंत्र सूचनात्मक वेबसाइट है। हम जुआ या सट्टेबाजी को बढ़ावा नहीं देते।",
            "FaridabadSatta.com is an independent informational website. We do not promote gambling or betting.",
            lang
          )}{" "}
          <Link href="/disclaimer" className="text-blue-600 hover:underline font-medium">
            {t("पूरा अस्वीकरण पढ़ें", "Read Full Disclaimer", lang)}
          </Link>
        </p>
      </div>

      <div className="max-w-[1400px] mx-auto px-2 sm:px-3 md:px-6 py-5 md:py-8 space-y-8 md:space-y-10">

        {loading ? (
          <div className="space-y-10">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <>
            {/* ─── 1ST SECTION: Promoted MongoDB games ─── */}
            <GameCardSection
              title={t("टॉप गेम रिजल्ट", "Top Game Results", lang)}
              subtitle={t("आज के प्रमुख गेमों के रिजल्ट", "Today’s featured game results", lang)}
              icon={<FiBarChart2 size={18} />}
              headerBg="bg-teal-700"
              accentColor="text-teal-700"
              games={topGames}
              isLive
              lang={lang}
            />

            {/* ─── 2ND SECTION: Monthly Chart ─── */}
            <MonthlyChartSection
              initialRows={monthlyChart}
              initialMonth={monthlyChartMeta.month}
              initialYear={monthlyChartMeta.year}
              lang={lang}
            />

                {/* ─── 3TH SECTION: WhatsApp / Khaiwal ─── */}
                <WhatsAppContactSection lang={lang} khaiwal={khaiwal} />

            {/* ─── 4TH SECTION: Former top games and other games ─── */}
           <GameCardSection
              title={t("अन्य गेम रिजल्ट", "Other Game Results", lang)}
              subtitle={t("पहले के टॉप गेम और अन्य गेम", "Former top games and other results", lang)}
              icon={<FiZap size={18} />}
              headerBg="bg-emerald-700"
              accentColor="text-emerald-700"
              games={otherGames}
              isLive
              lang={lang}
            />

        

            {/* SK24 Charts */}
            {sk24Charts.length > 0 && (
              <SK24ChartsSection tables={sk24Charts} lang={lang} />
            )}

            {/* LIVE (remaining) */}
            {filteredLive.length > 0 && (
              <GameCardSection
                title={t("लाइव रिजल्ट", "LIVE Results", lang)}
                subtitle={t("अभी जारी हो रहे गेम्स", "Games currently being declared", lang)}
                icon={<FiZap size={18} />}
                headerBg="bg-red-600"
                accentColor="text-red-600"
                games={filteredLive}
                isLive
                lang={lang}
              />
            )}

            {/* UPCOMING (remaining) */}
            {filteredNext.length > 0 && (
              <GameCardSection
                title={t("आने वाले रिजल्ट", "Upcoming Results", lang)}
                subtitle={t("ये गेम्स जल्द जारी होंगे", "These games will be declared soon", lang)}
                icon={<FiClock size={18} />}
                headerBg="bg-amber-600"
                accentColor="text-amber-700"
                games={filteredNext}
                lang={lang}
              />
            )}

            {/* DECLARED (remaining) */}
            {filteredRest.length > 0 && (
              <GameCardSection
                title={t("घोषित रिजल्ट", "Declared Results", lang)}
                subtitle={t("आज के पूरे हुए गेम रिजल्ट", "Today's completed game results", lang)}
                icon={<FiTrendingUp size={18} />}
                headerBg="bg-emerald-600"
                accentColor="text-emerald-600"
                games={filteredRest}
                lang={lang}
              />
            )}
          </>
        )}

        {/* Welcome */}
        <div className="sa opacity-0 translate-y-8 bg-gray-50 rounded-2xl border border-gray-200 p-5 md:p-8 space-y-3 text-sm text-gray-600 leading-relaxed">
          <p>
            {t(
              <>
                <strong className="text-gray-900">FaridabadSatta.com</strong> में आपका स्वागत है - लाइव <strong className="text-gray-900">सट्टा रिजल्ट</strong> और चार्ट देखने का आसान प्लेटफॉर्म। हमारा सिस्टम परिणाम उपलब्ध होते ही अपडेट करता है।
              </> as unknown as string,
              <>
                Welcome to <strong className="text-gray-900">FaridabadSatta.com</strong> — a simple place to check live <strong className="text-gray-900">Satta results</strong> and charts. Results are updated as they become available.
              </> as unknown as string,
              lang
            )}
          </p>
          <p>
            {t(
              "100% सटीक दैनिक अपडेट, ऐतिहासिक चार्ट और 100+ राष्ट्रीय व क्षेत्रीय बाजारों की जानकारी, पूरी तरह मुफ्त पाएं।",
              "Get 100% accurate daily updates, historical charts, and insights for over 100+ national and regional markets, completely free.",
              lang
            )}
          </p>
        </div>

        {/* CTA */}
        <div className="sa opacity-0 translate-y-8 bg-[var(--color-brand-deep)] rounded-2xl p-5 md:p-6 text-center">
          <p className="text-lg md:text-xl font-black text-white">
            {t("अपना गेम यहाँ एडवरटाइज़ करें", "ADVERTISE YOUR GAME HERE", lang)}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {t("FaridabadSatta.com पर अपने गेम को फीचर करने के लिए संपर्क करें", "Contact us to feature your game on FaridabadSatta.com", lang)}
          </p>
        </div>

        {/* SEO */}
        <SeoContent lang={lang} />
      </div>
    </div>
  );
}


// Parse a game time like "01:39 PM" / "9:20 PM" into minutes since midnight.
// Returns null if the string is empty or not a recognizable time.
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

// Current wall-clock time in IST as minutes since midnight.
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

// A game's "today" result should only show once its scheduled IST time has passed.
// Before that the result hasn't been declared yet, so show "XX".
// If the time can't be parsed we don't gate (return the value as-is).
function gateTodayByTime(today: string, time: string): string {
  const resultMin = parseGameTimeToMinutes(time);
  if (resultMin === null) return today;
  return istNowMinutes() < resultMin ? "XX" : today;
}

// Ordinal suffix for a day number, e.g. 1 -> "st", 27 -> "th".
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

// IST day label like "Sat. 27th". offsetDays shifts by whole days (-1 = yesterday).
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

function GameCardSection({
  title,
  subtitle,
  icon,
  headerBg,
  accentColor,
  games,
  isLive,
  lang,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  headerBg: string;
  accentColor: string;
  games: (GameResult | SK24Game)[];
  isLive?: boolean;
  lang: "hi" | "en";
}) {
  return (
    <section className="opacity-100">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div>
          <h2 className="text-lg md:text-xl font-black text-gray-900 flex items-center gap-2">
            {title}
            {isLive && (
              <span className="w-2 h-2 bg-red-500 rounded-full animate-live-pulse" />
            )}
          </h2>

          <p className="text-xs text-gray-500">
            {subtitle}
          </p>
        </div>

        <div
          className={`ml-auto px-3 py-1 rounded-full text-xs font-bold bg-gray-100 border border-gray-300 ${accentColor}`}
        >
          {games.length} Games
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border-2 border-black rounded-xl">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-black text-white">
              <th className="border border-black px-3 py-3 text-left">
                Game
              </th>

              <th className="border border-black px-3 py-2 text-center">
                <div>Yesterday</div>
                <div className="text-[11px] md:text-xs font-semibold text-green-300 mt-0.5">
                  {istDayLabel(-1)}
                </div>
              </th>

              <th className="border border-black px-3 py-2 text-center">
                <div>Today</div>
                <div className="text-[11px] md:text-xs font-semibold text-green-300 mt-0.5">
                  {istDayLabel(0)}
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {games.map((game, i) => {
              const slug = game.name
                .toLowerCase()
                .replace(/\s+/g, "-");

              const hasResult =
                game.today &&
                game.today !== "XX" &&
                game.today !== "--";

              return (
                <tr
                  key={game.name + i}
                  className="bg-gray-100 hover:bg-yellow-50 transition"
                >
                  {/* Game Name */}
                  <td className="border border-black px-1 py-2 bg-amber-50 text-center">
                    <div className="font-black uppercase text-sm md:text-base leading-none">
                      {game.name}
                    </div>
                    <div className="text-[10px] text-black leading-none mt-1">{game.time}</div>
                    <Link
                      href={`/chart/${slug}`}
                      className="inline-block text-[10px] font-bold text-blue-600 hover:text-blue-800 leading-none mt-0.5"
                    >
                      Chart →
                    </Link>
                  </td>

                  {/* Yesterday */}
                  <td className="border border-black px-3 py-1.5 text-center">
                    <span className="font-mono font-black text-2xl md:text-3xl text-gray-800">
                      {game.yesterday || "XX"}
                    </span>
                  </td>

                  {/* Today */}
                  <td className="border border-black px-3 py-1.5 text-center">
                    {hasResult ? (
                      <span className="font-mono font-black text-2xl md:text-3xl text-green-600">
                        {game.today}
                      </span>
                    ) : isLive ? (
                      <span className="font-bold text-red-500 text-sm md:text-base">
                        XX
                      </span>
                    ) : (
                      <span className="font-mono font-black text-2xl md:text-3xl text-gray-400">
                        XX
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
// ─── SK24 Charts Section ───

function SK24ChartsSection({ tables, lang }: { tables: SK24ChartTable[]; lang: "hi" | "en" }) {
  return (
    <div className="sa opacity-0 translate-y-8 space-y-6">
      <div className="flex items-center gap-2.5 md:gap-3 mb-1">
        <div className="p-2.5 rounded-xl bg-teal-600 text-white shrink-0 shadow-md">
          <FiBarChart2 size={18} />
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-black text-gray-900">
            {t("मंथली चार्ट", "Monthly Charts", lang)}
          </h2>
          <p className="text-xs text-gray-400">
            {t("सट्टा चार्ट रिकॉर्ड", "Satta chart records", lang)}
          </p>
        </div>
      </div>
      {tables.map((table, idx) => (
        <div key={idx} className="bg-white rounded-2xl border-2 border-gray-300 overflow-hidden shadow-sm">
          <div className="bg-teal-600 text-white text-center py-2.5 px-3 text-sm md:text-base font-bold">
            {table.title}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm md:text-base border-collapse">
              <thead>
                <tr className="bg-gray-800 text-white text-xs md:text-sm uppercase">
                  {table.headers.map((h, hi) => (
                    <th key={hi} className="py-2 px-1 md:px-3 font-semibold border border-gray-300">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, ri) => (
                  <tr key={ri} className={`text-center ${ri % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={`py-1.5 px-1 md:px-3 font-mono font-bold border border-gray-200 ${ci === 0 ? "text-red-500" : "text-gray-800"
                          }`}
                      >
                        {cell || "XX"}
                      </td>
                    ))}
                    {Array.from({ length: Math.max(0, table.headers.length - row.length) }).map((_, fi) => (
                      <td key={`fill-${fi}`} className="py-1.5 px-1 md:px-3 font-mono font-bold border border-gray-200 text-gray-400">
                        XX
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}


function WhatsAppContactSection({ lang, khaiwal }: any) {
  const phone =  "917355847700";
  const name =  "Har Har Mahadev";

  const games = [
    { name: t("शिव गंगा", "Shiv Ganga", lang), time: "12:15 PM" },
    { name: t("सबर बाजार", "Sabar Bazar", lang), time: "1:15 PM" },
    { name: t("अलीनगर", "Alinagar", lang), time: "2:15 PM" },
    { name: t("दिल्ली बाज़ार", "Delhi Bazar", lang), time: "2:50 PM" },
    { name: t("श्री गणेश", "Shri Ganesh", lang), time: "4:20 PM" },
    { name: t("फतेहाबाद सिटी", "Fatehabad City", lang), time: "5:20 PM" },
    { name: t("फरीदाबाद", "Faridabad", lang), time: "5:30 PM" },
    { name: t("मुल्तान बाज़ार", "Multan Bazar", lang), time: "7:20 PM" },
    { name: t("गाज़ियाबाद", "Ghaziabad", lang), time: "8:40 PM" },
    { name: t("कल्याणपुरी", "Kalyanpuri", lang), time: "10:10 PM" },
    { name: t("गली", "Gali", lang), time: "11:20 PM" },
    { name: t("दिसावर", "Disawar", lang), time: "1:30 AM" },
  ];

  return (
    <section className="sa opacity-0 translate-y-8">
      <div className="relative overflow-hidden rounded-3xl border-4 border-dashed border-red-500 bg-gradient-to-b from-yellow-300 via-yellow-100 to-white shadow-xl">

        {/* Top Header */}
        <div className="text-center px-4 pt-6 pb-3">
          <p className="text-lg md:text-xl font-black text-gray-900">
            ⭐ Direct Company No.1 Khaiwal ⭐
          </p>

          <h2 className="mt-3 text-2xl md:text-4xl font-black text-[#1a1a2e]">

            {name}
          </h2>
        </div>

        {/* Timing List */}
        <div className="max-w-xl mx-auto px-4 pb-5">
          <div className="bg-white/60 backdrop-blur rounded-2xl border-2 border-yellow-500 p-4">

            {games.map((game) => (
              <div
                key={game.name}
                className="flex items-center justify-between py-2 border-b border-dashed border-gray-400 last:border-0"
              >
                <div className="flex items-center gap-2 font-bold text-gray-800">
                  <span className="text-xl">⏰</span>
                  <span>{game.name}</span>
                </div>

                <span className="font-black text-[#1a1a2e]">
                  {game.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rates */}
        <div className="grid grid-cols-2 gap-3 px-4 max-w-md mx-auto">
          <div className="bg-white border-2 border-yellow-500 rounded-2xl p-3 text-center">
            <p className="text-xs font-bold text-gray-500 uppercase">
              Jodi Rate
            </p>
            <p className="text-2xl font-black text-blue-700">
              10-960
            </p>
          </div>

          <div className="bg-white border-2 border-yellow-500 rounded-2xl p-3 text-center">
            <p className="text-xs font-bold text-gray-500 uppercase">
              Haruf Rate
            </p>
            <p className="text-2xl font-black text-blue-700">
              100-960
            </p>
          </div>
        </div>

        {/* Payment */}
        <div className="text-center px-4 py-5">
          <p className="font-bold text-gray-700 text-sm">
            PAYTM • PHONEPE • GOOGLE PAY • BANK TRANSFER
          </p>

          <p className="mt-2 text-sm font-semibold text-red-600">
            PhonePe, GooglePay & Paytm Scanner Available
          </p>
        </div>

        {/* Phone */}
        <div className="text-center px-4">
          <a
            href={`tel:+917355847700`}
            className="inline-block text-3xl md:text-4xl font-black text-blue-700 border-b-4 border-blue-700"
          >
            +{phone}
          </a>
        </div>

        {/* Footer Text */}
        <div className="text-center px-4 pt-5">
          <p className="font-black text-xl md:text-2xl text-[#1a1a2e]">
            😊😊Har Har Mahadev 😊😊
          </p>

          <p className="mt-2 text-sm md:text-base font-bold text-gray-700">
            Game play karne ke liye niche link par click kare
          </p>
        </div>

        {/* WhatsApp Button */}
        <div className="px-4 pb-8 pt-5 flex justify-center">
          <a
           href={`https://wa.me/+917355847700?text=${encodeURIComponent("FARIDABAD SATTA")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full font-black text-lg shadow-lg hover:scale-105 transition-all"
          >
            <FaWhatsapp className="text-4xl" />

            <div className="text-left">
              <div className="text-xl leading-none">
                WhatsApp
              </div>
              <div className="text-sm opacity-90">
                Click To Chat
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Monthly Chart Section ───

const CHART_GAMES = [
  { key: "dlbz" as const, name: "Delhi Bazar" },
  { key: "srgn" as const, name: "Shri Ganesh" },
  { key: "frbd" as const, name: "Faridabad" },
  { key: "gzbd" as const, name: "Gaziabad" },
  { key: "gali" as const, name: "Gali" },
  { key: "dswr" as const, name: "Disawar" },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function MonthlyChartSection({
  initialRows,
  initialMonth,
  initialYear,
  lang,
}: {
  initialRows: ChartRow[];
  initialMonth: string;
  initialYear: string;
  lang: "hi" | "en";
}) {
  const now = new Date();
  const currentMonthName = initialMonth || now.toLocaleString("en-US", { month: "long" });
  const currentYear = initialYear || String(now.getFullYear());

  const [rows, setRows] = useState<ChartRow[]>(initialRows);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthName);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [chartLoading, setChartLoading] = useState(false);

  const years = Array.from({ length: 12 }, (_, i) => String(now.getFullYear() - i));

  const fetchChart = async (m: string, y: string) => {
    setChartLoading(true);
    try {
      const res = await fetch(`/api/monthly-chart?month=${m.toLowerCase()}&year=${y}`);
      const data = await res.json();
      if (data.success) {
        setRows(data.results || []);
      } else {
        setRows([]);
      }
    } catch {
      setRows([]);
    } finally {
      setChartLoading(false);
    }
  };

  const handleMonthChange = (m: string) => {
    setSelectedMonth(m);
    fetchChart(m, selectedYear);
  };

  const handleYearChange = (y: string) => {
    setSelectedYear(y);
    fetchChart(selectedMonth, y);
  };

  const displayMonth = selectedMonth.charAt(0).toUpperCase() + selectedMonth.slice(1);
  const title = lang === "hi"
    ? `${displayMonth} ${selectedYear} मंथली चार्ट`
    : `${displayMonth} ${selectedYear} Monthly Chart`;

  return (
    <section className="sa opacity-0 translate-y-8">
      <div className="flex items-center gap-2.5 md:gap-3 mb-4">
        <div>
          <h2 className="text-lg md:text-xl font-black text-gray-900">
            {lang === "hi" ? "मंथली चार्ट" : "Monthly Chart"} {selectedYear}
          </h2>
          <p className="text-xs text-gray-400">Delhi Bazar, Shri Ganesh, Faridabad, Gaziabad, Gali, Disawar</p>
        </div>
      </div>

      {/* Filter Dropdowns */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative">
          <FiCalendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none" />
          <select
            value={selectedMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="bg-gray-50 border border-gray-300 rounded-xl pl-8 pr-7 py-2 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 appearance-none cursor-pointer"
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <FiChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <FiBarChart2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none" />
          <select
            value={selectedYear}
            onChange={(e) => handleYearChange(e.target.value)}
            className="bg-gray-50 border border-gray-300 rounded-xl pl-8 pr-7 py-2 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 appearance-none cursor-pointer"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <FiChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        {chartLoading && (
          <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Chart Table */}
      {chartLoading ? (
        <div className="bg-white rounded-2xl border-2 border-gray-300 overflow-hidden shadow-sm">
          <div className="bg-[#1a1a2e] text-white text-center py-2.5 px-3 text-sm md:text-base font-bold">
            {title}
          </div>
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">{t("लोड हो रहा है...", "Loading...", lang)}</p>
          </div>
        </div>
      ) : rows.length > 0 ? (
        <div className="bg-white rounded-2xl border-2 border-gray-300 overflow-hidden shadow-sm">
          <div className="bg-[#1a1a2e] text-white text-center py-2.5 px-3 text-sm md:text-base font-bold">
            {title}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm md:text-base border-collapse">
              <thead>
                <tr className="bg-gray-800 text-white text-[10px] md:text-xs uppercase">
                  <th className="py-2 px-1.5 md:px-3 font-semibold border border-gray-300">
                    {t("तारीख", "Date", lang)}
                  </th>
                  {CHART_GAMES.map((g) => (
                    <th key={g.key} className="py-2 px-1.5 md:px-3 font-semibold border border-gray-300">
                      {g.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} className={`text-center ${ri % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                    <td className="py-1.5 px-1.5 md:px-3 font-bold text-red-500 border border-gray-200 text-xs md:text-sm whitespace-nowrap">
                      {row.date}
                    </td>
                    {CHART_GAMES.map((g) => (
                      <td
                        key={g.key}
                        className="py-1.5 px-1.5 md:px-3 font-mono font-bold border border-gray-200 text-gray-800"
                      >
                        {row[g.key] || "XX"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl border border-gray-200 py-12 text-center">
          <FiBarChart2 size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">{t("कोई डेटा उपलब्ध नहीं", "No data available", lang)}</p>
          <p className="text-gray-400 text-sm mt-1">{displayMonth} {selectedYear}</p>
        </div>
      )}
    </section>
  );
}

// ─── SEO Content ───

function SeoContent({ lang }: { lang: "hi" | "en" }) {
  return (
    <div className="sa opacity-0 translate-y-8 bg-gray-50 rounded-2xl border border-gray-200 p-5 md:p-8 space-y-4 text-sm text-gray-600 leading-relaxed">
      <h2 className="text-xl md:text-2xl font-black text-gray-900">
        {t("Faridabad Satta के बारे में", "About Faridabad Satta", lang)}
      </h2>
      <p>
        {t(
          "FaridabadSatta.com परिणाम और पुराने चार्ट रिकॉर्ड को एक ही स्थान पर देखने के लिए बनाया गया है। डेटा उपलब्ध होते ही प्लेटफॉर्म अपडेट किया जाता है।",
          "FaridabadSatta.com is built to make results and historical chart records easy to find in one place. The platform is updated as data becomes available.",
          lang
        )}
      </p>
      <p>
        {t(
          "चाहे आप गली, देसावर, गाज़ियाबाद, फरीदाबाद, या 100+ क्षेत्रीय गेम्स में से कोई भी फॉलो करते हों, हम आपको तुरंत अपडेट और व्यापक चार्ट रिकॉर्ड प्रदान करते हैं।",
          "Whether you follow Gali, Desawar, Ghaziabad, Faridabad, or any of the 100+ regional games, we have you covered with instant updates and comprehensive chart records.",
          lang
        )}
      </p>

      <h3 className="text-lg font-bold text-gray-900">
        {t("FaridabadSatta.com क्यों चुनें?", "Why Choose FaridabadSatta.com?", lang)}
      </h3>
      <ul className="list-none space-y-2 pl-0">
        <li className="flex items-start gap-2">
          <span className="text-green-600 font-bold mt-0.5">&#10003;</span>
          <span>
            <strong className="text-gray-900">{t("बिजली की तेज़ी:", "Lightning Fast:", lang)}</strong>{" "}
            {t("रिजल्ट घोषित होते ही अपडेट।", "Results updated the moment they are declared.", lang)}
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-green-600 font-bold mt-0.5">&#10003;</span>
          <span>
            <strong className="text-gray-900">{t("100+ गेम्स:", "100+ Games:", lang)}</strong>{" "}
            {t("राष्ट्रीय और क्षेत्रीय बाजारों की पूरी कवरेज।", "Complete coverage of national and regional markets.", lang)}
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-green-600 font-bold mt-0.5">&#10003;</span>
          <span>
            <strong className="text-gray-900">{t("चार्ट रिकॉर्ड:", "Chart Records:", lang)}</strong>{" "}
            {t(`2015 से ${new Date().getFullYear()} तक का ऐतिहासिक डेटा।`, `Historical data from 2015 to ${new Date().getFullYear()}.`, lang)}
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-green-600 font-bold mt-0.5">&#10003;</span>
          <span>
            <strong className="text-gray-900">{t("मोबाइल ऑप्टिमाइज़्ड:", "Mobile Optimized:", lang)}</strong>{" "}
            {t("सबसे अच्छे मोबाइल अनुभव के लिए बनाया गया।", "Built for the best mobile experience.", lang)}
          </span>
        </li>
      </ul>

      <h3 className="text-lg font-bold text-gray-900">{t("अस्वीकरण", "Disclaimer", lang)}</h3>
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700">
        <strong>{t("महत्वपूर्ण:", "Important:", lang)}</strong>{" "}
        {t(
          "FaridabadSatta.com पूरी तरह से सूचनात्मक उद्देश्यों के लिए है। हम किसी भी जुआ संचालन का स्वामित्व, संचालन या सुविधा नहीं देते। कृपया अपने क्षेत्रीय कानूनों का पालन करें।",
          "FaridabadSatta.com is strictly for informational purposes. We do not own, operate, or facilitate any gambling operations. Please comply with your regional laws.",
          lang
        )}
      </div>
    </div>
  );
}
