import type { NextConfig } from "next";

const allowedDevOrigins = [
  'localhost',
  '127.0.0.1',
  '192.168.1.11',
].filter(Boolean)

const nextConfig: NextConfig = {
  allowedDevOrigins,
};

export default nextConfig;
