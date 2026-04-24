import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.16"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
