import {
  getHomepageFromMongo,
  getMonthlyChartCacheFromMongo,
  getSK24GamesFromMongo,
  getSK24ChartsFromMongo,
  getKhaiwalSettings,
} from "./extra-games-mongodb";
import { getTopGamesFromMongo } from "./top-games-mongodb";
import { getMonthlyChartFromMongo, mergeMonthlyChartData } from "./top-games-mongodb";
import { getPublishedBlogs, type BlogPost } from "./blogs-mongodb";
import type {
  GameResult,
  ChartRow,
  SK24Game,
  SK24ChartTable,
} from "./types";

export interface HomeData {
  liveResults: GameResult[];
  nextResults: GameResult[];
  restResults: GameResult[];
  sk24Games: SK24Game[];
  sk24Charts: SK24ChartTable[];
  monthlyChart: ChartRow[];
  monthlyChartMeta: { month: string; year: string };
  khaiwal: { name: string; whatsapp: string } | null;
  mongoTopGames: SK24Game[];
  extraGames: GameResult[];
  blogs: BlogPost[];
}

// Fetch everything the homepage needs in parallel.
export async function getHomeData(): Promise<HomeData> {
  const now = new Date();
  const monthName = now.toLocaleString("en-US", { month: "long" }).toLowerCase();
  const year = now.getFullYear().toString();
  const [homepage, sk24, sk24chart, chart, mongoChart, mongoTopGames, blogs, khaiwal] =
    await Promise.all([
      getHomepageFromMongo(),
      getSK24GamesFromMongo(),
      getSK24ChartsFromMongo(),
      getMonthlyChartCacheFromMongo(monthName, year),
      getMonthlyChartFromMongo(monthName, year),
      getTopGamesFromMongo(),
      getPublishedBlogs(),
      getKhaiwalSettings(),
    ]);
  const mergedMonthlyChart = mergeMonthlyChartData(chart, mongoChart);

  return {
    liveResults: homepage?.live || [],
    nextResults: homepage?.next || [],
    restResults: homepage?.rest || [],
    sk24Games: sk24?.games || [],
    sk24Charts: sk24chart?.tables || [],
    monthlyChart: mergedMonthlyChart?.results || [],
    monthlyChartMeta: {
      month: mergedMonthlyChart?.month || monthName,
      year: mergedMonthlyChart?.year || year,
    },
    khaiwal,
    mongoTopGames,
    extraGames: homepage?.live || [],
    blogs,
  };
}
