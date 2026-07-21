import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Read the Faridabad Satta informational-use disclaimer.",
  alternates: { canonical: `${SITE_URL}/disclaimer` },
};

export default function DisclaimerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
