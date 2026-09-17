import HomeClient from "./HomeClient";
import { getHomeData } from "@/lib/home-data";
import { getHomepageSeoContent } from "@/lib/homepage-seo";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { SITE_URL } from "@/lib/site";

// Cache the MongoDB aggregation briefly. The client still
// refreshes every 20 seconds, while repeat requests can use a fast server cache.
const getCachedHomeData = unstable_cache(getHomeData, ["homepage-data"], {
  revalidate: 20,
  tags: ["homepage-data"],
});

// Same idea for the admin-editable homepage SEO (title/description/content) —
// short server cache, and the admin save handler calls revalidatePath("/")
// so an update shows up right away instead of waiting out the window.
const getCachedHomepageSeo = unstable_cache(getHomepageSeoContent, ["homepage-seo-content"], {
  revalidate: 20,
  tags: ["homepage-data"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { metaTitle: title, metaDescription: description } = await getCachedHomepageSeo();

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: SITE_URL },
    openGraph: { type: "website", url: SITE_URL, title, description },
    twitter: { card: "summary", title, description },
  };
}

export const revalidate = 20;

export default async function HomePage() {
  const [initialData, seo] = await Promise.all([getCachedHomeData(), getCachedHomepageSeo()]);
  return <HomeClient initialData={initialData} seoContent={seo.content} />;
}
