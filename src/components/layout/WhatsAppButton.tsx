import { FaWhatsapp } from "react-icons/fa";
import { getWhatsAppLink } from "@/lib/utils";
import { getKhaiwalSettings } from "@/lib/extra-games-mongodb";

export async function WhatsAppButton() {
  const khaiwal = await getKhaiwalSettings();
  const phone = khaiwal?.whatsapp || "7015129958";
  return (
    <div className="whatsapp-float fixed bottom-4 right-3 z-50 md:bottom-6 md:right-6">
      <a
        href={getWhatsAppLink(phone)}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center gap-2.5 overflow-visible rounded-full border border-white/30 bg-gradient-to-br from-[#29d869] via-[#20bc5a] to-[#128c3e] py-2 pl-2 pr-4 text-white shadow-[0_12px_28px_rgba(18,140,62,0.42)] transition duration-200 hover:-translate-y-1 hover:scale-[1.035] hover:shadow-[0_16px_34px_rgba(18,140,62,0.52)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-500/35 active:scale-95"
        aria-label="Chat on WhatsApp"
      >
        <span className="absolute -inset-1 -z-10 rounded-full whatsapp-ring" aria-hidden="true" />
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#1ca952] shadow-[inset_0_-2px_4px_rgba(0,0,0,0.12)] md:h-11 md:w-11">
          <FaWhatsapp className="h-6 w-6 md:h-7 md:w-7" />
        </span>
        <span className="flex flex-col leading-none">
          <span className="mt-1 text-sm font-extrabold md:text-[15px]">Chat on WhatsApp</span>
        </span>
        <span className="absolute right-3 top-2 h-2.5 w-2.5 rounded-full border-2 border-green-600 bg-lime-200" aria-label="Online" />
      </a>
    </div>
  );
}
