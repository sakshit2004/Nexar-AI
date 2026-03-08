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
  
  // Vercel deployment optimizations
  // Remove standalone output for Vercel deployment
  // output: 'standalone',
  
  // API routes: in production, do NOT rewrite /api so Vercel routes /api/v1/* to the Python serverless function (vercel.json). In dev, proxy to local backend.
  async rewrites() {
    if (process.env.NODE_ENV === 'production') return [];
    return [
      { source: '/api/:path*', destination: 'http://localhost:8000/api/:path*' },
    ];
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;
