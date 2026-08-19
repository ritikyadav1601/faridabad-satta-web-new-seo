import HomeClient from "./HomeClient";
import { getHomeData } from "@/lib/home-data";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { SITE_URL } from "@/lib/site";

export function generateMetadata(): Metadata {
  const today = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const title = `Satta King Today ${today} | Faridabad`;
  const description =
    "Check today's Faridabad Satta King result plus Gali, Ghaziabad, Delhi Bazar and Desawar updates, daily charts and old records.";

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: SITE_URL },
    openGraph: { type: "website", url: SITE_URL, title, description },
    twitter: { card: "summary", title, description },
  };
}

// Cache the MongoDB aggregation briefly. The client still
// refreshes every 20 seconds, while repeat requests can use a fast server cache.
const getCachedHomeData = unstable_cache(getHomeData, ["homepage-data"], {
  revalidate: 20,
  tags: ["homepage-data"],
});

export const revalidate = 20;

export default async function HomePage() {
  const initialData = await getCachedHomeData();
  return <HomeClient initialData={initialData} />;
}
