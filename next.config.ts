import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import path from "path";

const nextConfig = (phase: string): NextConfig => ({
  output: "export",
  trailingSlash: true,
  typescript: {
    tsconfigPath: phase === PHASE_PRODUCTION_BUILD ? "tsconfig.build.json" : "tsconfig.json",
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    unoptimized: true,
  },
});

export default nextConfig;
