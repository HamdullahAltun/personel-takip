import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = withPWA({
  /* config options here */
  experimental: {
    // PWA uses webpack, so we might need to be careful or disable turbopack check if possible 
    // or just run build --webpack. But Next 16 defaults to turbo.
  },
  // Simple fix: force empty turbopack config?
  // Actually the error says: setting an empty turbopack config in your Next config file (e.g. `turbopack: {}`).
});

export default nextConfig;
