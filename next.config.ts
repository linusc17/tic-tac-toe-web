import type { NextConfig } from "next";

// Parse API URL from environment variable
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const parsedUrl = new URL(apiUrl);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: parsedUrl.protocol.slice(0, -1) as 'http' | 'https', // Remove trailing ':'
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? '443' : '80'),
        pathname: '/api/avatar/**',
      },
    ],
  },
};

export default nextConfig;
