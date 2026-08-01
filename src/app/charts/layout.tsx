import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export function generateMetadata(): Metadata {
  const year = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
  }).format(new Date());

  return {
    title: `Satta King Charts ${year} | Old Records`,
    description: `Browse ${year} and old Satta King charts for Faridabad, Desawar, Delhi Bazar, Ghaziabad, Gali and Shri Ganesh by game and year.`,
    alternates: { canonical: `${SITE_URL}/charts` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/charts`,
      title: `Satta King Charts ${year} | Old Records`,
      description: `Browse organized Satta King chart archives and yearly records through ${year}.`,
    },
  };
}

export default function ChartsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
