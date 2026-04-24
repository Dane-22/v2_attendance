import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: '.next',
  images: {
    unoptimized: true,
  },
  async rewrites() {
    // Only use rewrites in development
    if (process.env.NODE_ENV === 'development') {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5002/api/:path*',
      },
    ];
    }
    return [];

  },
};

export default nextConfig;
