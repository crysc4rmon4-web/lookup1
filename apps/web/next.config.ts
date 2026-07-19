import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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