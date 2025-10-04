import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/Contour',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
