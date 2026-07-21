import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read the Faridabad Satta privacy policy and data-handling information.",
  alternates: { canonical: `${SITE_URL}/privacy` },
};

export default function PrivacyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
