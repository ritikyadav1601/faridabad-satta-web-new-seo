"use client";

import { FaTelegramPlane, FaWhatsapp } from "react-icons/fa";
import { useLanguage, t } from "@/context/LanguageContext";

const WHATSAPP_NUMBER = "917355847700";

export default function ComplaintPage() {
  const { lang } = useLanguage();

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-xl border border-gray-200 text-center">
        <FaWhatsapp className="mx-auto mb-6 h-20 w-20 text-green-500" />

        <h1 className="text-3xl font-black text-gray-900">
          {t("शिकायत दर्ज करें", "Complaint", lang)}
        </h1>

        <p className="mt-6 text-lg font-medium text-gray-700 leading-8">
          {t(
            "यदि किसी भी खाईवाल ने आपका पेमेंट नहीं किया है या आपको किसी भी प्रकार की समस्या है, तो नीचे दिए गए व्हाट्सऐप नंबर पर तुरंत संपर्क करें।",
            "If any Khaiwal has not paid your payment or you are facing any other issue, please contact us immediately on the WhatsApp number below.",
            lang
          )}
        </p>

        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-3 rounded-xl bg-green-600 px-8 py-4 text-lg font-bold text-white transition hover:bg-green-700"
        >
          <FaWhatsapp className="h-7 w-7" />
          WhatsApp Now
        </a>

        <p className="mt-5 text-2xl font-bold text-green-700">
          +91 73558 47700
        </p>

      </div>
    </main>
  );
}
