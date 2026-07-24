import axios from "axios";
import * as cheerio from "cheerio";

const HEADERS = { "User-Agent": "Mozilla/5.0" };
const TIMEOUT = 15_000;
const SATTA_FAST_URL = "https://satta-fast.com";

const SATTA_FAST_GAMES: Record<string, { column: string; name: string }> = {
  "delhi-bazar": { column: "DLBZ", name: "DELHI BAZAR" },
  "shri-ganesh": { column: "SHGN", name: "SHRI GANESH" },
};

const MONTH_SLUGS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

/**
 * Reads the dedicated monthly record chart published by satta-fast.com.
 * That site uses one focused result column per requested game, so this parser
 * intentionally supports only the two markets supplied by the site owner.
 */
export async function scrapeSattaFastGameChart(
  slug: string,
  month?: string,
  year?: string,
) {
  const game = SATTA_FAST_GAMES[slug];
  if (!game) return null;

  const now = new Date();
  const monthIndex = month
    ? MONTH_SLUGS.indexOf(month.toLowerCase())
    : now.getMonth();
  const targetMonthIndex = monthIndex >= 0 ? monthIndex : now.getMonth();
  const targetMonth = MONTH_SLUGS[targetMonthIndex];
  const targetYear = year || String(now.getFullYear());
  const url = `${SATTA_FAST_URL}/satta-king-chart/${targetMonth}-${targetYear}/${slug}`;

  const { data: html } = await axios.get(url, { headers: HEADERS, timeout: TIMEOUT });
  const $ = cheerio.load(html);
  const table = $("table.monthly-chart").first();
  if (!table.length) return null;

  const columns = table
    .find("tr.chart-column-header th")
    .map((_i, el) => $(el).text().trim().toUpperCase())
    .get();
  const gameColIndex = columns.indexOf(game.column);
  if (gameColIndex < 0) return null;
  // `columns` includes the leading Date header; `.result-cell` does not.
  const resultColumnIndex = gameColIndex - 1;

  const results: { date: string; day: string; result: string }[] = [];
  table.find("tbody tr.chart-row").each((_i, row) => {
    const dateParts = $(row).find("td.date-cell").text().trim().split(/\s+/);
    const values = $(row)
      .find("td.result-cell")
      .map((_j, cell) => $(cell).text().replace(/\s+/g, "").trim())
      .get();
    const date = dateParts[0];
    if (date) {
      results.push({
        date,
        day: dateParts.slice(1).join(" "),
        result: values[resultColumnIndex] || "XX",
      });
    }
  });

  if (!results.length) return null;

  const chartTitle = table.find(".chart-title1").text().replace(/\s+/g, " ").trim();
  return {
    gameName: game.name,
    chartTitle: chartTitle || `${game.name} - ${targetMonth} ${targetYear}`,
    month: targetMonth.charAt(0).toUpperCase() + targetMonth.slice(1),
    year: targetYear,
    columns,
    results,
  };
}

// ─── Game Chart Scraper ───

