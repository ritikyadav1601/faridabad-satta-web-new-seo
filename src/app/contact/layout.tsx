import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Faridabad Satta",
  description: "Contact the FaridabadSatta.com team for website-related assistance.",
  alternates: { canonical: `${SITE_URL}/contact` },
};

export default function ContactLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
