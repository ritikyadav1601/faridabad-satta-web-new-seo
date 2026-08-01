import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
  const title = `${game.name} Chart ${year} | Old Record`;
  const description = `View the ${game.name} chart for ${year}, with January–December historical results in one organized yearly table.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title, description },
  };
}

export default async function YearChartLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ gameCode: string; year: string }>;
}) {
  const { gameCode, year } = await params;
  const game = TOP_GAME_DEFS.find(({ name, aliases }) =>
    [normalise(name), ...aliases.map(normalise)].includes(normalise(gameCode))
  );
  const currentYear = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", year: "numeric" }).format(new Date())
  );
  const validYear = /^\d{4}$/.test(year) && Number(year) >= 2015 && Number(year) <= currentYear;
  if (!game || !validYear) notFound();

  const canonicalSlug = game.name.toLowerCase().replace(/\s+/g, "-");
  const url = `${SITE_URL}/charts/${canonicalSlug}/${year}`;
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Charts", item: `${SITE_URL}/charts` },
      { "@type": "ListItem", position: 3, name: `${game.name} ${year}`, item: url },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      {children}
    </>
  );
}
