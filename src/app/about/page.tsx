"use client";

import { useLanguage, t } from "@/context/LanguageContext";

export default function AboutPage() {
  const { lang } = useLanguage();

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-6">
          {t("FaridabadSatta.com के बारे में", "About FaridabadSatta.com", lang)}
        </h1>

        <div className="space-y-5 text-sm md:text-base text-gray-600 leading-relaxed">
          <p>
            {t(
              "FaridabadSatta.com लाइव सट्टा परिणाम, चार्ट और पुराने रिकॉर्ड देखने का एक स्वतंत्र सूचना मंच है। हम गली, देसावर, गाज़ियाबाद, फरीदाबाद, श्री गणेश और दिल्ली बाजार सहित विभिन्न बाजारों के अपडेट उपलब्ध कराते हैं।",
              "FaridabadSatta.com is an independent information platform for checking live Satta results, charts and historical records. We provide updates for Faridabad, Gali, Desawar, Ghaziabad, Shri Ganesh, Delhi Bazar and other markets.",
              lang
            )}
          </p>

          <h2 className="text-xl font-bold text-gray-900 pt-2">
            {t("हमारा मिशन", "Our Mission", lang)}
          </h2>
          <p>
            {t(
              "हमारा लक्ष्य परिणाम और चार्ट रिकॉर्ड तक सरल, स्पष्ट और मुफ्त पहुँच प्रदान करना है।",
              "Our goal is to provide simple, clear and free access to results and chart records.",
              lang
            )}
          </p>

          <h2 className="text-xl font-bold text-gray-900 pt-2">
            {t("हम क्या प्रदान करते हैं", "What We Offer", lang)}
          </h2>
          <ul className="list-none space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">&#10003;</span>
              <span>
                <strong className="text-gray-900">{t("लाइव रिजल्ट:", "Live Results:", lang)}</strong>{" "}
                {t("पूरे भारत में 100+ गेम्स के रियल-टाइम अपडेट।", "Real-time updates for 100+ games across India.", lang)}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">&#10003;</span>
              <span>
                <strong className="text-gray-900">{t("चार्ट रिकॉर्ड:", "Chart Records:", lang)}</strong>{" "}
                {t(`2015 से ${new Date().getFullYear()} तक के व्यापक मंथली चार्ट रिकॉर्ड।`, `Comprehensive monthly chart records from 2015 to ${new Date().getFullYear()}.`, lang)}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">&#10003;</span>
              <span>
                <strong className="text-gray-900">{t("मोबाइल फ्रेंडली:", "Mobile Friendly:", lang)}</strong>{" "}
                {t("सभी डिवाइसों के लिए ऑप्टिमाइज़्ड — स्मार्टफोन, टैबलेट और डेस्कटॉप।", "Optimized for all devices — smartphones, tablets, and desktops.", lang)}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">&#10003;</span>
              <span>
                <strong className="text-gray-900">{t("100% मुफ्त:", "100% Free:", lang)}</strong>{" "}
                {t("कोई रजिस्ट्रेशन नहीं, कोई छुपे शुल्क नहीं।", "No registration, no hidden charges, no ads blocking your results.", lang)}
              </span>
            </li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 pt-2">
            {t("हमारी टेक्नोलॉजी", "Our Technology", lang)}
          </h2>
          <p>
            {t(
              "FaridabadSatta.com आधुनिक वेब टेक्नोलॉजी से संचालित है ताकि पेज तेज़ी से लोड हों और डेटा व्यवस्थित ढंग से उपलब्ध हो।",
              "FaridabadSatta.com uses modern web technology to keep pages fast and data clearly organised.",
              lang
            )}
          </p>

          <h2 className="text-xl font-bold text-gray-900 pt-2">
            {t("महत्वपूर्ण सूचना", "Important Notice", lang)}
          </h2>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {t(
              "FaridabadSatta.com पूरी तरह से एक सूचनात्मक वेबसाइट है। हम किसी भी प्रकार के जुआ, सट्टेबाजी या लॉटरी का संचालन, प्रचार या सुविधा नहीं देते। प्रदर्शित सभी डेटा केवल सूचनात्मक और शैक्षिक उद्देश्यों के लिए है। कृपया अपने क्षेत्र में लागू कानूनों का पालन करें।",
              "FaridabadSatta.com is strictly an informational website. We do not operate, promote, or facilitate any form of gambling, betting, or lottery. All data displayed is for informational and educational purposes only. Please follow the laws applicable in your region.",
              lang
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
