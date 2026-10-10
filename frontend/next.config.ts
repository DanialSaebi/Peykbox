import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // All API traffic stays on the same browser origin; Django isn't public.
    return [{ source: "/api/:path*", destination: "http://backend:8000/api/:path*" }];
  },
};

export default nextConfig;
