import { realpathSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

// pnpm links packages: trace the physical file, never a child of the package symlink.
const mediaInfoWasm = path
  .relative(
    __dirname,
    realpathSync(require.resolve("mediainfo.js/MediaInfoModule.wasm")),
  )
  .split(path.sep)
  .join("/");

const nextConfig: NextConfig = {
  serverExternalPackages: ["mediainfo.js"],
  outputFileTracingIncludes: {
    "/api/events/mine/*/images": [mediaInfoWasm],
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
