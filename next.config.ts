import type { NextConfig } from "next";

// Cloudflare Pages: static export, no Node runtime.
// Build command: npm run build   ·   Output directory: out
// Everything that needs a secret lives in functions/api/* as Pages Functions.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
