import { FaWhatsapp } from "react-icons/fa";
import { getKhaiwalSettings } from "@/lib/extra-games-mongodb";
import { getWhatsAppLink } from "@/lib/utils";

const GAMES = [
  ["Shiv Ganga", "12:15 PM"],
  ["Sabar Bazar", "1:15 PM"],
  ["Alinagar", "2:15 PM"],
  ["Delhi Bazar", "2:50 PM"],
  ["Shri Ganesh", "4:20 PM"],
  ["Fatehabad City", "5:20 PM"],
  ["Faridabad", "5:30 PM"],
  ["Multan Bazar", "7:20 PM"],
  ["Ghaziabad", "8:40 PM"],
  ["Kalyanpuri", "10:10 PM"],
  ["Gali", "11:20 PM"],
  ["Disawar", "1:30 AM"],
] as const;

/** The Khaiwal contact chart shown above every game-result table. */
export default async function KhaiwalChartSection() {
  const khaiwal = await getKhaiwalSettings();
  const name = khaiwal?.name || "Har Har Mahadev";
  const phone = khaiwal?.whatsapp || "7015129958";

  return (
    <section className="mb-8">
      <div className="overflow-hidden rounded-2xl border-2 border-dashed border-red-500 bg-gradient-to-b from-yellow-300 via-yellow-100 to-white shadow-xl">
        <div className="px-4 pb-2 pt-4 text-center">
          <h2 className="text-xl font-black text-[#1a1a2e] md:text-3xl">{name}</h2>
        </div>

        <div className="mx-auto max-w-md px-4 pb-3">
          <div className="divide-y divide-dashed divide-yellow-300 overflow-hidden rounded-2xl border-2 border-yellow-500 bg-white/80 shadow-sm backdrop-blur">
            {GAMES.map(([game, time], index) => (
              <div
                key={game}
                className={`flex items-center justify-between gap-2 px-3 py-2 ${index % 2 === 0 ? "bg-yellow-50/70" : "bg-white/70"}`}
              >
                <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-sm">⏰</span>
                  <span>{game}</span>
                </div>
                <span className="shrink-0 rounded-full bg-[#1a1a2e] px-3 py-1 text-xs font-black text-white">{time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto grid max-w-md grid-cols-2 gap-2 px-4">
          <RateCard label="Jodi Rate" value="10-960" />
          <RateCard label="Haruf Rate" value="100-960" />
        </div>

        <div className="flex justify-center px-4 pb-4 pt-3">
          <a
            href={getWhatsAppLink(phone, "Faridabad Satta")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-full bg-green-500 px-7 py-3 text-base font-bold text-white shadow-md transition-all hover:scale-105 hover:bg-green-600"
          >
            <FaWhatsapp className="text-xl" />
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

function RateCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border-2 border-yellow-500 bg-white p-2 text-center shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-xl font-black text-blue-700">{value}</p>
    </div>
  );
}
