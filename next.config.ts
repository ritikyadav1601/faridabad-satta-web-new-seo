import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "a7satta.co" }],
        destination: "https://www.sattaonlineresult.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.a7satta.co" }],
        destination: "https://www.sattaonlineresult.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
