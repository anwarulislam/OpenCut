import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

const nextConfig: NextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  output: process.env.BUILD_TARGET === "desktop" ? "export" : "standalone",
  trailingSlash: process.env.BUILD_TARGET === "desktop" ? true : false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    ...(process.env.BUILD_TARGET === "desktop" && {
      unoptimized: true,
    }),
  },
};

export default withBotId(nextConfig);
