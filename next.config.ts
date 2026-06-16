import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // External packages that shouldn't be bundled
  serverExternalPackages: ["puppeteer", "puppeteer-core", "pg", "@prisma/adapter-pg"],
};

export default nextConfig;
