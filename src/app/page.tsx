import HomeClient from "./HomeClient";
import { getHomeData } from "@/lib/home-data";
import type { Metadata } from "next";

export function generateMetadata(): Metadata {
  const today = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return {
    title: `Satta King Result Today ${today} | Faridabad Satta Result & All Game Updates`,
    description:
      "Check the latest satta king result today along with faridabad satta updates, Delhi Bazar, Ghaziabad, Gali, Disawar, and All Game Satta records. Find daily charts, historical archives, and regularly updated regional result information.",
  };
}

// Results are database-backed and must reflect a newly saved value on the next
// browser refresh. Client-side refreshes are triggered every 20 seconds.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const initialData = await getHomeData();
  return <HomeClient initialData={initialData} />;
}
