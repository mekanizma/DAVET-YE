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
  async headers() {
    return [
      { source: "/media/uploads/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/img/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=2592000" }] },
      { source: "/fonts/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
};

export default nextConfig;
