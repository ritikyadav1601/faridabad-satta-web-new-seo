"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// Buttons that send `whatsapp_click`, identified by their data-wa-location.
const TRACKED_LOCATIONS = new Set(["hero", "floating_button", "khaiwal_section"]);

const WHATSAPP_HREF = /(^https?:\/\/)?(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com|(www\.)?whatsapp\.com)\//i;

// One document-level listener that sends a GA4 `whatsapp_click` event for
// the WhatsApp links whose data-wa-location is in TRACKED_LOCATIONS (the
// hero button, floating button and the Khaiwal section). Parameters:
//   click_location — the link's data-wa-location
//   link_type      — "channel" (whatsapp.com/channel) or "chat" (wa.me etc.)
//   link_url, page_path
// In GA4: Reports → Engagement → Events → whatsapp_click. Mark it as a key
// event (Admin → Events) to see it as a conversion.
export default function WhatsAppClickTracker() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const link = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || !WHATSAPP_HREF.test(link.href)) return;
      // Only the Khaiwal-number buttons are counted (per Ritik, 2026-10-19).
      const location = link.dataset.waLocation || "";
      if (!TRACKED_LOCATIONS.has(location)) return;
      const linkUrl = link.href.split("?")[0];
      window.gtag?.("event", "whatsapp_click", {
        click_location: location,
        link_type: /whatsapp\.com\/channel\//i.test(link.href) ? "channel" : "chat",
        link_url: linkUrl,
        page_path: window.location.pathname,
        transport_type: "beacon",
      });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
