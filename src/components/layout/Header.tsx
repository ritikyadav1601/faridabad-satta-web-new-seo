"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/charts", label: "Charts" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/complaint", label: "Complaint" },
];

export function Header() {
  const pathname = usePathname();
  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white text-slate-900 shadow-lg shadow-slate-950/10">
      <div className="mx-auto max-w-4xl px-2 sm:px-4">
        <div className="flex h-14 items-center md:h-16">
          <nav className="grid w-full grid-cols-5 gap-1.5" aria-label="Main navigation">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-xl px-1 py-2 text-center text-xs font-bold transition-all sm:px-3 md:text-sm ${
                    active
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/20"
                      : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="w-full overflow-hidden bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 py-1 text-slate-950">
        <div className="animate-marquee whitespace-nowrap text-[10px] md:text-xs font-bold">
          Welcome to FaridabadSatta.com — Live Satta Results • Gali, Desawar, Ghaziabad, Faridabad, Shri Ganesh, Delhi Bazar • Charts & Old Records • Updated Regularly
        </div>
      </div>
    </header>
  );
}
