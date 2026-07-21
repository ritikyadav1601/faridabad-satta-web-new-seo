import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Management",
  robots: { index: false, follow: false },
};

export default function AddGameValueLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
