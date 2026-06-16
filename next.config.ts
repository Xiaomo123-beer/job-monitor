import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // External packages that shouldn't be bundled
  serverExternalPackages: ["puppeteer", "puppeteer-core", "better-sqlite3", "@prisma/adapter-better-sqlite3"],
};

export default nextConfig;
