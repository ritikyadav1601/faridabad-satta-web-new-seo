"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { FiClock, FiTrendingUp, FiZap, FiBarChart2, FiCalendar, FiChevronDown } from "react-icons/fi";
import { FaTelegramPlane, FaWhatsapp } from "react-icons/fa";
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
  // The server provides the first render. Keeping these as props (instead of
  // one-time state) lets router.refresh() render the newly saved DB values.
  const router = useRouter();
  const isJunkGame = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]/g, "") === "showyourgamehere";
  const liveResults = initialData.liveResults.filter((game) => !isJunkGame(game.name));
  const nextResults = initialData.nextResults.filter((game) => !isJunkGame(game.name));
  const restResults = initialData.restResults.filter((game) => !isJunkGame(game.name));
  const sk24Games = initialData.sk24Games.filter((game) => !isJunkGame(game.name));
  const sk24Charts = initialData.sk24Charts;
  const monthlyChart = initialData.monthlyChart;
  const monthlyChartMeta = initialData.monthlyChartMeta;
  const mongoTopGames = initialData.mongoTopGames.filter((game) => !isJunkGame(game.name));
  const extraGames = initialData.extraGames.filter((game) => !isJunkGame(game.name));
  const loading = false;
  const khaiwal = initialData.khaiwal;

  const containerRef = useScrollAnimation([loading]);
  const { lang } = useLanguage();
  const [clockText, setClockText] = useState("");

  useEffect(() => {
    const updateClock = () => setClockText(formatIstClock(new Date()));
    updateClock();
    const clockInterval = window.setInterval(updateClock, 1_000);
    return () => window.clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const interval = window.setInterval(refresh, 20_000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [router]);

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
  // Show the newest declared Top Game in the dashboard hero. Sorting by the
  // scheduled result time keeps this in sync as results are added through day.
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
        (parseGameTimeToMinutes(b.time) ?? -1) -
        (parseGameTimeToMinutes(a.time) ?? -1)
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
  // The lower results list comes exclusively from EXTRA_GAMES_MONGO_URI.
  // Exclude promoted games so the separate Top Games section is untouched.
  const allFixedNames = new Set<string>();
  TOP_GAME_DEFS.forEach(({ name, aliases }) => {
    allFixedNames.add(name.toLowerCase().replace(/\s+/g, ""));
    aliases.forEach((alias) => allFixedNames.add(alias));
  });
  const isInFixedList = (name: string) => {
    const n = name.toLowerCase().replace(/\s+/g, "");
    return allFixedNames.has(n);
  };
  const otherGames = extraGames
    .filter((game) => !isInFixedList(game.name) && !isHidden(game.name))
    .map((game) => ({ ...game, today: gateTodayByTime(game.today, game.time) }));
  const filteredLive: GameResult[] = [];
  const filteredNext: GameResult[] = [];
  const filteredRest: GameResult[] = [];

  return (
    <div ref={containerRef} className="bg-[var(--surface-page)]">
      {/* Hero */}
      <div className="site-hero px-3 py-8 text-center text-slate-900 md:px-4 md:py-12">
       
        <h1 className="mb-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl md:text-5xl">
          Faridabad Satta King Result Today
        </h1>
        <p className="text-sm font-bold text-slate-600">Daily results and charts • {format(new Date(), "yyyy")}</p>
      
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
                  {upcomingIsTomorrow ? `${t("कल", "Tomorrow", lang)} • ` : ""}{upcomingTopGame.time}
                </p>
              </div>
              <span className="  px-3 py-2 text-center ">
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

      {/* Disclaimer */}
      {/* <div className="bg-gray-50 border-b border-gray-200 py-1.5 px-2 md:px-4">
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
      </div> */}

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
              emphasizeToday
              lang={lang}
            />

            {/* ─── 2ND SECTION: Monthly Chart ─── */}
            <MonthlyChartSection
              initialRows={monthlyChart}
              initialMonth={monthlyChartMeta.month}
              initialYear={monthlyChartMeta.year}
              lang={lang}
            />

            <WhatsAppContactSection lang={lang} khaiwal={khaiwal} />
            <ChannelFollowSection lang={lang} />

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

        {/* MongoDB blog posts */}
        <BlogSection posts={initialData.blogs} lang={lang} />
      </div>
    </div>
  );
}

function BlogSection({
  posts,
  lang,
}: {
  posts: HomeData["blogs"];
  lang: "hi" | "en";
}) {
  if (!posts.length) return null;

  return (
    <section className="sa opacity-0 translate-y-8" aria-labelledby="latest-blogs-heading">
      <div className="mb-5 text-center">
        <h2 id="latest-blogs-heading" className="text-2xl font-black tracking-tight text-gray-900 md:text-3xl">
          {t("नवीनतम ब्लॉग", "Latest Blogs", lang)}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {t("हमारे नवीनतम लेख और अपडेट पढ़ें", "Read our latest articles and updates", lang)}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} lang={lang} />
        ))}
      </div>
    </section>
  );
}

