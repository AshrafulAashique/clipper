import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["i.ytimg.com", "img.youtube.com", "images.unsplash.com"],
  },
};

export default nextConfig;
