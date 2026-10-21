import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      // /chart/fatehabad never had results; Fatehabad City is the live market.
      {
        source: "/chart/fatehabad",
        destination: "/chart/fatehabad-city",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "faridabadsatta.com" }],
        destination: "https://www.faridabadsatta.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "a7satta.co" }],
        destination: "https://www.faridabadsatta.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.a7satta.co" }],
        destination: "https://www.faridabadsatta.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