function BlogCard({
  post,
  lang,
}: {
  post: HomeData["blogs"][number];
  lang: "hi" | "en";
}) {
  const content = plainText(post.content);
  const previewLength = 220;
  const canExpand = content.length > previewLength;
  const visibleContent = canExpand ? `${content.slice(0, previewLength).trimEnd()}…` : content;

  if (!post.slug) return null;

  return (
    <Link
      href={`/blog/${encodeURIComponent(post.slug)}`}
      aria-label={`${t("ब्लॉग पढ़ें", "Read blog", lang)}: ${post.title}`}
      className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-deep)]"
    >
      <article>
      {post.image && (
        // Blog images are uploaded by the admin and served from MongoDB GridFS.
        <div className="relative h-48 w-full">
          <Image
            src={post.image}
            alt={post.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            loading="lazy"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        </div>
      )}
      <div className="p-5 md:p-6">
        {post.createdAt && (
          <time className="text-xs font-semibold uppercase tracking-wide text-gray-400" dateTime={post.createdAt}>
            {new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", {
              timeZone: "Asia/Kolkata",
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(new Date(post.createdAt))}
          </time>
        )}
        <h3 className="mt-2 text-xl font-black text-gray-900 transition group-hover:text-amber-700">{post.title}</h3>
        {content && (
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-600">{visibleContent}</p>
        )}
        <span className="mt-4 inline-flex rounded-lg bg-[var(--color-brand-deep)] px-4 py-2 text-sm font-bold text-white transition group-hover:opacity-90">
          {t("और देखें", "See more", lang)}
        </span>
      </div>
      </article>
    </Link>
  );
}

