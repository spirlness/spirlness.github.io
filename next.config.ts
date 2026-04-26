import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // 显式禁用 telemetry 警告并确保 experimental 干净
  experimental: {}
};

export default nextConfig;
