import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Complaint Support",
  description: "Get help with a website-related complaint or issue.",
  alternates: { canonical: `${SITE_URL}/complaint` },
  robots: { index: false, follow: true },
};

export default function ComplaintLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
