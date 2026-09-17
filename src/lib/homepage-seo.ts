import "server-only";

import { MongoClient, type Document } from "mongodb";
import { sanitizeBlogHtml } from "./admin-blogs";

let clientPromise: Promise<MongoClient> | null = null;

interface SettingsDocument extends Document {
  _id: string;
}

export interface HomepageSeoSettings {
  metaTitle: string;
  metaDescription: string;
  content: string;
}

const SETTINGS_ID = "homepage-seo";

// Seed/fallback copy — used whenever the database has nothing saved yet (or
// is briefly unreachable) so the homepage never renders blank SEO content.
// Kept close to the original hardcoded block, just flattened into plain
// headings/paragraphs since the admin editor is a single rich-text box.
export const DEFAULT_HOMEPAGE_SEO: HomepageSeoSettings = {
  metaTitle: "Satta King Today {{date}} | Faridabad",
  metaDescription:
    "Check today's Faridabad Satta King result plus Gali, Ghaziabad, Delhi Bazar and Desawar updates, daily charts and old records.",
  content: `<h2>Satta King Result Today {{date}} | Faridabad Satta Live Updates</h2>
<p>Welcome to <strong>FaridabadSatta.com</strong>, your trusted source for daily satta king and faridabad satta information. Our platform provides timely result updates, organized archives, and easy access to regional charts. Whether you are checking today's updates or exploring previous records, everything is arranged in a simple, user-friendly format that works smoothly across all devices.</p>
<h3>About FaridabadSatta.com</h3>
<p>FaridabadSatta.com is an independent information portal focused on publishing satta king and faridabad satta records in a well-organized manner. We maintain historical charts, regional archives, and daily updates so visitors can quickly find the information they need. Every page is designed for fast loading, easy navigation, and a better browsing experience on desktop and mobile devices.</p>
<p>Our website also provides archives for Delhi Bazar, Ghaziabad, Gali, Disawar, Shree Ganesh, Old Alwar, and many other popular categories. Instead of searching across multiple websites, users can browse everything from one organized platform.</p>
<h3>Latest Satta King Result Today ({{date}})</h3>
<p>The latest satta king result today is updated after the official publishing schedule. Visitors looking for the daily faridabad satta result can access today's information through our live result section without unnecessary delays. Our goal is to make daily updates available quickly while maintaining organized records for future reference.</p>
<p>Along with today's faridabad satta result, we provide updates for multiple regional categories through our All Game section. Every result page helps users locate the latest numbers and previous daily records.</p>
<h3>Regional Results &amp; Historical Archives</h3>
<p>Our archive section is designed for users who want to explore previous satta king and faridabad satta records. Historical charts are arranged by month, year, and regional category, making older entries easy to browse.</p>
<ul>
<li><strong>Faridabad Satta Results</strong> — Daily updates with complete monthly and yearly records, including today's result and historical charts.</li>
<li><strong>Delhi Bazar Results</strong> — Regularly updated daily records and historical chart collections in organized tables.</li>
<li><strong>Ghaziabad Results</strong> — Complete daily records and long-term charts arranged in chronological order.</li>
<li><strong>Gali Results</strong> — Organized daily, monthly, and yearly archives that make specific dates easy to locate.</li>
<li><strong>Disawar Results</strong> — Regularly updated records supported by charts from previous months and years.</li>
</ul>
<h3>All Game Satta Result Overview</h3>
<p>FaridabadSatta.com is a central destination for satta king, faridabad satta, and regional chart records. Users can access Delhi Bazar, Ghaziabad, Gali, Disawar, Shree Ganesh, Old Alwar, and other archives from one platform. Every result section is categorized to improve navigation and provide a consistent browsing experience across desktop and mobile devices.</p>
<h3>News &amp; Website Updates</h3>
<p>We continuously improve the platform to provide faster access during peak traffic hours. Recent improvements include better archive navigation, enhanced mobile compatibility, and simplified result pages, making historical records and previous dates easier to locate.</p>
<h3>Educational Articles</h3>
<p><strong>Understanding Satta King Historical Charts</strong> — Historical records show how archived data is organized over time. Structured tables make it easier to navigate and compare dates.</p>
<p><strong>How to Read Faridabad Satta Charts</strong> — Faridabad archives use a simple table format to display dates and published records, helping visitors browse monthly archives and locate historical information.</p>
<h3>Why Choose FaridabadSatta.com</h3>
<p>FaridabadSatta.com focuses on speed, organization, and user convenience. The platform combines daily updates, historical archives, regional result sections, and organized chart collections in one clean, responsive website.</p>
<h3>Frequently Asked Questions</h3>
<p><strong>Where can I check today's Satta King result?</strong><br>The latest result is available on the homepage in the live result section, with links to previous historical records.</p>
<p><strong>When is the Faridabad Satta result updated?</strong><br>It is generally updated around the scheduled evening announcement. Check the homepage shortly after the official timing.</p>
<p><strong>Does the website provide All Game Satta records?</strong><br>Yes. Archives include Faridabad, Delhi Bazar, Ghaziabad, Gali, Disawar, Shree Ganesh, Old Alwar, and other regional categories.</p>
<p><strong>Can I browse previous charts?</strong><br>Yes. Historical records are available through organized monthly and yearly chart collections.</p>
<p><strong>Is registration required?</strong><br>No. Results, archives, and historical records can be viewed without creating an account.</p>
<h3>Disclaimer</h3>
<p>FaridabadSatta.com is an independent informational website created to organize publicly available satta king and faridabad satta records. The website does not promote, support, or facilitate gambling, betting, or any illegal activity in any form.</p>
<p>All charts, archives, historical records, and regional information are intended solely for informational, educational, and historical reference purposes. Visitors are encouraged to comply with all applicable laws and regulations in their jurisdictions.</p>`,
};

