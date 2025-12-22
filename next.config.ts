import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Only use rewrites in development - in production, Vercel handles /api routes via vercel.json
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:5001/api/:path*",
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
