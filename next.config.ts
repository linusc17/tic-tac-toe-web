import type { NextConfig } from "next";

// Parse API URL from environment variable
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const parsedUrl = new URL(apiUrl);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: parsedUrl.protocol.slice(0, -1) as "http" | "https", // Remove trailing ':'
        hostname: parsedUrl.hostname,
        ...(parsedUrl.port && { port: parsedUrl.port }),
        pathname: "/api/avatar/**",
      },
      {
        protocol: "https",
        hostname: "*.onrender.com",
        pathname: "/api/avatar/**",
      },
      {
        protocol: "https",
        hostname: "localhost",
        pathname: "/api/avatar/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/api/avatar/**",
      },
    ],
  },
};

export default nextConfig;
