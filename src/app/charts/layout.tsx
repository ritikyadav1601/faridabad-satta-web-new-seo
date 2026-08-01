import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export function generateMetadata(): Metadata {
  const year = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
  }).format(new Date());

  return {
    title: `Satta King Charts ${year} | Faridabad Chart, Gali, Desawar, Ghaziabad & Old Records`,
    description: `Browse the latest Satta King Charts and old yearly records for Faridabad, Desawar, Delhi Bazar, Ghaziabad, Gali, Shri Ganesh, and other games. View organized chart archives from 2015 to ${year} with easy navigation.`,
    alternates: { canonical: `${SITE_URL}/charts` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/charts`,
      title: `Satta King Charts ${year} | Faridabad, Gali, Desawar & Old Records`,
      description: `Browse organized Satta King chart archives and yearly records from 2015 to ${year}.`,
    },
  };
}

export default function ChartsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
