import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pub-8e552935b5254aa5b649783df295a2a8.r2.dev",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
