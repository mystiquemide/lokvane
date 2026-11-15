import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [{ source: "/app", destination: "/check", permanent: true }];
  },
};

export default nextConfig;
