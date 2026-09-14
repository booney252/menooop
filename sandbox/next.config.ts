import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app lives inside a larger repo with its own lockfile; keep Next scoped here.
  turbopack: { root: __dirname },
};

export default nextConfig;
