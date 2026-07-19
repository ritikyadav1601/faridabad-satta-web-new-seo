import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Faridabad Satta",
  description:
    "Learn about FaridabadSatta.com, an independent information platform for Satta results, charts and historical records.",
  alternates: { canonical: `${SITE_URL}/about` },
};

export default function AboutLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
