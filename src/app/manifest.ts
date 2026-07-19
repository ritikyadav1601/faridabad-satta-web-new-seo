import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Faridabad Satta",
    short_name: "Faridabad Satta",
    description: "Live Satta results, charts and historical records.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#064e3b",
  };
}
