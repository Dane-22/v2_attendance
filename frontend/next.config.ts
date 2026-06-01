import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: '.next',
  images: {
    unoptimized: true,
  },
  async rewrites() {
    // Only use rewrites in development
    if (process.env.NODE_ENV === 'development') {
      const apiHost = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')
        .replace(/\/+$/, '')
        .replace(/\/api$/i, '');

      return [
        {
          source: '/api/:path*',
          destination: `${apiHost}/api/:path*`,
        },
      ];
    }
    return [];

  },
};

export default nextConfig;
