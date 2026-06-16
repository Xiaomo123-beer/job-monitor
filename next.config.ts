import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Docker
  output: "standalone",

  // Allow Puppeteer in server
  serverExternalPackages: ["puppeteer", "puppeteer-core", "better-sqlite3"],

  // Needed for Puppeteer in Docker
  experimental: {
    serverComponentsExternalPackages: [
      "puppeteer",
      "puppeteer-core",
      "better-sqlite3",
    ],
  },
};

export default nextConfig;
