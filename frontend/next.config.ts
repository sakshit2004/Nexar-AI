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
  output: 'standalone',
  
  // API routes configuration for backend integration
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? '/api/:path*' 
          : 'http://localhost:8000/api/:path*',
      },
    ];
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;
