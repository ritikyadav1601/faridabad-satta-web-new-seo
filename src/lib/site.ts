// Production currently resolves to the www host. All canonical URLs, sitemap
// entries, structured data, and robots directives must use that same host.
// src/lib/site.ts
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.faridabadsatta.com";
export const SITE_DOMAIN = new URL(SITE_URL).host;
export const SITE_NAME = "Faridabad Satta";
export const SITE_DISPLAY_DOMAIN = SITE_DOMAIN;
