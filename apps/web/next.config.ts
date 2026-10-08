import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mediainfo.js"],
  outputFileTracingIncludes: {
    "/api/events/mine/*/images": [
      "./node_modules/mediainfo.js/dist/MediaInfoModule.wasm",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dvjgbimtbxdemqnykkrj.supabase.co",
      },
    ],
  },
};

export default nextConfig;
