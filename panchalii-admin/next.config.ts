import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "panchalii-api-production.up.railway.app", pathname: "/static/**" },
      ...(isDev ? [{ protocol: "http" as const, hostname: "localhost", port: "4000", pathname: "/static/**" }] : []),
    ],
    // The dev API serves product images from localhost, which Next 16 blocks by default.
    dangerouslyAllowLocalIP: isDev,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
