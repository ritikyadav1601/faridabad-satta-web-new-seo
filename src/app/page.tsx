import HomeClient from "./HomeClient";
import { getHomeData } from "@/lib/home-data";

// Results are database-backed and must reflect a newly saved value on the next
// browser refresh. Client-side refreshes are triggered every 20 seconds.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const initialData = await getHomeData();
  return <HomeClient initialData={initialData} />;
}
