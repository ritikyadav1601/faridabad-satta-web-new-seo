import Link from "next/link";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import { TOP_GAME_DEFS } from "@/lib/top-games";
import { getTopGameAvailableYearsFromMongo } from "@/lib/top-games-mongodb";
import { unstable_cache } from "next/cache";

export const revalidate = 21600;

const getCachedAvailableYears = unstable_cache(
  getTopGameAvailableYearsFromMongo,
  ["top-game-available-years"],
  { revalidate: 21600, tags: ["top-game-available-years"] }
);

const MAIN_GAME_SLUGS = [
  "deshawer",
  "delhi-bazar",
  "shri-ganesh",
  "faridabad",
  "ghaziabad",
  "gali",
];

const slugFor = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

export default async function ChartsPage() {
  const currentYear = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
  }).format(new Date());
  const availableYears = await getCachedAvailableYears();
  const games = TOP_GAME_DEFS.map(({ name, time }) => ({ name, time, slug: slugFor(name) }));
  const mainGames = MAIN_GAME_SLUGS
    .map((slug) => games.find((game) => game.slug === slug))
    .filter((game): game is (typeof games)[number] => Boolean(game));
  const otherGames = games.filter((game) => !MAIN_GAME_SLUGS.includes(game.slug));

  const renderGame = (game: (typeof games)[number], featured = false) => {
    const years = availableYears[game.slug] || [];
    return (
      <section
        key={game.slug}
        className={`rounded-xl border bg-white p-3 shadow-sm ${featured ? "border-indigo-200" : "border-slate-200"}`}
      >
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-black uppercase tracking-tight text-slate-950 md:text-base">{game.name}</h2>
            <p className="text-[10px] font-semibold text-slate-500">{game.time}</p>
          </div>
          {featured && (
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-700">
              Main
            </span>
          )}
        </div>

        {years.length ? (
          <div className="flex flex-wrap gap-1.5">
            {years.map((year) => (
              <Link
                key={year}
                href={`/charts/${game.slug}/${year}`}
                className="group inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-black text-slate-800 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
              >
                {year}
                <FiChevronRight className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-center text-xs font-medium text-slate-500">
            No yearly records available
          </p>
        )}
      </section>
    );
  };

  return (
    <main className="min-h-screen bg-[var(--surface-page)] px-2.5 py-4 md:px-5 md:py-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5">
          <div className="mb-2 flex items-end justify-between">
            <h1 className="text-lg font-black text-slate-950 md:text-xl">Main Game Charts</h1>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">{mainGames.map((game) => renderGame(game, true))}</div>
        </div>

        <div>
        
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">{otherGames.map((game) => renderGame(game))}</div>
        </div>

        <article className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-600 shadow-sm md:p-8">
          <header>
            <h2 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
              Satta King Charts &amp; Historical Records
            </h2>
            <p className="mt-3">
              Welcome to the Satta King Charts section of FaridabadSatta.com, where you can browse organized yearly chart records for Faridabad, Desawar, Delhi Bazar, Ghaziabad, Gali, Shri Ganesh, and many other regional games. Our chart archive provides a clean, year-wise layout that works smoothly on desktop and mobile devices. Easy navigation between games and years makes old records simple to locate.
            </p>
          </header>

          <ChartInfoSection title="Complete Year-Wise Chart Archives">
            <p>Our chart section contains well-organized archives from 2015 to {currentYear} for multiple regional games. Every game includes dedicated yearly pages where visitors can browse month-wise and date-wise historical records without searching across multiple websites. This structured format improves readability and makes moving between years easy.</p>
          </ChartInfoSection>

          <ChartInfoSection title="Available Satta King Chart Categories">
            <p>FaridabadSatta.com provides historical chart records for a wide range of popular regional games. Visitors can browse charts for:</p>
            <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {["Faridabad", "Desawar", "Delhi Bazar", "Ghaziabad", "Gali", "Shri Ganesh", "Shiv Ganga", "Sabar Bazar", "Alinagar", "Fatehabad City", "Multan Bazar", "Kalyanpuri"].map((game) => (
                <li key={game} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-800">
                  {game}
                </li>
              ))}
            </ul>
            <p className="mt-4">Each chart page is arranged year-wise, allowing visitors to switch between different years and historical records without unnecessary navigation.</p>
          </ChartInfoSection>

          <ChartInfoSection title="Easy Navigation Between Years">
            <p>Every game archive includes quick links to multiple years, making previous records convenient to browse. Whether you are looking for the latest chart or an older archive, our navigation system lets you move between yearly pages with a single click.</p>
          </ChartInfoSection>

          <ChartInfoSection title="Mobile-Friendly Chart Experience">
            <p>Our Satta King Charts page uses a responsive interface that performs efficiently across smartphones, tablets, laptops, and desktop computers. Fast-loading pages, organized cards, and simple navigation allow visitors to browse records comfortably without unnecessary distractions.</p>
          </ChartInfoSection>

          <ChartInfoSection title="Why Use Our Chart Archive?">
            <p>FaridabadSatta.com offers an organized chart collection for multiple regional games. Instead of searching separate websites for different archives, visitors can access year-wise records from one platform. Every chart is categorized by game and year, helping users quickly locate historical information.</p>
          </ChartInfoSection>

          <ChartInfoSection title="Historical Records for Reference">
            <p>Our chart pages are maintained as historical archives for informational purposes. Year-wise tables make it easier to review previous records, compare dates, and browse older entries in a structured format. Each archive is regularly maintained to provide a consistent browsing experience.</p>
          </ChartInfoSection>

          <ChartInfoSection title="Frequently Asked Questions">
            <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 px-4">
              <ChartFaq question="What is the Satta King Charts page?">The page contains organized yearly archives for multiple regional games, allowing visitors to browse historical records by game and year.</ChartFaq>
              <ChartFaq question="Which games are available?">The archive includes Faridabad, Desawar, Delhi Bazar, Ghaziabad, Gali, Shri Ganesh, Shiv Ganga, Sabar Bazar, Alinagar, Fatehabad City, Multan Bazar, Kalyanpuri, and additional regional games.</ChartFaq>
              <ChartFaq question="Can I view old chart records?">Yes. Every game provides year-wise navigation so visitors can browse previous chart archives and historical records.</ChartFaq>
              <ChartFaq question="Is the chart page mobile-friendly?">Yes. The page is fully responsive and optimized for smartphones, tablets, laptops, and desktop devices.</ChartFaq>
              <ChartFaq question="Are these charts organized by year?">Yes. Every game contains dedicated yearly archive pages for quick and efficient navigation.</ChartFaq>
            </div>
          </ChartInfoSection>

          <section className="mt-7 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <h3 className="text-lg font-black text-red-800">Disclaimer</h3>
            <p className="mt-2">FaridabadSatta.com is an independent informational website. The chart pages are maintained solely for historical and informational reference. We do not promote, operate, or facilitate gambling, betting, paid number services, or prediction services. Visitors should always comply with the laws applicable in their jurisdiction.</p>
          </section>
        </article>
      </div>
    </main>
  );
}

function ChartInfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h3 className="text-xl font-black text-slate-950 md:text-2xl">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ChartFaq({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <details className="group py-4">
      <summary className="cursor-pointer list-none font-bold text-slate-900 marker:hidden">
        <span className="flex items-center justify-between gap-4">
          {question}
          <FiChevronDown className="shrink-0 transition-transform group-open:rotate-180" />
        </span>
      </summary>
      <p className="mt-2 pr-8">{children}</p>
    </details>
  );
}
