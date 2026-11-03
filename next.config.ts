import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/research",
        destination: "/#research",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
