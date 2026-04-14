import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://84.247.172.213/api/:path*',
      },
    ];
  },
};

export default nextConfig;