export async function scrapeGameChart(slug: string, month?: string, year?: string) {
  const { data: homeHtml } = await axios.get("https://satta-king-fast.com/", {
    headers: HEADERS,
    timeout: TIMEOUT,
  });

  const $home = cheerio.load(homeHtml);
  // Handle alternate spellings
  const slugVariants: Record<string, string[]> = {
    desawer: ["desawer", "desawar"],
    desawar: ["desawar", "desawer"],
  };
  const slugsToTry = slugVariants[slug] || [slug];

  let chartUrl = "";
  for (const s of slugsToTry) {
    $home(`a[href*="/${s}/satta-result-chart/"]`).each((_i, el) => {
      if (!chartUrl) chartUrl = $home(el).attr("href") || "";
    });
    if (chartUrl) break;
  }

  if (!chartUrl) return null;

  if (month && year) {
    const monthMap: Record<string, string> = {
      january: "01", february: "02", march: "03", april: "04",
      may: "05", june: "06", july: "07", august: "08",
      september: "09", october: "10", november: "11", december: "12",
    };
    const monthNum = monthMap[month.toLowerCase()];
    const formattedMonth = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
    chartUrl += `?month=${monthNum}&year=${year}&ResultFor=${formattedMonth}-${year}`;
  }

  const { data: chartHtml } = await axios.get(chartUrl, {
    headers: HEADERS,
    timeout: TIMEOUT,
  });

  const $ = cheerio.load(chartHtml);
  const chartTitle = $("tr.chart-head td.month h1").text().trim();

  const columns: string[] = [];
  $("tr.date-name th.name").each((_i, el) => {
    columns.push($(el).text().trim().toUpperCase());
  });

  const abbrMap: Record<string, string[]> = {
    DSWR: ["desawar", "desawer"], FRBD: ["faridabad"], GZBD: ["ghaziabad"],
    GALI: ["gali"], SRGN: ["shri-ganesh"],
  };

  const gameNameUpper = slug.replace(/-/g, " ").toUpperCase();
  let gameColIndex = -1;

  columns.forEach((col, i) => {
    const slugs = abbrMap[col];
    if (slugs && slugs.includes(slug)) gameColIndex = i;
  });
  if (gameColIndex === -1) {
    columns.forEach((col, i) => {
      if (col === gameNameUpper) gameColIndex = i;
    });
  }
  if (gameColIndex === -1) gameColIndex = columns.length - 1;

  const results: { date: string; day: string; result: string }[] = [];

  $("tr.day-number").each((_i, el) => {
    const dayEl = $(el).find("td.day");
    const dateNum = dayEl.text().trim();
    const dateTitle = dayEl.attr("title") || "";
    const numbers = $(el).find("td.number").map((_i, item) => $(item).text().trim()).get();

    if (dateNum) {
      let dayName = "";
      if (dateTitle) {
        try {
          dayName = new Date(dateTitle).toLocaleDateString("en-US", { weekday: "long" });
        } catch { /* skip */ }
      }
      results.push({
        // Store the day-of-month only; the full date title was leaking the
        // year (e.g. "2026") into the UI, which showed "26" for every row.
        date: dateNum || dateTitle,
        day: dayName,
        result: gameColIndex >= 0 ? (numbers[gameColIndex] || "XX") : (numbers[numbers.length - 1] || "XX"),
      });
    }
  });

  const titleMatch = chartTitle.match(/of\s+(\w+)\s+(\d{4})/);

  return {
    gameName: gameNameUpper,
    chartTitle,
    month: titleMatch?.[1] || "",
    year: titleMatch?.[2] || "",
    columns,
    results,
  };
}

// ─── SK24 Game Chart Scraper (fallback) ───

export async function scrapeSK24GameChart(slug: string, month?: string, year?: string) {
  const { data: html } = await axios.get("https://www.satta-king-24.com/chart", {
    headers: HEADERS,
    timeout: TIMEOUT,
  });

  const $ = cheerio.load(html);
  const gameNameUpper = slug.replace(/-/g, " ").toUpperCase();

  let foundHeaders: string[] = [];
  let foundRows: string[][] = [];
  let gameColIndex = -1;
  let chartTitle = "";

  $("table.newtable").each((_, table) => {
    if (gameColIndex >= 0) return;

    const headers: string[] = [];
    $(table).find("tr").eq(1).find("th").each((_, th) => {
      headers.push($(th).text().trim());
    });

    const idx = headers.findIndex(
      (h) => h.toLowerCase().replace(/\s+/g, "-") === slug || h.toUpperCase() === gameNameUpper
    );

    if (idx >= 0) {
      gameColIndex = idx;
      foundHeaders = headers;
      chartTitle = $(table).find("tr").first().text().trim().replace(/\s+/g, " ");

      $(table).find("tbody tr").each((_, tr) => {
        const cells: string[] = [];
        $(tr).find("td").each((_, td) => {
          cells.push($(td).text().trim());
        });
        if (cells.length > 0) foundRows.push(cells);
      });
    }
  });

  if (gameColIndex < 0) return null;

  const now = new Date();
  const targetMonth = month ? month.charAt(0).toUpperCase() + month.slice(1).toLowerCase() : now.toLocaleDateString("en-US", { month: "long" });
  const targetYear = year || String(now.getFullYear());

  const results: { date: string; day: string; result: string }[] = [];

  foundRows.forEach((cells) => {
    const dateStr = cells[0] || "";
    const dateParts = dateStr.split("-");
    const dayNum = dateParts[0] || dateStr;
    const gameResult = cells[gameColIndex] || "XX";

    let dayName = "";
    if (dateParts.length === 2) {
      try {
        const monthNum = parseInt(dateParts[1], 10) - 1;
        const dayNumInt = parseInt(dateParts[0], 10);
        const yearInt = parseInt(targetYear, 10);
        const d = new Date(yearInt, monthNum, dayNumInt);
        dayName = d.toLocaleDateString("en-US", { weekday: "long" });
      } catch { /* skip */ }
    }

    results.push({
      date: dayNum,
      day: dayName,
      result: gameResult || "XX",
    });
  });

  return {
    gameName: gameNameUpper,
    chartTitle,
    month: targetMonth,
    year: targetYear,
    columns: foundHeaders,
    results,
  };
}
