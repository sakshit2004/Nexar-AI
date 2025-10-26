import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Fix for Vercel deployment with monorepo structure
  outputFileTracingRoot: path.join(__dirname, "../"),
  // Webpack configuration for path resolution
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '.'),
    };
    return config;
  },
};

export default nextConfig;
