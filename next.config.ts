import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/blog/:path*",
        destination: "/",
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
