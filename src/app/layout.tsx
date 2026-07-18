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
      "Satta Online Result | Live A7 Satta Result 2026 | Gali Desawar Faridabad Ghaziabad",
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "SattaOnlineResult.com - Get superfast live A7 Satta results for Gali, Desawar, Ghaziabad, Faridabad, Shri Ganesh, Delhi Bazar & 100+ games. Monthly chart records. Updated daily.",
  verification: {
    google: "iwfZBGPCqdL74ht1H9V0bVgdfHVKvW-qXETMj6c7_Uk",
  },

  keywords: [
    "a7 satta",
    "satta king result",
    "satta king",
    "satta result",
    "gali result",
    "desawar result",
    "satta king 2026",
    "satta king live",
    "live satta result",
    "satta online result",
    "a7satta",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Satta Online Result | Live A7 Satta Result 2026",
    description:
      "Superfast live A7 Satta results for Gali, Desawar, Ghaziabad, Faridabad & 100+ games.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
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
        <LanguageProvider>
          <Header />
          <main className="flex-1">{children}</main>
          {/* <Footer /> */}
          <WhatsAppButton />
        </LanguageProvider>
      </body>
    </html>
  );
}