function getClient() {
  const uri = process.env.TOP_GAMES_MONGODB_URI;
  if (!uri) return null;
  if (!clientPromise) {
    clientPromise = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 })
      .connect()
      .catch((error) => {
        clientPromise = null;
        throw error;
      });
  }
  return clientPromise;
}

async function collection() {
  const client = getClient();
  if (!client) throw new Error("TOP_GAMES_MONGODB_URI is not configured");
  return (await client)
    .db(process.env.TOP_GAMES_MONGODB_DB || undefined)
    .collection<SettingsDocument>(process.env.HOMEPAGE_SEO_COLLECTION || "site_settings");
}

// Replaces every "{{date}}" (case-insensitive) with today's date in IST —
// used for both the meta title/description and the on-page content, so a
// phrase like "Satta King Today {{date}}" always shows the current date
// without the admin needing to edit it daily.
export function applyDatePlaceholder(text: string): string {
  const today = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  return text.replace(/\{\{\s*date\s*\}\}/gi, today);
}

// Public read used by the homepage (metadata + on-page content). Never
// throws — falls back to the seed copy on any DB issue so the homepage
// always has something reasonable to show.
export async function getHomepageSeoContent(): Promise<HomepageSeoSettings> {
  try {
    const doc = await (await collection()).findOne({ _id: SETTINGS_ID });
    const metaTitle = String(doc?.metaTitle || "").trim() || DEFAULT_HOMEPAGE_SEO.metaTitle;
    const metaDescription = String(doc?.metaDescription || "").trim() || DEFAULT_HOMEPAGE_SEO.metaDescription;
    const content = String(doc?.content || "").trim() || DEFAULT_HOMEPAGE_SEO.content;
    return {
      metaTitle: applyDatePlaceholder(metaTitle),
      metaDescription: applyDatePlaceholder(metaDescription),
      content: applyDatePlaceholder(content),
    };
  } catch (error) {
    console.error("[homepage-seo] Failed to read settings:", (error as Error).message);
    return {
      metaTitle: applyDatePlaceholder(DEFAULT_HOMEPAGE_SEO.metaTitle),
      metaDescription: applyDatePlaceholder(DEFAULT_HOMEPAGE_SEO.metaDescription),
      content: applyDatePlaceholder(DEFAULT_HOMEPAGE_SEO.content),
    };
  }
}

// Admin read (raw, un-substituted — so the editor shows "{{date}}" literally
// for the admin to keep or edit, not today's already-resolved date).
export async function getHomepageSeoSettingsRaw(): Promise<HomepageSeoSettings> {
  try {
    const doc = await (await collection()).findOne({ _id: SETTINGS_ID });
    return {
      metaTitle: String(doc?.metaTitle || "").trim() || DEFAULT_HOMEPAGE_SEO.metaTitle,
      metaDescription: String(doc?.metaDescription || "").trim() || DEFAULT_HOMEPAGE_SEO.metaDescription,
      content: String(doc?.content || "").trim() || DEFAULT_HOMEPAGE_SEO.content,
    };
  } catch (error) {
    console.error("[homepage-seo] Failed to read settings:", (error as Error).message);
    return DEFAULT_HOMEPAGE_SEO;
  }
}

export async function saveHomepageSeoSettings(input: {
  metaTitle?: string;
  metaDescription?: string;
  content?: string;
}): Promise<HomepageSeoSettings> {
  const metaTitle = String(input.metaTitle || "").trim();
  const metaDescription = String(input.metaDescription || "").trim();
  const content = sanitizeBlogHtml(String(input.content || ""));
  if (!metaTitle || !metaDescription || !content.replace(/<[^>]*>/g, "").trim()) {
    throw new Error("Complete all required fields.");
  }
  await (await collection()).updateOne(
    { _id: SETTINGS_ID },
    { $set: { metaTitle, metaDescription, content, updatedAt: new Date() } },
    { upsert: true }
  );
  return { metaTitle, metaDescription, content };
}
