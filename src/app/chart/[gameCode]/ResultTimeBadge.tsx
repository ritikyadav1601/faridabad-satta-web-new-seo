"use client";

import { useEffect, useState } from "react";

// The result-time lookup aggregates several live-results endpoints purely
// for a "Result Time: HH:MM" caption — decorative, not the page's indexable
// content — so it stays a small client-only enhancement rather than
// blocking the server-rendered chart table above it.
export default function ResultTimeBadge({ gameCode }: { gameCode: string }) {
  const [resultTime, setResultTime] = useState("");

  useEffect(() => {
    let cancelled = false;
    const findTime = async () => {
      try {
        const endpoints = ["/api/live-results", "/api/next-results", "/api/rest-results", "/api/sattaking24"];
        const responses = await Promise.all(endpoints.map((url) => fetch(url)));
        const payloads = await Promise.all(responses.map((response) => response.json()));
        const games = payloads.flatMap((data) => data.results || data.games || []);
        const found = games.find(
          (game: { name: string }) => game.name.toLowerCase().replace(/\s+/g, "-") === gameCode
        );
        if (found && !cancelled) setResultTime(found.time);
      } catch {
        /* ignore */
      }
    };
    findTime();
    return () => {
      cancelled = true;
    };
  }, [gameCode]);

  if (!resultTime) return null;
  return <p className="text-gray-400 text-sm mt-1">Result Time: {resultTime}</p>;
}
