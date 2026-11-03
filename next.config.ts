import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/research",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