function plainText(content: string) {
  return content
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
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
  emphasizeToday = false,
  lang,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  headerBg: string;
  accentColor: string;
  games: (GameResult | SK24Game)[];
  isLive?: boolean;
  emphasizeToday?: boolean;
  lang: "hi" | "en";
}) {
  return (
    <section className="results-section opacity-100">
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
      <div className="results-table-shell overflow-x-auto">
        <table className={`w-full border-collapse ${emphasizeToday ? "table-fixed" : ""}`}>
          {emphasizeToday && (
            <colgroup>
              <col className="w-[42%]" />
              <col className="w-[calc(29%_-_12px)]" />
              <col className="w-[calc(29%_+_12px)]" />
            </colgroup>
          )}
          <thead>
            <tr className="text-white">
              <th className="border px-3 py-3 text-left">
                Game
              </th>

              <th className={`border text-center ${emphasizeToday ? "px-1.5 py-2" : "px-3 py-2"}`}>
                <div className={emphasizeToday ? "text-[10px] sm:text-xs font-semibold text-white/75" : ""}>Yesterday</div>
                <div className="text-[11px] md:text-xs font-semibold text-green-300 mt-0.5">
                  {istDayLabel(-1)}
                </div>
              </th>

              <th className={`border text-center ${emphasizeToday ? "px-3 py-3 bg-emerald-600/25" : "px-3 py-2"}`}>
                <div className={emphasizeToday ? "text-base md:text-lg font-black" : ""}>Today</div>
                <div className={`${emphasizeToday ? "text-xs md:text-sm" : "text-[11px] md:text-xs"} font-semibold text-green-300 mt-0.5`}>
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
                  className="transition"
                >
                  {/* Game Name */}
                  <td className="border px-2 py-3 text-center">
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
                  <td className={`border text-center ${emphasizeToday ? "px-1.5 py-2 bg-gray-50/80" : "px-3 py-2"}`}>
                    <span className={`font-mono font-black text-gray-800 ${emphasizeToday ? "text-2xl md:text-3xl text-gray-500" : "text-2xl md:text-3xl"}`}>
                      {game.yesterday || "XX"}
                    </span>
                  </td>

                  {/* Today */}
                  <td className={`border text-center ${emphasizeToday ? "px-3 py-3 bg-emerald-50/70" : "px-3 py-2"}`}>
                    {hasResult ? (
                      <span className={`font-mono font-black text-green-600 ${emphasizeToday ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl"}`}>
                        {game.today}
                      </span>
                    ) : isLive ? (
                      <span className={`font-bold text-red-500 ${emphasizeToday ? "text-xl md:text-2xl" : "text-sm md:text-base"}`}>
                        XX
                      </span>
                    ) : (
                      <span className={`font-mono font-black text-gray-400 ${emphasizeToday ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl"}`}>
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


function WhatsAppContactSection({
  lang,
  khaiwal,
}: {
  lang: "hi" | "en";
  khaiwal: { name: string; whatsapp: string } | null;
}) {
  const savedPhone = (khaiwal?.whatsapp || "7015129958").replace(/\D/g, "");
  const phone = savedPhone.length === 10 ? `91${savedPhone}` : savedPhone;
  const name = khaiwal?.name || "Har Har Mahadev";
  const games = [
    ["शिव गंगा", "Shiv Ganga", "12:15 PM"],
    ["सबर बाजार", "Sabar Bazar", "1:15 PM"],
    ["अलीनगर", "Alinagar", "2:15 PM"],
    ["दिल्ली बाज़ार", "Delhi Bazar", "2:50 PM"],
    ["श्री गणेश", "Shri Ganesh", "4:20 PM"],
    ["फतेहाबाद सिटी", "Fatehabad City", "5:20 PM"],
    ["फरीदाबाद", "Faridabad", "5:30 PM"],
    ["मुल्तान बाज़ार", "Multan Bazar", "7:20 PM"],
    ["गाज़ियाबाद", "Ghaziabad", "8:40 PM"],
    ["कल्याणपुरी", "Kalyanpuri", "10:10 PM"],
    ["गली", "Gali", "11:20 PM"],
    ["दिसावर", "Disawar", "1:30 AM"],
  ];

  return (
    <section className="sa opacity-0 translate-y-8">
      <div className="overflow-hidden rounded-3xl border-4 border-dashed border-red-500 bg-gradient-to-b from-yellow-300 via-yellow-100 to-white shadow-xl">
        <div className="px-4 pb-3 pt-6 text-center">
          <p className="text-lg font-black text-gray-900 md:text-xl">⭐ Direct Company No.1 Khaiwal ⭐</p>
          <h2 className="mt-3 text-2xl font-black text-[#1a1a2e] md:text-4xl">{name}</h2>
        </div>

        <div className="mx-auto max-w-xl px-4 pb-5">
          <div className="rounded-2xl border-2 border-yellow-500 bg-white/60 p-4 backdrop-blur">
            {games.map(([hiName, enName, time]) => (
              <div key={enName} className="flex items-center justify-between border-b border-dashed border-gray-400 py-2 last:border-0">
                <div className="flex items-center gap-2 font-bold text-gray-800">
                  <span className="text-xl">⏰</span>
                  <span>{t(hiName, enName, lang)}</span>
                </div>
                <span className="font-black text-[#1a1a2e]">{time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto grid max-w-md grid-cols-2 gap-3 px-4">
          <div className="rounded-2xl border-2 border-yellow-500 bg-white p-3 text-center">
            <p className="text-xs font-bold uppercase text-gray-500">Jodi Rate</p>
            <p className="text-2xl font-black text-blue-700">10-960</p>
          </div>
          <div className="rounded-2xl border-2 border-yellow-500 bg-white p-3 text-center">
            <p className="text-xs font-bold uppercase text-gray-500">Haruf Rate</p>
            <p className="text-2xl font-black text-blue-700">100-960</p>
          </div>
        </div>

        <div className="px-4 py-5 text-center">
          <p className="text-sm font-bold text-gray-700">PAYTM • PHONEPE • GOOGLE PAY • BANK TRANSFER</p>
          <p className="mt-2 text-sm font-semibold text-red-600">PhonePe, GooglePay & Paytm Scanner Available</p>
          <a href={`tel:+${phone}`} className="mt-4 inline-block border-b-4 border-blue-700 text-3xl font-black text-blue-700 md:text-4xl">+{phone}</a>
          <p className="mt-5 text-xl font-black text-[#1a1a2e] md:text-2xl">😊😊 {name} 😊😊</p>
          <p className="mt-2 text-sm font-bold text-gray-700 md:text-base">Game play karne ke liye niche link par click kare</p>
        </div>

        <div className="flex justify-center px-4 pb-8">
          <a
            href={`https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent("FARIDABAD SATTA")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-full bg-green-500 px-8 py-4 text-lg font-black text-white shadow-lg transition-all hover:scale-105 hover:bg-green-600"
          >
            <FaWhatsapp className="text-4xl" />
            <span>WhatsApp<br /><small className="text-sm opacity-90">Click To Chat</small></span>
          </a>
        </div>
      </div>
    </section>
  );
}

function ChannelFollowSection({ lang }: { lang: "hi" | "en" }) {
  return (
    <section className="sa opacity-0 translate-y-8 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-sky-50 p-5 text-center shadow-sm md:p-6">
      <p className="text-base font-black text-gray-900 md:text-lg">
        {t(
          "सबसे तेज रिजल्ट के लिए चैनल को फॉलो करें 🕉️",
          "Follow our channels for the fastest results 🕉️",
          lang
        )}
      </p>
      <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
        <a
          href="https://whatsapp.com/channel/0029Vb7N6II8fewx7GpwN01p"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-bold text-white transition hover:bg-green-700"
        >
          <FaWhatsapp className="h-5 w-5" />
          WhatsApp Channel
        </a>
        <a
          href="https://t.me/faridabadsattafastresult"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 py-3 font-bold text-white transition hover:bg-sky-600"
        >
          <FaTelegramPlane className="h-5 w-5" />
          Telegram Channel
        </a>
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

  // Keep the default/current chart in sync when the home-page 20 second
  // refresh receives newer database data. A visitor-selected older chart is
  // deliberately left unchanged.
  useEffect(() => {
    if (selectedMonth === currentMonthName && selectedYear === currentYear) {
      setRows(initialRows);
    }
  }, [initialRows, currentMonthName, currentYear, selectedMonth, selectedYear]);

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
  const title = `${displayMonth} ${selectedYear} Monthly Chart`;

  return (
    <section className="sa opacity-0 translate-y-8">
      <div className="flex items-center gap-2.5 md:gap-3 mb-4">
        <div>
          <h2 className="text-lg md:text-xl font-black text-gray-900">
            Monthly Chart {selectedYear}
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
  const today = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <article className="sa opacity-0 translate-y-8 rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm leading-relaxed text-gray-600 md:p-8">
      <header className="mb-7">
        <h2 className="text-2xl font-black tracking-tight text-gray-900 md:text-3xl">
          Satta King Result Today {today} | Faridabad Satta Live Updates
        </h2>
        <p className="mt-3">
          Welcome to <strong className="text-gray-900">FaridabadSatta.com</strong>, your trusted source for daily satta king and faridabad satta information. Our platform provides timely result updates, organized archives, and easy access to regional charts. Whether you are checking today&apos;s updates or exploring previous records, everything is arranged in a simple, user-friendly format that works smoothly across all devices.
        </p>
      </header>

      <SeoSection title="About FaridabadSatta.com">
        <p>FaridabadSatta.com is an independent information portal focused on publishing satta king and faridabad satta records in a well-organized manner. We maintain historical charts, regional archives, and daily updates so visitors can quickly find the information they need. Every page is designed for fast loading, easy navigation, and a better browsing experience on desktop and mobile devices.</p>
        <p>Our website also provides archives for Delhi Bazar, Ghaziabad, Gali, Disawar, Shree Ganesh, Old Alwar, and many other popular categories. Instead of searching across multiple websites, users can browse everything from one organized platform.</p>
      </SeoSection>

      <SeoSection title={`Latest Satta King Result Today (${today})`}>
        <p>The latest satta king result today is updated after the official publishing schedule. Visitors looking for the daily faridabad satta result can access today&apos;s information through our live result section without unnecessary delays. Our goal is to make daily updates available quickly while maintaining organized records for future reference.</p>
        <p>Along with today&apos;s faridabad satta result, we provide updates for multiple regional categories through our All Game section. Every result page helps users locate the latest numbers and previous daily records.</p>
      </SeoSection>

      <SeoSection title="Regional Results & Historical Archives">
        <p>Our archive section is designed for users who want to explore previous satta king and faridabad satta records. Historical charts are arranged by month, year, and regional category, making older entries easy to browse.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <ArchiveItem title="Faridabad Satta Results">Daily updates with complete monthly and yearly records, including today&apos;s result and historical charts.</ArchiveItem>
          <ArchiveItem title="Delhi Bazar Results">Regularly updated daily records and historical chart collections in organized tables.</ArchiveItem>
          <ArchiveItem title="Ghaziabad Results">Complete daily records and long-term charts arranged in chronological order.</ArchiveItem>
          <ArchiveItem title="Gali Results">Organized daily, monthly, and yearly archives that make specific dates easy to locate.</ArchiveItem>
          <ArchiveItem title="Disawar Results">Regularly updated records supported by charts from previous months and years.</ArchiveItem>
        </div>
      </SeoSection>

      <SeoSection title="All Game Satta Result Overview">
        <p>FaridabadSatta.com is a central destination for satta king, faridabad satta, and regional chart records. Users can access Delhi Bazar, Ghaziabad, Gali, Disawar, Shree Ganesh, Old Alwar, and other archives from one platform. Every result section is categorized to improve navigation and provide a consistent browsing experience across desktop and mobile devices.</p>
      </SeoSection>

      <SeoSection title="News & Website Updates">
        <p>We continuously improve the platform to provide faster access during peak traffic hours. Recent improvements include better archive navigation, enhanced mobile compatibility, and simplified result pages, making historical records and previous dates easier to locate.</p>
      </SeoSection>

      <SeoSection title="Educational Articles">
        <div className="grid gap-3 md:grid-cols-2">
          <ArchiveItem title="Understanding Satta King Historical Charts">Historical records show how archived data is organized over time. Structured tables make it easier to navigate and compare dates.</ArchiveItem>
          <ArchiveItem title="How to Read Faridabad Satta Charts">Faridabad archives use a simple table format to display dates and published records, helping visitors browse monthly archives and locate historical information.</ArchiveItem>
        </div>
      </SeoSection>

      <SeoSection title="Why Choose FaridabadSatta.com">
        <p>FaridabadSatta.com focuses on speed, organization, and user convenience. The platform combines daily updates, historical archives, regional result sections, and organized chart collections in one clean, responsive website.</p>
      </SeoSection>

      <SeoSection title="Frequently Asked Questions">
        <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white px-4">
          <FaqItem question="Where can I check today's Satta King result?">The latest result is available on the homepage in the live result section, with links to previous historical records.</FaqItem>
          <FaqItem question="When is the Faridabad Satta result updated?">It is generally updated around the scheduled evening announcement. Check the homepage shortly after the official timing.</FaqItem>
          <FaqItem question="Does the website provide All Game Satta records?">Yes. Archives include Faridabad, Delhi Bazar, Ghaziabad, Gali, Disawar, Shree Ganesh, Old Alwar, and other regional categories.</FaqItem>
          <FaqItem question="Can I browse previous charts?">Yes. Historical records are available through organized monthly and yearly chart collections.</FaqItem>
          <FaqItem question="Is registration required?">No. Results, archives, and historical records can be viewed without creating an account.</FaqItem>
        </div>
      </SeoSection>

      <section className="mt-7 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
        <h3 className="text-lg font-bold text-red-800">Disclaimer</h3>
        <p className="mt-2">FaridabadSatta.com is an independent informational website created to organize publicly available satta king and faridabad satta records. The website does not promote, support, or facilitate gambling, betting, or any illegal activity in any form.</p>
        <p className="mt-2">All charts, archives, historical records, and regional information are intended solely for informational, educational, and historical reference purposes. Visitors are encouraged to comply with all applicable laws and regulations in their jurisdictions.</p>
      </section>
    </article>
  );
}

function SeoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7 space-y-3">
      <h3 className="text-xl font-black text-gray-900 md:text-2xl">{title}</h3>
      {children}
    </section>
  );
}

function ArchiveItem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h4 className="font-bold text-gray-900">{title}</h4>
      <p className="mt-1">{children}</p>
    </div>
  );
}

function FaqItem({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <details className="group py-4">
      <summary className="cursor-pointer list-none font-bold text-gray-900 marker:hidden">
        <span className="flex items-center justify-between gap-4">
          {question}
          <FiChevronDown className="shrink-0 transition-transform group-open:rotate-180" />
        </span>
      </summary>
      <p className="mt-2 pr-8">{children}</p>
    </details>
  );
}
