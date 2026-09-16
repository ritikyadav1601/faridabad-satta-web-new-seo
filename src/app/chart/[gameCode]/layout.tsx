import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/site";
import { CHART_META } from "@/lib/chart-meta";

function titleCase(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function canonicalGameCode(gameCode: string): string {
  const aliases: Record<string, string> = {
    fridabad: "faridabad",
    frbd: "faridabad",
    gaziabad: "ghaziabad",
    gzbd: "ghaziabad",
    "purani-gali": "gali",
    disawar: "deshawer",
    desawar: "deshawer",
    desawer: "deshawer",
    dswr: "deshawer",
  };
  return aliases[gameCode.toLowerCase()] || gameCode.toLowerCase();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gameCode: string }>;
}): Promise<Metadata> {
  const { gameCode } = await params;
  const canonicalCode = canonicalGameCode(gameCode);
  const meta = CHART_META[canonicalCode];

  const name = titleCase(canonicalCode);
  const title = meta?.title ?? `${name} Satta King Chart`;
  const description =
    meta?.description ??
    `Check the ${name} Satta King chart, daily results, old records, and complete chart history on Faridabad Satta.`;

  const url = `${SITE_URL}/chart/${encodeURIComponent(canonicalCode)}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
    },
  };
}

function isJunkGameCode(gameCode: string): boolean {
  return gameCode.toLowerCase().replace(/[^a-z0-9]/g, "") === "showyourgamehere";
}

export default async function ChartLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ gameCode: string }>;
}) {
  const { gameCode } = await params;
  if (isJunkGameCode(gameCode)) notFound();

  const canonicalCode = canonicalGameCode(gameCode);
  const name = titleCase(canonicalCode);
  const url = `${SITE_URL}/chart/${encodeURIComponent(canonicalCode)}`;
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Charts", item: `${SITE_URL}/charts` },
      { "@type": "ListItem", position: 3, name: `${name} Chart`, item: url },
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
