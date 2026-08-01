import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { TOP_GAME_DEFS } from "@/lib/top-games";

function normalise(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gameCode: string; year: string }>;
}): Promise<Metadata> {
  const { gameCode, year } = await params;
  const game = TOP_GAME_DEFS.find(({ name, aliases }) =>
    [normalise(name), ...aliases.map(normalise)].includes(normalise(gameCode))
  );
  const currentYear = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", year: "numeric" }).format(new Date())
  );
  const validYear = /^\d{4}$/.test(year) && Number(year) >= 2015 && Number(year) <= currentYear;

  if (!game || !validYear) {
    return {
      title: "Chart Archive Not Found",
      robots: { index: false, follow: true },
    };
  }

  const canonicalSlug = game.name.toLowerCase().replace(/\s+/g, "-");
  const url = `${SITE_URL}/charts/${canonicalSlug}/${year}`;
  const title = `${game.name} Satta King Chart ${year} | Full Year Old Record`;
  const description = `View the complete ${game.name} chart for ${year}, including January to December historical records in one organized yearly table.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title, description },
  };
}

export default function YearChartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
