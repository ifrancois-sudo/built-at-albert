import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next's image optimizer does not run on Cloudflare Workers.
  images: { unoptimized: true },
};

export default nextConfig;

// Makes the Cloudflare bindings available in `next dev` too.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
void initOpenNextCloudflareForDev();
