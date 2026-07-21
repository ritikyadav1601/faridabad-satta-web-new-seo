"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/complaint", label: "Complaint" },
];

export function Header() {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <header className="bg-[var(--color-brand-deep)] text-white shadow-lg shadow-emerald-950/25 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 md:px-4">
        <div className="flex items-center justify-between h-14 md:h-16">
          <Link href="/" className="flex items-center gap-2 min-w-0">

            <span className="text-lg md:text-xl font-black tracking-tight">
              <span className="text-white">FARIDABAD</span>
              <span className="text-amber-300">SATTA</span>

            </span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                    active
                      ? "bg-teal-600 text-white shadow-md shadow-emerald-950/30"
                      : "text-emerald-100 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-300"
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
          >
            {isMenuOpen ? (
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>

        {isMenuOpen && (
          <nav
            id="mobile-navigation"
            className="md:hidden border-t border-white/10 py-2"
            aria-label="Mobile navigation"
          >
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-teal-600 text-white"
                      : "text-emerald-100 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      <div className="bg-amber-400 text-emerald-950 py-1 overflow-hidden w-full">
        <div className="animate-marquee whitespace-nowrap text-[10px] md:text-xs font-bold">
          {lang === "hi"
            ? "FaridabadSatta.com में आपका स्वागत है — लाइव सट्टा रिजल्ट • गली, देसावर, गाज़ियाबाद, फरीदाबाद, श्री गणेश, दिल्ली बाजार • चार्ट और पुराने रिकॉर्ड • नियमित अपडेट"
            : "Welcome to FaridabadSatta.com — Live Satta Results • Gali, Desawar, Ghaziabad, Faridabad, Shri Ganesh, Delhi Bazar • Charts & Old Records • Updated Regularly"}
        </div>
      </div>
    </header>
  );
}
