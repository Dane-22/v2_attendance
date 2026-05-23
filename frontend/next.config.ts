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
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/:path*`,
      },
    ];
    }
    return [];

  },
};

export default nextConfig;
