"use client";

import { useEffect, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { getWhatsAppLink } from "@/lib/utils";

export function WhatsAppButton() {
  const [phone, setPhone] = useState("918901302607");

  useEffect(() => {
    const fetchKhaiwal = async () => {
      try {
        const res = await fetch("/api/custom-games");
        const data = await res.json();

        if (data?.khaiwal?.whatsapp) {
          setPhone(data.khaiwal.whatsapp);
        }
      } catch (err) {
        console.log("khaiwal fetch error", err);
      }
    };

    fetchKhaiwal();
  }, []);

  return (
    <div className="fixed bottom-4 right-3 md:bottom-6 md:right-6 z-50 flex flex-col items-center gap-2.5">
      
      {/* WhatsApp */}
      <a
        href={getWhatsAppLink("8708328760", "Faridabad Satta")}
        target="_blank"
        rel="noopener noreferrer"
        className="animate-float bg-green-500 hover:bg-green-600 text-white p-3.5 md:p-4 rounded-2xl shadow-xl shadow-green-500/30 transition-all hover:scale-110 block"
        aria-label="Chat on WhatsApp"
      >
        <FaWhatsapp className="w-6 h-6 md:w-8 md:h-8" />
      </a>
    </div>
  );
}
