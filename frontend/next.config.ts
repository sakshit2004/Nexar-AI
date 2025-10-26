import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Fix for Vercel deployment with monorepo structure
  outputFileTracingRoot: path.join(__dirname, "../"),
};

export default nextConfig;
