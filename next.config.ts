import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isProd ? '/Contour' : '',
  assetPrefix: isProd ? '/Contour' : '',
  images: {
    unoptimized: true,
  },
  devIndicators: {
    appIsrStatus: false,
  },
};

export default nextConfig;
