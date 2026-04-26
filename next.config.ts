import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // 显式指定导出目录为 out
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  experimental: {}
};

export default nextConfig;
