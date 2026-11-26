import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  output: "export",
  assetPrefix: "./",
  images: {
    unoptimized: true,
  },
  devIndicators: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
