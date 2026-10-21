"use client";

import { FaWhatsapp } from "react-icons/fa";
import { useLanguage, t } from "@/context/LanguageContext";

// Attention line + WhatsApp button shown right under the hero result cards
// (homepage and every chart page's TopResultsBlock). Points to the public
// WhatsApp results channel. Clicks are counted in Google Analytics as
// `whatsapp_click` by WhatsAppClickTracker (click_location = data-wa-location).
export const WHATSAPP_CHANNEL_URL = "https://whatsapp.com/channel/0029Vb7N6II8fewx7GpwN01p";

export default function HeroWhatsAppCta({ location = "hero" }: { location?: string }) {
  const { lang } = useLanguage();
  return (
    <div className="mx-auto mt-5 flex max-w-2xl flex-col items-center gap-3">
      <p className="text-sm font-black text-slate-800 sm:text-base">
        {t(
          "⚡ सबसे तेज़ रिज़ल्ट सीधे आपके WhatsApp पर — अभी फ्री जुड़ें!",
          "⚡ Get the fastest results straight on WhatsApp — join free now!",
          lang
        )}
      </p>
      <a
        href={WHATSAPP_CHANNEL_URL}
        target="_blank"
        rel="noopener noreferrer"
        data-wa-location={location}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#29d869] via-[#20bc5a] to-[#128c3e] px-6 py-3 text-base font-extrabold text-white shadow-[0_10px_24px_rgba(18,140,62,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(18,140,62,0.45)] active:scale-95"
      >
        <FaWhatsapp className="h-6 w-6" />
        {t("WhatsApp पर रिज़ल्ट पाएं", "Get Results on WhatsApp", lang)}
      </a>
    </div>
  );
}
