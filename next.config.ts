import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = withPWA({
  /* config options here */
  reactStrictMode: false,
  turbopack: {},
  experimental: {
    // PWA uses webpack, so we might need to be careful or disable turbopack check if possible 
    // or just run build --webpack. But Next 16 defaults to turbo.
  },
});

export default nextConfig;
