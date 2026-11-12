import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // All imagery is local under /public; skip the optimizer so the clone runs anywhere.
  images: { unoptimized: true },
  allowedDevOrigins: ["127.0.0.1", "172.28.240.1", "*.trycloudflare.com"],
  async redirects() {
    return [
      { source: "/", destination: "/tr", permanent: false },
    ];
  },
};

export default nextConfig;
