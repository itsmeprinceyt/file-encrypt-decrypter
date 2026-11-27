import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  output: "export",
  assetPrefix: process.env.NODE_ENV === "development" ? undefined : "./",
  images: {
    unoptimized: true,
  },
  devIndicators: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
