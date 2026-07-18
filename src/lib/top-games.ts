import type { SK24Game } from "./types";

export const TOP_GAME_DEFS = [
  { name: "DESHAWER", time: "05:10 AM", aliases: ["deshawer", "desawar", "desawer", "disawar"] },
  { name: "SHIV GANGA", time: "12:15 PM", aliases: ["shivganga"] },
  { name: "SABAR BAZAR", time: "01:30 PM", aliases: ["sabarbazar"] },
  { name: "ALINAGAR", time: "02:15 PM", aliases: [] },
  { name: "DELHI BAZAR", time: "02:50 PM", aliases: ["delhibazar", "dlbz"] },
  { name: "SHRI GANESH", time: "04:20 PM", aliases: ["shriganesh", "srgn"] },
  { name: "FATEHABAD CITY", time: "05:20 PM", aliases: ["fatehabadcity"] },
  { name: "FARIDABAD", time: "06:10 PM", aliases: ["fridabad", "frbd"] },
  { name: "MULTAN BAZAR", time: "07:20 PM", aliases: ["multanbazar"] },
  { name: "GHAZIABAD", time: "09:30 PM", aliases: ["gaziabad", "gzbd"] },
  { name: "KALYANPURI", time: "10:20 PM", aliases: [] },
  { name: "GALI", time: "11:30 PM", aliases: ["puranigali"] },
] as const;

export const EMPTY_TOP_GAMES: SK24Game[] = TOP_GAME_DEFS.map(({ name, time }) => ({
  name,
  time,
  yesterday: "XX",
  today: "XX",
}));
