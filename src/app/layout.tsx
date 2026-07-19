import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { LanguageProvider } from "@/context/LanguageContext";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Faridabad Satta Result | Live Results, Charts & Old Records",
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Check Faridabad Satta results, daily charts and historical records for Faridabad, Gali, Desawar, Ghaziabad, Delhi Bazar and more markets. Updated regularly.",
  verification: {
    google: "iwfZBGPCqdL74ht1H9V0bVgdfHVKvW-qXETMj6c7_Uk",
  },

  keywords: [
    "satta king result",
    "satta king",
    "satta result",
    "gali result",
    "desawar result",
    "satta king 2026",
    "satta king live",
    "live satta result",
    "satta online result",
    "faridabad satta",
    "faridabad satta result",
    "faridabad satta chart",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Faridabad Satta Result | Live Results, Charts & Old Records",
    description:
      "Live Faridabad Satta results, charts and old records for Faridabad, Gali, Desawar, Ghaziabad and more markets.",
  },
  twitter: {
    card: "summary",
    title: "Faridabad Satta Result | Live Results, Charts & Old Records",
    description:
      "Live Faridabad Satta results, charts and old records for Faridabad and more markets.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: ["en-IN", "hi-IN"],
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <LanguageProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppButton />
        </LanguageProvider>
      </body>
    </html>
  );
}
